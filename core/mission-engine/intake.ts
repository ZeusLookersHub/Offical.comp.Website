import type { Blueprint, Candidate, Session, Slot, SlotValueRaw } from './types.ts';
import { containsPhrase, normalize } from './text.ts';

const QUOTED = /["“«‘]([^"”»’\n]{2,120})["”»’]/g;

const isFilled = (v: SlotValueRaw | undefined) =>
  typeof v === 'string' ? v.trim().length > 0 : Array.isArray(v) ? v.length > 0 : false;

/** Accept a value only when it is valid for the slot. Exact slots must appear verbatim in the user text. */
export function validValue(slot: Slot, value: SlotValueRaw, sourceText?: string): SlotValueRaw | null {
  if (slot.kind === 'single') {
    return typeof value === 'string' && slot.options?.some(o => o.value === value) ? value : null;
  }
  if (slot.kind === 'multi') {
    if (!Array.isArray(value) || !value.length) return null;
    const unique = [...new Set(value)];
    return unique.every(v => slot.options?.some(o => o.value === v)) ? unique : null;
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > (slot.maxLength ?? 2000)) return null;
  if (slot.kind === 'exact' && sourceText !== undefined && !sourceText.includes(trimmed)) return null;
  return trimmed;
}

/**
 * Deterministic extraction: regex patterns, quoted text for exact slots,
 * and option keywords. Ambiguous option matches are dropped, never guessed.
 */
export function extractDeterministic(blueprint: Blueprint, text: string): Candidate[] {
  const out: Candidate[] = [];
  const digits = text.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[：]/g, ':');
  for (const slot of blueprint.slots) {
    for (const pattern of slot.patterns ?? []) {
      const match = new RegExp(pattern.regex, pattern.flags ?? 'iu').exec(digits);
      if (match) {
        const value = pattern.value ?? match[pattern.group ?? 0];
        out.push({ slot: slot.id, value: value.trim(), evidence: match[0] });
        break;
      }
    }
    if (slot.kind === 'single' || slot.kind === 'multi') {
      const hits = (slot.options ?? []).flatMap(option =>
        (option.keywords ?? []).filter(k => containsPhrase(text, k)).slice(0, 1).map(k => ({ option: option.value, k })));
      const distinct = [...new Set(hits.map(h => h.option))];
      if (slot.kind === 'single' && distinct.length === 1) out.push({ slot: slot.id, value: distinct[0], evidence: hits[0].k });
      if (slot.kind === 'multi' && distinct.length) out.push({ slot: slot.id, value: distinct, evidence: hits.map(h => h.k).join(', ') });
    }
  }
  // Quoted phrases go to the exact slot whose cue word sits right before the quote ("brand", "مكتوب"...).
  for (const match of text.matchAll(QUOTED)) {
    const before = text.slice(Math.max(0, (match.index ?? 0) - 40), match.index);
    const owners = blueprint.slots.filter(s => s.kind === 'exact' && (s.quoteCues ?? []).some(cue => containsPhrase(before, cue)));
    if (owners.length === 1 && !out.some(c => c.slot === owners[0].id)) {
      out.push({ slot: owners[0].id, value: match[1].trim(), evidence: match[1].trim() });
    }
  }
  return out;
}

/**
 * Merge candidates into the session. Rules:
 * - evidence must be present in the user text (normalized) — no evidence, no fact;
 * - user answers are never overwritten;
 * - conflicting candidates for one slot cancel each other.
 */
export function applyCandidates(session: Session, blueprint: Blueprint, text: string, candidates: Candidate[]): Session {
  const values = { ...session.values };
  const plain = normalize(text);
  const bySlot = new Map<string, Candidate[]>();
  for (const c of candidates) bySlot.set(c.slot, [...(bySlot.get(c.slot) ?? []), c]);
  for (const [slotId, list] of bySlot) {
    const slot = blueprint.slots.find(s => s.id === slotId);
    if (!slot || values[slotId]?.source === 'user') continue;
    const accepted = list.filter(c => typeof c.evidence === 'string' && c.evidence.trim().length > 0 && plain.includes(normalize(c.evidence)))
      .map(c => ({ c, v: validValue(slot, c.value, text) }))
      .filter((x): x is { c: Candidate; v: SlotValueRaw } => x.v !== null && isFilled(x.v));
    const distinct = new Set(accepted.map(x => JSON.stringify(x.v)));
    if (distinct.size !== 1) continue;
    values[slotId] = { value: accepted[0].v, source: 'extracted', evidence: accepted[0].c.evidence.trim() };
  }
  return { ...session, values };
}
