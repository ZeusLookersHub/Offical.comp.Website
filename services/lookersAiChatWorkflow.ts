import { questionCopy } from '../data/lookersAiQuestionCopy';
import { topicQuestions } from './lookersAiTopicQuestions';
import { draftObjective } from './lookersAiAnswerContext';
import { questions, type Lang, type ProjectDraft, type Question, type TaskType } from '../data/lookersAi';
import { extractIdeaContext, mergeIdeaContext } from './lookersAiContextExtraction';
import { videoChatQuestions } from './lookersAiVideoQuestions';
import { resolveTopic } from './lookersAiTopicRegistry';
import { egyptianHelp, getWorkflowSteps, type WorkflowStep } from './lookersAiWorkflowSchemas';

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

const fallbackHelp: Record<string, Record<Lang, string>> = {
  publishing: { en: "Choose who publishes or approves the campaign so we respect that boundary.", ar: "قولّي مين هينشر أو يوافق على الحملة، عشان ما نفترضش صلاحيات مش عندنا." },
  campaignGoal: { en: "Choose the business outcome so the campaign focuses on the right result.", ar: "اختار عايز مبيعات ولا استفسارات ولا انتشار، عشان الحملة تركز على الهدف ده." },
  product: { en: "Describe the product and confirmed offer so the campaign uses accurate facts.", ar: "قولّي بتسوّق لإيه والعرض المؤكد إيه، عشان ما نخترعش مزايا أو أسعار." },
  decisions: { en: "Describe the decisions the dashboard must support so we choose useful measures.", ar: "قولّي عايز تاخد قرارات إيه من الداشبورد، عشان نختار أرقام تساعدك فيها." },
  metrics: { en: "Name the measures that matter so the dashboard answers your business questions.", ar: "قولّي الأرقام اللي تهمك، عشان الداشبورد يجاوب على أسئلتك." },
  presentationType: { en: "Describe the kind of presentation so the structure suits the occasion.", ar: "قولّي ده عرض بيع ولا تدريب ولا تعريف بالشركة، عشان نرتب الشرائح على استخدامه." },
  slideCount: { en: "Give a preferred slide count or running time so the deck fits your time.", ar: "قولّي تحب كام شريحة أو عندك كام دقيقة، عشان العرض ما يطولش عليك." },
  visualStyle: { en: "Describe the visual style so the slides have a consistent look.", ar: "قولّي تحب شكل الشرائح يبقى عامل إزاي، عشان كلها تطلع متناسقة." },
  brandGuidelines: { en: "Share approved brand rules so the deck matches your identity.", ar: "قولّي عندك ألوان أو خط أو لوجو لازم نلتزم بيه، عشان العرض يبقى شبه هويتك." },
  dataAvailability: { en: "Identify confirmed facts so we avoid invented numbers or claims.", ar: "قولّي إيه الأرقام والمعلومات اللي عندك فعلًا، عشان ما نكتبش أرقام من عندنا." },
  speakerNotes: { en: "Choose whether to add speaking notes so the presenter knows what to say.", ar: "اختار محتاج كلام يساعدك وإنت بتعرض ولا الشرائح بس، عشان نجهز التسليم المناسب." },
  presentationFormat: { en: "Name the output format so the presentation is usable in your tools.", ar: "قولّي محتاج شرائح تتعدل ولا PDF ولا مخطط، عشان التسليم يناسب شغلك." },
  imageText: { en: "Write the exact words to appear so the image does not invent copy.", ar: "اكتب الكلام اللي عايزه يظهر بالحرف، عشان ما نألفش كتابة على الصورة." },
  avoid: { en: "Name unwanted elements so the prompt excludes them explicitly.", ar: "قولّي إيه اللي مش عايزه يظهر، عشان نستبعده بوضوح من البرومبت." },
  constraints: { en: "List limits we must respect so the result stays within your requirements.", ar: "قولّي إيه الحدود اللي لازم نلتزم بيها، عشان النتيجة ما تخرجش عن طلبك." },
  success: { en: "Describe what a useful result looks like so we can check it against your goal.", ar: "قولّي هتعرف إزاي إن النتيجة نفعتك، عشان نراجعها على أساس واضح." },
  videoGoal: { en: 'Choose what the video should achieve so the scenes support that goal.', ar: 'قولّي الفيديو هيعمل إيه: إعلان ولا شرح ولا حكاية؟ عشان نرتب المشاهد على الهدف ده.' },
  duration: { en: 'Choose the running time so the scene pacing fits.', ar: 'قولّي الفيديو كام ثانية أو دقيقة، عشان نوزع المشاهد من غير ما يبقى سريع زيادة أو طويل.' },
  format: { en: 'Choose the shape of the frame so it fits where you will use it.', ar: 'اختار شكل الكادر: طولي ولا عريض ولا مربع، عشان يناسب المكان اللي هتنشر فيه.' },
  action: { en: 'Choose whether to create, edit or analyze so we use the right workflow.', ar: 'اختار هنعمل صورة جديدة ولا نعدل أو نحلل مرجع، عشان نمشي على الخطوات المناسبة.' },
  videoStyle: { en: 'Choose the visual mood so lighting and camera direction stay consistent.', ar: 'اختار إحساس الفيديو، عشان الإضاءة وحركة الكاميرا يمشوا مع الشكل اللي في دماغك.' },
  videoAudio: { en: 'Choose the sound so the prompt asks for the right audio.', ar: 'اختار محتاج موسيقى ولا تعليق صوتي ولا من غير صوت، عشان البرومبت يوضح اللي عايز تسمعه.' },
  voiceoverScript: { en: 'Write the exact spoken words so the voice-over keeps your message.', ar: 'اكتب الكلام اللي تحب يتقال بالحرف، عشان التعليق الصوتي يحافظ على رسالتك.' },
  outcome: { en: 'Describe the result you want so we can focus the work on it.', ar: 'قولّي النتيجة اللي عايز توصلها، عشان الشغل يركز عليها من الأول.' },
};

