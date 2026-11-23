// Server imports core modules directly (not index.ts) so the UI copy of the blueprints is not bundled.
import type { Blueprint, Candidate, GateReport, Lang, Session, SlotValue, SlotValueRaw } from '../../core/mission-engine/types.ts';
import type { TurnResult, TurnIntent, SmartOptions, DeepQuestion } from '../../core/mission-engine/converse.ts';
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
  const notes = Array.isArray(s.notes) ? s.notes.filter((n): n is { q: string; a: string } => !!n && typeof n.q === 'string' && typeof n.a === 'string' && n.a.trim().length > 0).slice(0, 8).map(n => ({ q: n.q.slice(0, 240), a: n.a.slice(0, 600) })) : [];
  const references = Array.isArray(s.references) ? s.references.filter((r): r is string => typeof r === 'string' && r.trim().length > 0).slice(0, 3).map(r => r.slice(0, 1500)) : [];
  return { bp, session: { id: String(s.id ?? '').slice(0, 64), blueprintId: bp.id, blueprintVersion: bp.version, lang: s.lang, phase: 'confirmed', idea, values, ...(references.length ? { references } : {}), ...(notes.length ? { notes } : {}), asked: [], revision: Number(s.revision) || 0 } };
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

// ---------- 5. Conversation: understand whatever the user typed ----------


const INTENTS: TurnIntent[] = ['answer', 'confused', 'ask', 'delegate', 'skip', 'offtopic'];
const voice = (lang: Lang) => lang === 'ar'
  ? 'Write every user-facing text in warm, simple Egyptian Arabic (عامية مصرية), like a helpful friend who is an expert. Short sentences, no jargon; if a technical word is needed, explain it in a few words.'
  : 'Write every user-facing text in warm, simple English, like a helpful friend who is an expert. Short sentences, no jargon.';
const strs = (v: unknown, max: number, len = 80) => Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map(x => x.trim().slice(0, len)).slice(0, max) : [];

function describeSlot(bp: Blueprint, slotId: string): string {
  const slot = bp.slots.find(s => s.id === slotId)!;
  const opts = slot.options ? `\nOptions (value: label | what it means):\n${slot.options.map(o => `- ${o.value}: ${o.label.en} / ${o.label.ar}${o.visual ? ` | ${o.visual.description.en}` : ''}`).join('\n')}` : '';
  return `Current question (slot "${slot.id}", kind ${slot.kind}${slot.kind === 'multi' ? ', several allowed' : ''}): ${slot.question.en}\nWhy we ask: ${slot.why.en}\nExample answer: ${slot.example.en}${opts}`;
}

export interface TurnInput { slot: string; text: string; context: string; lang: Lang; probesLeft: number }

/**
 * One typed message while a question is open. The model says what the person meant; every
 * value is then checked against the blueprint here, so a wrong guess can never enter the brief.
 */
export async function turn(model: JsonModel, bp: Blueprint, input: TurnInput, signal?: AbortSignal): Promise<TurnResult> {
  const slot = bp.slots.find(s => s.id === input.slot);
  if (!slot) throw new ModelError('model_bad_output');
  const system = [
    `You are the conversation brain of Lookers AI. You help people, often non-experts, build a "${bp.title.en}" brief by chat, one question at a time, so that the final AI prompt is complete and strong.`,
    describeSlot(bp, slot.id),
    'What we know so far:', input.context || '(nothing yet)',
    'Read the user message (any dialect, typos, Franco-Arabic, English mix) and decide what they meant:',
    '- answer: it answers the question, even loosely. value = for choice slots the option value(s) that match the MEANING (not the words); for text slots their answer cleaned up (fix typos, keep every detail, add nothing). For exact slots copy the text verbatim.',
    '- confused: they do not understand the question. reply = explain it again in very simple words with one concrete example tied to THEIR idea, then re-ask it in a simpler way. chips = 3–4 short ready answers they can tap (for choice slots, the most fitting option labels in their language).',
    '- ask: they ask something (the difference, which is better, what you advise). reply = a short practical answer that recommends one when sensible, then re-asks. chips as above.',
    '- delegate: they hand the choice to you (you choose, I do not know, whatever fits). value = the best answer for their idea; reply = one short line saying what you picked and why.',
    '- skip: they want to skip this question.',
    '- offtopic: unrelated. reply = one kind line that brings them back to the question; chips as above.',
    'others: facts in the message that answer OTHER fields (catalogue below); evidence = exact words copied from the message. [] when none.',
    `probe: only for intent answer on a descriptive (text/longtext) question when the answer is valid but too thin for a strong prompt (one vague word, generic adjectives). One short follow-up that digs for the single most useful missing detail, with 3 concrete chips. null otherwise${input.probesLeft > 0 ? '' : ' (no probes left: always null)'}.`,
    voice(input.lang),
    'Fields catalogue:', slotCatalogue(bp),
    'Return JSON only: {"intent":"answer","value":null,"others":[],"reply":"","chips":[],"probe":null}',
  ].join('\n');
  const { json } = await model.complete({ system, user: input.text.slice(0, 2000), maxTokens: 700, signal });
  const j = (json ?? {}) as Record<string, unknown>;
  let intent = INTENTS.includes(j.intent as TurnIntent) ? j.intent as TurnIntent : 'confused';
  let value: SlotValueRaw | undefined;
  if (intent === 'answer' || intent === 'delegate') {
    const raw = j.value as SlotValueRaw | null | undefined;
    // Exact text must come from the user words themselves.
    let checked = raw === null || raw === undefined ? null : validValue(slot, raw, slot.kind === 'exact' ? input.text : undefined);
    if (checked === null && intent === 'answer' && (slot.kind === 'text' || slot.kind === 'longtext')) checked = input.text.trim().slice(0, slot.maxLength ?? 400);
    if (checked === null) intent = 'confused'; else value = checked;
  }
  const others = (Array.isArray(j.others) ? j.others : []).filter((c): c is { slot: string; value: SlotValueRaw; evidence: string } =>
    !!c && typeof c === 'object' && typeof (c as { slot?: unknown }).slot === 'string' && (c as { slot: string }).slot !== slot.id
    && typeof (c as { evidence?: unknown }).evidence === 'string').slice(0, 8);
  const probeRaw = j.probe as { q?: unknown; chips?: unknown } | null;
  const probe = intent === 'answer' && input.probesLeft > 0 && (slot.kind === 'text' || slot.kind === 'longtext') && probeRaw && typeof probeRaw.q === 'string' && probeRaw.q.trim().length > 5
    ? { q: probeRaw.q.trim().slice(0, 240), chips: strs(probeRaw.chips, 4) } : undefined;
  return {
    intent, ...(value !== undefined ? { value } : {}), others,
    reply: typeof j.reply === 'string' ? j.reply.trim().slice(0, 700) : '',
    chips: strs(j.chips, 4),
    ...(probe ? { probe } : {}),
  };
}

