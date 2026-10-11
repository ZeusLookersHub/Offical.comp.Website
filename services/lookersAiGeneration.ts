import { compileLookersPrompt, type ProjectDraft, type Lang } from '../data/lookersAi';
import { dataOnly, exact, text } from '../core/agent/validation';
import type { AgentAITransport } from './lookersAiAgentReasoner';

/** Existing generation HTTP contract. Model text is a draft, never a Project patch. */
export function createDraftGenerator(transport: AgentAITransport) {
  return async (draft: ProjectDraft, language: Lang, signal: AbortSignal): Promise<{ prompt: string; source: 'ai' | 'local' }> => {
    const prompt = compileLookersPrompt(draft, language);
    try {
      if (signal.aborted || prompt.length > 12000) throw new Error('ai_unavailable');
      const envelope = await transport({ prompt, language }, signal);
      if (signal.aborted) throw new Error('aborted');
      if (!dataOnly(envelope) || !exact(envelope, ['data', 'identity']) ||
        !exact(envelope.identity, ['userId', 'isAnonymous']) || !text(envelope.identity.userId) || envelope.identity.isAnonymous !== true ||
        !exact(envelope.data, ['id', 'output', 'provenance'], ['usage']) || !text(envelope.data.id) ||
        !exact(envelope.data.provenance, ['providerId', 'modelId']) || !text(envelope.data.provenance.providerId) || !text(envelope.data.provenance.modelId) ||
        !exact(envelope.data.output, ['title', 'prompt', 'summary']) || !text(envelope.data.output.title, 500) ||
        !text(envelope.data.output.prompt, 20000) || !text(envelope.data.output.summary, 4000) ||
        (envelope.data.usage !== undefined && (!exact(envelope.data.usage, [], ['inputTokens', 'outputTokens']) ||
          !Object.values(envelope.data.usage).every(n => Number.isSafeInteger(n) && (n as number) >= 0)))) throw new Error('invalid_ai_response');
      return { prompt: envelope.data.output.prompt, source: 'ai' };
    } catch {
      if (signal.aborted) throw new Error('aborted');
      return { prompt, source: 'local' };
    }
  };
}
