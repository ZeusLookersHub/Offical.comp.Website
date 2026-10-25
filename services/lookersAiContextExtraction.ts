import type { ProjectDraft, TaskType } from '../data/lookersAi';

export interface ExplicitFact { field: string; value: string; evidence: string }
export interface IdeaContext { taskType: TaskType; facts: ExplicitFact[] }

/** Extract only explicit, unambiguous facts. Evidence always comes from the original idea. */
export function extractIdeaContext(idea: string, fallback: TaskType): IdeaContext {
  const facts: ExplicitFact[] = [];
  const add = (field: string, value: string, evidence: string) => facts.push({ field, value, evidence });
  const text = idea.replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
  const videoMatch = idea.match(/\b(?:video|reels?)\b|فيديو|ريلز/i);
  const video = !!videoMatch && !/(?:no|without|not|بدون|من غير|مش)\s+(?:a\s+)?(?:video|reels?|فيديو|ريلز)/i.test(idea);
  const taskType: TaskType = fallback !== 'general' ? fallback : video ? 'general'
    : /presentation|slides|شرائح|برزنتيشن|عرض تقديمي/i.test(idea) ? 'presentation'
    : /dashboard|داشبورد|لوحة بيانات/i.test(idea) ? 'dashboard'
    : /campaign|حملة إعلانية|حملة تسويقية/i.test(idea) ? 'campaign'
    : /\b(?:image|photo|poster)\b|صورة|صوره|بوستر/i.test(idea) ? 'image' : fallback;
  if (idea.trim()) add('idea', idea.trim(), idea.trim());
  if (video) add('contentType', 'video', videoMatch![0]);
  const uniqueMatch = (pattern: RegExp, field: string, convert: (m: RegExpMatchArray) => string) => {
    const matches = [...text.matchAll(pattern)].filter(m => !/(?:not|without|no|مش|بدون|من غير)\s*$/i.test(text.slice(0, m.index)));
    const values = [...new Set(matches.map(convert))];
    if (field === 'format' && values.some(v => !['16:9','9:16','1:1','4:5','3:2','2:3','4:3'].includes(v))) return;
    if (values.length === 1) {
      const m = matches[0];
      add(field, values[0], idea.slice(m.index, m.index! + m[0].length));
    }
  };
  uniqueMatch(/(?<![\d.])(16|9|1|4|3|2)\s*[:x/]\s*(16|9|1|5|3|2)(?!\d)/g, 'format', m => m[1] + ':' + m[2]);
  uniqueMatch(/(?<![\d.\-–])([1-9]\d{0,2})\s*-?\s*(seconds?\b|minutes?\b|ثانية|ثواني|ثوان|دقائق|دقيقة)/gi, 'duration',
    m => m[1] + (/minute|دقيق/i.test(m[2]) ? ' minutes' : ' seconds'));
  const platforms: [string, RegExp][] = [
    ['TikTok', /\btiktok\b|تيك توك/i], ['Instagram', /\binstagram\b|انستجرام|إنستجرام/i],
    ['YouTube', /\byoutube\b|يوتيوب/i], ['LinkedIn', /\blinkedin\b|لينكدإن/i],
    ['Facebook', /\bfacebook\b|فيسبوك/i], ['WhatsApp', /\bwhatsapp\b|واتساب/i],
  ];
  const selected = platforms.flatMap(([name, pattern]) => {
    const match = idea.match(pattern);
    // A negated platform is not a requested destination.
    return match && !/(?:not|without|no|مش|بدون|من غير)\s*$/i.test(idea.slice(0, match.index)) ? [{ name, evidence: match[0] }] : [];
  });
  if (selected.length) add('platform', selected.map(p => p.name).join(', '), selected.map(p => p.evidence).join(', '));
  // Labels delimit explicit facts; do not guess an audience, subject or goal from vague prose.
  const labels: [string, string][] = [
    ['audience', 'audience|الجمهور'], ['purpose', 'purpose|goal|الهدف'],
    ['output', 'output|deliverable|التسليم|المخرج'], ['tools', 'tool|tools|الأداة|الاداة'],
    ['subject', 'subject|العنصر'], ['videoSubject', 'scene|المشهد'],
    ['message', 'message|الرسالة'], ['topic', 'topic|الموضوع'],
    ['constraints', 'constraints|القيود'], ['tone', 'tone|الأسلوب'],
  ];
  for (const [field, label] of labels) {
    const matches = [...idea.matchAll(new RegExp('(?:^|[;؛\\n])\\s*(?:' + label + ')\\s*[:：]\\s*([^;؛\\n]+)', 'gi'))];
    const values = [...new Set(matches.map(m => m[1].trim()).filter(Boolean))];
    if (values.length === 1) add(field, values[0], matches[0][0].trim());
  }
  const prose: [string, RegExp][] = [
    ['audience', /(?:\btargeting\s+|\bfor an audience of\s+|للجمهور\s+)([^.;؛\n]+)/i],
    ['videoSubject', /\bvideo of\s+([^;.\n]+?)(?=\s+(?:for|on|lasting|using)\b|[;.\n]|$)/i],
    ['purpose', /(?:\bin order to\s+|بهدف\s+|عشان\s+)([^.;؛\n]+)/i],
    ['output', /(?:\boutput as\s+|\bdeliver as\s+|بصيغة\s+)(PDF|DOCX|PPTX|JSON|Markdown|نص|جدول)(?=$|[\s;؛.,])/i],
    ['tools', /(?:\busing\s+|\bwith\s+|باستخدام\s+)(Canva|Midjourney|Sora|Runway|PowerPoint|Gamma|ChatGPT)\b/i],
  ];
  for (const [field, pattern] of prose) {
    const match = idea.match(pattern);
    if (match && (field !== 'videoSubject' || video) && !facts.some(f => f.field === field)) add(field, match[1].trim(), match[0]);
  }
  const purpose = facts.find(f => f.field === 'purpose');
  if (purpose) add('goal', purpose.value, purpose.evidence);
  const subject = facts.find(f => f.field === 'subject');
  if (video && subject && !facts.some(f => f.field === 'videoSubject')) add('videoSubject', subject.value, subject.evidence);
  return { taskType, facts };
}

/** Existing explicit answers (including deliberate empty values) always take precedence. */
export function mergeIdeaContext(draft: ProjectDraft, context: IdeaContext): ProjectDraft {
  const answers = { ...draft.answers };
  for (const fact of context.facts) {
    const groups = [['purpose','outcome','goal','videoGoal'], ['subject','videoSubject'], ['output','deliverable'], ['audience','users']];
    const peers = groups.find(group => group.includes(fact.field)) || [fact.field];
    if (!Object.hasOwn(answers, fact.field) && !peers.some(key => Object.hasOwn(draft.answers, key))) answers[fact.field] = fact.value;
  }
  return { ...draft, taskType: draft.taskType === 'general' ? context.taskType : draft.taskType, answers, updatedAt: new Date().toISOString() };
}
