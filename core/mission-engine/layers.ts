import type { Blueprint, Copy, LayerId, Session } from './types.ts';
import { NONE } from './planner.ts';

/** What each layer owns and what it must deliver. Shared by every blueprint and every universe. */
export const LAYERS: Record<LayerId, { order: number; name: Copy; scope: Copy; delivers: Copy; heading: string }> = {
  understanding: {
    order: 1,
    name: { en: 'Understanding', ar: 'الفهم' },
    scope: { en: 'Goal, subject, audience, where it will be used, the facts and references available.', ar: 'الهدف، والموضوع، والجمهور، وهيتستخدم فين، والمعلومات والمراجع المتاحة.' },
    delivers: { en: 'A correct picture of what is wanted, built only from confirmed facts.', ar: 'صورة صح للمطلوب، مبنية على معلومات مؤكدة بس.' },
    heading: '1 · UNDERSTANDING — what you are given',
  },
  intelligence: {
    order: 2,
    name: { en: 'Intelligence', ar: 'التفكير' },
    scope: { en: 'Approach and creative or strategic direction: style, structure, sequence, decision criteria.', ar: 'طريقة الحل والاتجاه الإبداعي أو الاستراتيجي: الستايل، والهيكل، والترتيب، ومعايير القرار.' },
    delivers: { en: 'The expert decisions the user would otherwise have to make alone.', ar: 'القرارات اللي كان المستخدم هيضطر ياخدها لوحده، بخبرة متخصص.' },
    heading: '2 · INTELLIGENCE — how to decide',
  },
  control: {
    order: 3,
    name: { en: 'Control', ar: 'التحكم' },
    scope: { en: 'Hard limits: verbatim names and text, exclusions, things never to invent, scope boundaries.', ar: 'الحدود الثابتة: الأسماء والكلام الحرفي، والممنوعات، واللي ممنوع نخترعه، وحدود النطاق.' },
    delivers: { en: 'Safety from the classic AI mistakes: wrong names, made-up facts, unwanted elements.', ar: 'حماية من أخطاء الـ AI المعروفة: أسماء غلط، ومعلومات متألفة، وعناصر مش مطلوبة.' },
    heading: '3 · CONTROL — hard limits',
  },
  delivery: {
    order: 4,
    name: { en: 'Delivery', ar: 'التسليم' },
    scope: { en: 'Output format, target tool, size/duration/length, language, and the acceptance checks.', ar: 'شكل الناتج، والأداة المستهدفة، والمقاس أو المدة أو الطول، واللغة، وفحوصات القبول.' },
    delivers: { en: 'A ready-to-paste result that fits the tool and passes the checks.', ar: 'نتيجة جاهزة للنسخ، مناسبة للأداة، وعدّت الفحوصات.' },
    heading: '4 · DELIVERY — what to return',
  },
};

export const LAYER_ORDER: LayerId[] = ['understanding', 'intelligence', 'control', 'delivery'];

const GLOBAL: Record<LayerId, string[]> = {
  understanding: [
    'The brief arrives as JSON. "values" holds slot values; each has verbatim (copy exactly), assumed (an accepted default, not a user fact) and label (readable meaning).',
    'Use only the brief. Never invent names, prices, numbers, claims, testimonials, statistics or text.',
    'A value the user gave (assumed = false) carries "asked": the question it answers. Read the answer in that context; it is the user\'s own decision and outranks any default or house style.',
    'brief.references, when present, describe photos the user uploaded: real facts about what exists (shapes, colours, materials, text on it). Use their concrete details and never contradict them.',
  ],
  intelligence: [
    'Make the expert choices the user did not make, guided by the strategy below. Prefer concrete, sensory, specific wording over generic adjectives.',
    'Every detail the user gave must visibly shape the result: turn it into specific decisions (what is seen, where, in which colour, material, light, order or tone), never a passing mention or a vague echo of their words.',
    'Expand each chosen option into 3–5 concrete craft decisions a specialist would write (for visuals: subject details, composition and framing, camera/lens, light, named colour palette, materials and textures, mood; for text: structure, sections, tone devices, examples, length).',
    'No filler: words like "stunning", "high quality", "beautiful", "professional", "amazing", "8k" add nothing — replace each with the specific thing that makes it so.',
  ],
  control: [
    'Verbatim values must be copied character for character, including letter case. Never translate, respell or shorten them.',
    'Where a fact is missing, write a clear placeholder in square brackets (e.g. [revenue]) instead of inventing it.',
    'Execution metadata (target tool, aspect ratio, duration, model settings) goes in params/variants, never inside a scene description.',
  ],
  delivery: [
    'Return one JSON object that matches the contract exactly. No markdown fences, no extra keys.',
    'If the contract has coverage: for every value with assumed = false that is not verbatim, coverage[slotId] = a short phrase (3–12 words) copied character for character from prompt that carries that detail. Do not list assumed values.',
  ],
};

/**
 * The internal system prompt for one blueprint (what WE send to our model; the user never sees it).
 * The deliverable prompt the user copies is a field inside the JSON it returns.
 */
export function compileSystemPrompt(blueprint: Blueprint, session?: Pick<Session, 'values'>): string {
  const empty = session ? blueprint.slots.filter(s => session.values[s.id]?.value === NONE).map(s => s.id) : [];
  const parts: string[] = [`ROLE: ${blueprint.role}`];
  for (const layer of LAYER_ORDER) {
    const rules = [...GLOBAL[layer], ...blueprint.strategy[layer]];
    if (layer === 'control' && empty.length) rules.push(`These were deliberately left empty, do not fill them: ${empty.join(', ')}.`);
    if (layer === 'delivery') {
      rules.push('Contract fields: ' + blueprint.output.fields.map(f => `${f.path} (${f.type}${f.required ? ', required' : ''}${f.maxLength ? `, ≤${f.maxLength} chars` : ''}): ${f.description}`).join(' | '));
      rules.push('Tool notes: ' + blueprint.tools.map(t => `${t.id} = ${t.notes}`).join(' | '));
      rules.push('Before answering, verify: ' + blueprint.gates.map(g => g.message.en).join('; ') + '.');
    }
    parts.push(`\n${LAYERS[layer].heading}\n` + rules.map(r => `- ${r}`).join('\n'));
  }
  for (const ex of blueprint.examples ?? []) parts.push(`\nEXAMPLE\nGood: ${ex.good}\nBad: ${ex.bad}\nWhy: ${ex.why}`);
  return parts.join('\n');
}
