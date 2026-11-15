import { bounded } from '../../core/agent/bounded.ts';
import { dataOnly, record } from '../../core/agent/validation.ts';
import { blueprintById } from '../../core/mission-engine/index.ts';
import { compose, extract, ideas, sanitizeSession } from './engine.ts';
import { ModelError, type JsonModel } from './model.ts';

const DEFAULT_ORIGINS = ['https://lookershub.com', 'https://www.lookershub.com', 'http://localhost:3000', 'http://localhost:5173'];
const MAX_BODY = 60000;

/**
 * POST { op: 'intake', blueprintId, text }            → { candidates }
 * POST { op: 'ideas', blueprintId, slot, typed, context, lang } → { ideas }
 * POST { op: 'compose', session }                      → { output, report, attempts, model }
 * Same boundary as lookers-ai-generate: anonymous Supabase user, allowed origins, size caps.
 */
export function createEngineHandler(options: { env: (name: string) => string | undefined; model: JsonModel | null; transport?: typeof fetch }) {
  const transport = options.transport ?? fetch;
  const allowed = new Set([...DEFAULT_ORIGINS, ...(options.env('ENGINE_ALLOWED_ORIGINS') ?? '').split(',').map(s => s.trim()).filter(Boolean)]);
  const cors = (origin: string | null) => ({
    ...(origin && allowed.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin',
  });
  const json = (body: unknown, status: number, origin: string | null) => new Response(JSON.stringify(body), {
    status, headers: { ...cors(origin), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get('Origin');
    if (origin && !allowed.has(origin)) return json({ error: 'origin_not_allowed' }, 403, null);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, origin);
    if (Number(req.headers.get('content-length') || 0) > MAX_BODY) return json({ error: 'request_too_large' }, 413, origin);
    const token = req.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    const url = options.env('SUPABASE_URL'), key = options.env('SUPABASE_ANON_KEY');
    if (!token) return json({ error: 'unauthorized' }, 401, origin);
    if (!url || !key) return json({ error: 'server_configuration_error' }, 503, origin);
    try {
      await bounded(async signal => {
        const auth = await transport(url + '/auth/v1/user', { headers: { apikey: key, Authorization: 'Bearer ' + token }, signal, redirect: 'error' });
        if (!auth.ok) throw new Error('unauthorized');
        const user: unknown = await auth.json();
        if (!record(user) || typeof user.id !== 'string' || user.is_anonymous !== true) throw new Error('unauthorized');
      }, 8000, req.signal);
    } catch { return json({ error: 'identity_verification_failed' }, 401, origin); }

    let body: unknown;
    try {
      const raw = await req.text();
      if (raw.length > MAX_BODY) return json({ error: 'request_too_large' }, 413, origin);
      body = JSON.parse(raw);
    } catch { return json({ error: 'invalid_json' }, 400, origin); }
    if (!dataOnly(body) || !record(body)) return json({ error: 'invalid_request' }, 400, origin);
    if (!options.model) return json({ error: 'model_unavailable' }, 503, origin);

    try {
      if (body.op === 'intake') {
        const bp = typeof body.blueprintId === 'string' ? blueprintById(body.blueprintId) : undefined;
        if (!bp || typeof body.text !== 'string' || body.text.trim().length < 2 || body.text.length > 4000) return json({ error: 'invalid_request' }, 400, origin);
        return json({ candidates: await extract(options.model, bp, body.text, req.signal) }, 200, origin);
      }
      if (body.op === 'ideas') {
        const bp = typeof body.blueprintId === 'string' ? blueprintById(body.blueprintId) : undefined;
        if (!bp || typeof body.slot !== 'string' || typeof body.typed !== 'string' || body.typed.length > 400) return json({ error: 'invalid_request' }, 400, origin);
        const lang = body.lang === 'ar' ? 'ar' : 'en';
        return json({ ideas: await ideas(options.model, bp, body.slot, body.typed, typeof body.context === 'string' ? body.context : '', lang, req.signal) }, 200, origin);
      }
      if (body.op === 'compose') {
        const clean = sanitizeSession(body.session);
        if ('error' in clean) return json({ error: clean.error }, 400, origin);
        return json(await compose(options.model, clean.bp, clean.session, req.signal), 200, origin);
      }
      return json({ error: 'unknown_op' }, 400, origin);
    } catch (error) {
      const code = error instanceof ModelError ? error.code : 'engine_failed';
      const status = code === 'model_timeout' ? 504 : code === 'model_rate_limited' ? 429 : code === 'model_unavailable' || code === 'model_auth_failed' ? 503 : 502;
      return json({ error: code }, status, origin);
    }
  };
}
