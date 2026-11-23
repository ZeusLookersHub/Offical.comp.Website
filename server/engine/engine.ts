// Server imports core modules directly (not index.ts) so the UI copy of the blueprints is not bundled.
import type { Blueprint, Candidate, GateReport, Lang, Session, SlotValue } from '../../core/mission-engine/types.ts';
import { applyCandidates, validValue } from '../../core/mission-engine/intake.ts';
import { buildComposeRequest, repairInstruction } from '../../core/mission-engine/compose.ts';
import { runGates } from '../../core/mission-engine/gates.ts';
import { nearMisses } from '../../core/mission-engine/text.ts';
import { LAYERS } from '../../core/mission-engine/layers.ts';
import { NONE } from '../../core/mission-engine/planner.ts';

export type BlueprintLookup = (id: string) => Blueprint | undefined | Promise<Blueprint | undefined>;
import { ModelError, type JsonModel } from './model.ts';

export type EngineError = 'unknown_blueprint' | 'version_mismatch' | 'invalid_session' | 'not_confirmed' | 'invalid_request';

// ---------- 1. Smart intake: the model proposes, evidence decides ----------

function slotCatalogue(bp: Blueprint): string {
  return bp.slots.map(s => {
    const opts = s.options ? ` options=[${s.options.map(o => `${o.value} (${o.label.en})`).join(', ')}]` : '';
    const kind = s.kind === 'exact' ? 'exact (copy verbatim from the text, keep case)' : s.kind;
    return `- ${s.id}: ${kind}; ${LAYERS[s.layer].name.en}; ${s.question.en}${opts}`;
  }).join('\n');
}

export async function extract(model: JsonModel, bp: Blueprint, text: string, signal?: AbortSignal): Promise<{ candidates: Candidate[]; model: string }> {
  const system = [
    `You extract facts for a "${bp.title.en}" brief from the user's message. Arabic or English.`,
    'Return JSON: {"candidates":[{"slot":"<id>","value":"<value or option id or array of option ids>","evidence":"<exact words copied from the message>"}]}',
    'Only include a slot when the message clearly states it. evidence must be a verbatim span of the message. Never guess, never infer brand names, never translate exact values.',
    'Slots:', slotCatalogue(bp),
  ].join('\n');
  const { json, modelId } = await model.complete({ system, user: text, maxTokens: 800, signal });
  const list = (json as { candidates?: unknown })?.candidates;
  const served = modelId ?? model.id;
  if (!Array.isArray(list)) return { candidates: [], model: served };
  const candidates = list.filter((c): c is Candidate => !!c && typeof c === 'object'
    && typeof (c as Candidate).slot === 'string' && typeof (c as Candidate).evidence === 'string'
    && (typeof (c as Candidate).value === 'string' || Array.isArray((c as Candidate).value)))
    .slice(0, 20)
    // Pre-filter here too; the client applies the same rule again with applyCandidates.
    .filter(c => applyCandidates({ id: 'x', blueprintId: bp.id, blueprintVersion: bp.version, lang: 'en', phase: 'questions', values: {}, asked: [], revision: 0 }, bp, text, [c]).values[c.slot]);
  return { candidates, model: served };
}

// ---------- 2. Ideas while typing: contextual chips ----------

export async function ideas(model: JsonModel, bp: Blueprint, slotId: string, typed: string, context: string, lang: Lang, signal?: AbortSignal): Promise<string[]> {
  const slot = bp.slots.find(s => s.id === slotId);
  if (!slot || slot.kind === 'single' || slot.kind === 'multi' || slot.kind === 'exact') return [];
  const system = [
    `You suggest short continuations for a field in a "${bp.title.en}" brief. Field: ${slot.question.en}`,
    `Reply in ${lang === 'ar' ? 'Egyptian Arabic' : 'English'}. Return JSON {"ideas":["…"]} with up to 6 ideas, each 1–5 words, specific to what the user already wrote, no brand names, no numbers, no repetition of their words.`,
  ].join('\n');
  const { json } = await model.complete({ system, user: `Context: ${context.slice(0, 600)}\nTyped so far: ${typed.slice(0, 400)}`, maxTokens: 200, signal });
  const out = (json as { ideas?: unknown })?.ideas;
  return Array.isArray(out) ? out.filter((x): x is string => typeof x === 'string' && x.trim().length > 0 && x.length <= 60 && !/\d/.test(x)).slice(0, 6) : [];
}

