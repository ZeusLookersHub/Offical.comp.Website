import type { Blueprint, Gate, Slot, ToolTarget } from './types.ts';
import { c } from './modules.ts';

/**
 * "What is this built on?" — every visual mission first learns whether the user is making
 * something new, something that must belong to what already exists (their brand, product, a
 * past design, a series), or an edit of something they have. That one answer decides whether
 * we need a real reference, what must stay untouched, and how the tool is told to use it.
 *
 * Applied to every blueprint with a `reference` slot, so a new visual mission gets it for free.
 */
const EXISTING = ['existing', 'edit'];

const basis = (fixed?: 'edit'): Slot => ({
  id: 'basis', kind: 'single', layer: 'understanding', importance: fixed ? 'nice' : 'important',
  label: c('Built on', 'مبني على'),
  question: c('Is this something new, or does it build on something you already have?', 'ده حاجة جديدة، ولا مربوط بحاجة عندك فعلاً؟'),
  why: c('If something already exists, the result has to match it — so I ask what stays and use your reference.', 'لو في حاجة موجودة، النتيجة لازم تمشي معاها، فهسألك إيه اللي يفضل وهستخدم المرجع بتاعك.'),
  example: c('It is for my existing brand — same colours and logo.', 'لبراندي الموجود، نفس الألوان واللوجو.'),
  options: [
    { value: 'new', label: c('Something new · free direction', 'حاجة جديدة · اتجاه حر'), keywords: ['from scratch', 'brand new', 'new idea', 'من الصفر', 'فكرة جديدة', 'حاجة جديدة'] },
    { value: 'existing', label: c('Linked to something I have · brand, product, past design, a series', 'مربوط بحاجة عندي · براند، منتج، تصميم قديم، سلسلة'),
      keywords: ['my brand', 'our brand', 'brand identity', 'same style', 'same colors', 'same colours', 'series', 'matching', 'براندي', 'هويتي', 'الهوية بتاعتي', 'نفس الستايل', 'نفس الألوان', 'نفس الالوان', 'سلسلة', 'يمشي مع', 'زي اللي قبل'] },
    { value: 'edit', label: c('Edit or redo something I already have', 'تعديل أو إعادة لحاجة عندي'),
      keywords: ['edit', 'redo', 'remake', 'update my', 'change my', 'fix my', 'عدّل', 'عدل', 'تعديل', 'اعدل', 'أعدل', 'أغير', 'اغير', 'أظبط', 'اظبط'] },
  ],
  defaults: [fixed
    ? { value: 'edit', reason: c('You are editing a photo you have.', 'انت بتعدّل صورة عندك.') }
    : { value: 'new', reason: c('Treated as a new piece with free direction.', 'اعتبرناها حاجة جديدة باتجاه حر.') }],
});

const keep: Slot = {
  id: 'keep', kind: 'longtext', layer: 'control', importance: 'important', maxLength: 600,
  when: [{ slot: 'basis', equals: EXISTING }],
  label: c('Must stay the same', 'لازم يفضل زي ما هو'),
  question: c('What must stay exactly as it is? (logo, colours, font, the character, the product look…)', 'إيه اللي لازم يفضل زي ما هو بالظبط؟ (اللوجو، الألوان، الخط، الشخصية، شكل المنتج…)'),
  why: c('AI tools redraw everything unless told what to keep. Each item becomes a hard rule.', 'أدوات الـ AI بتعيد رسم كل حاجة لو محدش قالها تحافظ على إيه. كل حاجة هتكتبها هتبقى قاعدة ثابتة.'),
  example: c('The gold logo, the dark green colour and the round bottle shape.', 'اللوجو الدهبي، واللون الأخضر الغامق، وشكل الزجاجة المدوّر.'),
  vocabulary: {
    en: ['logo', 'brand colours', 'font', 'character', 'product shape', 'label', 'layout', 'face', 'packaging'],
    ar: ['اللوجو', 'ألوان البراند', 'الخط', 'الشخصية', 'شكل المنتج', 'الليبل', 'التوزيع', 'الوش', 'العبوة'],
  },
};

