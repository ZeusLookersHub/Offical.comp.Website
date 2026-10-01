import { PROJECT_ENGINES, isProjectEngineId } from "../projects/engines";
import type { Project, ProjectEngineId } from "../projects/types";
import { normalizeText } from "./normalize";
import {
  BUSINESS_CANDIDATES, OUTPUT_LABEL, VISUAL_CANDIDATES, engineForOutput, intentFor, matchTextRules, sortEngines,
} from "./rules";
import {
  BRAIN_AI_ERROR_CODES,
  type BrainAIReasoner, type BrainDecision, type BrainErrorCode, type BrainOptions, type BrainRequest,
  type BrainReasoningResult,
} from "./types";

const DEFAULT_AI_TIMEOUT_MS = 8000;
const DEFAULT_AI_MIN_CONFIDENCE = 0.6;
const AI_CONFIDENCE_CAP = 0.85;

const ALL_ROUTABLE: readonly ProjectEngineId[] = PROJECT_ENGINES
  .filter((engine) => engine.kind === "engine").map((engine) => engine.id as ProjectEngineId);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

/** Collects only what the user or the existing Project actually supplied. */
const collectKnownFields = (request: BrainRequest, language: string): Record<string, unknown> => {
  const known: Record<string, unknown> = { language };
  const schema = request.existingProject?.schema;
  if (!schema) return known;
  if (nonEmpty(schema.objective)) known.objective = schema.objective.trim();
  if (nonEmpty(schema.context)) known.context = schema.context.trim();
  if (nonEmpty(schema.audience)) known.audience = schema.audience.trim();
  if (Array.isArray(schema.constraints) && schema.constraints.length > 0) known.constraints = [...schema.constraints];
  if (Array.isArray(schema.targetTools) && schema.targetTools.length > 0) known.targetTools = [...schema.targetTools];
  if (nonEmpty(schema.output?.format)) known.outputFormat = schema.output.format;
  const references = (schema.references || []).filter((reference) => reference.included).map((reference) => reference.name);
  if (references.length > 0) known.references = references;
  return known;
};

export interface DeterministicRoute {
  decision: BrainDecision;
  /** True when ambiguity exists and the AI Layer may be consulted. */
  askAi: boolean;
}

const resolved = (
  request: BrainRequest, engineId: ProjectEngineId, confidence: number, source: BrainDecision["source"],
  reasons: string[], language: string,
): DeterministicRoute => {
  const known = collectKnownFields(request, language);
  const output = OUTPUT_LABEL[engineId];
  if (output && source !== "existing_project") known.output = output;
  return {
    askAi: false,
    decision: {
      intent: intentFor(engineId, []), engineId, confidence, status: "resolved", reasons,
      knownFields: known, ambiguousFields: [], source, candidates: [],
    },
  };
};

const unresolved = (
  request: BrainRequest, candidates: ProjectEngineId[], ambiguousFields: string[], reasons: string[], language: string,
  askAi: boolean,
): DeterministicRoute => ({
  askAi,
  decision: {
    intent: intentFor(null, candidates), engineId: null, confidence: 0, status: "needs_clarification", reasons,
    knownFields: collectKnownFields(request, language), ambiguousFields, source: "none", candidates,
  },
});

/** Deterministic routing only: never calls AI and never throws. */
export const routeDeterministic = (request: BrainRequest): DeterministicRoute => {
  const safe: BrainRequest = isRecord(request) ? request : ({ input: "", language: "en" } as BrainRequest);
  const language = safe.language === "ar" ? "ar" : "en";
  const existingEngine = safe.existingProject?.engineId;

  // 1. Explicit output wins over text.
  const explicit = safe.context?.output;
  if (explicit !== undefined && explicit !== null && explicit !== "") {
    const engineId = engineForOutput(explicit);
    if (engineId) {
      const reasons = [`Explicit output "${normalizeText(explicit)}" maps to ${engineId}.`];
      return resolved(safe, engineId, 0.98, "explicit_output", reasons, language);
    }
  }

  // 2. Text rules.
  const { strong, weak } = matchTextRules(safe.input);
  if (strong.size === 1) {
    const [[engineId, hits]] = [...strong.entries()];
    const reasons = [`Request clearly describes ${engineId}.`];
    if (existingEngine && existingEngine !== engineId && existingEngine !== "other") {
      reasons.push(`Differs from the existing project engine (${existingEngine}).`);
    }
    return resolved(safe, engineId, hits > 1 ? 0.95 : 0.9, "deterministic", reasons, language);
  }
  if (strong.size > 1) {
    const candidates = sortEngines(strong.keys());
    return unresolved(safe, candidates, ["output"], [`Request matches several engines: ${candidates.join(", ")}.`], language, true);
  }
  if (weak.size > 0) {
    const candidates = sortEngines([
      ...(weak.has("visual") ? VISUAL_CANDIDATES : []),
      ...(weak.has("business") ? BUSINESS_CANDIDATES : []),
    ]);
    return unresolved(safe, candidates, ["output"], ["Request is general; the output type is not clear."], language, true);
  }

  // 3. No text signal: continue the existing project when it already has a specific engine.
  if (existingEngine && existingEngine !== "other" && isProjectEngineId(existingEngine) && safe.existingProject?.status !== "archived") {
    return resolved(safe, existingEngine, 0.7, "existing_project", ["No new engine signal; continuing the existing project."], language);
  }

  // 4. Nothing to go on.
  const hasText = normalizeText(safe.input).length > 0;
  return unresolved(
    safe, [...ALL_ROUTABLE], ["intent", "output"],
    [hasText ? "No engine could be determined from the request." : "The request is empty."], language, hasText,
  );
};

