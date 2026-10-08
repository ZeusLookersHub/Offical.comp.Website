import { evaluateQuestions, inputSchema, sessionMatches } from './engine';
import { canInfer, isRecord, validValue } from './validation';
import type { Field, FieldValue, QuestionInferencePort, QuestionInput, QuestionSession } from './types';

/** Optional, single-attempt boundary. No provider adapter is installed in Stage 03. */
export async function inferQuestion(input: QuestionInput, port?: QuestionInferencePort, timeoutMs = 3000) {
  const result = evaluateQuestions(input);
  const d = result.question;
  const fallback = (reason: string) => ({ result: { ...result, reasons: [...result.reasons, reason] }, session: input.session });
  if (!d || !canInfer(d) || result.status === 'needs_confirmation') return fallback('no_safe_inference');
  if (!port) return fallback('inference_unavailable');
  const revision = JSON.stringify(input);
  const safeKnown: Partial<Record<Field, FieldValue>> = {};
  for (const field of result.fields) {
    const definition = inputSchema(input).definitions.find(q => q.field === field.field)!;
    if (canInfer(definition) && result.knownFields.includes(field.field) && field.value !== undefined)
      safeKnown[field.field] = structuredClone(field.value);
  }
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const limit = Number.isFinite(timeoutMs) ? Math.max(1, Math.min(timeoutMs, 30000)) : 3000;
    const response = await Promise.race([
      Promise.resolve().then(() => port.infer({
        engineId: input.project.engineId, field: d.field, label: d.label[input.project.schema.language],
        language: input.project.schema.language, knownFields: safeKnown, signal: controller.signal,
      })),
      new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('timeout')); }, limit); }),
    ]);
    if (JSON.stringify(input) !== revision) {
      const latest = evaluateQuestions(input);
      return { result: { ...latest, reasons: [...latest.reasons, 'inference_context_changed'] }, session: input.session };
    }
    if (!isRecord(response) || response.field !== d.field || !validValue(d, response.value) ||
      typeof response.confidence !== 'number' || !Number.isFinite(response.confidence) ||
      response.confidence < 0.7 || response.confidence > 1 ||
      Object.keys(response).some(k => !['field', 'value', 'confidence'].includes(k))) return fallback('invalid_inference');
    const session: QuestionSession = sessionMatches(input) ? structuredClone(input.session!) : {
      projectId: input.project.id, engineId: input.project.engineId, fields: {},
    };
    session.fields[d.field] = { value: structuredClone(response.value), source: 'inference', confirmed: false };
    return { result: evaluateQuestions({ ...input, session }), session };
  } catch {
    return fallback(controller.signal.aborted ? 'inference_timeout' : 'inference_unavailable');
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    controller.abort();
  }
}
