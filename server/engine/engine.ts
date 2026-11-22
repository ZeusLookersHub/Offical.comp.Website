// Server imports core modules directly (not index.ts) so the UI copy of the blueprints is not bundled.
import type { Blueprint, Candidate, GateReport, Lang, Session, SlotValue } from '../../core/mission-engine/types.ts';
import { applyCandidates, validValue } from '../../core/mission-engine/intake.ts';
import { buildComposeRequest, repairInstruction } from '../../core/mission-engine/compose.ts';
import { runGates } from '../../core/mission-engine/gates.ts';
import { LAYERS } from '../../core/mission-engine/layers.ts';
import { NONE } from '../../core/mission-engine/planner.ts';

export type BlueprintLookup = (id: string) => Blueprint | undefined | Promise<Blueprint | undefined>;
import type { JsonModel } from './model.ts';

export type EngineError = 'unknown_blueprint' | 'version_mismatch' | 'invalid_session' | 'not_confirmed' | 'invalid_request';

// ---------- 1. Smart intake: the model proposes, evidence decides ----------

function slotCatalogue(bp: Blueprint): string {
  return bp.slots.map(s => {
    const opts = s.options ? ` options=[${s.options.map(o => `${o.value} (${o.label.en})`).join(', ')}]` : '';
    const kind = s.kind === 'exact' ? 'exact (copy verbatim from the text, keep case)' : s.kind;
    return `- ${s.id}: ${kind}; ${LAYERS[s.layer].name.en}; ${s.question.en}${opts}`;
  }).join('\n');
}

export async function extract(model: JsonModel, bp: Blueprint, text: string, signal?: AbortSignal): Promise<Candidate[]> {
  const system = [
    `You extract facts for a "${bp.title.en}" brief from the user's message. Arabic or English.`,
    'Return JSON: {"candidates":[{"slot":"<id>","value":"<value or option id or array of option ids>","evidence":"<exact words copied from the message>"}]}',
    'Only include a slot when the message clearly states it. evidence must be a verbatim span of the message. Never guess, never infer brand names, never translate exact values.',
    'Slots:', slotCatalogue(bp),
  ].join('\n');
  const { json } = await model.complete({ system, user: text, maxTokens: 800, signal });
  const list = (json as { candidates?: unknown })?.candidates;
  if (!Array.isArray(list)) return [];
  return list.filter((c): c is Candidate => !!c && typeof c === 'object'
    && typeof (c as Candidate).slot === 'string' && typeof (c as Candidate).evidence === 'string'
    && (typeof (c as Candidate).value === 'string' || Array.isArray((c as Candidate).value)))
    .slice(0, 20)
    // Pre-filter here too; the client applies the same rule again with applyCandidates.
    .filter(c => applyCandidates({ id: 'x', blueprintId: bp.id, blueprintVersion: bp.version, lang: 'en', phase: 'questions', values: {}, asked: [], revision: 0 }, bp, text, [c]).values[c.slot]);
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
  return { bp, session: { id: String(s.id ?? '').slice(0, 64), blueprintId: bp.id, blueprintVersion: bp.version, lang: s.lang, phase: 'confirmed', idea, values, asked: [], revision: Number(s.revision) || 0 } };
}

export interface ComposeResult { output: unknown; report: GateReport; attempts: number; model: string }

export async function compose(model: JsonModel, bp: Blueprint, session: Session, signal?: AbortSignal): Promise<ComposeResult> {
  const request = buildComposeRequest(bp, session);
  const user = JSON.stringify({ brief: request.brief, tools: request.tools.map(t => t.id) });
  let { json, modelId } = await model.complete({ system: request.system, user, maxTokens: 4000, signal });
  let report = runGates(bp, session, json);
  let attempts = 1;
  const fix = repairInstruction(report);
  if (fix) {
    const repaired = await model.complete({ system: request.system, user: `${user}\n\nYour previous answer:\n${JSON.stringify(json).slice(0, 12000)}\n\n${fix}`, maxTokens: 4000, signal });
    modelId = repaired.modelId ?? modelId;
    const second = runGates(bp, session, repaired.json);
    attempts = 2;
    // Keep whichever attempt passes more checks; report honestly either way.
    if (second.passed >= report.passed) { json = repaired.json; report = second; }
  }
  return { output: json, report, attempts, model: modelId ?? model.id };
}
