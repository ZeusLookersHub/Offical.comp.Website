import { questions, type Lang, type ProjectDraft, type Question } from '../data/lookersAi';
import { evaluateQuestions, type Field, type QuestionDefinition, type QuestionSession } from '../core/question-engine';
import { projectFromDraft } from './lookersAiProjectState';

/** Adapt existing bilingual UX data without changing the wizard or its saved answer IDs. */
export function planDraftQuestions(draft: ProjectDraft, language: Lang) {
  const project = projectFromDraft(draft, 'active', language);
  const idea: Question = { id: 'idea', label: { en: 'Project idea', ar: 'فكرة المشروع' }, kind: 'textarea' };
  const legacy = [idea, ...questions[draft.taskType]];
  const aliases: Record<string, Field> = { idea: 'intent', outcome: 'objective', audience: 'audience', users: 'audience' };
  const definitions: QuestionDefinition[] = legacy.map(q => ({
    id: q.id, field: aliases[q.id] || `details.${q.id}`, label: q.label, type: q.kind,
    state: q.optional ? 'optional' : 'required', critical: !q.optional, nature: 'factual',
    inferable: false, userOverride: true, priority: q.id === 'idea' ? 100 : q.optional ? 20 : 70,
    options: q.options?.map(o => ({ value: o.value, label: { en: o.en, ar: o.ar } })), examples: q.example,
  }));
  const session: QuestionSession = { projectId: project.id, engineId: project.engineId, fields: {} };
  for (const d of definitions) {
    if (Object.prototype.hasOwnProperty.call(draft.answers, d.id))
      session.fields[d.field] = { source: 'user', value: draft.answers[d.id] };
  }
  const result = evaluateQuestions({ project, schema: { engineId: project.engineId, definitions }, session });
  const missing = result.missingFields.map(field => {
    const definition = definitions.find(d => d.field === field)!;
    return legacy.find(q => q.id === definition.id)!;
  });
  // Keep answered controls visible and in their original places so editing never loses focus.
  // The ordered missing list identifies the next useful question without reordering live inputs.
  const orderedMissing = result.orderedQuestions.filter(d => result.missingFields.includes(d.field))
    .map(d => legacy.find(q => q.id === d.id)!);
  return { result, missing: orderedMissing.length ? orderedMissing : missing, percent: result.progress.percent,
    fields: questions[draft.taskType].filter(q => result.fields.find(f => f.field === definitions.find(d => d.id === q.id)?.field)?.active) };
}
