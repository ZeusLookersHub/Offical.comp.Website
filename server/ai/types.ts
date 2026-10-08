import type { AgentReasoningRequest } from '../../core/agent/types.ts';

// These generation contracts are copied from the actual deployed v11 AI Layer.
export interface AIRequest { input: string; locale: 'en' | 'ar' }
export interface AIResponse {
  id: string;
  output: { title: string; prompt: string; summary: string };
  usage?: { inputTokens?: number; outputTokens?: number };
  provenance: { providerId: string; modelId: string };
}
export interface AIProvider { readonly id: string; generate(request: AIRequest): Promise<AIResponse> }
/** Optional segregated capability; the existing generate contract is unchanged. */
export interface AIReasoningProvider extends AIProvider { reason(request: AgentReasoningRequest): Promise<unknown> }
