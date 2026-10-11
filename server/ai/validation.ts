import { confidence, dataOnly, exact, record, text } from '../../core/agent/validation.ts';
import { isProjectEngineId } from '../../core/projects/engines.ts';
import { AgentToolRegistry } from '../../core/agent/registry.ts';
import { createAgentTools } from '../../core/agent/tools.ts';
import { equal } from '../../core/agent/validation.ts';
import type { AgentReasoningRequest, AgentReasoningDecision } from '../../core/agent/types.ts';
import type { AIRequest, AIResponse } from './types.ts';
import { ProviderError } from './errors.ts';

export const validAIRequest = (v: unknown): v is AIRequest => dataOnly(v) && exact(v, ['input', 'locale']) &&
  text(v.input, 12000) && v.input.trim().length >= 3 && ['en', 'ar'].includes(String(v.locale));
export const validOutput = (v: unknown): v is AIResponse['output'] => dataOnly(v) && exact(v, ['title', 'prompt', 'summary']) &&
  text(v.title, 500) && text(v.prompt, 20000) && text(v.summary, 4000);
export function validAIResponse(v: unknown): v is AIResponse {
  return dataOnly(v) && exact(v, ['id', 'output', 'provenance'], ['usage']) && text(v.id) && validOutput(v.output) &&
    exact(v.provenance, ['providerId', 'modelId']) && text(v.provenance.providerId) && text(v.provenance.modelId) &&
    (v.usage === undefined || exact(v.usage, [], ['inputTokens', 'outputTokens']) &&
      Object.values(v.usage).every(n => Number.isSafeInteger(n) && (n as number) >= 0));
}
export type ReasoningBody = Omit<AgentReasoningRequest, 'signal'>;
export function reasoningBody(request: unknown): { body: ReasoningBody; signal: AbortSignal } {
  if (!record(request) || Object.values(Object.getOwnPropertyDescriptors(request)).some(d => !('value' in d)) ||
    !(request.signal instanceof AbortSignal)) throw new ProviderError('invalid_ai_request');
  const { signal, ...body } = request;
  if (!validReasoningBody(body)) throw new ProviderError('invalid_ai_request');
  return { body, signal: signal as AbortSignal };
}
export function validReasoningBody(v: unknown): v is ReasoningBody {
  if (!dataOnly(v) || !exact(v, ['engineId', 'language', 'questionStatus', 'history', 'tools', 'remainingSteps']) ||
    !isProjectEngineId(v.engineId) || !['en', 'ar'].includes(String(v.language)) || v.questionStatus !== 'complete' ||
    !Number.isInteger(v.remainingSteps) || (v.remainingSteps as number) < 1 || (v.remainingSteps as number) > 16 ||
    !Array.isArray(v.tools) || !v.tools.length || v.tools.length > 4 || !Array.isArray(v.history) || v.history.length > 16) return false;
  const allowed = new AgentToolRegistry().reasoningTools();
  return new Set(v.tools.map(t => record(t) ? t.id : null)).size === v.tools.length &&
    v.tools.every(t => record(t) && allowed.some(a => a.id === t.id && equal(a, t))) &&
    v.history.every(h => exact(h, ['toolId', 'ok']) && typeof h.ok === 'boolean' && allowed.some(a => a.id === h.toolId));
}
export function validReasoningDecision(v: unknown, request: ReasoningBody): v is AgentReasoningDecision {
  if (!dataOnly(v) || !exact(v, ['action', 'confidence'], ['toolId', 'input']) || !confidence(v.confidence) || (v.confidence as number) < .6) return false;
  if (v.action === 'complete') return exact(v, ['action', 'confidence']);
  if (v.action !== 'use_tool' || !exact(v, ['action', 'confidence', 'toolId', 'input']) || !request.tools.some(t => t.id === v.toolId)) return false;
  return createAgentTools().some(t => t.id === v.toolId && t.validateInput(v.input));
}
