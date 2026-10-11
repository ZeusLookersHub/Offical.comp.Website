import type { AgentReasoner, AgentReasoningRequest } from '../../core/agent/types.ts';
import type { AIProvider, AIReasoningProvider, AIRequest, AIResponse } from './types.ts';
import { ProviderError, normalizeError } from './errors.ts';
import { validAIRequest, validAIResponse, reasoningBody, validReasoningDecision } from './validation.ts';

export class ProviderRegistry {
  private readonly providers = new Map<string, AIProvider>();
  register(provider: AIProvider): void {
    if (this.providers.has(provider.id)) throw new Error('duplicate_provider');
    this.providers.set(provider.id, provider);
  }
  resolve(providerId: string): AIProvider {
    const provider = this.providers.get(providerId);
    if (!provider) throw new ProviderError('provider_unavailable');
    return provider;
  }
}
export class AILayer {
  constructor(private readonly providers: ProviderRegistry, private readonly providerId: string) {}
  async generate(request: AIRequest): Promise<AIResponse> {
    if (!validAIRequest(request)) throw new ProviderError('invalid_ai_request');
    try {
      const result = await this.providers.resolve(this.providerId).generate(structuredClone(request));
      if (!validAIResponse(result)) throw new ProviderError('invalid_provider_response');
      return structuredClone(result);
    } catch (error) { throw normalizeError(error); }
  }
  async reason(request: AgentReasoningRequest): Promise<unknown> {
    const { signal, body } = reasoningBody(request);
    try {
      const provider = this.providers.resolve(this.providerId) as Partial<AIReasoningProvider>;
      if (typeof provider.reason !== 'function') throw new ProviderError('provider_unavailable');
      const decision = await provider.reason({ ...structuredClone(body), signal });
      if (!validReasoningDecision(decision, body)) throw new ProviderError('invalid_provider_response');
      return structuredClone(decision);
    } catch (error) { throw normalizeError(error); }
  }
}
/** Server-side bridge. Core sees only its original port, never provider configuration. */
export class LayerAgentReasoner implements AgentReasoner {
  constructor(private readonly layer: AILayer) {}
  reason(request: AgentReasoningRequest) { return this.layer.reason(request); }
}
