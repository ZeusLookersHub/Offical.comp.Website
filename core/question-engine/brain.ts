import type { BrainDecision } from '../brain/types';
import { applyBrainDecision } from '../brain/apply';
import { isProjectEngineId } from '../projects/engines';
import type { QuestionInput } from './types';
import { evaluateQuestions } from './engine';

/** Consume only the resolved route. Brain hints never become factual answers. */
export function questionsFromBrain(input: QuestionInput, decision: BrainDecision, now: string) {
  if (decision?.status !== 'resolved' || !isProjectEngineId(decision.engineId))
    return { status: 'needs_route' as const, project: input.project, result: null };
  const project = applyBrainDecision(input.project, decision, now);
  if (project.engineId !== decision.engineId) return { status: 'needs_route' as const, project, result: null };
  return { status: 'routed' as const, project, result: evaluateQuestions({ ...input, project }) };
}
