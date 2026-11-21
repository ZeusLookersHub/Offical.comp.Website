import type { Blueprint, Copy, Gate, OptionVisual, OutputContract, Slot, ToolTarget } from '../types.ts';
import { avoid, brandName, c, language, targetTool } from '../modules.ts';

/** Deck style examples are shared across every deck mission, so they need one asset set. */
export const deckLayout = (value: string, en: string, ar: string, generate: string): OptionVisual => ({
  media: 'layout', asset: `/assets/lookers-ai/examples/deck-style/${value}.webp`, description: c(en, ar), generate,
});

/** Visual style of the slides — the same four directions fit every deck. */
export const deckStyleSlot = (def = 'clean-corporate'): Slot => ({
  id: 'deckStyle', kind: 'single', layer: 'intelligence', importance: 'nice',
  label: c('Visual style', 'الشكل'), question: c('How should the slides look?', 'تحب شكل الشرائح يبقى إزاي؟'),
  why: c('Style sets fonts, colour and how much text per slide.', 'الشكل بيحدد الخطوط والألوان وكمية الكلام في كل شريحة.'),
  example: c('Clean corporate.', 'رسمي نضيف.'),
  options: [
    { value: 'clean-corporate', label: c('Clean corporate', 'رسمي نضيف'), keywords: ['corporate', 'clean', 'رسمي', 'نضيف'], visual: deckLayout('clean-corporate', 'White space, navy and grey, clear charts, structured grid.', 'مساحات بيضا، وكحلي ورمادي، ورسومات واضحة، وتقسيم منظم.', 'clean corporate presentation slide, navy and grey, structured grid with a clear bar chart, generous whitespace') },
    { value: 'bold-modern', label: c('Bold modern', 'عصري جريء'), keywords: ['bold', 'modern', 'جريء', 'عصري'], visual: deckLayout('bold-modern', 'One big idea per slide, large numbers, strong accent colour, few words.', 'فكرة كبيرة في كل شريحة، وأرقام كبيرة، ولون مميز قوي، وكلام قليل.', 'bold modern presentation slide, one huge metric in a strong accent colour, minimal words') },
    { value: 'dark-premium', label: c('Dark premium', 'غامق فخم'), keywords: ['dark', 'premium', 'غامق', 'فخم'], visual: deckLayout('dark-premium', 'Dark background, gold accents, imagery, cinematic feel.', 'خلفية غامقة، ولمسات دهبي، وصور، وإحساس سينمائي.', 'dark premium presentation slide, black background, gold accents, large image, cinematic') },
    { value: 'minimal', label: c('Minimal', 'بسيط جداً'), keywords: ['minimal', 'simple', 'بسيط'], visual: deckLayout('minimal', 'Mostly typography, one colour, lots of air.', 'معظمها كلام بخط جميل، ولون واحد، ومساحات كتير.', 'minimal typographic presentation slide, single colour, generous whitespace') },
  ],
  defaults: [{ value: def, reason: c('A clean corporate look suits most rooms.', 'الشكل الرسمي النضيف بيناسب أغلب القاعات.') }],
});

/** Slide count lives in the delivery layer and is checked by a gate. */
export const slideCountSlot = (values: string[], def: string, defReason: Copy): Slot => ({
  id: 'slideCount', kind: 'single', layer: 'delivery', importance: 'nice',
  label: c('Number of slides', 'عدد الشرائح'), question: c('How many slides?', 'كام شريحة؟'),
  why: c('The count decides how much fits on each slide.', 'العدد بيحدد كمية اللي هتدخل في كل شريحة.'),
  example: c('12 slides.', '١٢ شريحة.'),
  options: values.map(v => ({ value: v, label: c(v, v) })),
  patterns: [{ regex: `(?<![\\d])(${values.join('|')})\\s*(?:slides?|شريحة|شرايح|شرائح|سلايد)`, group: 1 }],
  defaults: [{ value: def, reason: defReason }],
});

export const deckToolOptions = [
  { value: 'gamma', label: c('Gamma', 'Gamma'), keywords: ['gamma', 'جاما'] },
  { value: 'chatgpt', label: c('ChatGPT', 'ChatGPT'), keywords: ['chatgpt', 'chat gpt', 'شات جي بي تي'] },
  { value: 'claude', label: c('Claude', 'Claude'), keywords: ['claude', 'كلود'] },
  { value: 'canva', label: c('Canva', 'Canva'), keywords: ['canva', 'كانفا'] },
  { value: 'copilot', label: c('PowerPoint Copilot', 'PowerPoint Copilot'), keywords: ['powerpoint', 'copilot', 'باوربوينت'] },
  { value: 'gemini', label: c('Google Slides / Gemini', 'Google Slides / Gemini'), keywords: ['google slides', 'gemini', 'جيميناي'] },
];

export const deckTools = (): ToolTarget[] => [
  { id: 'universal', label: 'Universal', notes: 'Plain layered prompt with headings; works in any chat AI.' },
  { id: 'gamma', label: 'Gamma', notes: 'Paste as the generation prompt; one line per slide in the outline; keep instructions short.' },
  { id: 'chatgpt', label: 'ChatGPT', notes: 'Ask it to produce slide-by-slide content then an editable .pptx; keep the four headings.' },
  { id: 'claude', label: 'Claude', notes: 'Keep the four headings; ask for slide-by-slide content with speaker notes.' },
  { id: 'canva', label: 'Canva', notes: 'Short brief: topic, audience, slide titles, style; Canva limits prompt length.' },
  { id: 'copilot', label: 'PowerPoint Copilot', notes: 'Start with "Create a presentation about…", then the outline and style.' },
  { id: 'gemini', label: 'Google Slides / Gemini', notes: 'Slide-by-slide request; Gemini works best one slide at a time — include the outline.' },
];

