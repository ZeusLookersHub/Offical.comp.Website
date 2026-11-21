import type { Copy, Gate, OutputContract, ToolTarget } from '../types.ts';
import { c } from '../modules.ts';

/**
 * Shared shape for text-AI deliverables (strategy, plan, analysis, deck, page…).
 * The deliverable prompt is assembled from the four layers under clear headings,
 * plus an outline the user can skim and the data they still owe.
 */
export function textOutput(id: string, description: Copy, outlineKey: string, outlineDesc: string): OutputContract {
  return {
    id, description,
    fields: [
      { path: 'title', type: 'string', required: true, maxLength: 120, description: 'Short title in the user language.' },
      { path: 'sections', type: 'object', required: true, description: 'The four layers of the deliverable prompt.' },
      { path: 'sections.goal', type: 'string', required: true, description: 'Goal, audience and context (Understanding).' },
      { path: 'sections.approach', type: 'string', required: true, description: 'Expert method and structure (Intelligence).' },
      { path: 'sections.rules', type: 'string', required: true, description: 'Verbatim name, no invented numbers, placeholders, exclusions (Control).' },
      { path: 'sections.output', type: 'string', required: true, description: 'Format, length, language and self-check (Delivery).' },
      { path: 'prompt', type: 'string', required: true, maxLength: 6000, description: 'The four sections assembled with headings, ready to paste, in the chosen language.' },
      { path: outlineKey, type: 'string[]', required: true, description: outlineDesc },
      { path: 'missingData', type: 'string[]', required: true, description: 'Placeholders the user still has to fill (may be empty).' },
      { path: 'variants', type: 'record', required: true, description: 'Tool id → ready prompt.' },
      { path: 'checklist', type: 'string[]', required: true, description: '4–6 checks for the finished work, user language.' },
      { path: 'summary', type: 'string', required: true, maxLength: 600, description: 'One or two sentences, user language.' },
    ],
  };
}

/** Name-verbatim, no-invented-numbers and right-to-left gates shared by text deliverables. */
export function textGates(outlineKey: string, brandSlot = 'brandName'): Gate[] {
  return [
    { id: 'name-verbatim', kind: 'verbatim', slot: brandSlot, fields: ['prompt', 'variants.*'], nearMiss: true, message: c('Name kept exactly as written', 'الاسم مكتوب بالحرف') },
    { id: 'no-invented-numbers', kind: 'no-invented-numbers', fields: ['prompt', outlineKey, 'variants.*'], message: c('Every number comes from you — the rest are placeholders', 'كل رقم جاي منك، والباقي أماكن فاضية') },
    { id: 'rtl', kind: 'includes-when', when: [{ slot: 'language', equals: ['ar', 'both'] }], field: 'prompt', anyOf: ['right-to-left', 'RTL', 'من اليمين'], message: c('Arabic layout set right-to-left', 'العربي متظبط من اليمين للشمال') },
  ];
}

export const textTools = (): ToolTarget[] => [
  { id: 'universal', label: 'Universal', notes: 'Layered prompt with the four headings; works in any chat AI.' },
  { id: 'chatgpt', label: 'ChatGPT', notes: 'Keep the four headings; ask for the document section by section, then an editable file.' },
  { id: 'claude', label: 'Claude', notes: 'Keep the four headings; ask for the document with clear structure and headings.' },
  { id: 'gemini', label: 'Gemini', notes: 'Keep the four headings; works best one section at a time.' },
];

export const textToolOptions = [
  { value: 'chatgpt', label: c('ChatGPT', 'ChatGPT'), keywords: ['chatgpt', 'chat gpt', 'شات جي بي تي'] },
  { value: 'claude', label: c('Claude', 'Claude'), keywords: ['claude', 'كلود'] },
  { value: 'gemini', label: c('Gemini', 'Gemini'), keywords: ['gemini', 'جيميناي', 'جيمناي'] },
];

/** Delivery-layer rules every text deliverable shares (assembled prompt + language/RTL). */
export const textDeliveryRules = (outlineKey: string, outlineWhat: string): string[] => [
  `prompt = the four sections assembled under clear headings (Goal & context / Approach / Rules / Output) in the chosen language; if language is ar or both, require right-to-left layout explicitly.`,
  `${outlineKey} lists ${outlineWhat}, in order.`,
  'variants: universal plus the chosen tool (all tools if universal), following each tool note. missingData lists every placeholder in plain words.',
  'checklist (4–6) and summary in the user language (Egyptian Arabic for ar).',
];

