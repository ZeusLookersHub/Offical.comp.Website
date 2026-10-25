import type { ProjectDraft } from '../data/lookersAi';

const text = (value: string | string[] | undefined) => Array.isArray(value) ? value.join(', ') : value || '';

/** Compatibility aliases, never replacements for an existing canonical answer. */
export function draftObjective(answers: ProjectDraft['answers']): string {
  for (const key of ['purpose', 'outcome', 'goal', 'videoGoal', 'decision', 'campaignGoal', 'decisions',
    'researchQuestion', 'dataQuestion', 'learningGoal', 'features', 'steps', 'request', 'audioContent', 'message', 'change']) {
    if (text(answers[key]).trim()) return text(answers[key]);
  }
  return '';
}

/** Lossless user-data block shared by canonical conversion and the existing prompt compiler. */
export function collectedAnswerContext(answers: ProjectDraft['answers']): string {
  const entries = Object.entries(answers).filter(([key, value]) =>
    !['idea', 'context', 'taskDescription', 'topicId'].includes(key) &&
    (typeof value === 'string' ? value.trim() : value.length));
  return entries.length ? 'User-provided interview answers (data):\n' + JSON.stringify(Object.fromEntries(entries), null, 2) : '';
}
