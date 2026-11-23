import { bounded } from '../../core/agent/bounded.ts';
import { dataOnly, record } from '../../core/agent/validation.ts';
import { compose, deepen, extract, ideas, nextMove, options as smartOptions, sanitizeSession, turn, type BlueprintLookup } from './engine.ts';
import { ModelError, type JsonModel } from './model.ts';
import type { EngineOp, ModelRoute } from './router.ts';
import { describeReference, validImage, type VisionModel } from './vision.ts';

const DEFAULT_ORIGINS = ['https://lookershub.com', 'https://www.lookershub.com', 'http://localhost:3000', 'http://localhost:5173'];
/** Vercel previews of this team only (the scope suffix cannot be claimed by anyone else). */
const PREVIEW_ORIGIN = /^https:\/\/[a-z0-9-]+-zeuslookershubs-projects\.vercel\.app$/;
/** While testing a branch, preview hostnames are unpredictable. Set ENGINE_ALLOW_VERCEL_PREVIEWS=1
 *  to accept any vercel.app preview; the token check and the rate limits still apply to every call. */
const ANY_VERCEL_PREVIEW = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;
const MAX_BODY = 60000;
/** Calls one anonymous user may make per minute, per operation. Compose costs money; typing does not. */
const RATE_LIMITS: Record<string, number> = { compose: 10, next: 10, describe: 10, intake: 30, ideas: 60, turn: 40, options: 40, deepen: 10 };
const RATE_WINDOW_SECONDS = 60;
const MAX_IMAGE_BODY = 4_200_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Counts the call and says whether this user is still inside the limit. Needs the service key,
 * because the counter is in a locked table — without it we do not throttle rather than refuse.
 */
async function withinRate(transport: typeof fetch, url: string, serviceKey: string | undefined, owner: string, op: string): Promise<boolean> {
  if (!serviceKey) return true;
  try {
    return await bounded(async signal => {
      const res = await transport(url + '/rest/v1/rpc/engine_rate_check', {
        method: 'POST', signal, redirect: 'error',
        headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_owner: owner, p_op: op, p_limit: RATE_LIMITS[op] ?? 30, p_window_seconds: RATE_WINDOW_SECONDS }),
      });
      if (!res.ok) return true;
      return await res.json() !== false;
    }, 3000);
  } catch { return true; }
}

