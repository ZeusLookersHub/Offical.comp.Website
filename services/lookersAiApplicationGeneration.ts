import { Agent } from '../core/agent';
import type { AgentResult } from '../core/agent/types';
import type { QuestionSession } from '../core/question-engine';
import { compileLookersPrompt, type Lang, type ProjectDraft } from '../data/lookersAi';
import { projectFromDraft } from './lookersAiProjectState';
import { createDraftGenerator } from './lookersAiGeneration';
import type { AgentAITransport } from './lookersAiAgentReasoner';
import { validateEnhancement, type EnhancementValidation } from '../core/enhancement';

/** The application owns access; neither model output nor draft fields grant tool permissions. */
export function createApplicationGenerator(transport: AgentAITransport) {
  const generate = createDraftGenerator(transport);
  return async (draft: ProjectDraft, language: Lang, signal: AbortSignal):
    Promise<{ prompt: string; source: 'ai' | 'local'; agent: AgentResult; enhancement: EnhancementValidation }> => {
    const snapshot = structuredClone(draft);
    const project = projectFromDraft(snapshot, 'active', language);
    const fields: QuestionSession['fields'] = {};
    const user = (field: string, value: unknown) => {
      if (typeof value === 'string' && value.trim()) fields[field] = { source: 'user', value };
    };
    // Only actual user-authored answers are forwarded; no inferred facts or approvals.
    user('intent', snapshot.answers.idea);
    user('objective', snapshot.answers.purpose || snapshot.answers.outcome);
    if (snapshot.taskType === 'image') {
      user('details.subject', snapshot.answers.subject);
      user('details.usage', snapshot.answers.usage);
      user('details.style', snapshot.answers.style);
      user('details.aspectRatio', snapshot.answers.format);
      if (typeof snapshot.answers.imageText === 'string' && snapshot.answers.imageText.trim()) {
        user('details.includeText', 'yes');
        user('details.exactText', snapshot.answers.imageText);
      }
    }
    if (snapshot.taskType === 'campaign') user('details.businessFacts', snapshot.answers.product);
    const questionSession = { projectId: project.id, engineId: project.engineId, fields };
    const enhancement = validateEnhancement(project, questionSession);
    const agent = await new Agent({ access: { projectId: project.id, canSave: false } }).run({ project, questionSession }, signal);
    if (signal.aborted) throw new Error('aborted');
    if (enhancement.status !== 'ready' || agent.error || agent.decision.action !== 'complete') {
      // Do not interpret a failed/unfinished Agent run as permission to call the provider.
      return { prompt: compileLookersPrompt(snapshot, language), source: 'local', agent, enhancement };
    }
    const result = await generate(snapshot, language, signal);
    return { ...result, agent, enhancement };
  };
}
