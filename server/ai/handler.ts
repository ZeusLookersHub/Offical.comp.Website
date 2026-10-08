import { bounded } from '../../core/agent/bounded.ts';
import { dataOnly, exact, record } from '../../core/agent/validation.ts';
import { normalizeError } from './errors.ts';
import type { AILayer } from './layer.ts';
import { validReasoningBody } from './validation.ts';

const allowedOrigins = new Set(['https://lookershub.com', 'http://localhost:3000', 'http://localhost:5173']);
const cors = (origin: string | null) => ({
  ...(origin && allowedOrigins.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin',
});
const json = (body: unknown, status: number, origin: string | null) => new Response(JSON.stringify(body), {
  status, headers: { ...cors(origin), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
class BodyError extends Error {}
async function readBody(req: Request, signal: AbortSignal): Promise<unknown> {
  if (!req.body) throw new BodyError('invalid_json');
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    while (true) {
      if (signal.aborted) throw new BodyError('request_timeout');
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 20000) throw new BodyError('request_too_large');
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new BodyError('invalid_json'); }
  } finally { signal.removeEventListener('abort', cancel); cancel(); }
}

/** Same authenticated anonymous-user boundary as deployed v11. Reasoning is additive. */
export function createAIHandler(options: {
  env: (name: string) => string | undefined;
  layer: Pick<AILayer, 'generate' | 'reason'>;
  transport?: typeof fetch;
}) {
  const transport = options.transport ?? fetch;
  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get('Origin');
    if (origin && !allowedOrigins.has(origin)) return json({ error: 'origin_not_allowed' }, 403, null);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, origin);
    if (Number(req.headers.get('content-length') || 0) > 20000) return json({ error: 'request_too_large' }, 413, origin);
    const token = req.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return json({ error: 'unauthorized' }, 401, origin);
    const url = options.env('SUPABASE_URL');
    const key = options.env('SUPABASE_ANON_KEY');
    if (!url || !key) return json({ error: 'server_configuration_error' }, 503, origin);
    let userId: string;
    try {
      userId = await bounded(async signal => {
        const auth = await transport(url + '/auth/v1/user', {
          headers: { apikey: key, Authorization: 'Bearer ' + token }, signal, redirect: 'error',
        });
        if (!auth.ok) throw new Error('unauthorized');
        const user: unknown = await auth.json();
        if (!record(user) || typeof user.id !== 'string' || !user.id || user.is_anonymous !== true) throw new Error('unauthorized');
        return user.id;
      }, 8000, req.signal);
    } catch { return json({ error: 'identity_verification_failed' }, 401, origin); }
    let body: unknown;
    try { body = await bounded(signal => readBody(req, signal), 8000, req.signal); }
    catch (error) {
      const code = error instanceof BodyError ? error.message : 'request_timeout';
      return json({ error: code }, code === 'request_too_large' ? 413 : code === 'request_timeout' ? 408 : 400, origin);
    }
    if (!dataOnly(body) || !record(body)) return json({ error: 'invalid_request' }, 400, origin);
    const reasoning = body.operation === 'reason';
    if (reasoning ? !exact(body, ['operation', 'reasoning']) || !validReasoningBody(body.reasoning) :
      body.operation !== undefined || typeof body.prompt !== 'string' || body.prompt.trim().length < 3 ||
      body.prompt.length > 12000 || (body.language !== undefined && body.language !== 'en' && body.language !== 'ar'))
      return json({ error: 'invalid_request' }, 400, origin);
    try {
      const data = reasoning
        ? { decision: await options.layer.reason({ ...(body.reasoning as Parameters<AILayer['reason']>[0]), signal: req.signal }) }
        : await options.layer.generate({ input: body.prompt as string, locale: body.language === 'ar' ? 'ar' : 'en' });
      return json({ data, identity: { userId, isAnonymous: true } }, 200, origin);
    } catch (error) {
      const { code } = normalizeError(error);
      const providerStatus = code === 'provider_auth_failed' ? 401 : code === 'provider_insufficient_balance' ? 402 :
        code === 'provider_rate_limited' ? 429 : undefined;
      return json({ error: code, ...(providerStatus ? { providerStatus } : {}) },
        code === 'provider_unavailable' ? 503 : code === 'provider_timeout' ? 504 : code === 'invalid_ai_request' ? 400 : 502, origin);
    }
  };
}
