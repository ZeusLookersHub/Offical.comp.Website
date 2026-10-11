import type { Project, ProjectEngineId, ProjectLanguage } from '../projects/types';
import type { BrainDecision } from '../brain/types';
import type { QuestionEngineResult, QuestionSession, ReferenceEvidence } from '../question-engine';

export const AGENT_TOOL_IDS = ['get_project_schema', 'get_engine_definition', 'get_question_definition',
  'get_tool_profile', 'get_reference', 'validate_prompt', 'save_project_state', 'get_owner_memory'] as const;
export type AgentToolId = typeof AGENT_TOOL_IDS[number];
export interface ToolInvocation { toolId: AgentToolId; input: Record<string, unknown> }
export interface AgentRequest {
  project: Project;
  brainDecision?: BrainDecision;
  questionSession?: QuestionSession;
  referenceEvidence?: ReferenceEvidence[];
  /** Optional cached result, checked against a fresh Stage 03 evaluation. */
  questionState?: QuestionEngineResult;
  /** Explicit application operations. Reasoning cannot grant itself write permission. */
  operations?: ToolInvocation[];
}
export interface AgentDecision {
  action: 'ask_question' | 'use_tool' | 'complete' | 'needs_confirmation' | 'error';
  reason: string;
  confidence: number;
  questionId?: string;
  toolId?: AgentToolId;
}
export type AgentErrorCode = 'invalid_request' | 'invalid_options' | 'unauthorized' | 'invalid_brain_decision'
  | 'invalid_question_state' | 'unknown_tool' | 'invalid_tool_input' | 'invalid_tool_output'
  | 'tool_failed' | 'tool_timeout' | 'aborted' | 'step_limit' | 'tool_loop' | 'unavailable'
  | 'reasoner_unavailable' | 'reasoner_timeout' | 'invalid_reasoning';
export type ToolResult = { ok: true; toolId: AgentToolId; value: unknown }
  | { ok: false; toolId?: AgentToolId; error: AgentErrorCode };
export interface AgentResult {
  decision: AgentDecision;
  /** The supplied canonical Project, never model-authored or patched by the Agent. */
  project?: Project;
  questionState?: QuestionEngineResult;
  steps: number;
  trace: Array<{ decision: AgentDecision; result?: ToolResult }>;
  error?: AgentErrorCode;
  warnings: AgentErrorCode[];
}
/** Application-owned capability grant. Never accept it from a model or request.context. */
export interface AgentAccess { projectId: string; canSave?: boolean; ownerId?: string }
export interface AgentPersistencePort {
  /** Implementations must honor cancellation before committing and reject stale state. */
  save(project: Project, signal: AbortSignal): Promise<unknown>;
}
export interface ToolContext {
  project: Project;
  access: AgentAccess;
  persistence?: AgentPersistencePort;
  signal: AbortSignal;
}
export interface AgentTool {
  id: AgentToolId;
  description: string;
  inputSchema: { required: readonly string[]; additionalProperties: false };
  validateInput(input: unknown): boolean;
  authorize(input: Record<string, unknown>, context: ToolContext): boolean;
  execute(input: Record<string, unknown>, context: ToolContext): Promise<unknown>;
  validateOutput(value: unknown, input: Record<string, unknown>, context: ToolContext): boolean;
}
export interface AgentReasoningRequest {
  engineId: ProjectEngineId;
  language: ProjectLanguage;
  questionStatus: 'complete';
  /** Only tool IDs and success flags; no personal facts, references, prompts or tool contents. */
  history: Array<{ toolId: AgentToolId; ok: boolean }>;
  tools: Array<{ id: AgentToolId; description: string; inputSchema: AgentTool['inputSchema'] }>;
  remainingSteps: number;
  signal: AbortSignal;
}
export type AgentReasoningDecision = { action: 'complete'; confidence: number }
  | { action: 'use_tool'; toolId: AgentToolId; input: Record<string, unknown>; confidence: number };
export interface AgentReasoner { reason(request: AgentReasoningRequest): Promise<unknown> }
export interface AgentOptions {
  access: AgentAccess;
  persistence?: AgentPersistencePort;
  reasoner?: AgentReasoner;
  maxSteps?: number;
  timeoutMs?: number;
}
