import type { Blueprint, Copy, Gate, OptionVisual, OutputContract, Slot, ToolTarget } from '../types.ts';
import { avoid, brandName, c, exactText, ratio, reference, targetTool } from '../modules.ts';

/** Visual example for an option; the chat shows it next to the choice. Assets are listed in RESOURCES.md. */
export const vis = (mission: string, value: string, en: string, ar: string, generate: string, media: OptionVisual['media'] = 'image'): OptionVisual => ({
  media, asset: `/assets/lookers-ai/examples/${mission}/${value}.webp`, description: c(en, ar), generate,
});

export function imageOutput(id: string, description: Copy): OutputContract {
  return {
    id, description,
    fields: [
      { path: 'title', type: 'string', required: true, maxLength: 120, description: 'Short title in the user language.' },
      { path: 'prompt', type: 'string', required: true, maxLength: 2500, description: 'Universal scene prompt in English.' },
      { path: 'negative', type: 'string', required: true, maxLength: 600, description: 'What to avoid, comma separated.' },
      { path: 'params', type: 'object', required: true, description: 'Execution settings.' },
      { path: 'params.aspectRatio', type: 'string', required: true, description: 'Exactly the ratio slot.' },
      { path: 'textOverlay', type: 'object', required: true, description: 'Text policy.' },
      { path: 'textOverlay.mode', type: 'string', required: true, description: 'none | in-image | add-later' },
      { path: 'variants', type: 'record', required: true, description: 'Tool id → ready prompt.' },
      { path: 'checklist', type: 'string[]', required: true, description: '4–6 checks for the generated image, user language.' },
      { path: 'summary', type: 'string', required: true, maxLength: 600, description: 'One or two sentences, user language.' },
    ],
  };
}

/** The gates every image mission shares: verbatim names and text, size, no tool leak, no invented text, English prompt. */
export function imageGates(): Gate[] {
  return [
    { id: 'brand-verbatim', kind: 'verbatim', slot: 'brandName', fields: ['prompt', 'variants.*'], nearMiss: true, message: c('Brand name kept exactly as written', 'اسم البراند مكتوب بالحرف') },
    { id: 'text-verbatim', kind: 'verbatim', slot: 'exactText', fields: ['textOverlay.text', 'prompt'], nearMiss: true, message: c('Your words kept exactly', 'الكلام بتاعك مكتوب بالحرف') },
    { id: 'size', kind: 'equals-slot', slot: 'ratio', field: 'params.aspectRatio', message: c('Size matches where you will use it', 'المقاس مناسب للمكان اللي هتستخدمها فيه') },
    { id: 'no-leak', kind: 'no-leak', fields: ['prompt'], terms: ['Lookers', 'aspect ratio', '--ar', 'Midjourney', 'DALL', 'Firefly', 'Ideogram', 'Flux', 'Imagen'], slotTerms: ['ratio'], message: c('No tool settings mixed into the scene', 'مفيش إعدادات أدوات داخلة في وصف المشهد') },
    { id: 'no-invented-text', kind: 'no-invented-text', whenEmpty: ['brandName', 'exactText'], field: 'prompt', negativeField: 'negative', message: c('No made-up words in the image', 'مفيش كلام متألّف على الصورة') },
    { id: 'english-prompt', kind: 'latin-ratio', field: 'prompt', min: 0.9, exceptSlots: ['brandName', 'exactText'], message: c('Prompt written in English (image tools work best)', 'البرومبت بالإنجليزي (أدوات الصور بتفهمه أحسن)') },
  ];
}

export const imageTools = (): ToolTarget[] => [
  { id: 'universal', label: 'Universal', notes: 'Descriptive prose, no tool syntax.' },
  { id: 'midjourney', label: 'Midjourney', notes: 'Prose then parameters: --ar <ratio> --style raw. Negative goes in --no.' },
  { id: 'chatgpt', label: 'ChatGPT image', notes: 'Conversational instruction: "Create an image of…", state the size in words.' },
  { id: 'flux', label: 'Flux', notes: 'Natural detailed prose; quoted text is supported.' },
  { id: 'firefly', label: 'Adobe Firefly', notes: 'Prose; avoid other companies\' brands; good for commercial-safe output.' },
  { id: 'ideogram', label: 'Ideogram', notes: 'Best for in-image text; put exact text in quotes.' },
  { id: 'gemini', label: 'Gemini / Imagen', notes: 'Prose with camera, lighting and composition terms.' },
];

