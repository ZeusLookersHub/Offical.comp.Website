import { bounded, BoundedError } from './bounded';
import { confidence, dataOnly, exact, toolId } from './validation';
import type { AgentErrorCode, AgentReasoner, AgentReasoningDecision, AgentReasoningRequest } from './types';

export async function reasonNext(port: AgentReasoner, request: Omit<AgentReasoningRequest, 'signal'>, timeoutMs: number, signal?: AbortSignal):
  Promise<{ decision?: AgentReasoningDecision; error?: AgentErrorCode }> {
  try {
    const raw = await bounded(abort => port.reason({ ...structuredClone(request), signal: abort }), timeoutMs, signal);
    if (!dataOnly(raw) || !exact(raw, ['action', 'confidence'], ['toolId', 'input']) || !confidence(raw.confidence) || (raw.confidence as number) < .6)
      return { error: 'invalid_reasoning' };
    if (raw.action === 'complete' && exact(raw, ['action', 'confidence'])) return { decision: structuredClone(raw) as unknown as AgentReasoningDecision };
    if (raw.action === 'use_tool' && exact(raw, ['action', 'confidence', 'toolId', 'input']) && toolId(raw.toolId) &&
      request.tools.some(t => t.id === raw.toolId)) return { decision: structuredClone(raw) as unknown as AgentReasoningDecision };
    return { error: 'invalid_reasoning' };
  } catch (error) {
    return { error: error instanceof BoundedError ? error.code === 'timeout' ? 'reasoner_timeout' : 'aborted' : 'reasoner_unavailable' };
  }
}
