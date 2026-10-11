import type { AgentReasoner } from '../core/agent/types';
import { dataOnly, exact, record } from '../core/agent/validation';

/** Transport is supplied by the authenticated application boundary; no provider or secret here. */
export type AgentAITransport = (body: unknown, signal: AbortSignal) => Promise<unknown>;
export function createAgentReasoner(transport: AgentAITransport): AgentReasoner {
  return {
    async reason(request) {
      const { signal, ...reasoning } = request;
      const envelope = await transport({ operation: 'reason', reasoning }, signal);
      if (!dataOnly(envelope) || !exact(envelope, ['data'], ['identity']) || !record(envelope.data) || !exact(envelope.data, ['decision']))
        throw new Error('ai_unavailable');
      // The existing Agent performs the final allowlist, confidence and tool checks.
      return structuredClone(envelope.data.decision);
    },
  };
}
