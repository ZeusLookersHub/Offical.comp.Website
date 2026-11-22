import { bounded, BoundedError } from '../../core/agent/bounded.ts';

/** One JSON completion. The engine never sees provider details. */
export interface JsonModel {
  id: string;
  complete(input: { system: string; user: string; maxTokens: number; signal?: AbortSignal }): Promise<{
    json: unknown;
    usage?: { inputTokens?: number; outputTokens?: number };
    /** Which model actually answered — differs from id when a backup covered the call. */
    modelId?: string;
  }>;
}

export class ModelError extends Error {
  constructor(readonly code: 'model_unavailable' | 'model_auth_failed' | 'model_rate_limited' | 'model_timeout' | 'model_bad_output') { super(code); }
}

/**
 * OpenAI-compatible chat endpoint (DeepSeek, OpenRouter, …) in JSON mode.
 * The key never leaves the server and is checked out of every response.
 */
/**
 * Why a model call failed, said out loud. One opaque model_unavailable for every non-ok response
 * makes a wrong model name, a disabled API and a quota wall indistinguishable, which is how a
 * silent failover looked like a provider that was never wired up. The provider's own status and
 * wording are logged, truncated, with the key scrubbed in case it is echoed back.
 */
async function explainFailure(provider: string, model: string, res: Response, key: string): Promise<never> {
  const body = (await res.text().catch(() => '')).split(key).join('[key]').slice(0, 300);
  console.warn('model call failed', { provider, model, status: res.status, body });
  if (res.status === 401 || res.status === 403) throw new ModelError('model_auth_failed');
  if (res.status === 429 || res.status === 402) throw new ModelError('model_rate_limited');
  throw new ModelError('model_unavailable');
}

export function createChatJsonModel(cfg: { url: string; key: string; model: string; timeoutMs?: number; extraBody?: Record<string, unknown>; transport?: typeof fetch }): JsonModel {
  const transport = cfg.transport ?? fetch;
  const timeoutMs = cfg.timeoutMs ?? 40000;
  return {
    id: cfg.model,
    async complete({ system, user, maxTokens, signal }) {
      if (!cfg.key) throw new ModelError('model_unavailable');
      try {
        return await bounded(async abort => {
          let res: Response;
          try {
            res = await transport(cfg.url, {
              method: 'POST', redirect: 'error', signal: abort,
              headers: { Authorization: 'Bearer ' + cfg.key, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: cfg.model, stream: false, temperature: 0.3, max_tokens: maxTokens,
                response_format: { type: 'json_object' },
                messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
                ...cfg.extraBody,
              }),
            });
          } catch { throw new ModelError('model_unavailable'); }
          if (!res.ok) await explainFailure('chat', cfg.model, res, cfg.key);
          const raw = await res.text();
          if (raw.length > 400000 || raw.includes(cfg.key)) throw new ModelError('model_bad_output');
          try {
            const payload = JSON.parse(raw);
            const content = payload?.choices?.[0]?.message?.content;
            if (typeof content !== 'string') throw new Error();
            const json = JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, ''));
            const usage = payload.usage ? { inputTokens: payload.usage.prompt_tokens, outputTokens: payload.usage.completion_tokens } : undefined;
            return { json, usage };
          } catch { throw new ModelError('model_bad_output'); }
        }, timeoutMs, signal);
      } catch (error) {
        if (error instanceof ModelError) throw error;
        if (error instanceof BoundedError) throw new ModelError('model_timeout');
        throw new ModelError('model_unavailable');
      }
    },
  };
}

/**
 * Gemini generateContent in JSON mode, as a JsonModel (text: intake, ideas, compose).
 * Same model family as the vision adapter, so one key drives the whole engine.
 */
export function createGeminiJsonModel(cfg: { key: string; model?: string; timeoutMs?: number; transport?: typeof fetch }): JsonModel {
  const transport = cfg.transport ?? fetch;
  const model = cfg.model || 'gemini-3.8-flash';
  const timeoutMs = cfg.timeoutMs ?? 40000;
  return {
    id: model,
    async complete({ system, user, maxTokens, signal }) {
      if (!cfg.key) throw new ModelError('model_unavailable');
      try {
        return await bounded(async abort => {
          let res: Response;
          try {
            res = await transport(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
              method: 'POST', redirect: 'error', signal: abort,
              headers: { 'x-goog-api-key': cfg.key, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: system }] },
                contents: [{ role: 'user', parts: [{ text: user }] }],
                generationConfig: { responseMimeType: 'application/json', temperature: 0.3, maxOutputTokens: maxTokens },
              }),
            });
          } catch { throw new ModelError('model_unavailable'); }
          if (!res.ok) await explainFailure('gemini', model, res, cfg.key);
          const raw = await res.text();
          if (raw.length > 400000 || raw.includes(cfg.key)) throw new ModelError('model_bad_output');
          try {
            const payload = JSON.parse(raw);
            const text = payload?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
            if (!text) throw new Error();
            const json = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
            const u = payload?.usageMetadata;
            const usage = u ? { inputTokens: u.promptTokenCount, outputTokens: u.candidatesTokenCount } : undefined;
            return { json, usage };
          } catch { throw new ModelError('model_bad_output'); }
        }, timeoutMs, signal);
      } catch (error) {
        if (error instanceof ModelError) throw error;
        if (error instanceof BoundedError) throw new ModelError('model_timeout');
        throw new ModelError('model_unavailable');
      }
    },
  };
}

/**
 * Server environment → model. Gemini is preferred once its key is set (one key for text and
 * vision); DeepSeek and OpenRouter remain as fallbacks. Force a provider with ENGINE_PROVIDER.
 */
export function modelFromEnv(env: (name: string) => string | undefined, transport?: typeof fetch): JsonModel | null {
  const gemini = env('GEMINI_API_KEY');
  const deepseek = env('DEEPSEEK_API_KEY');
  const openrouter = env('OPENROUTER_API_KEY');
  const provider = env('ENGINE_PROVIDER') || (gemini ? 'gemini' : deepseek ? 'deepseek' : openrouter ? 'openrouter' : '');
  const makeGemini = () => createGeminiJsonModel({ key: gemini!, model: env('ENGINE_MODEL') || env('GEMINI_MODEL'), transport });
  const makeDeepseek = () => createChatJsonModel({ url: 'https://api.deepseek.com/chat/completions', key: deepseek!, model: env('ENGINE_MODEL') || 'deepseek-flash', extraBody: { thinking: { type: 'disabled' } }, transport });
  const makeOpenRouter = () => createChatJsonModel({ url: 'https://openrouter.ai/api/v1/chat/completions', key: openrouter!, model: env('ENGINE_MODEL') || env('AI_MODEL_ID') || 'google/gemma-4-31b-it:free', transport });
  if (provider === 'gemini' && gemini) return makeGemini();
  if (provider === 'deepseek' && deepseek) return makeDeepseek();
  if (provider === 'openrouter' && openrouter) return makeOpenRouter();
  // Explicit provider with a missing key, or no provider: fall back to whatever key exists.
  if (gemini) return makeGemini();
  if (deepseek) return makeDeepseek();
  if (openrouter) return makeOpenRouter();
  return null;
}
