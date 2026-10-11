import { validateProject } from '../projects/validation';
import { getQuestionSchema } from './definitions';
import { canInfer, isRecord, validValue, validateQuestionSchema } from './validation';
import type { Condition, Field, FieldValue, QuestionDefinition, QuestionEngineResult, QuestionInput, ResolvedField } from './types';

export const readProjectField = (input: QuestionInput, field: Field): unknown => {
  if (field.startsWith('details.')) return undefined;
  if (field.startsWith('output.')) return input.project.schema.output[field.slice(7) as 'description' | 'format' | 'deliverables'];
  return input.project.schema[field as 'intent' | 'objective' | 'context' | 'audience' | 'constraints' | 'targetTools'];
};
export const inputSchema = (input: QuestionInput) => input.schema === undefined ? getQuestionSchema(input.project.engineId) : input.schema;
export const sessionMatches = (input: QuestionInput) => input.session?.projectId === input.project.id &&
  input.session?.engineId === input.project.engineId && isRecord(input.session.fields);
const emptyResult = (reasons: string[]): QuestionEngineResult => ({
  status: 'invalid', fields: [], knownFields: [], missingFields: [], inferableFields: [], criticalFields: [],
  orderedQuestions: [], progress: { completed: 0, required: 0, percent: 0 }, reasons,
});
const answered = (f: ResolvedField) => f.active && f.value !== undefined && f.state !== 'needs_confirmation';
const normalizeUsage = (v: string) => v.trim().toLowerCase().replace(/\s+/g, ' ')
  .replace(/^(قصة|ستوري) (إنستغرام|انستغرام|إنستجرام|انستجرام)$/, 'instagram story');