const fallbackExamples: Record<string, Record<Lang, string>> = {
  slideCount: { en: "10 slides for a 15-minute talk.", ar: "10 شرائح لعرض مدته 15 دقيقة." },
  visualStyle: { en: "Simple slides with dark blue backgrounds.", ar: "شرائح بسيطة بخلفية كحلي." },
  brandGuidelines: { en: "Use our approved logo and blue brand colors.", ar: "استخدم اللوجو المعتمد وألواننا الزرقا." },
  dataAvailability: { en: "I have verified quarterly sales figures.", ar: "معايا أرقام المبيعات المؤكدة للربع ده." },
  speakerNotes: { en: "Include a short speaking note per slide.", ar: "عايز ملاحظات قصيرة أقولها مع كل شريحة." },
  presentationFormat: { en: "Editable PowerPoint slides.", ar: "شرائح PowerPoint أقدر أعدلها." },
  imageText: { en: "Discover your new fragrance.", ar: "اكتشف عطرك الجديد." },
  constraints: { en: "Keep the approved label unchanged.", ar: "خلي الكتابة المعتمدة على المنتج زي ما هي." },
  avoid: { en: "No extra text or unrelated objects.", ar: "من غير كلام زيادة أو حاجات ملهاش علاقة." },
  success: { en: "Viewers understand the offer and how to book.", ar: "الناس تفهم العرض وتعرف تحجز إزاي." },
  style: { en: "Warm studio light and realistic materials.", ar: "إضاءة استوديو دافية وخامات واقعية." },
  usage: { en: "An Instagram story promoting the new bottle.", ar: "ستوري إنستجرام للعطر الجديد." },
};

const translate = (lang: Lang, en: string, ar: string) => lang === 'ar' ? ar : en;