/** Control-layer rules shared by text deliverables that must not invent facts. */
export const textControlRules = (nameWhat: string): string[] => [
  `sections.rules must say: copy ${nameWhat} exactly; never invent numbers, names, logos, testimonials, market sizes or quotes; use [placeholders] for anything missing; respect avoid.`,
  'missingData lists each placeholder in plain words so the user knows what to prepare.',
];

import type { Blueprint, Slot } from '../types.ts';
import { avoid, brandName, language, targetTool } from '../modules.ts';

/**
 * Builds a complete text-deliverable blueprint from a compact config, appending the standard
 * control/delivery slots (brand name, language, target tool, avoid) and the shared output,
 * gates, tools and layer rules. Domain slots (understanding/intelligence) come from the caller.
 */
export function makeTextMission(cfg: {
  id: string; title: Copy; topics: string[]; questionBudget?: number;
  intake: Blueprint['intake'];
  slots: Slot[];
  nameLabel: Copy; nameWhat: string;
  avoidVocab: { en: string[]; ar: string[] };
  outlineKey: string; outlineDesc: string; outlineWhat: string;
  outputDescription: Copy;
  role: string;
  understanding: string[]; intelligence: string[]; controlExtra?: string[]; deliveryExtra?: string[];
  extraGates?: Gate[];
  examples: { good: string; bad: string; why: string }[];
}): Blueprint {
  return {
    id: cfg.id, version: 1, title: cfg.title, topics: cfg.topics,
    intake: cfg.intake, questionBudget: cfg.questionBudget ?? 3,
    slots: [...cfg.slots, brandName({ label: cfg.nameLabel }), language(), avoid(cfg.avoidVocab), targetTool(textToolOptions)],
    output: textOutput(cfg.id.startsWith('text-') ? cfg.id : `text-${cfg.id}`, cfg.outputDescription, cfg.outlineKey, cfg.outlineDesc),
    gates: [...textGates(cfg.outlineKey), ...(cfg.extraGates ?? [])],
    tools: textTools(),
    role: cfg.role,
    strategy: {
      understanding: cfg.understanding,
      intelligence: cfg.intelligence,
      control: [...textControlRules(cfg.nameWhat), ...(cfg.controlExtra ?? [])],
      delivery: [...textDeliveryRules(cfg.outlineKey, cfg.outlineWhat), ...(cfg.deliveryExtra ?? [])],
    },
    examples: cfg.examples,
  };
}

/** A tone single-select, reused across writing missions. */
export const toneSlot = (patch: Partial<Slot> = {}): Slot => ({
  id: 'tone', kind: 'single', layer: 'intelligence', importance: 'important',
  label: c('Tone', 'النبرة'),
  question: c('What tone fits?', 'أنهي نبرة تناسب؟'),
  why: c('Tone shapes every sentence.', 'النبرة بتشكّل كل جملة.'),
  example: c('Friendly and confident.', 'ودود وواثق.'),
  options: [
    { value: 'professional', label: c('Professional', 'رسمي محترف'), keywords: ['professional', 'formal', 'رسمي', 'محترف'] },
    { value: 'friendly', label: c('Friendly', 'ودود'), keywords: ['friendly', 'warm', 'ودود', 'قريب'] },
    { value: 'bold', label: c('Bold & punchy', 'جريء وقوي'), keywords: ['bold', 'punchy', 'جريء', 'قوي'] },
    { value: 'luxury', label: c('Elegant & premium', 'أنيق وفخم'), keywords: ['luxury', 'elegant', 'premium', 'فخم', 'أنيق'] },
    { value: 'playful', label: c('Playful', 'مرح'), keywords: ['playful', 'fun', 'مرح', 'خفيف'] },
    { value: 'simple', label: c('Simple & clear', 'بسيط وواضح'), keywords: ['simple', 'clear', 'plain', 'بسيط', 'واضح'] },
  ],
  defaults: [{ value: 'friendly', reason: c('A friendly, confident tone fits most brands.', 'نبرة ودودة وواثقة بتناسب أغلب البراندات.') }],
  ...patch,
});
