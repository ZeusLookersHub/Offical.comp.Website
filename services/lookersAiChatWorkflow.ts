import { questions, type Lang, type ProjectDraft, type Question, type TaskType } from '../data/lookersAi';
import { extractIdeaContext, mergeIdeaContext } from './lookersAiContextExtraction';
import { videoChatQuestions } from './lookersAiVideoQuestions';
import { resolveTopic } from './lookersAiTopicRegistry';
import { getWorkflowSteps, type WorkflowStep } from './lookersAiWorkflowSchemas';

/**
 * Headless chat contract. Frontend owns presentation; backend owns progression.
 * One active question per turn, with choice controls embedded in the assistant message.
 * Nothing is persisted or sent to an external model by this pure module.
 */
export type ChatControl =
  | { type: 'single'; options: { value: string; label: string }[] }
  | { type: 'multi'; options: { value: string; label: string }[]; doneLabel: string }
  | { type: 'text'; placeholder: string; example: string }
  | { type: 'textarea'; placeholder: string; example: string };

export interface ChatQuestion {
  id: string;
  message: string;
  help: string;
  example: string;
  control: ChatControl;
  required: boolean;
  canSkip: boolean;
  submitLabel: string;
  helpLabel: string;
}

export type ChatTurn =
  | { status: 'question'; question: ChatQuestion; answered: number; remaining: number }
  | { status: 'ready'; answered: number; remaining: 0; promptReady: true };

const hasAnswer = (value: unknown): boolean =>
  typeof value === 'string' ? value.trim().length > 0 :
  Array.isArray(value) ? value.some(item => typeof item === 'string' && item.trim().length > 0) : false;

const translate = (lang: Lang, en: string, ar: string) => lang === 'ar' ? ar : en;

function toChatQuestion(question: Question | WorkflowStep, lang: Lang): ChatQuestion {
  const example = question.example?.[lang] || '';
  const placeholder = question.placeholder?.[lang] ||
    translate(lang, 'Write a short, specific answer here…', 'اكتب إجابة قصيرة وواضحة هنا…');
  const contextualWhy = 'why' in question ? question.why[lang] + ' ' : '';
  const help = contextualWhy + (example
    ? translate(lang, 'For example: ', 'مثال على إجابة مناسبة: ') + example
    : translate(lang, 'One short answer is enough.', 'إجابة قصيرة كفاية.'));
  const options = (question.options || []).map(option => ({ value: option.value, label: option[lang] }));
  const control: ChatControl = question.kind === 'single'
    ? { type: 'single', options }
    : question.kind === 'multi'
      ? { type: 'multi', options, doneLabel: translate(lang, 'Done · Send', 'تم · إرسال') }
      : { type: question.kind, placeholder, example };
  return {
    id: question.id,
    message: question.label[lang],
    help,
    example,
    control,
    required: !question.optional,
    canSkip: !!question.optional,
    submitLabel: translate(lang, 'Done · Send', 'تم · إرسال'),
    helpLabel: translate(lang, 'Explain this question', 'وضح لي السؤال'),
  };
}

/** Initial project idea is always asked inside chat, not in a separate wizard. */
const ideaQuestion = (lang: Lang): ChatQuestion => ({
  id: 'idea',
  message: translate(lang, 'Hi! I am Lookers AI. What would you like to create?', 'أهلًا! أنا Lookers AI. تحب نعمل إيه؟'),
  help: translate(lang, 'Describe the result you want, not technical AI instructions.', 'احكي النتيجة اللي عايز توصل لها، مش محتاج تعرف مصطلحات AI.'),
  example: translate(lang, 'I want a luxury perfume ad for Instagram.', 'عايز إعلان لعطر فاخر على إنستجرام.'),
  control: { type: 'textarea', placeholder: translate(lang, 'I want to create…', 'أنا عايز أعمل…'), example: translate(lang, 'I want a luxury perfume ad for Instagram.', 'عايز إعلان لعطر فاخر على إنستجرام.') },
  required: true, canSkip: false,
  submitLabel: translate(lang, 'Done · Send', 'تم · إرسال'),
  helpLabel: translate(lang, 'Show an example', 'وريني مثال'),
});

function activeQuestions(draft: ProjectDraft, lang: Lang): ChatQuestion[] {
  const video = draft.answers.contentType === 'video';
  const topicId = typeof draft.answers.topicId === 'string' ? draft.answers.topicId : '';
  const topic = resolveTopic(topicId);
  const selected = topic ? getWorkflowSteps(topic.family, draft.answers)
    : video ? videoChatQuestions : questions[draft.taskType];
  return [ideaQuestion(lang), ...selected.map(q => toChatQuestion(q, lang))];
}

/** Avoid asking for details already present in saved user answers. Optional details never block generation. */
export function nextChatTurn(draft: ProjectDraft, lang: Lang): ChatTurn {
  const all = activeQuestions(draft, lang);
  const required = all.filter(q => q.required);
  const answered = required.filter(q => hasAnswer(draft.answers[q.id])).length;
  const next = required.find(q => !hasAnswer(draft.answers[q.id]));
  if (!next) return { status: 'ready', answered, remaining: 0, promptReady: true };
  return { status: 'question', question: next, answered, remaining: required.length - answered };
}

export type ChatAnswerResult =
  | { ok: true; draft: ProjectDraft; turn: ChatTurn }
  | { ok: false; reason: 'unknown_question' | 'wrong_question' | 'invalid_answer' | 'invalid_option'; message: string };

/** Choices are staged by the UI and only committed when the user taps Done/Send. */
export function submitChatAnswer(draft: ProjectDraft, lang: Lang, questionId: string, answer: string | string[]): ChatAnswerResult {
  const turn = nextChatTurn(draft, lang);
  if (turn.status !== 'question') return { ok: false, reason: 'wrong_question', message: 'Interview already complete.' };
  const known = activeQuestions(draft, lang).find(q => q.id === questionId);
  if (!known) return { ok: false, reason: 'unknown_question', message: 'Unknown question.' };
  if (turn.question.id !== questionId) return { ok: false, reason: 'wrong_question', message: 'Answer the current question first.' };
  const control = known.control;
  const validOptions = control.type === 'single' || control.type === 'multi' ? control.options.map(o => o.value) : [];
  let normalized: string | string[];
  if (control.type === 'single') {
    if (typeof answer !== 'string' || !validOptions.includes(answer)) return { ok: false, reason: 'invalid_option', message: 'Select one available option.' };
    normalized = answer;
  } else if (control.type === 'multi') {
    if (!Array.isArray(answer) || !answer.length || answer.some(v => !validOptions.includes(v))) return { ok: false, reason: 'invalid_option', message: 'Select one or more available options.' };
    normalized = [...new Set(answer)];
  } else {
    if (typeof answer !== 'string' || !answer.trim()) return { ok: false, reason: 'invalid_answer', message: 'Please provide an answer.' };
    normalized = answer.trim();
  }
  const updated: ProjectDraft = {
    ...draft, updatedAt: new Date().toISOString(),
    answers: { ...draft.answers, [questionId]: normalized },
  };
  const contextualized = questionId === 'idea' && typeof normalized === 'string'
    ? mergeIdeaContext(updated, extractIdeaContext(normalized, updated.taskType)) : updated;
  return { ok: true, draft: contextualized, turn: nextChatTurn(contextualized, lang) };
}

/** Help is explanatory only: it does not advance or mutate the project. */
export function explainChatQuestion(draft: ProjectDraft, lang: Lang): string | null {
  const turn = nextChatTurn(draft, lang);
  return turn.status === 'question' ? turn.question.help : null;
}
