import type { Blueprint, GateReport, Session } from './types.ts';
import { NONE } from './planner.ts';
import { compileSystemPrompt } from './layers.ts';

export interface ComposeRequest {
  blueprintId: string;
  blueprintVersion: number;
  language: Session['lang'];
  system: string;
  brief: { idea: string; references?: string[]; details?: { q: string; a: string }[]; values: Record<string, { value: string | string[]; label?: string | string[]; asked?: string; verbatim: boolean; assumed: boolean }> };
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
      asked: v.source === 'default' ? undefined : slot.question.en,
      verbatim: slot.kind === 'exact',
      assumed: v.source === 'default',
    };
  }
  const system = compileSystemPrompt(blueprint, session);
  return { blueprintId: blueprint.id, blueprintVersion: blueprint.version, language: session.lang, system, brief: { idea: session.idea ?? '', ...(session.references?.length ? { references: session.references } : {}), ...(session.notes?.length ? { details: session.notes } : {}), values }, contract: blueprint.output.fields, tools: blueprint.tools };
}

/** One targeted repair instruction from failed gates (the server retries once). */
export function repairInstruction(report: GateReport): string | null {
  const failed = report.results.filter(r => !r.ok);
  if (!failed.length) return null;
  return 'Fix only these problems and return the full JSON again:\n' + failed.map(r => `- ${r.id}: ${r.detail ?? r.message}`).join('\n');
}
