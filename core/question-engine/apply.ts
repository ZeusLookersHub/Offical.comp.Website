import type { Project } from '../projects/types';
import { validateProject } from '../projects/validation';
import { evaluateQuestions, inputSchema, sessionMatches } from './engine';
import { validValue } from './validation';
import type { Field, QuestionInput, QuestionSession } from './types';

/** Explicit user answers replace suggestions. Time and persistence remain caller-owned. */
export function answerQuestion(input: QuestionInput, field: Field, value: unknown, now: string): { project: Project; session: QuestionSession } {
  const plan = evaluateQuestions(input);
  if (plan.status === 'invalid' || input.project.status === 'archived') throw new Error('invalid_question_update');
  const d = inputSchema(input).definitions.find(q => q.field === field);
  if (!d || !validValue(d, value) || !plan.fields.find(f => f.field === field)?.active) throw new Error('invalid_answer');
  const project = structuredClone(input.project);
  if (field.startsWith('output.')) {
    const key = field.slice(7);
    if (key === 'deliverables') project.schema.output.deliverables = value as string[];
    else project.schema.output[key as 'description' | 'format'] = value as string;
  } else if (!field.startsWith('details.')) {
    if (field === 'constraints' || field === 'targetTools') project.schema[field] = value as string[];
    else project.schema[field as 'intent' | 'objective' | 'context' | 'audience'] = value as string;
  }
  project.updatedAt = now;
  if (!validateProject(project).valid) throw new Error('invalid_project_update');
  const session: QuestionSession = sessionMatches(input) ? structuredClone(input.session!) : {
    projectId: project.id, engineId: project.engineId, fields: {},
  };
  // Any edited answer can change the brief; unconfirmed suggestions must be reconsidered.
  for (const [key, entry] of Object.entries(session.fields)) {
    if (entry?.source === 'inference') delete session.fields[key as Field];
  }
  session.fields[field] = { value: structuredClone(value), source: 'user', confirmed: true };
  return { project, session };
}
