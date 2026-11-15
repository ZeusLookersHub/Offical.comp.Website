import { bounded, BoundedError } from '../../core/agent/bounded.ts';

/** One JSON completion. The engine never sees provider details. */
export interface JsonModel {
  id: string;
  complete(input: { system: string; user: string; maxTokens: number; signal?: AbortSignal }): Promise<{ json: unknown; usage?: { inputTokens?: number; outputTokens?: number } }>;
}

export class ModelError extends Error {
  constructor(readonly code: 'model_unavailable' | 'model_auth_failed' | 'model_rate_limited' | 'model_timeout' | 'model_bad_output') { super(code); }
}

/**
 * OpenAI-compatible chat endpoint (DeepSeek, OpenRouter, …) in JSON mode.
 * The key never leaves the server and is checked out of every response.
 */
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
          if (res.status === 401 || res.status === 403) throw new ModelError('model_auth_failed');
          if (res.status === 429 || res.status === 402) throw new ModelError('model_rate_limited');
          if (!res.ok) throw new ModelError('model_unavailable');
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

/** Server environment → model. DeepSeek first (current production provider), OpenRouter as an alternative. */
export function modelFromEnv(env: (name: string) => string | undefined, transport?: typeof fetch): JsonModel | null {
  const deepseek = env('DEEPSEEK_API_KEY');
  if (deepseek && (env('ENGINE_PROVIDER') ?? 'deepseek') === 'deepseek') {
    return createChatJsonModel({ url: 'https://api.deepseek.com/chat/completions', key: deepseek, model: env('ENGINE_MODEL') || 'deepseek-flash', extraBody: { thinking: { type: 'disabled' } }, transport });
  }
  const openrouter = env('OPENROUTER_API_KEY');
  if (openrouter) return createChatJsonModel({ url: 'https://openrouter.ai/api/v1/chat/completions', key: openrouter, model: env('ENGINE_MODEL') || env('AI_MODEL_ID') || 'google/gemma-4-31b-it:free', transport });
  return null;
}
