import type { Blueprint, Copy } from './types.ts';

const copyOk = (c: Copy | undefined) => !!c && !!c.en?.trim() && !!c.ar?.trim();

/** Structural checks so a broken blueprint fails in CI, not in front of a user. */
export function validateBlueprint(bp: Blueprint): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const err = (m: string) => errors.push(`${bp.id}: ${m}`);
  if (!copyOk(bp.title) || !copyOk(bp.intake.question) || !copyOk(bp.intake.why)) err('title/intake copy missing');
  if (bp.intake.starters.length < 3 || !bp.intake.starters.every(copyOk)) err('intake needs 3+ bilingual starters');
  if (!Number.isInteger(bp.questionBudget) || bp.questionBudget < 0 || bp.questionBudget > 6) err('questionBudget must be 0..6');
  for (const s of bp.slots) {
    if (ids.has(s.id)) err(`duplicate slot ${s.id}`);
    ids.add(s.id);
  }
  for (const s of bp.slots) {
    if (!copyOk(s.label) || !copyOk(s.question) || !copyOk(s.why) || !copyOk(s.example)) err(`${s.id}: copy missing`);
    const hasOptions = !!s.options?.length;
    if ((s.kind === 'single' || s.kind === 'multi') !== hasOptions) err(`${s.id}: options do not match kind`);
    s.options?.forEach(o => { if (!copyOk(o.label)) err(`${s.id}.${o.value}: label missing`); });
    for (const d of s.defaults ?? []) {
      const vals = Array.isArray(d.value) ? d.value : [d.value];
      if (hasOptions && !vals.every(v => v === 'none' || s.options!.some(o => o.value === v))) err(`${s.id}: default not an option`);
      if (!copyOk(d.reason)) err(`${s.id}: default reason missing`);
      d.when?.forEach(c => { if (!ids.has(c.slot)) err(`${s.id}: default condition on unknown ${c.slot}`); });
    }
    s.when?.forEach(c => { if (!ids.has(c.slot)) err(`${s.id}: condition on unknown ${c.slot}`); });
    if (s.kind === 'exact' && s.importance === 'critical') err(`${s.id}: exact slots cannot be critical (users may have no text)`);
    if (s.vocabulary && (!s.vocabulary.en.length || !s.vocabulary.ar.length)) err(`${s.id}: vocabulary needs both languages`);
    s.patterns?.forEach(p => { try { new RegExp(p.regex, p.flags ?? 'iu'); } catch { err(`${s.id}: bad regex`); } });
  }
  if (!bp.slots.some(s => s.importance === 'critical')) err('needs at least one critical slot');
  for (const g of bp.gates) {
    const refs = 'slot' in g ? [g.slot] : g.kind === 'no-invented-text' ? g.whenEmpty : g.kind === 'no-leak' ? g.slotTerms ?? [] : g.exceptSlots;
    refs.forEach(r => { if (!ids.has(r)) err(`gate ${g.id}: unknown slot ${r}`); });
    if (!copyOk(g.message)) err(`gate ${g.id}: message missing`);
  }
  if (!bp.output.fields.some(f => f.required)) err('contract needs required fields');
  return errors;
}