class BrainAiError extends Error {
  constructor(readonly code: BrainErrorCode) { super(code); }
}

const toErrorCode = (error: unknown): BrainErrorCode => {
  const code = isRecord(error) ? error.code : undefined;
  return (BRAIN_AI_ERROR_CODES as readonly unknown[]).includes(code) ? (code as BrainErrorCode) : "provider_unavailable";
};

const withTimeout = async <T,>(run: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> => {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new BrainAiError("provider_timeout")); }, ms);
  });
  try {
    return await Promise.race([run(controller.signal), timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
};

const validateReasoning = (result: unknown, candidates: readonly ProjectEngineId[]): BrainReasoningResult => {
  if (!isRecord(result)) throw new BrainAiError("invalid_ai_response");
  const { engineId, confidence } = result;
  if (typeof confidence !== "number" || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new BrainAiError("invalid_ai_response");
  }
  if (engineId !== null && !(typeof engineId === "string" && (candidates as readonly string[]).includes(engineId))) {
    throw new BrainAiError("invalid_ai_response");
  }
  return { engineId: engineId as string | null, confidence };
};

export class Brain {
  private readonly reasoner?: BrainAIReasoner;
  private readonly aiTimeoutMs: number;
  private readonly aiMinConfidence: number;

  constructor(options: BrainOptions = {}) {
    this.reasoner = options.reasoner;
    this.aiTimeoutMs = options.aiTimeoutMs ?? DEFAULT_AI_TIMEOUT_MS;
    this.aiMinConfidence = options.aiMinConfidence ?? DEFAULT_AI_MIN_CONFIDENCE;
  }

  /** Always returns a structured decision; never throws. AI is consulted only when ambiguity exists. */
  async decide(request: BrainRequest): Promise<BrainDecision> {
    const route = routeDeterministic(request);
    if (!route.askAi || !this.reasoner) return route.decision;

    const { decision } = route;
    const language = request.language === "ar" ? "ar" : "en";
    const candidates = decision.candidates;
    const offered = PROJECT_ENGINES
      .filter((engine) => engine.kind === "engine" && (candidates as readonly string[]).includes(engine.id))
      .map((engine) => ({ id: engine.id as ProjectEngineId, label: engine.label }));

    try {
      const raw = await withTimeout(
        (signal) => this.reasoner!.reason({ input: String(request.input).slice(0, 4000), language, candidates: offered, signal }),
        this.aiTimeoutMs,
      );
      const answer = validateReasoning(raw, candidates);
      if (answer.engineId === null || answer.confidence < this.aiMinConfidence) {
        return { ...decision, reasons: [...decision.reasons, "AI assistance could not decide confidently."] };
      }
      const engineId = answer.engineId as ProjectEngineId;
      return {
        ...decision, engineId, status: "resolved", source: "ai", candidates: [], ambiguousFields: [],
        intent: intentFor(engineId, []), confidence: Math.min(answer.confidence, AI_CONFIDENCE_CAP),
        reasons: [...decision.reasons, "Resolved with AI assistance among the plausible engines."],
      };
    } catch (error) {
      const errorCode = toErrorCode(error);
      return { ...decision, errorCode, reasons: [...decision.reasons, `AI assistance unavailable (${errorCode}).`] };
    }
  }
}
