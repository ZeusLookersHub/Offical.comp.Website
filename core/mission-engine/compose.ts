import type { Blueprint, GateReport, Session } from './types.ts';
import { NONE } from './planner.ts';

const GLOBAL_RULES = [
  'Return one JSON object that matches the contract exactly. No markdown, no extra keys.',
  'Use only the facts in the brief. Never invent names, prices, claims, statistics or text.',
  'Values marked verbatim must be copied character for character, including letter case. Never translate, respell or shorten them.',
  'Assumptions are defaults the user accepted; follow them but do not mention them as facts.',
  'Execution metadata (target tool, aspect ratio, model settings) belongs in params/variants, never inside the scene description.',
];

export interface ComposeRequest {
  blueprintId: string;
  blueprintVersion: number;
  language: Session['lang'];
  system: string;
  brief: { idea: string; values: Record<string, { value: string | string[]; label?: string | string[]; verbatim: boolean; assumed: boolean }> };
  contract: Blueprint['output']['fields'];
  tools: Blueprint['tools'];
}

/** Bridge to the server composer. Only a confirmed brief can be composed. */
export function buildComposeRequest(blueprint: Blueprint, session: Session): ComposeRequest {
  if (session.phase !== 'confirmed') throw new Error('brief_not_confirmed');
  const values: ComposeRequest['brief']['values'] = {};
  for (const [id, v] of Object.entries(session.values)) {
    if (v.value === NONE) continue;
    const slot = blueprint.slots.find(s => s.id === id);
    if (!slot) continue;
    const labelOf = (x: string) => slot.options?.find(o => o.value === x)?.label.en ?? x;
    values[id] = {
      value: v.value,
      label: slot.options ? (Array.isArray(v.value) ? v.value.map(labelOf) : labelOf(v.value)) : undefined,
      verbatim: slot.kind === 'exact',
      assumed: v.source === 'default',
    };
  }
  const empty = blueprint.slots.filter(s => session.values[s.id]?.value === NONE).map(s => s.id);
  const system = [
    ...GLOBAL_RULES,
    ...blueprint.composeRules,
    empty.length ? `These were deliberately left empty, do not fill them: ${empty.join(', ')}.` : '',
  ].filter(Boolean).map((rule, i) => `${i + 1}. ${rule}`).join('\n');
  return { blueprintId: blueprint.id, blueprintVersion: blueprint.version, language: session.lang, system, brief: { idea: session.idea ?? '', values }, contract: blueprint.output.fields, tools: blueprint.tools };
}

/** One targeted repair instruction from failed gates (the server retries once). */
export function repairInstruction(report: GateReport): string | null {
  const failed = report.results.filter(r => !r.ok);
  if (!failed.length) return null;
  return 'Fix only these problems and return the full JSON again:\n' + failed.map(r => `- ${r.id}: ${r.detail ?? r.message}`).join('\n');
}
