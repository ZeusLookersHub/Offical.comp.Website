import type { Blueprint, Candidate, Condition, EngineResult, Lang, Session, Slot, SlotDefault, SlotValue, SlotValueRaw, Step } from './types.ts';
import { applyCandidates, extractDeterministic, validValue } from './intake.ts';
import { buildBrief } from './brief.ts';
import { suggest } from './suggest.ts';
import { t } from './text.ts';

export const NONE = 'none';

const filled = (v: SlotValue | undefined) => !!v && (Array.isArray(v.value) ? v.value.length > 0 : v.value.trim().length > 0);

function matches(cond: Condition, values: Record<string, SlotValue>): boolean {
  const current = values[cond.slot]?.value;
  if (cond.filled !== undefined) return cond.filled === (current !== undefined && current !== NONE && filled(values[cond.slot]));
  if (cond.equals !== undefined) {
    const wanted = Array.isArray(cond.equals) ? cond.equals : [cond.equals];
    return Array.isArray(current) ? current.some(c => wanted.includes(c)) : typeof current === 'string' && wanted.includes(current);
  }
  if (cond.notEquals !== undefined) return current !== cond.notEquals;
  return true;
}
const allMatch = (conds: Condition[] | undefined, values: Record<string, SlotValue>) => (conds ?? []).every(c => matches(c, values));

export function resolveDefault(slot: Slot, values: Record<string, SlotValue>): SlotDefault | undefined {
  return slot.defaults?.find(d => allMatch(d.when, values));
}

/** Values plus defaults for every relevant unfilled slot (iterated so defaults can depend on defaults). */
export function effectiveValues(session: Session, blueprint: Blueprint): Record<string, SlotValue> {
  const values = { ...session.values };
  for (let pass = 0; pass < 3; pass++) {
    for (const slot of blueprint.slots) {
      if (filled(values[slot.id]) || !allMatch(slot.when, values)) continue;
      const d = resolveDefault(slot, values);
      if (d) values[slot.id] = { value: d.value === '@lang' ? session.lang : structuredClone(d.value), source: 'default', reason: d.reason };
    }
  }
  return values;
}

export function relevantSlots(blueprint: Blueprint, values: Record<string, SlotValue>): Slot[] {
  return blueprint.slots.filter(slot => allMatch(slot.when, values));
}

/** The ordered list of slots we would still ask, given the budget. */
export function plannedQuestions(session: Session, blueprint: Blueprint): Slot[] {
  const values = effectiveValues(session, blueprint);
  const queue: Slot[] = [];
  for (const slot of relevantSlots(blueprint, values)) {
    if (filled(session.values[slot.id])) continue;
    const hasDefault = !!resolveDefault(slot, values);
    const askedOptional = session.asked.filter(id => blueprint.slots.find(s => s.id === id)?.importance !== 'critical').length;
    const budgetLeft = blueprint.questionBudget - askedOptional - queue.filter(s => s.importance !== 'critical').length;
    if (slot.importance === 'critical' && !hasDefault) queue.push(slot);
    else if (slot.importance === 'important' && (!hasDefault || budgetLeft > 0)) queue.push(slot);
  }
  return queue;
}

export function createSession(blueprint: Blueprint, lang: Lang, id: string = cryptoId()): Session {
  return { id, blueprintId: blueprint.id, blueprintVersion: blueprint.version, lang, phase: 'intake', values: {}, asked: [], revision: 0 };
}

