import { isProjectEngineId } from '../projects/engines';
import type { Field, FieldValue, QuestionDefinition, QuestionSchema } from './types';

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string' && !!v.trim();
const localized = (v: unknown): boolean => isRecord(v) && text(v.en) && text(v.ar);
const fields = new Set(['intent', 'objective', 'context', 'audience', 'constraints',
  'output.description', 'output.format', 'output.deliverables', 'targetTools']);
export const isField = (v: unknown): v is Field => typeof v === 'string' &&
  (fields.has(v) || /^details\.[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(v)) &&
  !['details.__proto__', 'details.constructor', 'details.prototype'].includes(v);
export const validValue = (d: QuestionDefinition, v: unknown): v is FieldValue => {
  if (d.type === 'multi') return Array.isArray(v) && v.length > 0 &&
    v.every(text) && new Set(v).size === v.length &&
    (!d.options || v.every(item => d.options.some(o => o.value === item)));
  return text(v) && (d.type !== 'single' || !!d.options?.some(o => o.value === v));
};
export const canInfer = (d: QuestionDefinition): boolean => d.inferable && !d.critical && d.nature !== 'factual';

/** Reject the whole schema on incompatibility: never silently report completion. */
export function validateQuestionSchema(raw: unknown): string[] {
  if (!isRecord(raw) || !isProjectEngineId(raw.engineId) || !Array.isArray(raw.definitions) || !raw.definitions.length)
    return ['invalid_schema'];
  const errors: string[] = [];
  const ids = new Set<string>();
  const byField = new Map<string, QuestionDefinition>();
  for (const d of raw.definitions) {
    if (!isRecord(d) || !text(d.id) || !isField(d.field) || !localized(d.label) ||
      !['text', 'textarea', 'single', 'multi'].includes(String(d.type)) ||
      !['required', 'conditional', 'optional'].includes(String(d.state)) ||
      !['factual', 'creative', 'technical'].includes(String(d.nature)) ||
      typeof d.critical !== 'boolean' || typeof d.inferable !== 'boolean' || d.userOverride !== true ||
      !Number.isFinite(d.priority) || (d.priority as number) < 0 || (d.priority as number) > 100) {
      errors.push('invalid_definition'); continue;
    }
    if (ids.has(d.id) || byField.has(d.field)) errors.push('duplicate_definition');
    ids.add(d.id);
    byField.set(d.field, d as unknown as QuestionDefinition);
    if (d.inferable && (d.nature === 'factual' || d.critical)) errors.push('unsafe_inference_definition');
    if (d.examples !== undefined && !localized(d.examples)) errors.push('invalid_examples');
    if (d.options !== undefined && (!Array.isArray(d.options) || !d.options.length ||
      !d.options.every(o => isRecord(o) && text(o.value) && localized(o.label)) ||
      new Set(d.options.map(o => o.value)).size !== d.options.length)) errors.push('invalid_options');
    if (d.type === 'single' && !d.options) errors.push('missing_options');
    const arrayField = ['constraints', 'output.deliverables', 'targetTools'].includes(d.field);
    if (!d.field.startsWith('details.') && arrayField !== (d.type === 'multi')) errors.push('incompatible_field_type');
    if (d.state === 'conditional' && (!Array.isArray(d.requiredWhen) || !d.requiredWhen.length)) errors.push('missing_condition');
    if (d.state !== 'conditional' && d.requiredWhen !== undefined) errors.push('incompatible_condition');
    if (d.state !== 'optional' && d.askWhen !== undefined) errors.push('required_question_cannot_be_hidden');
  }
  if (errors.length) return errors;
  const schema = raw as unknown as QuestionSchema;
  const edges = new Map<string, string[]>();
  for (const d of schema.definitions) {
    const refs: string[] = [];
    if (d.dependencies !== undefined) {
      if (!Array.isArray(d.dependencies) || !d.dependencies.every(isField)) errors.push('invalid_dependencies');
      else refs.push(...d.dependencies);
    }
    const conditions = [d.requiredWhen, d.askWhen];
    if (d.defaultRule !== undefined) {
      if (!isRecord(d.defaultRule) || !Array.isArray(d.defaultRule.when) || !d.defaultRule.when.length ||
        !canInfer(d) || !validValue(d, d.defaultRule.value)) errors.push('unsafe_default');
      else conditions.push(d.defaultRule.when);
    }
    for (const list of conditions) {
      if (list === undefined) continue;
      if (!Array.isArray(list) || !list.length || !list.every(c => isRecord(c) && isField(c.field) && text(c.equals))) {
        errors.push('invalid_condition'); continue;
      }
      refs.push(...list.map(c => c.field));
      for (const c of list) {
        const dependency = byField.get(c.field);
        if (dependency?.type === 'single' && !dependency.options?.some(o => o.value === c.equals)) errors.push('invalid_condition_value');
      }
    }
    if (refs.some(f => !byField.has(f))) errors.push('unknown_dependency');
    edges.set(d.field, refs);
  }
  const visiting = new Set<string>(), visited = new Set<string>();
  function visit(field: string): void {
    if (visiting.has(field)) { errors.push('cyclic_dependency'); return; }
    if (visited.has(field)) return;
    visiting.add(field);
    for (const dep of edges.get(field) || []) visit(dep);
    visiting.delete(field); visited.add(field);
  }
  for (const field of edges.keys()) visit(field);
  return [...new Set(errors)];
}