/** Smart options for the question on screen: which choice fits this idea best, and ready answers. */
export async function options(model: JsonModel, bp: Blueprint, input: { slot: string; context: string; lang: Lang }, signal?: AbortSignal): Promise<SmartOptions> {
  const slot = bp.slots.find(s => s.id === input.slot);
  if (!slot || slot.kind === 'exact') return { answers: [] };
  const choice = slot.kind === 'single' || slot.kind === 'multi';
  const system = [
    `You help a user answer one question of a "${bp.title.en}" brief, as a senior specialist who knows their idea.`,
    describeSlot(bp, slot.id),
    'What we know so far:', input.context || '(nothing yet)',
    choice
      ? 'recommend = the single option value that best fits THIS idea (or null if nothing stands out); why = one short line why, tied to their idea. answers = [].'
      : 'answers = 3 complete, concrete answers this person could give, each a different strong direction built on their idea (each 4–14 words, specific details, no invented brand names, prices or numbers). recommend = null.',
    voice(input.lang),
    'Return JSON only: {"recommend":null,"why":"","answers":[]}',
  ].join('\n');
  const { json } = await model.complete({ system, user: 'Suggest.', maxTokens: 400, signal });
  const j = (json ?? {}) as Record<string, unknown>;
  const recommend = choice && typeof j.recommend === 'string' && slot.options?.some(o => o.value === j.recommend) ? j.recommend : undefined;
  return {
    ...(recommend ? { recommend, why: typeof j.why === 'string' ? j.why.trim().slice(0, 200) : '' } : {}),
    answers: choice ? [] : strs(j.answers, 3, 140).filter(a => !/\d/.test(a)),
  };
}

/** "Make it stronger": the questions a senior specialist would still ask before writing. */
export async function deepen(model: JsonModel, bp: Blueprint, input: { context: string; lang: Lang }, signal?: AbortSignal): Promise<DeepQuestion[]> {
  const system = [
    `You are a senior specialist preparing a "${bp.title.en}". The brief below is enough for a basic prompt.`,
    'Ask the 3 questions that would make the final result markedly stronger and more personal — what a top professional would still ask: the feeling or reaction wanted, specific scenes/details/elements, who it is really for, what must be avoided, references, where and how it will be used, what success looks like. Never ask what the brief already answers; never ask for prices, numbers or legal claims.',
    'Each question is short and simple, with why (one line: what it improves) and 3 concrete chips (possible answers, 1–6 words) tailored to their idea.',
    'Brief so far:', input.context || '(nothing yet)',
    voice(input.lang),
    'Return JSON only: {"questions":[{"q":"","why":"","chips":[]}]}',
  ].join('\n');
  const { json } = await model.complete({ system, user: 'Ask.', maxTokens: 700, signal });
  const list = (json as { questions?: unknown })?.questions;
  return (Array.isArray(list) ? list : []).filter((q): q is { q: string; why?: string; chips?: unknown } => !!q && typeof (q as { q?: unknown }).q === 'string' && (q as { q: string }).q.trim().length > 5)
    .slice(0, 3).map(q => ({ q: q.q.trim().slice(0, 240), why: typeof q.why === 'string' ? q.why.trim().slice(0, 160) : undefined, chips: strs(q.chips, 4) }));
}