/** Best effort: the result is stored under the user's own token (RLS owner check). Never blocks the answer. */
async function saveResult(transport: typeof fetch, url: string, key: string, token: string, row: Record<string, unknown>): Promise<string | null> {
  try {
    return await bounded(async signal => {
      const res = await transport(url + '/rest/v1/lookers_engine_results', {
        method: 'POST', signal, redirect: 'error',
        headers: { apikey: key, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify(row),
      });
      if (!res.ok) return null;
      const rows: unknown = await res.json();
      return Array.isArray(rows) && rows[0] && typeof rows[0].id === 'string' ? rows[0].id : null;
    }, 4000);
  } catch { return null; }
}

/**
 * POST { op: 'intake', blueprintId, text }            → { candidates }
 * POST { op: 'ideas', blueprintId, slot, typed, context, lang } → { ideas }
 * POST { op: 'compose', session }                      → { output, report, attempts, model }
 * Same boundary as lookers-ai-generate: anonymous Supabase user, allowed origins, size caps.
 */
export function createEngineHandler(options: {
  env: (name: string) => string | undefined;
  /** Per-job models. A single model may still be passed; it then serves every job. */
  model: JsonModel | ModelRoute | null;
  vision?: VisionModel | null;
  blueprints: BlueprintLookup;
  transport?: typeof fetch;
}) {
  const transport = options.transport ?? fetch;
  const blueprintById = options.blueprints;
  const route = options.model && 'for' in options.model ? options.model : null;
  const modelFor = (op: EngineOp): JsonModel | null =>
    route ? route.for(op) : (options.model as JsonModel | null);
  const allowed = new Set([...DEFAULT_ORIGINS, ...(options.env('ENGINE_ALLOWED_ORIGINS') ?? '').split(',').map(s => s.trim()).filter(Boolean)]);
  const previewsOpen = options.env('ENGINE_ALLOW_VERCEL_PREVIEWS') === '1';
  const isAllowed = (origin: string) => allowed.has(origin) || PREVIEW_ORIGIN.test(origin)
    || (previewsOpen && ANY_VERCEL_PREVIEW.test(origin));
  const cors = (origin: string | null) => ({
    ...(origin && isAllowed(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin',
  });
  const json = (body: unknown, status: number, origin: string | null) => new Response(JSON.stringify(body), {
    status, headers: { ...cors(origin), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get('Origin');
    if (origin && !isAllowed(origin)) return json({ error: 'origin_not_allowed' }, 403, null);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, origin);
    if (Number(req.headers.get('content-length') || 0) > MAX_IMAGE_BODY) return json({ error: 'request_too_large' }, 413, origin);
    const token = req.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    const url = options.env('SUPABASE_URL'), key = options.env('SUPABASE_ANON_KEY');
    if (!token) return json({ error: 'unauthorized' }, 401, origin);
    if (!url || !key) return json({ error: 'server_configuration_error' }, 503, origin);
    let owner = '';
    try {
      await bounded(async signal => {
        const auth = await transport(url + '/auth/v1/user', { headers: { apikey: key, Authorization: 'Bearer ' + token }, signal, redirect: 'error' });
        if (!auth.ok) throw new Error('unauthorized');
        const user: unknown = await auth.json();
        if (!record(user) || typeof user.id !== 'string' || user.is_anonymous !== true) throw new Error('unauthorized');
        owner = user.id;
      }, 8000, req.signal);
    } catch { return json({ error: 'identity_verification_failed' }, 401, origin); }

    let body: unknown;
    try {
      const raw = await req.text();
      if (raw.length > MAX_IMAGE_BODY) return json({ error: 'request_too_large' }, 413, origin);
      body = JSON.parse(raw);
      // Only the image operation may carry a large body.
      if (raw.length > MAX_BODY && !(record(body) && body.op === 'describe')) return json({ error: 'request_too_large' }, 413, origin);
    } catch { return json({ error: 'invalid_json' }, 400, origin); }
    if (!dataOnly(body) || !record(body)) return json({ error: 'invalid_request' }, 400, origin);
    const op = typeof body.op === 'string' ? body.op : '';
    if (!(op in RATE_LIMITS)) return json({ error: 'unknown_op' }, 400, origin);
    if (!await withinRate(transport, url, options.env('SUPABASE_SERVICE_ROLE_KEY'), owner, op)) {
      return new Response(JSON.stringify({ error: 'rate_limited' }), {
        status: 429, headers: { ...cors(origin), 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Retry-After': String(RATE_WINDOW_SECONDS) },
      });
    }
    try {
      if (body.op === 'describe') {
        if (!options.vision) return json({ error: 'vision_unavailable' }, 503, origin);
        const bp = typeof body.blueprintId === 'string' ? await blueprintById(body.blueprintId) : undefined;
        if (!bp || !validImage(body.image)) return json({ error: 'invalid_request' }, 400, origin);
        return json(await describeReference(options.vision, bp, body.image, body.lang === 'ar' ? 'ar' : 'en', req.signal), 200, origin);
      }
      const model = modelFor(body.op === 'intake' || body.op === 'turn' || body.op === 'deepen' ? 'intake' : body.op === 'ideas' || body.op === 'options' ? 'ideas' : 'compose');
      if (!model) return json({ error: 'model_unavailable' }, 503, origin);
      if (body.op === 'intake') {
        const bp = typeof body.blueprintId === 'string' ? await blueprintById(body.blueprintId) : undefined;
        if (!bp || typeof body.text !== 'string' || body.text.trim().length < 2 || body.text.length > 4000) return json({ error: 'invalid_request' }, 400, origin);
        return json(await extract(model, bp, body.text, req.signal), 200, origin);
      }
      if (body.op === 'ideas') {
        const bp = typeof body.blueprintId === 'string' ? await blueprintById(body.blueprintId) : undefined;
        if (!bp || typeof body.slot !== 'string' || typeof body.typed !== 'string' || body.typed.length > 400) return json({ error: 'invalid_request' }, 400, origin);
        const lang = body.lang === 'ar' ? 'ar' : 'en';
        return json({ ideas: await ideas(model, bp, body.slot, body.typed, typeof body.context === 'string' ? body.context : '', lang, req.signal) }, 200, origin);
      }
      if (body.op === 'turn' || body.op === 'options' || body.op === 'deepen') {
        const bp = typeof body.blueprintId === 'string' ? await blueprintById(body.blueprintId) : undefined;
        if (!bp) return json({ error: 'unknown_blueprint' }, 400, origin);
        const lang = body.lang === 'ar' ? 'ar' : 'en';
        const context = typeof body.context === 'string' ? body.context.slice(0, 3000) : '';
        if (body.op === 'deepen') return json({ questions: await deepen(model, bp, { context, lang }, req.signal) }, 200, origin);
        if (typeof body.slot !== 'string' || !bp.slots.some(s => s.id === body.slot)) return json({ error: 'invalid_request' }, 400, origin);
        if (body.op === 'options') return json(await smartOptions(model, bp, { slot: body.slot, context, lang }, req.signal), 200, origin);
        if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 2000) return json({ error: 'invalid_request' }, 400, origin);
        const probesLeft = Math.max(0, Math.min(3, Number(body.probesLeft) || 0));
        return json(await turn(model, bp, { slot: body.slot, text: body.text, context, lang, probesLeft }, req.signal), 200, origin);
      }
      if (body.op === 'compose') {
        const clean = await sanitizeSession(body.session, blueprintById);
        if ('error' in clean) return json({ error: clean.error }, 400, origin);
        const result = await compose(model, clean.bp, clean.session, req.signal);
        const sessionId = typeof body.sessionId === 'string' && UUID.test(body.sessionId) ? body.sessionId : null;
        const resultId = await saveResult(transport, url, key, token, {
          session_id: sessionId, blueprint_id: clean.bp.id, blueprint_version: clean.bp.version,
          output: result.output, report: result.report, gates_passed: result.report.passed, gates_total: result.report.total,
          attempts: result.attempts, model: result.model,
        });
        return json({ ...result, resultId }, 200, origin);
      }
      if (body.op === 'next') {
        const clean = await sanitizeSession(body.session, blueprintById);
        if ('error' in clean) return json({ error: clean.error }, 400, origin);
        const str = (v: unknown, max: number) => typeof v === 'string' ? v.trim().slice(0, max) : '';
        const reply = str(body.reply, 10000), sent = str(body.sent, 8000);
        if (reply.length < 10 || !sent) return json({ error: 'invalid_request' }, 400, origin);
        const done = Array.isArray(body.done) ? body.done.filter((d): d is string => typeof d === 'string').slice(0, 20).map(d => d.slice(0, 300)) : [];
        return json(await nextMove(model, clean.bp, clean.session, { sent, reply, note: str(body.note, 1000), done }, req.signal), 200, origin);
      }
      return json({ error: 'unknown_op' }, 400, origin);
    } catch (error) {
      const code = error instanceof ModelError ? error.code : error instanceof Error && error.message.startsWith('blueprints_') ? 'blueprints_unavailable' : 'engine_failed';
      if (code === 'engine_failed') console.warn('engine failed', { op, error: error instanceof Error ? error.message.slice(0, 200) : 'unknown' });
      const status = code === 'model_timeout' ? 504 : code === 'model_rate_limited' ? 429 : code === 'model_unavailable' || code === 'model_auth_failed' || code === 'blueprints_unavailable' ? 503 : 502;
      return json({ error: code }, status, origin);
    }
  };
}