// ---------- 3. Compose → gates → one repair ----------

/** Never trust the client session blindly: rebuild it from valid values only. */
export async function sanitizeSession(raw: unknown, lookup: BlueprintLookup): Promise<{ session: Session; bp: Blueprint } | { error: EngineError }> {
  if (!raw || typeof raw !== 'object') return { error: 'invalid_session' };
  const s = raw as Session;
  const bp = typeof s.blueprintId === 'string' ? await lookup(s.blueprintId) : undefined;
  if (!bp) return { error: 'unknown_blueprint' };
  if (s.blueprintVersion !== bp.version) return { error: 'version_mismatch' };
  if (s.phase !== 'confirmed') return { error: 'not_confirmed' };
  if (s.lang !== 'ar' && s.lang !== 'en') return { error: 'invalid_session' };
  if (!s.values || typeof s.values !== 'object') return { error: 'invalid_session' };
  const values: Record<string, SlotValue> = {};
  for (const slot of bp.slots) {
    const v = (s.values as Record<string, SlotValue>)[slot.id];
    if (!v) continue;
    const value = v.value === NONE ? NONE : validValue(slot, v.value);
    if (value === null) return { error: 'invalid_session' };
    values[slot.id] = { value, source: v.source === 'default' ? 'default' : v.source === 'extracted' ? 'extracted' : 'user' };
  }
  if (bp.slots.some(slot => slot.importance === 'critical' && !values[slot.id])) return { error: 'invalid_session' };
  const idea = typeof s.idea === 'string' ? s.idea.slice(0, 4000) : '';
  const references = Array.isArray(s.references) ? s.references.filter((r): r is string => typeof r === 'string' && r.trim().length > 0).slice(0, 3).map(r => r.slice(0, 1500)) : [];
  return { bp, session: { id: String(s.id ?? '').slice(0, 64), blueprintId: bp.id, blueprintVersion: bp.version, lang: s.lang, phase: 'confirmed', idea, values, ...(references.length ? { references } : {}), asked: [], revision: Number(s.revision) || 0 } };
}

export interface ComposeResult { output: unknown; report: GateReport; attempts: number; model: string }

export async function compose(model: JsonModel, bp: Blueprint, session: Session, signal?: AbortSignal): Promise<ComposeResult> {
  const request = buildComposeRequest(bp, session);
  const user = JSON.stringify({ brief: request.brief, tools: request.tools.map(t => t.id) });
  let { json, modelId } = await model.complete({ system: request.system, user, maxTokens: 8000, signal });
  let report = runGates(bp, session, json);
  let attempts = 1;
  const fix = repairInstruction(report);
  if (fix) {
    const repaired = await model.complete({ system: request.system, user: `${user}\n\nYour previous answer:\n${JSON.stringify(json).slice(0, 12000)}\n\n${fix}`, maxTokens: 8000, signal });
    modelId = repaired.modelId ?? modelId;
    const second = runGates(bp, session, repaired.json);
    attempts = 2;
    // Keep whichever attempt passes more checks; report honestly either way.
    if (second.passed >= report.passed) { json = repaired.json; report = second; }
  }
  return { output: json, report, attempts, model: modelId ?? model.id };
}

// ---------- 4. Next move: follow the user through the external AI, step by step ----------

export interface NextMoveInput { sent: string; reply: string; note: string; done: string[] }
export interface NextMove { done: string[]; received: string; issues: string[]; next: string; message: string; finished: boolean; model: string }

/**
 * The user ran our prompt (or our last follow-up) in their AI tool and pasted back what it said.
 * We read it against the confirmed brief, keep a running list of what is finished, and write the
 * one message to paste into the same chat so the tool executes the next step instead of talking
 * about it. The brief stays the source of truth: nothing in the reply may override it.
 */
