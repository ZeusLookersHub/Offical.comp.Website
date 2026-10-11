import { validateProject } from '../projects/validation';
import { evaluateQuestions, type QuestionSession, type Field } from '../question-engine';
import type { Project } from '../projects/types';
import { dataOnly } from '../agent/validation';

export interface EnhancementValidation {
  status: 'invalid' | 'needs_input' | 'needs_confirmation' | 'ready';
  critical: Field[];
  known: Field[];
  inferable: Field[];
  /** Advisory technical defaults only; no inferred business or personal facts. */
  suggestions: Array<{ field: Field; value: string | string[]; requiresUserOverrideSupport: true }>;
  issues: string[];
}
/** Stage 05 validation is advisory and never patches canonical data or user answers. */
export function validateEnhancement(project: Project, session?: QuestionSession): EnhancementValidation {
  const empty: EnhancementValidation = { status: 'invalid', critical: [], known: [], inferable: [], suggestions: [], issues: [] };
  if (!dataOnly(project) || !validateProject(project).valid) return { ...empty, issues: ['invalid_project'] };
  if (session !== undefined && !dataOnly(session)) return { ...empty, issues: ['invalid_question_state'] };
  const result = evaluateQuestions({ project, session });
  if (result.status === 'invalid') return { ...empty, issues: result.reasons };
  return {
    status: result.status === 'complete' ? 'ready' : result.status === 'needs_confirmation' ? 'needs_confirmation' : 'needs_input',
    critical: [...result.criticalFields], known: [...result.knownFields], inferable: [...result.inferableFields],
    suggestions: result.fields.filter(f => f.active && f.source === 'default' && f.value !== undefined).map(f => ({
      field: f.field, value: structuredClone(f.value!), requiresUserOverrideSupport: true,
    })),
    issues: result.missingFields.map(f => 'missing:' + f),
  };
}