export function deckOutput(id: string, description: Copy): OutputContract {
  return {
    id, description,
    fields: [
      { path: 'title', type: 'string', required: true, maxLength: 120, description: 'Short title in the user language.' },
      { path: 'sections', type: 'object', required: true, description: 'The four layers of the deliverable prompt.' },
      { path: 'sections.goal', type: 'string', required: true, description: 'Goal, audience and context (Understanding).' },
      { path: 'sections.approach', type: 'string', required: true, description: 'Story structure and expert approach (Intelligence).' },
      { path: 'sections.rules', type: 'string', required: true, description: 'Verbatim names, no invented numbers, placeholders, exclusions (Control).' },
      { path: 'sections.output', type: 'string', required: true, description: 'Slide count, per-slide format, style, language and self-check (Delivery).' },
      { path: 'prompt', type: 'string', required: true, maxLength: 6000, description: 'The four sections assembled with headings, ready to paste, in the chosen language.' },
      { path: 'slideOutline', type: 'string[]', required: true, description: 'One title per slide, exactly slideCount items.' },
      { path: 'missingData', type: 'string[]', required: true, description: 'Placeholders the user still has to fill (may be empty).' },
      { path: 'variants', type: 'record', required: true, description: 'Tool id → ready prompt.' },
      { path: 'checklist', type: 'string[]', required: true, description: '4–6 checks for the finished deck, user language.' },
      { path: 'summary', type: 'string', required: true, maxLength: 600, description: 'One or two sentences, user language.' },
    ],
  };
}

export const deckGates = (brandSlot = 'brandName'): Gate[] => [
  { id: 'name-verbatim', kind: 'verbatim', slot: brandSlot, fields: ['prompt', 'variants.*'], nearMiss: true, message: c('Name kept exactly as written', 'الاسم مكتوب بالحرف') },
  { id: 'no-invented-numbers', kind: 'no-invented-numbers', fields: ['prompt', 'slideOutline', 'variants.*'], message: c('Every number comes from you — the rest are placeholders', 'كل رقم جاي منك، والباقي أماكن فاضية') },
  { id: 'slide-count', kind: 'array-length', slot: 'slideCount', field: 'slideOutline', message: c('Slide count is what you chose', 'عدد الشرائح زي ما اخترت') },
  { id: 'rtl', kind: 'includes-when', when: [{ slot: 'language', equals: ['ar', 'both'] }], field: 'prompt', anyOf: ['right-to-left', 'RTL', 'من اليمين'], message: c('Arabic layout set right-to-left', 'العربي متظبط من اليمين للشمال') },
];

export const deckControlRules = (nameWhat: string): string[] => [
  `sections.rules must say: copy ${nameWhat} exactly as written; never invent numbers, names, logos, testimonials, market sizes or quotes; use [placeholders] for anything missing; respect avoid.`,
  'missingData lists each placeholder in plain words so the user knows what to prepare before the meeting.',
];

export const deckDeliveryRules = (): string[] => [
  'prompt = the four sections assembled under clear headings (Goal & context / Approach / Rules / Output) in the chosen language; if language is ar or both, require right-to-left layout explicitly.',
  'sections.output fixes the slide count, the per-slide format (headline as a claim, 3 bullets max, suggested visual, speaker note) and the visual style from deckStyle.',
  'slideOutline has exactly slideCount titles, each a real headline rather than a label.',
  'variants: universal plus the chosen tool (all tools if universal), following each tool note.',
  'checklist and summary in the user language (Egyptian Arabic for ar).',
];

/** Factory for deck missions: the deliverable is a layered prompt for a presentation AI. */
export function makeDeckMission(cfg: {
  id: string; title: Copy; topics: string[]; questionBudget?: number;
  intake: Blueprint['intake'];
  slots: Slot[];
  nameLabel: Copy; nameQuestion?: Copy; nameWhat: string;
  avoidVocab: { en: string[]; ar: string[] };
  slideCounts: string[]; slideCountDefault: string; slideCountReason: Copy;
  deckStyleDefault?: string;
  outputDescription: Copy;
  role: string;
  understanding: string[]; intelligence: string[]; controlExtra?: string[]; deliveryExtra?: string[];
  examples: { good: string; bad: string; why: string }[];
}): Blueprint {
  return {
    id: cfg.id, version: 1, title: cfg.title, topics: cfg.topics,
    intake: cfg.intake, questionBudget: cfg.questionBudget ?? 3,
    slots: [
      ...cfg.slots,
      brandName({ label: cfg.nameLabel, ...(cfg.nameQuestion ? { question: cfg.nameQuestion } : {}) }),
      deckStyleSlot(cfg.deckStyleDefault),
      slideCountSlot(cfg.slideCounts, cfg.slideCountDefault, cfg.slideCountReason),
      language(),
      avoid(cfg.avoidVocab),
      targetTool(deckToolOptions),
    ],
    output: deckOutput('text-ai-prompt', cfg.outputDescription),
    gates: deckGates(),
    tools: deckTools(),
    role: cfg.role,
    strategy: {
      understanding: cfg.understanding,
      intelligence: cfg.intelligence,
      control: [...deckControlRules(cfg.nameWhat), ...(cfg.controlExtra ?? [])],
      delivery: [...deckDeliveryRules(), ...(cfg.deliveryExtra ?? [])],
    },
    examples: cfg.examples,
  };
}