const change: Slot = {
  id: 'change', kind: 'longtext', layer: 'intelligence', importance: 'important', maxLength: 600,
  when: [{ slot: 'basis', equals: 'edit' }],
  label: c('What changes', 'التغيير المطلوب'),
  question: c('What exactly should change?', 'إيه بالظبط اللي يتغيّر؟'),
  why: c('Only this changes — everything else stays.', 'ده بس اللي هيتغيّر، والباقي يفضل زي ما هو.'),
  example: c('Swap the background for a sunny beach and make the colours warmer.', 'غيّر الخلفية لشط مشمس وخلّي الألوان أدفى.'),
  vocabulary: {
    en: ['background', 'colours', 'lighting', 'text', 'season', 'add an element', 'remove an element', 'style'],
    ar: ['الخلفية', 'الألوان', 'الإضاءة', 'الكلام', 'الموسم', 'إضافة عنصر', 'شيل عنصر', 'الستايل'],
  },
};

const referenceFor = (slot: Slot, fixed: boolean): Slot => ({
  ...slot,
  importance: fixed ? 'important' : 'nice',
  raise: fixed ? undefined : { when: [{ slot: 'basis', equals: EXISTING }], importance: 'important' },
  question: c(
    'Do you have a photo to upload? If it builds on something you have, upload that thing itself (logo, product, past design).',
    'معاك صورة ترفعها؟ لو مربوط بحاجة عندك، ارفع الحاجة نفسها (اللوجو، المنتج، التصميم القديم).'),
  why: c('With the real thing in front of it, the tool copies what exists instead of guessing. I read the photo and use what I see.',
    'لما الأداة تشوف الحاجة الحقيقية بتنقلها بدل ما تخمّن. وأنا هقرا الصورة وأستخدم اللي فيها في البرومبت.'),
  example: c('One clear photo on a plain background beats several busy ones.', 'صورة واحدة واضحة على خلفية سادة أحسن من كذا صورة زحمة.'),
  options: [
    { value: 'yes', label: c('Yes — I will upload it now', 'أيوه، هرفعها دلوقتي'), keywords: ['reference', 'my photo', 'عندي صورة', 'معايا صورة', 'مرجع'] },
    { value: 'no', label: c('No, I will describe it in words', 'لأ، هوصفه بالكلام') },
  ],
  // New work may go without a reference; anything built on what exists must be asked.
  defaults: fixed ? [] : [{ when: [{ slot: 'basis', equals: 'new' }], value: 'no', reason: c('New piece — described in words. Upload one any time with the photo button.', 'حاجة جديدة، هنوصفها بالكلام. وتقدر ترفع صورة في أي وقت من زرار الصورة.') }],
});

/** How each tool takes a reference image. The model turns this into the user's referenceGuide. */
const REF_NOTES: Record<string, string> = {
  universal: 'Reference: upload the image in the same message as the prompt and say how to use it (style only / keep this subject / edit this image).',
  midjourney: 'Reference: style inspiration = drag the image into the prompt bar and choose Style Reference (--sref); the existing product/character/logo = Omni Reference (--oref) with --ow 100–400; edit = open the image in the Editor and repaint only the area to change.',
  chatgpt: 'Reference: attach the image with the + button in the same message; start the prompt with "Using the attached image as…"; for edits say "keep everything else exactly the same".',
  flux: 'Reference: use Flux Kontext for anything built on an existing image — upload it and describe only the change; plain Flux takes it as an image prompt for style.',
  firefly: 'Reference: Style reference for look and colours, Composition reference for layout; edits go through Generative Fill on the uploaded image.',
  ideogram: 'Reference: upload under Remix (keeps layout/subject, set image weight high to stay close) or as a Style reference.',
  gemini: 'Reference: upload the image in the Gemini app with the prompt; for edits say "edit this image: change only …, keep everything else".',
  veo: 'Reference: use Ingredients/Frames to video — upload the image as the first frame or as an ingredient so the subject stays identical.',
  sora: 'Reference: upload the image to start the video from it (image-to-video); describe only motion and camera.',
  kling: 'Reference: Image to Video — upload the image as the start frame; Elements keeps a product/character consistent.',
  runway: 'Reference: upload the image as the first frame (Gen-4 image to video) or as a References image to keep the subject identical.',
  hailuo: 'Reference: Image to Video — upload the image as the first frame; describe only motion.',
};

const withRefNotes = (tools: ToolTarget[]): ToolTarget[] => tools.map(t => ({ ...t, notes: REF_NOTES[t.id] ? `${t.notes} ${REF_NOTES[t.id]}` : t.notes }));

