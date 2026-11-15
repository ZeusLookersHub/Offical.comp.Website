/**
 * Lookers AI Mission Engine — shared contracts.
 *
 * A Blueprint is pure data (JSON-serialisable) so it can live in the repo today
 * and in the database later. Rules decide the flow; the model only extracts,
 * composes and critiques (server side, phase 2).
 */
export type Lang = 'en' | 'ar';
export type Copy = { en: string; ar: string };
export type SlotValueRaw = string | string[];

export type SlotKind =
  | 'text'      // short free text
  | 'longtext'  // description
  | 'exact'     // verbatim text: brand names, approved copy. Never paraphrased.
  | 'single'    // one option
  | 'multi';    // several options

/** critical: always asked. important: asked within the question budget, else default. nice: never asked, default shown in brief. */
export type Importance = 'critical' | 'important' | 'nice';

export interface Condition { slot: string; equals?: SlotValueRaw; notEquals?: string; filled?: boolean }

/**
 * The four prompt layers. Every slot belongs to one; every blueprint states its rules per layer.
 * understanding: what is wanted and from what facts · intelligence: how to decide/approach
 * control: hard limits, verbatim values, exclusions · delivery: format, target tool, checks.
 */
export type LayerId = 'understanding' | 'intelligence' | 'control' | 'delivery';

/** Visual example for an option: shown as a thumbnail/clip; description is the fallback and the explanation. */
export interface OptionVisual {
  media: 'image' | 'video' | 'layout';
  description: Copy;
  /** Public path (may not exist yet — see RESOURCES.md). */
  asset?: string;
  /** English prompt we use to produce the example asset ourselves. */
  generate?: string;
}

export interface SlotOption {
  value: string;
  label: Copy;
  visual?: OptionVisual;
  /** Words that, when written by the user, select this option during intake. */
  keywords?: string[];
}

export interface SlotDefault {
  value: SlotValueRaw;
  reason: Copy;
  when?: Condition[];
}

export interface Slot {
  id: string;
  kind: SlotKind;
  layer: LayerId;
  importance: Importance;
  /** Short noun used in the brief card. */
  label: Copy;
  /** One clear question, to the point. */
  question: Copy;
  /** One line: why we ask. */
  why: Copy;
  example: Copy;
  options?: SlotOption[];
  /** First matching default wins. Value 'none' means "deliberately empty". */
  defaults?: SlotDefault[];
  /** Slot only exists when these hold. */
  when?: Condition[];
  /** Vocabulary for live suggestion chips while typing. */
  vocabulary?: { en: string[]; ar: string[] };
  maxLength?: number;
  /** Deterministic extraction from free text. */
  patterns?: { regex: string; flags?: string; group?: number; value?: string }[];
  /** How a deliberately empty value reads in the brief (default: "None"). */
  noneLabel?: Copy;
  /** For exact slots: words that, right before a quoted phrase, mean the quote belongs here. */
  quoteCues?: string[];
  /** Slot that collects things to exclude (shown as "Avoid" in brief). */
  role?: 'exclusion' | 'target-tool';
}

export type ContractFieldType = 'string' | 'string[]' | 'record' | 'object';
export interface ContractField { path: string; type: ContractFieldType; required: boolean; maxLength?: number; description: string }

export interface OutputContract {
  id: string;
  description: Copy;
  fields: ContractField[];
}

export type Gate =
  | { id: string; kind: 'verbatim'; slot: string; fields: string[]; nearMiss?: boolean; message: Copy }
  | { id: string; kind: 'equals-slot'; slot: string; field: string; message: Copy }
  | { id: string; kind: 'no-leak'; fields: string[]; terms: string[]; slotTerms?: string[]; message: Copy }
  | { id: string; kind: 'no-invented-text'; whenEmpty: string[]; field: string; negativeField: string; message: Copy }
  | { id: string; kind: 'latin-ratio'; field: string; min: number; exceptSlots: string[]; message: Copy }
  /** Every number (≥ 21, or with %, $, K, M…) must come from what the user wrote. */
  | { id: string; kind: 'no-invented-numbers'; fields: string[]; message: Copy }
  | { id: string; kind: 'array-length'; slot: string; field: string; message: Copy }
  | { id: string; kind: 'includes-when'; when: Condition[]; field: string; anyOf: string[]; message: Copy };

export interface ToolTarget { id: string; label: string; notes: string }

export interface Blueprint {
  id: string;
  version: number;
  title: Copy;
  /** Topic ids from services/lookersAiTopicRegistry that open this blueprint. */
  topics: string[];
  intake: { question: Copy; why: Copy; starters: Copy[] };
  /** Max follow-up questions after intake (critical slots may exceed it). */
  questionBudget: number;
  slots: Slot[];
  output: OutputContract;
  gates: Gate[];
  tools: ToolTarget[];
  /** Internal system prompt: one-line role + model-facing rules per layer (English). */
  role: string;
  strategy: Record<LayerId, string[]>;
  /** Gold examples: a short excellent output and a short failing one, with why. */
  examples?: { good: string; bad: string; why: string }[];
}

// ---------- runtime state ----------

export type ValueSource = 'user' | 'extracted' | 'default';
export interface SlotValue {
  value: SlotValueRaw;
  source: ValueSource;
  /** Exact user words that justify an extracted value. */
  evidence?: string;
  /** Why a default was assumed. */
  reason?: Copy;
}

export type Phase = 'intake' | 'questions' | 'brief' | 'confirmed';

export interface Session {
  id: string;
  blueprintId: string;
  blueprintVersion: number;
  lang: Lang;
  phase: Phase;
  idea?: string;
  values: Record<string, SlotValue>;
  asked: string[];
  revision: number;
}

/** What the model returns from intake extraction (server). Rejected unless evidence is in the user text. */
export interface Candidate { slot: string; value: SlotValueRaw; evidence: string }

export interface QuestionView {
  slot: string;
  kind: SlotKind;
  layer: LayerId;
  message: string;
  why: string;
  example: string;
  options?: { value: string; label: string; description?: string; media?: OptionVisual['media']; asset?: string }[];
  canSkip: boolean;
  skipLabel?: string;
  suggestions: string[];
}

export type Step =
  | { type: 'intake'; question: string; why: string; starters: string[] }
  | { type: 'question'; question: QuestionView; progress: { asked: number; remaining: number } }
  | { type: 'brief'; brief: Brief };

export interface BriefItem { slot: string; label: string; value: string; source: ValueSource; reason?: string }
export interface Brief {
  blueprintId: string;
  title: string;
  idea: string;
  facts: BriefItem[];
  assumptions: BriefItem[];
  exclusions: BriefItem[];
  target: string;
  output: string;
  ready: boolean;
  missing: string[];
  revision: number;
}

export interface GateResult { id: string; ok: boolean; message: string; detail?: string }
export interface GateReport { passed: number; total: number; ok: boolean; results: GateResult[] }

export type EngineResult<T> = { ok: true; value: T } | { ok: false; error: string };
