import type { Project, ProjectEngineId, ProjectLanguage } from "../projects/types";

/** Input to the Brain. `context.output`, when a string, is treated as an explicit user/system output choice. */
export interface BrainRequest {
  input: string;
  language: ProjectLanguage;
  existingProject?: Project;
  context?: Record<string, unknown>;
}

export type BrainStatus = "resolved" | "needs_clarification";
export type BrainDecisionSource = "explicit_output" | "deterministic" | "existing_project" | "ai" | "none";

/** Structured, normalized failure codes (the only error detail that leaves the Brain). */
export const BRAIN_AI_ERROR_CODES = [
  "provider_unavailable",
  "provider_rate_limited",
  "provider_timeout",
  "invalid_ai_response",
] as const;
export type BrainErrorCode = (typeof BRAIN_AI_ERROR_CODES)[number];

export interface BrainDecision {
  /** Stable classification of what the user wants, e.g. "create_visual". "unknown" when undetermined. */
  intent: string;
  engineId: ProjectEngineId | null;
  /** 0..1. Always 0 when no engine is selected. */
  confidence: number;
  status: BrainStatus;
  reasons: string[];
  /** Only values the user (or the existing Project) actually supplied. Never inferred or invented. */
  knownFields: Record<string, unknown>;
  /** Canonical schema field names that remain unresolved, e.g. ["output"]. */
  ambiguousFields: string[];
  source: BrainDecisionSource;
  /** Engines that remain plausible when status is "needs_clarification". */
  candidates: ProjectEngineId[];
  /** Set when AI assistance was attempted and failed or returned an unusable answer. */
  errorCode?: BrainErrorCode;
}

/**
 * Provider-neutral port for AI reasoning. The Brain never knows which provider or model answers;
 * an adapter outside Core connects this port to the AI Layer.
 */
export interface BrainReasoningRequest {
  input: string;
  language: ProjectLanguage;
  candidates: ReadonlyArray<{ id: ProjectEngineId; label: { en: string; ar: string } }>;
  /** Aborted when the Brain's timeout elapses. */
  signal: AbortSignal;
}

export interface BrainReasoningResult {
  /** Must be one of the offered candidates, or null when the AI cannot decide. */
  engineId: string | null;
  /** 0..1 */
  confidence: number;
}

export interface BrainAIReasoner {
  reason(request: BrainReasoningRequest): Promise<BrainReasoningResult>;
}

export interface BrainOptions {
  reasoner?: BrainAIReasoner;
  /** Default 8000. */
  aiTimeoutMs?: number;
  /** Minimum AI confidence required to resolve. Default 0.6. */
  aiMinConfidence?: number;
}
