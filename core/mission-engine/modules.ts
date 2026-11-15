import type { Copy, Importance, Slot, SlotDefault, SlotOption } from './types.ts';

/**
 * Shared slot modules. A new mission (or a whole new universe) is mostly a selection of these,
 * plus 2–4 domain slots and its strategy. Override anything per blueprint.
 */
export const c = (en: string, ar: string): Copy => ({ en, ar });
type Patch = Partial<Slot>;
const make = (base: Slot, patch: Patch = {}): Slot => ({ ...base, ...patch });

export const brandName = (patch?: Patch): Slot => make({
  id: 'brandName', kind: 'exact', layer: 'control', importance: 'important', maxLength: 80,
  label: c('Brand name', 'اسم البراند'),
  question: c('What is the brand name, exactly as it is written?', 'اسم البراند إيه؟ اكتبه بالحرف زي ما بيتكتب.'),
  why: c('We copy it letter by letter — AI tools often misspell names.', 'هننقله حرف بحرف، لأن أدوات الـ AI ساعات بتغلط في الأسماء.'),
  example: c('LookersHub', 'LookersHub'),
  quoteCues: ['brand', 'brand name', 'company', 'logo', 'name', 'براند', 'البراند', 'ماركة', 'الماركة', 'اسم', 'الشركة', 'لوجو'],
  patterns: [
    { regex: '(?:brand(?:\\s+name)?|company(?:\\s+name)?|براند|البراند|ماركة|الماركة|اسم الشركة)\\s*[:：]\\s*([^\\n,،.]{2,60})', group: 1 },
    { regex: '(?<![\\p{L}\\p{N}])([A-Z][A-Z0-9&\'.-]{3,}(?:\\s[A-Z][A-Z0-9&\'.-]{2,})?)(?![\\p{L}\\p{N}])', flags: 'u', group: 1 },
  ],
  noneLabel: c('No brand name', 'من غير اسم براند'),
  defaults: [{ value: 'none', reason: c('No brand name unless you write it.', 'مش هنكتب اسم براند غير لو انت كتبته.') }],
}, patch);

export const exactText = (patch?: Patch): Slot => make({
  id: 'exactText', kind: 'exact', layer: 'control', importance: 'nice', maxLength: 160,
  label: c('Words on screen', 'كلام ظاهر'),
  question: c('Any words that must appear? Write them exactly.', 'في كلام لازم يظهر؟ اكتبه بالحرف.'),
  why: c('Generators often misspell words, so we only add text you write.', 'أدوات التوليد بتغلط في الكتابة، فمش هنضيف غير الكلام اللي انت تكتبه.'),
  example: c('Discover your signature scent', 'اكتشف ريحتك المميزة'),
  quoteCues: ['text', 'written', 'headline', 'slogan', 'tagline', 'caption', 'مكتوب', 'كلام', 'جملة', 'شعار', 'عنوان', 'يكتب', 'نكتب'],
  noneLabel: c('No text', 'من غير كلام'),
  defaults: [{ value: 'none', reason: c('No text — add it later in an editor, or write it here.', 'من غير كلام. ممكن تضيفه بعدين في برنامج تعديل، أو تكتبه هنا.') }],
}, patch);

export const avoid = (vocabulary: Slot['vocabulary'], patch?: Patch): Slot => make({
  id: 'avoid', kind: 'text', layer: 'control', importance: 'nice', role: 'exclusion', maxLength: 300,
  label: c('Avoid', 'ممنوع'),
  question: c('Anything that must not appear?', 'في حاجة مش عايزها تظهر خالص؟'),
  why: c('We exclude it explicitly so the tool does not add it.', 'هنمنعها بوضوح عشان الأداة ما تضيفهاش.'),
  example: c('No other brands, no people.', 'من غير براندات تانية ولا ناس.'),
  vocabulary,
  noneLabel: c('Nothing extra', 'مفيش حاجة زيادة'),
  defaults: [{ value: 'none', reason: c('Nothing extra to exclude.', 'مفيش حاجة زيادة نمنعها.') }],
}, patch);

export const reference = (what: Copy, patch?: Patch): Slot => make({
  id: 'reference', kind: 'single', layer: 'understanding', importance: 'nice',
  label: c('Reference', 'مرجع'),
  question: c(`Will you upload ${what.en} as a reference?`, `هترفع ${what.ar} كمرجع؟`),
  why: c('A real reference keeps the result accurate.', 'المرجع الحقيقي بيخلّي النتيجة مظبوطة.'),
  example: c('Yes, I have one.', 'أيوه، معايا.'),
  options: [
    { value: 'yes', label: c('Yes, I have one', 'أيوه، معايا'), keywords: ['reference', 'my photo', 'عندي صورة', 'معايا صورة', 'مرجع'] },
    { value: 'no', label: c('No, describe it in words', 'لأ، اوصفه بالكلام') },
  ],
  defaults: [{ value: 'no', reason: c('We describe it in words.', 'هنوصفه بالكلام.') }],
}, patch);