export async function nextMove(model: JsonModel, bp: Blueprint, session: Session, input: NextMoveInput, signal?: AbortSignal): Promise<NextMove> {
  const { brief } = buildComposeRequest(bp, session);
  const lang = session.lang === 'ar' ? 'Egyptian Arabic' : 'English';
  const brand = typeof session.values.brandName?.value === 'string' && session.values.brandName.value !== NONE ? session.values.brandName.value : '';
  const system = [
    `ROLE: ${bp.role} You now guide the user through running this mission in an external AI chat, one step at a time, until the deliverable is finished.`,
    'You receive: the confirmed brief (source of truth), the last message the user sent to the tool, the tool reply, an optional note from the user, and the steps already done.',
    'Strategy for this mission (keep every rule):',
    ...(['understanding', 'intelligence', 'control'] as const).flatMap(l => bp.strategy[l].map(r => `- ${r}`)),
    'Read the reply against the brief:',
    '- done: the full cumulative list of finished steps (previous done + what this reply really delivered), each 2–8 words.',
    '- received: one sentence on what the tool actually delivered.',
    '- issues: concrete problems only — it described or planned instead of producing; it stopped to ask permission ("ready for the next part?"); it changed a verbatim name or text; it invented numbers, prices, claims or names; it contradicted the brief or an earlier step. [] when none.',
    '- next: the next step in 2–8 words (the next part the tool itself announced, if it fits the brief).',
    '- message: the exact message to paste into the same chat, in the language of the last message sent. It (1) locks what is approved in one line, naming the concrete decisions so later steps stay consistent; (2) applies the user note first if there is one, and fixes each issue explicitly; (3) orders the next step to be delivered now, complete and final, with no questions, no "shall I continue", no description of what it will do. If the tool only described something it can produce (an image, a logo, copy, a table, code), tell it to produce it now; if it cannot, ask it for the ready-to-use prompt for an image tool instead. If several parts remain, ask for all remaining parts in this one reply unless they are too long, then the next part only.',
    '- finished: true when every part of the deliverable exists; then message asks for one final consolidated version of everything approved, clean and ready to use.',
    'Never invent facts, numbers or names that are not in the brief or the reply. Verbatim values are copied character for character.',
    `done, received, issues and next in ${lang}. Return JSON only: {"done":[],"received":"","issues":[],"next":"","message":"","finished":false}`,
  ].join('\n');
  const user = JSON.stringify({ brief, stepsDone: input.done, lastSent: input.sent, toolReply: input.reply, userNote: input.note || undefined });
  const valid = (j: unknown): j is Omit<NextMove, 'model'> => {
    const o = j as Record<string, unknown>;
    return !!o && typeof o === 'object' && Array.isArray(o.done) && typeof o.message === 'string' && o.message.trim().length > 20
      && typeof o.next === 'string' && typeof o.received === 'string' && Array.isArray(o.issues);
  };
  const problems = (j: Omit<NextMove, 'model'>) => brand ? nearMisses(j.message, brand) : [];
  let { json, modelId } = await model.complete({ system, user, maxTokens: 3000, signal });
  if (!valid(json) || problems(json).length) {
    const why = !valid(json) ? 'Return every field of the JSON shape.' : `Write the brand exactly as "${brand}", not ${problems(json as Omit<NextMove, 'model'>).join(', ')}.`;
    const again = await model.complete({ system, user: `${user}\n\nYour previous answer:\n${JSON.stringify(json).slice(0, 6000)}\n\nFix: ${why}`, maxTokens: 3000, signal });
    json = again.json; modelId = again.modelId ?? modelId;
  }
  if (!valid(json)) throw new ModelError('model_bad_output');
  const list = (v: unknown[]) => v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map(x => x.trim().slice(0, 200)).slice(0, 20);
  return {
    done: list(json.done), received: String(json.received).slice(0, 400), issues: list(json.issues).slice(0, 6),
    next: String(json.next).slice(0, 120), message: json.message.trim().slice(0, 6000), finished: json.finished === true,
    model: modelId ?? model.id,
  };
}