function cryptoId() {
  return globalThis.crypto?.randomUUID?.() ?? `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Freeze defaults into the session once nothing is left to ask. */
function settle(session: Session, blueprint: Blueprint): Session {
  if (session.phase === 'intake') return session;
  if (plannedQuestions(session, blueprint).length) return { ...session, phase: 'questions' };
  const values = effectiveValues(session, blueprint);
  for (const key of Object.keys(values)) {
    const slot = blueprint.slots.find(s => s.id === key);
    if (!slot || !allMatch(slot.when, values)) delete values[key];
  }
  return { ...session, values, phase: session.phase === 'confirmed' ? 'confirmed' : 'brief' };
}

/** First message: the user's idea. Extraction fills every slot it can prove from the text. */
export function submitIntake(session: Session, blueprint: Blueprint, text: string, modelCandidates: Candidate[] = []): EngineResult<Session> {
  if (session.phase !== 'intake') return { ok: false, error: 'intake_already_done' };
  const idea = typeof text === 'string' ? text.trim() : '';
  if (idea.length < 2 || idea.length > 4000) return { ok: false, error: 'invalid_answer' };
  const extracted = applyCandidates(session, blueprint, idea, [...extractDeterministic(blueprint, idea), ...modelCandidates]);
  return { ok: true, value: settle({ ...extracted, idea, phase: 'questions', revision: session.revision + 1 }, blueprint) };
}

/**
 * Answer a slot. During questions this is the next answer; in brief/confirmed it is a rework
 * edit (the brief must then be confirmed again). Free-text answers can also fill other slots.
 */
export function answer(session: Session, blueprint: Blueprint, slotId: string, raw: SlotValueRaw, modelCandidates: Candidate[] = []): EngineResult<Session> {
  if (session.phase === 'intake') return { ok: false, error: 'intake_first' };
  const slot = blueprint.slots.find(s => s.id === slotId);
  if (!slot || !relevantSlots(blueprint, effectiveValues(session, blueprint)).includes(slot)) return { ok: false, error: 'unknown_slot' };
  const value = validValue(slot, raw);
  if (value === null) return { ok: false, error: slot.kind === 'single' || slot.kind === 'multi' ? 'invalid_option' : 'invalid_answer' };
  let next: Session = {
    ...session,
    values: { ...session.values, [slotId]: { value, source: 'user' } },
    asked: session.phase === 'questions' && !session.asked.includes(slotId) ? [...session.asked, slotId] : session.asked,
    revision: session.revision + 1,
    phase: session.phase === 'confirmed' ? 'brief' : session.phase,
  };
  if (typeof value === 'string' && (slot.kind === 'text' || slot.kind === 'longtext')) {
    next = applyCandidates(next, blueprint, value, [...extractDeterministic(blueprint, value), ...modelCandidates]);
  }
  return { ok: true, value: settle(next, blueprint) };
}

/** Skip an optional question: its default (or "none") becomes a visible assumption. */
export function skip(session: Session, blueprint: Blueprint, slotId: string): EngineResult<Session> {
  const slot = blueprint.slots.find(s => s.id === slotId);
  if (!slot || session.phase !== 'questions') return { ok: false, error: 'unknown_slot' };
  if (slot.importance === 'critical') return { ok: false, error: 'required' };
  const values = effectiveValues(session, blueprint);
  const d = resolveDefault(slot, values);
  const assumed: SlotValue = d ? { value: d.value === '@lang' ? session.lang : d.value, source: 'default', reason: d.reason }
    : { value: NONE, source: 'default', reason: { en: 'You skipped this.', ar: 'اتخطيت السؤال ده.' } };
  return { ok: true, value: settle({ ...session, values: { ...session.values, [slotId]: assumed }, asked: [...session.asked, slotId], revision: session.revision + 1 }, blueprint) };
}

/** Pure: what the chat should show now. */
export function nextStep(session: Session, blueprint: Blueprint): Step {
  const lang = session.lang;
  if (session.phase === 'intake') {
    return { type: 'intake', question: t(blueprint.intake.question, lang), why: t(blueprint.intake.why, lang), starters: blueprint.intake.starters.map(s => t(s, lang)) };
  }
  const queue = session.phase === 'questions' ? plannedQuestions(session, blueprint) : [];
  const slot = queue[0];
  if (!slot) return { type: 'brief', brief: buildBrief(session, blueprint) };
  return {
    type: 'question',
    progress: { asked: session.asked.length, remaining: queue.length },
    question: {
      slot: slot.id,
      kind: slot.kind,
      layer: slot.layer,
      message: t(slot.question, lang),
      why: t(slot.why, lang),
      example: t(slot.example, lang),
      options: slot.options?.map(o => ({ value: o.value, label: t(o.label, lang), description: o.visual ? t(o.visual.description, lang) : undefined, media: o.visual?.media, asset: o.visual?.asset })),
      canSkip: slot.importance !== 'critical',
      skipLabel: slot.importance !== 'critical' ? t({ en: 'Skip · use the best default', ar: 'تخطّى · اختارلي الأنسب' }, lang) : undefined,
      suggestions: suggest(blueprint, slot.id, '', session),
    },
  };
}

/** Lock the brief. Only a complete brief can be confirmed. */
export function confirmBrief(session: Session, blueprint: Blueprint): EngineResult<Session> {
  if (session.phase !== 'brief') return { ok: false, error: 'not_ready' };
  const brief = buildBrief(session, blueprint);
  if (!brief.ready) return { ok: false, error: 'missing_required' };
  return { ok: true, value: { ...session, phase: 'confirmed' } };
}