function toChatQuestion(question: Question | WorkflowStep, lang: Lang): ChatQuestion {
  const copy = questionCopy[question.id];
  const example = question.example?.[lang] || (lang === 'ar' ? copy?.[3] : '') || '';
  const placeholder = question.placeholder?.[lang] ||
    (lang === 'ar' ? copy?.[1] : '') || example || question.label[lang];
  const contextualWhy = 'why' in question ? question.why[lang] + ' ' : '';
  const detail = fallbackHelp[question.id];
  const deliveryFormat = question.id === 'format' && question.options?.some(o => o.value === 'excel');
  const meaning = deliveryFormat ? translate(lang, 'Choose the delivery format so your team can open and maintain the dashboard.', 'اختار هتستلم الداشبورد في إيه، عشان فريقك يعرف يفتحه ويعدّل عليه.') : 'why' in question ? contextualWhy : detail?.[lang] || (lang === 'ar' && copy ? `${copy[1]} ${copy[2]}` : '') ||
    (lang === 'ar' ? (egyptianHelp[question.id] || `قولّي إجابتك على «${question.label.ar}» بطريقتك.`) + ' عشان النتيجة تتظبط على طلبك.'
      : `Tell us your preference for “${question.label.en}” so the result follows your choices.`);
  const sample = ('why' in question ? example : fallbackExamples[question.id]?.[lang] || example) || (deliveryFormat ? question.options?.[0]?.[lang] : undefined) || question.options?.[0]?.[lang] || translate(lang, 'Keep the result concise and practical.', 'خلي النتيجة قصيرة وعملية.');
  const help = meaning + ' ' + translate(lang, 'For example: ', 'مثال على إجابة مناسبة: ') + sample;
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
  help: translate(lang, 'Describe what you want to create so we can choose useful follow-up questions. For example: a luxury perfume ad for Instagram.', 'بص، احكيلي عايز تعمل إيه والنتيجة تبقى عاملة إزاي، عشان نسألك بس عن اللي ناقص. مثال: عايز إعلان لعطر فاخر على إنستجرام.'),
  example: translate(lang, 'I want a luxury perfume ad for Instagram.', 'عايز إعلان لعطر فاخر على إنستجرام.'),
  control: { type: 'textarea', placeholder: translate(lang, 'I want to create…', 'أنا عايز أعمل…'), example: translate(lang, 'I want a luxury perfume ad for Instagram.', 'عايز إعلان لعطر فاخر على إنستجرام.') },
  required: true, canSkip: false,
  submitLabel: translate(lang, 'Done · Send', 'تم · إرسال'),
  helpLabel: translate(lang, 'Explain this question', 'وضح لي السؤال'),
});

function activeQuestions(draft: ProjectDraft, lang: Lang): ChatQuestion[] {
  const video = draft.answers.contentType === 'video';
  const topicId = typeof draft.answers.topicId === 'string' ? draft.answers.topicId : '';
  const topic = resolveTopic(topicId);
  const selected = topic ? [...getWorkflowSteps(topic.family, draft.answers), ...topicQuestions(topic.id)]
    : video ? [...videoChatQuestions, ...getWorkflowSteps('video', draft.answers).filter(q => q.id === 'voiceoverScript')]
      : questions[draft.taskType];
  const mapped = selected.map(q => toChatQuestion(q, lang));
  // Keep the interview aligned with the existing canonical Agent's objective/ratio requirements.
  if (draft.taskType === 'image') {
    if (!mapped.some(q => q.id === 'subject')) mapped.push(toChatQuestion(questions.image.find(q => q.id === 'subject')!, lang));
    const ratio = mapped.find(q => q.id === 'format');
    if (ratio) { ratio.required = true; ratio.canSkip = false; }
    else mapped.push(toChatQuestion(questions.image.find(q => q.id === 'format')!, lang));
  }
  if (!draftObjective(draft.answers) && !mapped.some(q => q.required &&
    ['goal','videoGoal','outcome','campaignGoal','decisions','decision','researchQuestion','dataQuestion','learningGoal','features','steps','request','audioContent','message','change'].includes(q.id))) {
    mapped.push(toChatQuestion(getWorkflowSteps('business', {}).find(q => q.id === 'goal')!, lang));
  }
  if (!mapped.some(q => q.id === 'output')) mapped.push(toChatQuestion(getWorkflowSteps('business', {}).find(q => q.id === 'output')!, lang));
  mapped.push(toChatQuestion({
    id: 'tools', kind: 'text', optional: true,
    label: { en: 'Which tool should the prompt be ready for?', ar: 'تحب البرومبت يبقى جاهز لأنهي أداة؟' },
    why: { en: 'Name the target tool so the prompt uses a suitable structure and output format.', ar: 'قولّي هتستخدم البرومبت في أنهي أداة، عشان نجهز التعليمات بالشكل المناسب ليها.' },
    example: { en: 'Runway for video, or Canva for a presentation.', ar: 'Runway للفيديو، أو Canva للعرض.' }, priority: 5,
  }, lang));
  return [ideaQuestion(lang), ...mapped];
}

