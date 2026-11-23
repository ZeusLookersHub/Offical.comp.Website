import type { Blueprint, Lang, Session, SlotValueRaw } from './types.ts';
import { normalize } from './text.ts';

/**
 * The conversation layer: people do not always answer the question. They say they do not
 * understand it, ask what the difference is, hand the choice back ("you pick"), or answer
 * with more than was asked. The server reads that with a model (op `turn`); this file holds
 * the shared shapes, the context we send, and a local fallback for when the model is away.
 */
export type TurnIntent = 'answer' | 'confused' | 'ask' | 'delegate' | 'skip' | 'offtopic';

export type Note = NonNullable<Session['notes']>[number];

export interface TurnResult {
  intent: TurnIntent;
  /** For answer/delegate: the value for the current slot (option values for choices). */
  value?: SlotValueRaw;
  /** Facts for other slots found in the same message (applied with evidence checks). */
  others?: { slot: string; value: SlotValueRaw; evidence: string }[];
  /** What we say back: an explanation, an answer, or why we chose. */
  reply?: string;
  /** Ready answers to tap. */
  chips?: string[];
  /** One follow-up that digs for detail when the answer is valid but thin. */
  probe?: { q: string; chips: string[] };
}

export interface SmartOptions { recommend?: string; why?: string; answers: string[] }
export interface DeepQuestion { q: string; why?: string; chips: string[] }

const has = (text: string, list: string[]) => {
  const plain = ` ${normalize(text)} `;
  return list.some(w => plain.includes(` ${normalize(w)} `) || plain.includes(normalize(w)) && normalize(w).length > 5);
};

const CONFUSED = ['مش فاهم', 'مش فاهمه', 'مفهمتش', 'مش واضح', 'يعني ايه', 'يعني إيه', 'تقصد ايه', 'تقصد إيه', 'وضح', 'وضّح', 'اشرح', 'اشرحلي', 'معناها ايه',
  "don't understand", 'dont understand', 'not clear', 'what do you mean', 'explain', 'meaning', 'confused'];
const DELEGATE = ['اختار انت', 'اختار إنت', 'انت اختار', 'إنت اختار', 'اللي تشوفه', 'اللي تشوفيه', 'زي ما تحب', 'مش عارف', 'معرفش', 'مش متأكد', 'أي حاجة', 'اي حاجة', 'انت حر',
  'you choose', 'you pick', 'up to you', 'not sure', "don't know", 'dont know', 'whatever', 'anything', 'surprise me'];
const SKIP = ['تخطى', 'تخطي', 'عدي', 'عدّي', 'سيبها', 'مش مهم', 'skip', 'next', 'pass'];

/** Cheap first read, used when the model is unavailable. */
export function readLocally(text: string): TurnIntent | null {
  const words = normalize(text).split(' ').filter(Boolean).length;
  if (words <= 6 && has(text, SKIP)) return 'skip';
  if (has(text, DELEGATE)) return 'delegate';
  if (has(text, CONFUSED) || /^\s*[؟?]+\s*$/.test(text)) return 'confused';
  return null;
}

/** Local explanation: the why, the example, and the choices in plain words. */
export function explainLocally(bp: Blueprint, slotId: string, lang: Lang): { reply: string; chips: string[] } {
  const slot = bp.slots.find(s => s.id === slotId);
  if (!slot) return { reply: '', chips: [] };
  const ar = lang === 'ar';
  const reply = ar
    ? `أقصد: ${slot.why.ar}\nمثلاً: ${slot.example.ar}\nقولّي بكلامك العادي، أو اختار من تحت.`
    : `I mean: ${slot.why.en}\nFor example: ${slot.example.en}\nTell me in your own words, or pick one below.`;
  const chips = slot.options?.slice(0, 4).map(o => o.label[lang]) ?? (ar ? slot.vocabulary?.ar : slot.vocabulary?.en)?.slice(0, 4) ?? [];
  return { reply, chips };
}

/** What we tell the model about the conversation so far: the idea, every answer, the extra details. */
export function conversationContext(session: Session, bp: Blueprint): string {
  const lines: string[] = [];
  if (session.idea) lines.push(`Idea: ${session.idea.slice(0, 1200)}`);
  for (const slot of bp.slots) {
    const v = session.values[slot.id];
    if (!v || v.source === 'default') continue;
    const one = (x: string) => slot.options?.find(o => o.value === x)?.label.en ?? x;
    const value = Array.isArray(v.value) ? v.value.map(one).join(', ') : one(v.value);
    lines.push(`${slot.label.en}: ${value}`);
  }
  for (const n of session.notes ?? []) lines.push(`Q: ${n.q} → ${n.a}`);
  return lines.join('\n').slice(0, 3000);
}

export const MAX_NOTES = 8;
export const MAX_PROBES = 3;