export const targetTool = (options: SlotOption[], patch?: Patch): Slot => make({
  id: 'tool', kind: 'single', layer: 'delivery', importance: 'nice', role: 'target-tool',
  label: c('Target tool', 'الأداة'),
  question: c('Which tool will you use?', 'هتستخدم أنهي أداة؟'),
  why: c('Each tool reads prompts differently.', 'كل أداة بتفهم البرومبت بطريقة مختلفة.'),
  example: c('Any tool.', 'أي أداة.'),
  options: [{ value: 'universal', label: c('Any tool · universal', 'أي أداة · برومبت عام') }, ...options],
  defaults: [{ value: 'universal', reason: c('One universal prompt plus ready versions for the main tools.', 'برومبت عام ومعاه نسخ جاهزة لأشهر الأدوات.') }],
}, patch);

export const language = (patch?: Patch): Slot => make({
  id: 'language', kind: 'single', layer: 'delivery', importance: 'nice',
  label: c('Language', 'اللغة'),
  question: c('Which language should the result be in?', 'النتيجة تطلع بأنهي لغة؟'),
  why: c('Arabic needs right-to-left layout and its own wording.', 'العربي محتاج اتجاه من اليمين للشمال وصياغة خاصة بيه.'),
  example: c('Arabic.', 'عربي.'),
  options: [
    { value: 'ar', label: c('Arabic (right-to-left)', 'عربي (من اليمين)'), keywords: ['arabic', 'بالعربي', 'عربي'] },
    { value: 'en', label: c('English', 'إنجليزي'), keywords: ['english', 'بالانجليزي', 'انجليزي', 'إنجليزي'] },
    { value: 'both', label: c('Arabic and English', 'عربي وإنجليزي'), keywords: ['bilingual', 'لغتين', 'عربي وانجليزي'] },
  ],
  defaults: [{ value: '@lang', reason: c('Same language you are writing in.', 'نفس اللغة اللي بتكتب بيها.') }],
}, patch);

/** Facts the user can verify (numbers, proof). Empty means placeholders, never invented values. */
export const facts = (id: string, label: Copy, question: Copy, example: Copy, importance: Importance = 'important', patch?: Patch): Slot => make({
  id, kind: 'longtext', layer: 'understanding', importance, maxLength: 1500,
  label, question, example,
  why: c('Only real numbers and proof go in; anything missing becomes a clear placeholder.', 'هنحط الأرقام والدلائل الحقيقية بس، وأي حاجة ناقصة هتبقى مكان فاضي واضح تكمّله.'),
  noneLabel: c('Placeholders to fill', 'أماكن فاضية تكمّلها'),
  defaults: [{ value: 'none', reason: c('We leave clear [placeholders] instead of inventing numbers.', 'هنسيب [أماكن فاضية] واضحة بدل ما نألّف أرقام.') }],
}, patch);

/** Aspect ratio that follows where the result will be used. */
export const ratio = (byUsage: Record<string, string>, options: string[], patch?: Patch): Slot => {
  const names: Record<string, Copy> = {
    '1:1': c('Square · 1:1', 'مربع · 1:1'), '4:5': c('Portrait · 4:5', 'طولي · 4:5'), '9:16': c('Full vertical · 9:16', 'طولي كامل · 9:16'),
    '16:9': c('Wide · 16:9', 'عريض · 16:9'), '2:3': c('Print portrait · 2:3', 'طباعة طولي · 2:3'), '21:9': c('Cinematic · 21:9', 'سينمائي · 21:9'),
  };
  const grouped = new Map<string, string[]>();
  for (const [usage, r] of Object.entries(byUsage)) grouped.set(r, [...(grouped.get(r) ?? []), usage]);
  const defaults: SlotDefault[] = [...grouped].map(([r, usages]) => ({
    when: [{ slot: 'usage', equals: usages }], value: r,
    reason: c(`${r} fits where you will use it.`, `${r} مناسب للمكان اللي هتستخدمه فيه.`),
  }));
  return make({
    id: 'ratio', kind: 'single', layer: 'delivery', importance: 'nice',
    label: c('Size', 'المقاس'), question: c('Which size?', 'أنهي مقاس؟'),
    why: c('The right size avoids cropping later.', 'المقاس الصح بيمنع القص بعدين.'), example: c('9:16 for a reel.', '9:16 للريلز.'),
    options: options.map(o => ({ value: o, label: names[o] ?? c(o, o), keywords: o === '1:1' ? ['square', 'مربع'] : o === '16:9' ? ['landscape', 'widescreen', 'عريض'] : undefined })),
    patterns: [{ regex: `(?<![\\d])(${options.map(o => o.replace(':', ':')).join('|')})(?![\\d])`, group: 1 }],
    defaults,
  }, patch);
};
