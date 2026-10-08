import { AILayer, ProviderRegistry } from './layer.ts';
import { DeepSeekAdapter } from './providers/deepseek.ts';
import { OpenRouterAdapter } from './providers/openrouter.ts';

/** Server-owned environment only. No import by any browser module. */
export function createServerAILayer(env: (name: string) => string | undefined, transport: typeof fetch = fetch): AILayer {
  const registry = new ProviderRegistry();
  const selected = env('AI_PROVIDER_ID') || 'deepseek';
  if (env('DEEPSEEK_API_KEY')) registry.register(new DeepSeekAdapter(env('DEEPSEEK_API_KEY'), { transport }));
  const legacyKey = env('OPENROUTER_API_KEY');
  if (legacyKey) registry.register(new OpenRouterAdapter(legacyKey, env('AI_MODEL_ID') || 'google/gemma-4-31b-it:free'));
  return new AILayer(registry, selected);
}