function answerFor(draft: ProjectDraft, id: string): unknown {
  if (Object.hasOwn(draft.answers, id)) return draft.answers[id];
  const aliases: Record<string, string[]> = {
    goal: ['purpose', 'outcome'], videoGoal: ['purpose', 'goal'], videoSubject: ['subject'], subject: ['videoSubject'], outcome: ['purpose', 'goal'],
    audience: ['users'], users: ['audience'], output: ['deliverable'],
  };
  return aliases[id]?.map(key => draft.answers[key]).find(hasAnswer);
}

function isAnswered(draft: ProjectDraft, question: ChatQuestion): boolean {
  const answer = answerFor(draft, question.id);
  if (!hasAnswer(answer)) return false;
  const control = question.control;
  if (control.type === 'single') {
    if (typeof answer !== 'string') return false;
    if (control.options.some(o => o.value === answer)) return true;
    // Explicit custom timings/ratios are meaningful even outside the suggested choices.
    if (question.id === 'duration') return /^[1-9]\d{0,2} (?:seconds|minutes)$/.test(answer);
    if (question.id === 'format') return ['1:1','9:16','16:9','4:5','3:2','2:3','4:3'].includes(answer);
    return question.id === 'videoGoal' && !Object.hasOwn(draft.answers, 'videoGoal');
  }
  if (control.type === 'multi') return Array.isArray(answer) && answer.length > 0 &&
    answer.every(value => control.options.some(o => o.value === value));
  return hasAnswer(answer);
}

/** Avoid asking for details already present in saved user answers. Optional details never block generation. */
export function nextChatTurn(draft: ProjectDraft, lang: Lang): ChatTurn {
  const all = activeQuestions(draft, lang);
  const required = all.filter(q => q.required);
  const answered = required.filter(q => isAnswered(draft, q)).length;
  const next = required.find(q => !isAnswered(draft, q));
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
  return saveAnswer(draft, lang, known, answer);
}

function saveAnswer(draft: ProjectDraft, lang: Lang, question: ChatQuestion, answer: string | string[]): ChatAnswerResult {
  const questionId = question.id;
  const control = question.control;
  const validOptions = control.type === 'single' || control.type === 'multi' ? control.options.map(o => o.value) : [];
  let normalized: string | string[];
  if (control.type === 'single') {
    if (typeof answer !== 'string' || !validOptions.includes(answer)) return { ok: false, reason: 'invalid_option', message: 'Select one available option.' };
    normalized = answer;
  } else if (control.type === 'multi') {
    if (!Array.isArray(answer) || !answer.length || answer.some(v => !validOptions.includes(v))) return { ok: false, reason: 'invalid_option', message: 'Select one or more available options.' };
    normalized = [...new Set(answer)];
  } else {
    if (typeof answer !== 'string' || !answer.trim() || answer.length > 4000) return { ok: false, reason: 'invalid_answer', message: 'Please provide an answer.' };
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
export function explainChatQuestion(draft: ProjectDraft, lang: Lang, refinementId?: string): string | null {
  const turn = nextChatTurn(draft, lang);
  if (refinementId) return turn.status === 'ready'
    ? getChatRefinements(draft, lang).questions.find(q => q.id === refinementId)?.help || null : null;
  return turn.status === 'question' ? turn.question.help : null;
}

/** Separate opt-in phase. A ready required interview stays ready throughout refinements. */
export interface ChatRefinements {
  phase: 'required' | 'refinement';
  canGenerate: boolean;
  canSkip: boolean;
  questions: ChatQuestion[];
}
export function getChatRefinements(draft: ProjectDraft, lang: Lang): ChatRefinements {
  if (nextChatTurn(draft, lang).status !== 'ready') return { phase: 'required', canGenerate: false, canSkip: false, questions: [] };
  return { phase: 'refinement', canGenerate: true, canSkip: true,
    questions: activeQuestions(draft, lang).filter(q => !q.required && !isAnswered(draft, q)) };
}

export function submitChatRefinement(draft: ProjectDraft, lang: Lang, questionId: string, answer: string | string[]): ChatAnswerResult {
  const question = getChatRefinements(draft, lang).questions.find(q => q.id === questionId);
  if (!question) return { ok: false, reason: 'wrong_question', message: 'Refinement is not currently available.' };
  return saveAnswer(draft, lang, question, answer);
}

/** Skipping all remaining refinements is a read-only operation, with no fabricated answer. */
export function skipChatRefinements(draft: ProjectDraft, lang: Lang): ChatTurn {
  return nextChatTurn(draft, lang);
}