const RULES = {
  understanding: [
    'basis says what this builds on: new = free direction; existing = it must belong to something the user already has (their brand, product, a past design, a series); edit = a change to an image the user has.',
    'brief.references are what we read in the photos the user uploaded: treat them as ground truth for how the existing thing looks (shape, colours, materials, label, character) and reuse those concrete details.',
  ],
  intelligence: [
    'basis = existing: create only what is new (the subject of this piece) inside the existing identity; reuse its colours, type, shapes and look described in keep and references instead of inventing a new style.',
    'basis = edit: write the prompt as an edit of the provided original: open with "Using the provided image as the base", state change as the only change, then "keep everything else exactly the same".',
  ],
  control: [
    'Every item in keep is a hard rule: restate it explicitly in the prompt as something to preserve exactly (e.g. "keep the exact logo, colours and bottle shape from the reference").',
  ],
  delivery: [
    'referenceGuide: when reference = yes or basis is existing/edit, 3–5 short numbered steps in the user language (Egyptian Arabic for ar): which image to upload and how clear it should be, where to attach it in the chosen tool (or the two main tools when universal) following the tool notes, which reference mode to pick (style inspiration for new, keep the subject for existing, edit for edit), and the opening line the prompt already uses for it. Otherwise return [].',
    'When reference = yes or basis is existing/edit, every variant opens with how to use the reference (e.g. "Using the attached image as the product reference, …").',
  ],
};

export function withBasis(bp: Blueprint): Blueprint {
  const ref = bp.slots.find(s => s.id === 'reference');
  if (!ref || bp.slots.some(s => s.id === 'basis')) return bp; // idempotent: a payload may already carry it
  const fixed = bp.id === 'photo-retouch';
  const slots = bp.slots.filter(s => s.id !== 'reference');
  const first = slots.findIndex(s => s.importance === 'critical');
  const insertAt = first >= 0 ? first + 1 : 0;
  const added = fixed ? [basis('edit'), keep] : [basis(), keep, change];
  slots.splice(insertAt, 0, ...added);
  slots.push(referenceFor(ref, fixed));
  const gates: Gate[] = [...bp.gates, {
    id: 'reference-guide', kind: 'filled-when', field: 'referenceGuide',
    whenAny: [{ slot: 'reference', equals: 'yes' }, { slot: 'basis', equals: EXISTING }],
    message: c('Steps to attach your reference in the tool', 'خطوات تحط المرجع في الأداة'),
  }];
  return {
    ...bp,
    version: bp.version + 1,
    questionBudget: bp.questionBudget + 1,
    slots,
    output: { ...bp.output, fields: [...bp.output.fields, { path: 'referenceGuide', type: 'string[]', required: false, description: 'How to attach the reference in the tool, user language; [] when none.' }] },
    gates,
    tools: withRefNotes(bp.tools),
    strategy: {
      understanding: [...bp.strategy.understanding, ...RULES.understanding],
      intelligence: [...bp.strategy.intelligence, ...RULES.intelligence],
      control: [...bp.strategy.control, ...RULES.control],
      delivery: [...bp.strategy.delivery, ...RULES.delivery],
    },
  };
}

/**
 * Coverage: every detail the user actually gave must be realised in the deliverable prompt,
 * not mentioned in passing. The model returns, per slot, the phrase of the prompt that carries
 * it; the gate checks the phrase is really there. Applied to every mission with a `prompt` field.
 */
export function withCoverage(bp: Blueprint): Blueprint {
  const prompt = bp.output.fields.find(f => f.path === 'prompt' && f.type === 'string');
  if (!prompt || bp.gates.some(g => g.kind === 'coverage')) return bp;
  const slots = bp.slots.filter(s => s.kind !== 'exact' && !s.role && s.layer !== 'delivery' && !['reference', 'basis', 'avoid', 'tool'].includes(s.id)).map(s => s.id);
  if (!slots.length) return bp;
  return {
    ...bp,
    output: { ...bp.output, fields: [...bp.output.fields, { path: 'coverage', type: 'record', required: false, description: 'slot id → the exact phrase copied from prompt that realises what the user gave for it (only user-given slots).' }] },
    gates: [...bp.gates, { id: 'coverage', kind: 'coverage', slots, field: 'prompt', map: 'coverage', message: c('Every detail you gave is in the prompt', 'كل تفصيلة قلتها موجودة في البرومبت') }],
  };
}
