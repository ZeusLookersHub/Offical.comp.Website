import { evaluateQuestions } from '../question-engine';
import { AgentToolRegistry } from './registry';
import { reasonNext } from './reasoning';
import { exact, stable, text, validateRequest } from './validation';
import type { AgentDecision, AgentErrorCode, AgentOptions, AgentRequest, AgentResult, ToolInvocation } from './types';

/** A bounded coordinator, not a content generator. Each run owns an immutable input snapshot. */
export class Agent {
  private readonly options: AgentOptions;
  constructor(options: AgentOptions, private readonly registry = new AgentToolRegistry()) {
    this.options = { ...options, access: options?.access && structuredClone(options.access) };
  }
  async run(raw: AgentRequest, signal?: AbortSignal): Promise<AgentResult> {
    const result: AgentResult = { decision: { action: 'error', reason: 'invalid_request', confidence: 0 }, steps: 0, trace: [], warnings: [] };
    const fail = (error: AgentErrorCode) => {
      result.error = error;
      result.decision = { action: 'error', reason: error, confidence: 0 };
      return result;
    };
    try {
      const { access, reasoner, persistence } = this.options;
      const maxSteps = this.options.maxSteps ?? 6, timeoutMs = this.options.timeoutMs ?? 1000;
      if (!Number.isInteger(maxSteps) || maxSteps < 1 || maxSteps > 16 || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 10000 ||
        !exact(access, ['projectId'], ['canSave', 'ownerId']) || !text(access.projectId) ||
        access.canSave !== undefined && typeof access.canSave !== 'boolean' || access.ownerId !== undefined && !text(access.ownerId)) return fail('invalid_options');
      const invalid = validateRequest(raw);
      if (invalid) return fail(invalid);
      if (raw.project.id !== access.projectId) return fail('unauthorized');
      if (signal?.aborted) return fail('aborted');
      const request = structuredClone(raw);
      result.project = request.project;
      const questionState = evaluateQuestions({ project: request.project, session: request.questionSession, evidence: request.referenceEvidence });
      result.questionState = questionState;
      const finish = (decision: AgentDecision) => { result.decision = decision; return result; };
      const brain = request.brainDecision;
      if (brain?.status === 'needs_clarification') return finish({ action: 'needs_confirmation', reason: 'brain_clarification_required', confidence: 1 });
      if (brain && brain.engineId !== request.project.engineId) return finish({ action: 'needs_confirmation', reason: 'engine_override_conflict', confidence: 1 });
      if (questionState.status === 'needs_question' || questionState.status === 'needs_confirmation') return finish({
        action: questionState.status === 'needs_question' ? 'ask_question' : 'needs_confirmation',
        questionId: questionState.question!.id, reason: 'question_engine_requires_input', confidence: 1,
      });
      const operations = request.operations || [];
      const executed = new Set<string>();
      let index = 0;
      while (result.steps < maxSteps) {
        if (signal?.aborted) return fail('aborted');
        let call: ToolInvocation | undefined = operations[index];
        let certainty = 1;
        if (!call) {
          if (!reasoner) return finish({ action: 'complete', reason: 'ready_for_next_stage', confidence: 1 });
          const response = await reasonNext(reasoner, {
            engineId: request.project.engineId, language: request.project.schema.language, questionStatus: 'complete',
            tools: this.registry.reasoningTools(), remainingSteps: maxSteps - result.steps,
            history: result.trace.flatMap(t => t.result?.toolId ? [{ toolId: t.result.toolId, ok: t.result.ok }] : []),
          }, timeoutMs, signal);
          if (response.error) {
            if (response.error === 'aborted') return fail('aborted');
            result.warnings.push(response.error);
            return finish({ action: 'complete', reason: 'deterministic_ready_without_reasoning', confidence: 1 });
          }
          certainty = response.decision!.confidence;
          if (response.decision!.action === 'complete') return finish({ action: 'complete', reason: 'ready_for_next_stage', confidence: certainty });
          call = response.decision as ToolInvocation;
          // Copy only the invocation contract; AI metadata is not a tool input.
          call = { toolId: call.toolId, input: call.input };
        } else index++;
        const signature = stable(call);
        if (executed.has(signature)) return fail('tool_loop');
        executed.add(signature);
        result.steps++;
        const decision: AgentDecision = { action: 'use_tool', toolId: call.toolId, reason: 'validated_tool_operation', confidence: certainty };
        const toolResult = await this.registry.invoke(call, {
          project: request.project, access, persistence, signal: signal || new AbortController().signal,
        }, timeoutMs);
        result.trace.push({ decision, result: toolResult });
        if (toolResult.ok === false) return fail(toolResult.error);
        if (index >= operations.length && !reasoner) return finish({ action: 'complete', reason: 'requested_operations_complete', confidence: 1 });
      }
      return fail('step_limit');
    } catch {
      // No raw exception text, model content, or internal stack crosses this boundary.
      return fail('invalid_request');
    }
  }
}
