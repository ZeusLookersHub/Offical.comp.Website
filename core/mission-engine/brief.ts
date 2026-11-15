import type { Blueprint, Brief, BriefItem, Session, Slot, SlotValue } from './types.ts';
import { effectiveValues, NONE, relevantSlots } from './planner.ts';
import { asText, t } from './text.ts';

export function displayValue(slot: Slot, value: SlotValue['value'], lang: Session['lang']): string {
  const one = (v: string) => v === NONE ? t(slot.noneLabel ?? { en: 'None', ar: 'مفيش' }, lang)
    : slot.options?.find(o => o.value === v) ? t(slot.options.find(o => o.value === v)!.label, lang) : v;
  return Array.isArray(value) ? value.map(one).join(lang === 'ar' ? '، ' : ', ') : one(value);
}

/** The card the user confirms (and can share): what they said, what we assumed, what is excluded. */
export function buildBrief(session: Session, blueprint: Blueprint): Brief {
  const lang = session.lang;
  const values = effectiveValues(session, blueprint);
  const facts: BriefItem[] = [], assumptions: BriefItem[] = [], exclusions: BriefItem[] = [], missing: string[] = [];
  let target = '';
  for (const slot of relevantSlots(blueprint, values)) {
    const v = values[slot.id];
    const empty = !v || !asText(v.value).trim();
    if (empty) {
      if (slot.importance !== 'nice') missing.push(t(slot.label, lang));
      continue;
    }
    const item: BriefItem = { slot: slot.id, label: t(slot.label, lang), value: displayValue(slot, v.value, lang), source: v.source, reason: v.reason ? t(v.reason, lang) : undefined };
    if (slot.role === 'target-tool') target = item.value;
    if (slot.role === 'exclusion' && v.value !== NONE) exclusions.push(item);
    else if (v.source === 'default') assumptions.push(item);
    else if (slot.role !== 'exclusion') facts.push(item);
  }
  return {
    blueprintId: blueprint.id,
    title: t(blueprint.title, lang),
    idea: session.idea ?? '',
    facts, assumptions, exclusions, target,
    output: t(blueprint.output.description, lang),
    ready: missing.length === 0 && session.phase !== 'intake',
    missing,
    revision: session.revision,
  };
}
