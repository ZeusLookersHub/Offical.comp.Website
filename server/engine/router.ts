import { createGeminiJsonModel, createChatJsonModel, ModelError, type JsonModel } from './model.ts';
import { geminiKey } from './keys.ts';

/**
 * Which model does which job.
 *
 * The two providers are priced in different currencies. DeepSeek charges per token and
 * its output tokens are what costs real money; a repeated system prompt is almost free
 * on its prefix cache. Gemini's free tier costs nothing per token but is capped per day,
 * so it is spent in requests, not in tokens.
 *
 * So the split follows the shape of each job rather than a preference for a provider:
 *
 *   compose  → the long one. Thousands of output tokens per call, quality decides the
 *              whole product, and it runs once per finished brief. Paid tokens, few calls.
 *   intake   → one call per session, small output. Cheap either way; it sits on the free
 *              tier so the paid balance is kept for compose.
 *   ideas    → fires while the person types, the highest-volume call by far, and its output
 *              is a handful of words. Exactly what a per-day free quota is good for.
 *   describe → vision, so Gemini regardless: DeepSeek cannot see an image.
 *
 * Either side can be down or out of quota, so every job has a backup on the other provider
 * and fails over on its own. A free tier that runs out mid-afternoon must not stop the tool.
 */
export type EngineOp = 'intake' | 'ideas' | 'compose';

const DEFAULT_ROUTE: Record<EngineOp, 'gemini' | 'deepseek'> = {
  compose: 'deepseek',
  intake: 'gemini',
  ideas: 'gemini',
};

export interface ModelRoute {
  /** The model for this job, already wrapped so it covers for itself. */
  for(op: EngineOp): JsonModel | null;
  /** What actually got configured, for diagnostics — names only, never a key. */
  readonly plan: Record<EngineOp, string>;
  /** Which environment name the Gemini key was found under, or 'none'. */
  readonly geminiKeyName: string;
}

/** Fails over to the backup when the primary is out of quota, down, or too slow. */
const COVERABLE = new Set(['model_rate_limited', 'model_unavailable', 'model_timeout']);

export function withBackup(primary: JsonModel, backup: JsonModel | null): JsonModel {
  if (!backup) return primary;
  return {
    id: `${primary.id}→${backup.id}`,
    async complete(input) {
      try {
        const result = await primary.complete(input);
        return { ...result, modelId: result.modelId ?? primary.id };
      } catch (error) {
        if (!(error instanceof ModelError) || !COVERABLE.has(error.code)) throw error;
        const result = await backup.complete(input);
        return { ...result, modelId: result.modelId ?? backup.id };
      }
    },
  };
}

function parseRoute(raw: string | undefined): Partial<Record<EngineOp, 'gemini' | 'deepseek'>> {
  const out: Partial<Record<EngineOp, 'gemini' | 'deepseek'>> = {};
  for (const pair of (raw ?? '').split(',')) {
    const [op, provider] = pair.split(':').map(s => s.trim().toLowerCase());
    if ((op === 'intake' || op === 'ideas' || op === 'compose') && (provider === 'gemini' || provider === 'deepseek')) out[op] = provider;
  }
  return out;
}

/**
 * ENGINE_ROUTE overrides a single job: "compose:deepseek,ideas:gemini".
 * ENGINE_PROVIDER still pins every job to one provider, so an existing setting keeps
 * behaving exactly as it did; remove it to let the split above take over.
 */
export function routeFromEnv(env: (name: string) => string | undefined, transport?: typeof fetch): ModelRoute {
  const gem = geminiKey(env);
  const deepseekKey = env('DEEPSEEK_API_KEY');

  const gemini = gem.key
    ? createGeminiJsonModel({ key: gem.key, model: env('GEMINI_MODEL') || env('ENGINE_MODEL'), transport })
    : null;
  const deepseek = deepseekKey
    ? createChatJsonModel({
        url: 'https://api.deepseek.com/chat/completions', key: deepseekKey,
        model: env('DEEPSEEK_MODEL') || env('ENGINE_MODEL') || 'deepseek-flash',
        extraBody: { thinking: { type: 'disabled' } }, transport,
      })
    : null;

  const pinned = env('ENGINE_PROVIDER')?.trim().toLowerCase();
  const overrides = parseRoute(env('ENGINE_ROUTE'));
  const plan = {} as Record<EngineOp, string>;

  const pick = (op: EngineOp): JsonModel | null => {
    const want = pinned === 'gemini' || pinned === 'deepseek' ? pinned : overrides[op] ?? DEFAULT_ROUTE[op];
    const primary = want === 'gemini' ? gemini ?? deepseek : deepseek ?? gemini;
    const backup = want === 'gemini' ? deepseek : gemini;
    if (!primary) { plan[op] = 'none'; return null; }
    const model = withBackup(primary, backup === primary ? null : backup);
    plan[op] = model.id;
    return model;
  };

  const models: Record<EngineOp, JsonModel | null> = { intake: pick('intake'), ideas: pick('ideas'), compose: pick('compose') };
  return { for: op => models[op], plan, geminiKeyName: gem.name };
}
