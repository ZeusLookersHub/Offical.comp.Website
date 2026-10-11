import type { Project, ProjectEngineId, ProjectLanguage } from '../projects/types';

export type FieldValue = string | string[];
export type Field = 'intent' | 'objective' | 'context' | 'audience' | 'constraints'
  | 'output.description' | 'output.format' | 'output.deliverables' | 'targetTools' | `details.${string}`;
export type LocalizedText = { en: string; ar: string };
export type Condition = { field: Field; equals: string };
export interface QuestionDefinition {
  id: string;
  field: Field;
  label: LocalizedText;
  type: 'text' | 'textarea' | 'single' | 'multi';
  state: 'required' | 'conditional' | 'optional';
  nature: 'factual' | 'creative' | 'technical';
  critical: boolean;
  inferable: boolean;
  userOverride: boolean;
  priority: number;
  dependencies?: Field[];
  requiredWhen?: Condition[];
  askWhen?: Condition[];
  options?: Array<{ value: string; label: LocalizedText }>;
  examples?: LocalizedText;
  defaultRule?: { when: Condition[]; value: FieldValue };
}
export interface QuestionSchema { engineId: ProjectEngineId; definitions: QuestionDefinition[] }
export type FieldState = 'known' | 'missing' | 'inferable' | 'critical' | 'optional' | 'answered' | 'needs_confirmation';
export type FieldSource = 'project' | 'user' | 'reference' | 'default' | 'inference';
export interface FieldEntry {
  value: FieldValue;
  source: 'user' | 'inference';
  confirmed?: boolean;
}
/** Specialized answers stay outside the universal Project schema, scoped to one project and engine. */
export interface QuestionSession {
  projectId: string;
  engineId: ProjectEngineId;
  fields: Partial<Record<Field, FieldEntry>>;
}
/** Supplied by a trusted caller after inspecting text; filenames/URLs are never evidence. */
export interface ReferenceEvidence {
  field: Field;
  referenceId: string;
  value: string;
  excerpt: string;
  trusted: boolean;
}
export interface QuestionInput {
  project: Project;
  schema?: QuestionSchema;
  session?: QuestionSession;
  evidence?: ReferenceEvidence[];
}
export interface ResolvedField {
  field: Field;
  state: FieldState;
  active: boolean;
  required: boolean;
  value?: FieldValue;
  source?: FieldSource;
  reasons: string[];
}
export interface QuestionEngineResult {
  status: 'needs_question' | 'complete' | 'needs_confirmation' | 'invalid';
  question?: QuestionDefinition;
  label?: string;
  fields: ResolvedField[];
  knownFields: Field[];
  missingFields: Field[];
  inferableFields: Field[];
  criticalFields: Field[];
  orderedQuestions: QuestionDefinition[];
  progress: { completed: number; required: number; percent: number };
  reasons: string[];
}
export interface QuestionInferencePort {
  infer(request: {
    engineId: ProjectEngineId;
    field: Field;
    label: string;
    language: ProjectLanguage;
    /** Minimal safe context; no project references or personal/business fields. */
    knownFields: Partial<Record<Field, FieldValue>>;
    signal: AbortSignal;
  }): Promise<unknown>;
}
