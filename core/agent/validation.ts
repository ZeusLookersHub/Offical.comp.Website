import { isProjectEngineId } from '../projects/engines';
import { validateProject } from '../projects/validation';
import { evaluateQuestions, getQuestionSchema } from '../question-engine';
import { AGENT_TOOL_IDS, type AgentRequest } from './types';

export const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' &&
  !Array.isArray(v) && [Object.prototype, null].includes(Object.getPrototypeOf(v));
export const exact = (v: unknown, required: readonly string[], optional: readonly string[] = []): v is Record<string, unknown> =>
  record(v) && required.every(k => Object.hasOwn(v, k)) && Object.keys(v).every(k => [...required, ...optional].includes(k));
export const text = (v: unknown, max = 1000): v is string => typeof v === 'string' && !!v.trim() && v.length <= max;
export const toolId = (v: unknown): v is typeof AGENT_TOOL_IDS[number] => typeof v === 'string' && AGENT_TOOL_IDS.includes(v as never);
export const confidence = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
export function dataOnly(value: unknown): boolean {
  let nodes = 0, characters = 0;
  const seen = new Set<object>();
  function walk(v: unknown, depth: number): boolean {
    if (++nodes > 20000 || depth > 32) return false;
    if (typeof v === 'string') { characters += v.length; return characters <= 2000000; }
    if (v === null || typeof v === 'boolean' || v === undefined) return true;
    if (typeof v === 'number') return Number.isFinite(v);
    if ((!Array.isArray(v) && !record(v)) || seen.has(v as object)) return false;
    seen.add(v as object);
    const descriptors = Object.getOwnPropertyDescriptors(v);
    const valid = Object.getOwnPropertySymbols(v).length === 0 && Object.entries(descriptors).every(([k, d]) =>
      !['__proto__', 'constructor', 'prototype'].includes(k) && 'value' in d && walk(d.value, depth + 1));
    seen.delete(v as object);
    return valid;
  }
  try { return walk(value, 0); } catch { return false; }
}
/** Stable equality for validated data; key order does not change identity or loop detection. */
export function stable(v: unknown): string {
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
  if (record(v)) return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
  return JSON.stringify(v);
}
export const equal = (a: unknown, b: unknown) => dataOnly(a) && dataOnly(b) && stable(a) === stable(b);
export function validBrain(v: unknown): boolean {
  if (!exact(v, ['intent', 'engineId', 'confidence', 'status', 'reasons', 'knownFields', 'ambiguousFields', 'source', 'candidates'], ['errorCode'])) return false;
  return text(v.intent) && confidence(v.confidence) &&
    (v.status === 'resolved' ? isProjectEngineId(v.engineId) : v.status === 'needs_clarification' && v.engineId === null) &&
    ['explicit_output', 'deterministic', 'existing_project', 'ai', 'none'].includes(String(v.source)) &&
    record(v.knownFields) && [v.reasons, v.ambiguousFields].every(a => Array.isArray(a) && a.every(x => typeof x === 'string')) &&
    Array.isArray(v.candidates) && v.candidates.every(isProjectEngineId) &&
    (v.errorCode === undefined || ['provider_unavailable', 'provider_rate_limited', 'provider_timeout', 'invalid_ai_response'].includes(String(v.errorCode)));
}
export function validateRequest(raw: unknown): 'invalid_request' | 'invalid_brain_decision' | 'invalid_question_state' | null {
  if (!dataOnly(raw) || !exact(raw, ['project'], ['brainDecision', 'questionSession', 'referenceEvidence', 'questionState', 'operations']) ||
    !validateProject(raw.project).valid) return 'invalid_request';
  const r = raw as unknown as AgentRequest;
  if (r.brainDecision !== undefined && !validBrain(r.brainDecision)) return 'invalid_brain_decision';
  if (r.questionSession !== undefined) {
    const s = r.questionSession;
    if (!exact(s, ['projectId', 'engineId', 'fields']) || s.projectId !== r.project.id || s.engineId !== r.project.engineId || !record(s.fields)) return 'invalid_question_state';
    const fields = getQuestionSchema(r.project.engineId).definitions.map(d => d.field);
    if (!Object.entries(s.fields).every(([key, e]) => fields.includes(key as never) && exact(e, ['source', 'value'], ['confirmed']) &&
      ['user', 'inference'].includes(String(e.source)) && (typeof e.value === 'string' || Array.isArray(e.value) && e.value.every(x => typeof x === 'string')) &&
      (e.confirmed === undefined || typeof e.confirmed === 'boolean'))) return 'invalid_question_state';
  }
  if (r.referenceEvidence !== undefined && (!Array.isArray(r.referenceEvidence) || !r.referenceEvidence.every(e =>
    exact(e, ['field', 'referenceId', 'value', 'excerpt', 'trusted']) && text(e.field) && text(e.referenceId) &&
    text(e.value, 100000) && text(e.excerpt, 100000) && typeof e.trusted === 'boolean'))) return 'invalid_question_state';
  if (r.operations !== undefined && (!Array.isArray(r.operations) || r.operations.length > 32 ||
    !r.operations.every(o => exact(o, ['toolId', 'input']) && typeof o.toolId === 'string' && record(o.input)))) return 'invalid_request';
  const actual = evaluateQuestions({ project: r.project, session: r.questionSession, evidence: r.referenceEvidence });
  if (actual.status === 'invalid' || r.questionState !== undefined && !equal(actual, r.questionState)) return 'invalid_question_state';
  return null;
}