/** Pure deterministic evaluation; supplied facts beat defaults and inference. */
export function evaluateQuestions(input: QuestionInput): QuestionEngineResult {
  if (!isRecord(input) || !validateProject(input.project).valid) return emptyResult(['invalid_project']);
  const schema = inputSchema(input);
  const errors = validateQuestionSchema(schema);
  if (errors.length) return emptyResult(errors);
  if (schema.engineId !== input.project.engineId) return emptyResult(['engine_mismatch']);
  const defs = new Map(schema.definitions.map(d => [d.field, d]));
  const resolved = new Map<Field, ResolvedField>();
  const reasons: string[] = [];
  const matches = (conditions?: Condition[]) => !conditions || conditions.every(c => {
    const value = resolve(c.field);
    return answered(value) && (Array.isArray(value.value) ? value.value.includes(c.equals) :
      c.field === 'details.usage' ? normalizeUsage(String(value.value)) === normalizeUsage(c.equals) : value.value === c.equals);
  });
  function resolve(field: Field): ResolvedField {
    if (resolved.has(field)) return resolved.get(field)!;
    const d = defs.get(field)!;
    const active = matches(d.requiredWhen) && matches(d.askWhen);
    const required = active && d.state !== 'optional';
    const result: ResolvedField = {
      field, active, required,
      state: !required ? 'optional' : d.critical ? 'critical' : canInfer(d) ? 'inferable' : 'missing',
      reasons: [!active ? 'condition_not_met' : required ? 'required_information' : 'optional_information'],
    };
    // A user clearing an answer suppresses old canonical/default values until a new answer is supplied.
    const entry = sessionMatches(input) ? input.session!.fields[field] : undefined;
    if (active && isRecord(entry) && entry.source === 'user') {
      if (validValue(d, entry.value)) Object.assign(result, { value: structuredClone(entry.value), source: 'user', state: 'answered' });
      else result.reasons.push('user_answer_missing_or_invalid');
    } else if (active) {
      const projectValue = readProjectField(input, field);
      if (validValue(d, projectValue)) Object.assign(result, { value: structuredClone(projectValue), source: 'project', state: 'known' });
      else {
        const evidence = (Array.isArray(input.evidence) ? input.evidence : []).filter(e => {
          if (!isRecord(e) || e.field !== field || e.trusted !== true || typeof e.excerpt !== 'string' ||
            !e.excerpt.trim() || typeof e.value !== 'string' || !e.value.trim() || !validValue(d, e.value)) return false;
          const ref = input.project.schema.references.find(r => r.id === e.referenceId && r.included);
          return !!ref?.text?.includes(e.excerpt) && e.excerpt.includes(e.value);
        });
        const values = [...new Set(evidence.map(e => e.value))];
        if (values.length === 1) Object.assign(result, { value: values[0], source: 'reference', state: 'known' });
        else if (values.length > 1) {
          result.state = 'needs_confirmation'; result.reasons.push('conflicting_reference_evidence');
        } else if (isRecord(entry) && entry.source === 'inference' && canInfer(d) && validValue(d, entry.value)) {
          // Inferences always need an explicit user answer; callers cannot self-confirm them.
          Object.assign(result, { value: structuredClone(entry.value), source: 'inference', state: 'needs_confirmation' });
        } else if (d.defaultRule && matches(d.defaultRule.when)) {
          Object.assign(result, { value: structuredClone(d.defaultRule.value), source: 'default', state: 'known' });
        }
      }
    }
    resolved.set(field, result);
    return result;
  }
  const fields = schema.definitions.map(d => resolve(d.field));
  // Promote prerequisites of active required fields, including optional prerequisites.
  function requireDependencies(d: QuestionDefinition, seen = new Set<Field>()): void {
    if (seen.has(d.field)) return;
    seen.add(d.field);
    for (const field of d.dependencies || []) {
      const dep = resolved.get(field)!;
      if (!dep.active) { reasons.push('inactive_required_dependency'); continue; }
      dep.required = true;
      if (dep.state === 'optional') dep.state = defs.get(field)!.critical ? 'critical' : canInfer(defs.get(field)!) ? 'inferable' : 'missing';
      requireDependencies(defs.get(field)!, seen);
    }
  }
  for (const d of schema.definitions) if (resolved.get(d.field)!.required) requireDependencies(d);
  if (reasons.includes('inactive_required_dependency')) return { ...emptyResult(reasons), fields };
  const unlocks = (field: Field) => schema.definitions.filter(d =>
    [...(d.dependencies || []), ...(d.requiredWhen || []).map(c => c.field), ...(d.askWhen || []).map(c => c.field)].includes(field)).length;
  const orderedQuestions = schema.definitions.filter(d => {
    const f = resolved.get(d.field)!;
    return f.active && (d.dependencies || []).every(dep => answered(resolved.get(dep)!)) && !answered(f);
  }).sort((a, b) => {
    const x = resolved.get(a.field)!, y = resolved.get(b.field)!;
    return Number(y.required) - Number(x.required) || Number(b.critical) - Number(a.critical) ||
      b.priority - a.priority || unlocks(b.field) - unlocks(a.field) || a.id.localeCompare(b.id);
  });
  const required = fields.filter(f => f.required);
  const missing = required.filter(f => !answered(f));
  const next = orderedQuestions.find(d => resolved.get(d.field)!.required);
  if (missing.length && !next) return { ...emptyResult([...reasons, 'blocked_dependencies']), fields };
  const completed = required.length - missing.length;
  return {
    status: next ? resolved.get(next.field)!.state === 'needs_confirmation' ? 'needs_confirmation' : 'needs_question' : 'complete',
    question: next, label: next?.label[input.project.schema.language], fields,
    knownFields: fields.filter(answered).map(f => f.field), missingFields: missing.map(f => f.field),
    inferableFields: fields.filter(f => f.active && !answered(f) && canInfer(defs.get(f.field)!)).map(f => f.field),
    criticalFields: fields.filter(f => f.required && !answered(f) && defs.get(f.field)!.critical).map(f => f.field),
    orderedQuestions, progress: { completed, required: required.length, percent: required.length ? Math.round(completed / required.length * 100) : 100 },
    reasons: [...reasons, next ? 'highest_value_unresolved_field' : 'required_information_complete'],
  };
}
