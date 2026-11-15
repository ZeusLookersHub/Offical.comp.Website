import type { Blueprint, Session } from './types.ts';
import { normalize, t, words } from './text.ts';

/**
 * Live suggestion chips while the user types (instant, offline).
 * Ranks the slot's vocabulary and option labels against the word being typed,
 * and leaves out what is already written. The server may append model ideas later.
 */
export function suggest(blueprint: Blueprint, slotId: string | 'intake', typed: string, session: Pick<Session, 'lang'>, limit = 6): string[] {
  const lang = session.lang;
  const pool: string[] = slotId === 'intake'
    ? blueprint.intake.starters.map(s => t(s, lang))
    : (() => {
      const slot = blueprint.slots.find(s => s.id === slotId);
      if (!slot) return [];
      return [...(slot.vocabulary?.[lang] ?? []), ...(slot.kind === 'text' || slot.kind === 'longtext' ? [] : (slot.options ?? []).map(o => t(o.label, lang)))];
    })();
  const written = new Set(words(typed));
  const tokens = words(typed);
  const current = /\s$/.test(typed) ? '' : tokens[tokens.length - 1] ?? '';
  const scored = [...new Set(pool)].map((chip, index) => {
    const chipWords = words(chip);
    if (chipWords.length && chipWords.every(w => written.has(w))) return { chip, score: -1, index };
    let score = 1;
    if (current) {
      if (chipWords.some(w => w.startsWith(current))) score += 4;
      else if (normalize(chip).includes(current)) score += 2;
      else score -= 0.5;
    }
    if (chipWords.some(w => written.has(w))) score += 1; // related to what they already wrote
    return { chip, score, index };
  });
  return scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, limit).map(s => s.chip);
}
