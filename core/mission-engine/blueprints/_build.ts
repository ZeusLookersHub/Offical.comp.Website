import type { Blueprint, Copy, Gate, OutputContract, Slot, ToolTarget } from '../types.ts';
import { avoid, brandName, c, language, targetTool } from '../modules.ts';

/** AI builders and chat AIs that can produce working software. */
export const buildToolOptions = [
  { value: 'claude', label: c('Claude', 'Claude'), keywords: ['claude', 'كلود'] },
  { value: 'chatgpt', label: c('ChatGPT', 'ChatGPT'), keywords: ['chatgpt', 'chat gpt', 'شات جي بي تي'] },
  { value: 'gemini', label: c('Gemini', 'Gemini'), keywords: ['gemini', 'جيميناي'] },
  { value: 'lovable', label: c('Lovable', 'Lovable'), keywords: ['lovable', 'لوفابل'] },
  { value: 'v0', label: c('v0', 'v0'), keywords: ['v0', 'في زيرو'] },
  { value: 'bolt', label: c('Bolt', 'Bolt'), keywords: ['bolt', 'بولت'] },
];

export const buildTools = (): ToolTarget[] => [
  { id: 'universal', label: 'Universal', notes: 'Layered prompt with headings; stack-agnostic.' },
  { id: 'claude', label: 'Claude', notes: 'Ask for complete files, one at a time, with the exact file paths; keep the four headings.' },
  { id: 'chatgpt', label: 'ChatGPT', notes: 'Ask for complete files with paths; keep the four headings and request a run command.' },
  { id: 'gemini', label: 'Gemini', notes: 'Works best one file or one screen per request — include the spec each time.' },
  { id: 'lovable', label: 'Lovable', notes: 'Start with the goal and the screens; Lovable builds React + Tailwind + Supabase; ask for one screen at a time.' },
  { id: 'v0', label: 'v0', notes: 'Describe the screen, its components and states; ask for one responsive screen per request.' },
  { id: 'bolt', label: 'Bolt', notes: 'Full build prompt; name the stack and say whether a backend is needed.' },
];

export function buildOutput(description: Copy, outlineKey: string, outlineDesc: string): OutputContract {
  return {
    id: 'text-ai-prompt', description,
    fields: [
      { path: 'title', type: 'string', required: true, maxLength: 120, description: 'Short title in the user language.' },
      { path: 'sections', type: 'object', required: true, description: 'The four layers of the deliverable prompt.' },
      { path: 'sections.goal', type: 'string', required: true, description: 'What is being built, for whom, and the one job it must do (Understanding).' },
      { path: 'sections.approach', type: 'string', required: true, description: 'Structure, data model, states and the expert approach (Intelligence).' },
      { path: 'sections.rules', type: 'string', required: true, description: 'Verbatim names, no invented data or credentials, placeholders, exclusions (Control).' },
      { path: 'sections.output', type: 'string', required: true, description: 'Stack, files, language/RTL, accessibility, error states, self-check (Delivery).' },
      { path: 'prompt', type: 'string', required: true, maxLength: 6000, description: 'The four sections assembled with headings, ready to paste.' },
      { path: outlineKey, type: 'string[]', required: true, description: outlineDesc },
      { path: 'missingData', type: 'string[]', required: true, description: 'What the user still has to provide (may be empty).' },
      { path: 'variants', type: 'record', required: true, description: 'Tool id → ready prompt.' },
      { path: 'checklist', type: 'string[]', required: true, description: '4–6 checks for the built result, user language.' },
      { path: 'summary', type: 'string', required: true, maxLength: 600, description: 'One or two sentences, user language.' },
    ],
  };
}

export const buildGates = (outlineKey: string): Gate[] => [
  { id: 'name-verbatim', kind: 'verbatim', slot: 'brandName', fields: ['prompt', 'variants.*'], nearMiss: true, message: c('Name kept exactly as written', 'الاسم مكتوب بالحرف') },
  { id: 'no-invented-numbers', kind: 'no-invented-numbers', fields: ['prompt', outlineKey, 'variants.*'], message: c('No made-up prices, limits or numbers', 'مفيش أسعار أو حدود أو أرقام متألفة') },
  { id: 'rtl', kind: 'includes-when', when: [{ slot: 'language', equals: ['ar', 'both'] }], field: 'prompt', anyOf: ['right-to-left', 'RTL', 'dir="rtl"', 'من اليمين'], message: c('Arabic interface set right-to-left', 'الواجهة العربية من اليمين للشمال') },
  { id: 'states', kind: 'includes-when', when: [{ slot: 'language', equals: ['ar', 'en', 'both'] }], field: 'prompt', anyOf: ['empty state', 'loading', 'error state', 'حالة فاضية', 'تحميل', 'خطأ'], message: c('Loading, empty and error states are specified', 'حالات التحميل والفاضي والخطأ محددة') },
];

export const buildControlRules = (nameWhat: string): string[] => [
  `sections.rules must say: copy ${nameWhat} exactly as written; never invent data, prices, limits, API keys, credentials or third-party services; use [placeholders] for anything missing; respect avoid.`,
  'The prompt must forbid hard-coded secrets and must require keys to be read from environment variables.',
  'missingData lists what the user must supply before the build can run (content, keys, accounts).',
];

export const buildDeliveryRules = (outlineKey: string, outlineWhat: string): string[] => [
  'prompt = the four sections assembled under clear headings (Goal & context / Approach / Rules / Output) in the chosen language; if language is ar or both, require right-to-left layout explicitly.',
  'sections.output must name the stack, the files to produce with their paths, the responsive behaviour, the loading, empty and error states, and basic accessibility (labels, contrast, keyboard).',
  `${outlineKey} lists ${outlineWhat}, in order.`,
  'variants: universal plus the chosen tool (all tools if universal), following each tool note. Builders get one screen or file per request; chat AIs get complete files.',
  'checklist and summary in the user language (Egyptian Arabic for ar).',
];

/** Factory for software missions: the deliverable is a build prompt for an AI builder or chat AI. */
export function makeBuildMission(cfg: {
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
    slots: [...cfg.slots, brandName({ label: cfg.nameLabel }), language(), avoid(cfg.avoidVocab), targetTool(buildToolOptions)],
    output: buildOutput(cfg.outputDescription, cfg.outlineKey, cfg.outlineDesc),
    gates: [...buildGates(cfg.outlineKey), ...(cfg.extraGates ?? [])],
    tools: buildTools(),
    role: cfg.role,
    strategy: {
      understanding: cfg.understanding,
      intelligence: cfg.intelligence,
      control: [...buildControlRules(cfg.nameWhat), ...(cfg.controlExtra ?? [])],
      delivery: [...buildDeliveryRules(cfg.outlineKey, cfg.outlineWhat), ...(cfg.deliveryExtra ?? [])],
    },
    examples: cfg.examples,
  };
}
