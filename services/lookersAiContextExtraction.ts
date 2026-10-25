import type { ProjectDraft, TaskType } from '../data/lookersAi';

export interface ExplicitFact { field: string; value: string; evidence: string }
export interface IdeaContext { taskType: TaskType; facts: ExplicitFact[] }

/** Deterministic extraction of explicit facts; never infer unstated preferences. */
export function extractIdeaContext(idea: string, fallback: TaskType): IdeaContext {
  const facts: ExplicitFact[] = [];
  const add = (field: string, value: string, evidence: string) => facts.push({ field, value, evidence });
  const video = /video|reels|فيديو|ريلز/i.test(idea);
  const taskType: TaskType = video ? 'general'
    : /presentation|slides|شرائح|برزنتيشن|عرض تقديمي/i.test(idea) ? 'presentation'
    : /dashboard|داشبورد|لوحة بيانات/i.test(idea) ? 'dashboard'
    : /campaign|حملة إعلانية|حملة تسويقية/i.test(idea) ? 'campaign'
    : /image|photo|poster|صورة|صوره|بوستر/i.test(idea) ? 'image' : fallback;
  if (idea.trim()) add('idea', idea.trim(), idea.trim());
  if (video) add('contentType', 'video', 'video keyword');
  const ratio = idea.match(/(9|16|1|4)\s*[:x/]\s*(9|16|1|4|5)/);
  if (ratio) add('format', ratio[1] + ':' + ratio[2], ratio[0]);
  const duration = idea.match(/\d{1,3}\s*(seconds?|minutes?|ثانية|ثواني|دقيقة)/i);
  if (duration) {
    const amount = duration[0].match(/\d{1,3}/)?.[0];
    const unit = /minute|دقيقة/i.test(duration[0]) ? 'minutes' : 'seconds';
    if (amount) add('duration', amount + ' ' + unit, duration[0]);
  }
  const platforms: [string, RegExp][] = [
    ['TikTok', /tiktok|تيك توك/i], ['Instagram', /instagram|انستجرام|إنستجرام/i],
    ['YouTube', /youtube|يوتيوب/i],
  ];
  for (const [name, pattern] of platforms) {
    const matched = idea.match(pattern);
    if (matched) add('platform', name, matched[0]);
  }
  return { taskType, facts };
}

/** Existing explicit answers always take precedence over extracted fields. */
export function mergeIdeaContext(draft: ProjectDraft, context: IdeaContext): ProjectDraft {
  const answers = { ...draft.answers };
  for (const fact of context.facts) {
    if (answers[fact.field] === undefined || answers[fact.field] === '') answers[fact.field] = fact.value;
  }
  return { ...draft, taskType: context.taskType, answers, updatedAt: new Date().toISOString() };
}