export const imageToolOptions = [
  { value: 'midjourney', label: c('Midjourney', 'Midjourney'), keywords: ['midjourney', 'ميدجورني'] },
  { value: 'chatgpt', label: c('ChatGPT image', 'صور ChatGPT'), keywords: ['chatgpt', 'dalle', 'dall-e', 'شات جي بي تي'] },
  { value: 'flux', label: c('Flux', 'Flux'), keywords: ['flux', 'فلكس'] },
  { value: 'firefly', label: c('Adobe Firefly', 'Adobe Firefly'), keywords: ['firefly', 'فايرفلاي'] },
  { value: 'ideogram', label: c('Ideogram · best with text', 'Ideogram · الأحسن في الكتابة'), keywords: ['ideogram', 'ايديوجرام'] },
  { value: 'gemini', label: c('Gemini / Imagen', 'Gemini / Imagen'), keywords: ['gemini', 'imagen', 'جيميناي'] },
];

/** Delivery rules shared by image missions. */
export const imageDeliveryRules = (maxWords = 120): string[] => [
  `prompt and variants in English even when the user writes Arabic; verbatim values stay exactly as given. prompt ≤ ${maxWords} words.`,
  'params.aspectRatio = ratio exactly. Never write the ratio, sizes or tool names inside prompt.',
  'variants: include "universal" and the chosen tool; when tool is universal include every listed tool. Follow each tool note.',
  'checklist: 4 to 6 concrete checks for the generated image, in the user language. title and summary in the user language (Egyptian Arabic for ar).',
];

/** Control rules shared by image missions (verbatim text policy and exclusions). */
export const imageControlRules = (brandWhere: string): string[] => [
  `If brandName is given, it appears once, ${brandWhere}, in double quotes. Add no other words unless exactText is given.`,
  'If exactText is given: textOverlay.mode = "in-image", textOverlay.text = exactText verbatim, and mention it once in double quotes with its placement.',
  'Otherwise textOverlay.mode = "none" and the negative must exclude text, letters, watermark and extra logos.',
  'Respect avoid as hard exclusions in negative. Never show other brands.',
];

/**
 * Builds a complete image-mission blueprint, appending the standard control/delivery slots
 * (brand name, exact text, avoid, size, target tool, reference) and the shared output and gates.
 */
export function makeImageMission(cfg: {
  id: string; title: Copy; topics: string[]; questionBudget?: number;
  intake: Blueprint['intake'];
  slots: Slot[];
  brandLabel: Copy; brandQuestion?: Copy; brandWhere: string;
  exactTextLabel?: Copy;
  avoidVocab: { en: string[]; ar: string[] };
  ratioByUsage: Record<string, string>; ratioOptions: string[];
  referenceWhat: Copy; referenceLabel: Copy; referenceRequired?: boolean;
  outputDescription: Copy;
  role: string;
  understanding: string[]; intelligence: string[]; controlExtra?: string[]; deliveryExtra?: string[];
  maxWords?: number;
  examples: { good: string; bad: string; why: string }[];
}): Blueprint {
  return {
    id: cfg.id, version: 1, title: cfg.title, topics: cfg.topics,
    intake: cfg.intake, questionBudget: cfg.questionBudget ?? 3,
    slots: [
      ...cfg.slots,
      brandName({ label: cfg.brandLabel, ...(cfg.brandQuestion ? { question: cfg.brandQuestion } : {}) }),
      exactText(cfg.exactTextLabel ? { label: cfg.exactTextLabel } : {}),
      avoid(cfg.avoidVocab),
      ratio(cfg.ratioByUsage, cfg.ratioOptions),
      reference(cfg.referenceWhat, { label: cfg.referenceLabel, ...(cfg.referenceRequired ? { importance: 'important' as const } : {}) }),
      targetTool(imageToolOptions),
    ],
    output: imageOutput(`image-${cfg.id}`, cfg.outputDescription),
    gates: imageGates(),
    tools: imageTools(),
    role: cfg.role,
    strategy: {
      understanding: cfg.understanding,
      intelligence: cfg.intelligence,
      control: [...imageControlRules(cfg.brandWhere), ...(cfg.controlExtra ?? [])],
      delivery: [...imageDeliveryRules(cfg.maxWords), ...(cfg.deliveryExtra ?? [])],
    },
    examples: cfg.examples,
  };
}
