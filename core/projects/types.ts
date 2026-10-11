export type ProjectLanguage = "en" | "ar";

export type ProjectEngineId =
  | "visual.image"
  | "visual.video"
  | "business"
  | "cv"
  | "powerpoint"
  | "excel"
  | "report"
  | "proposal"
  | "business-plan"
  | "project-product"
  | "other";

export type ProjectReferenceKind = "image" | "video" | "document" | "text" | "file" | "link" | "other";

export interface ProjectReference {
  id: string;
  name: string;
  kind: ProjectReferenceKind;
  mimeType?: string;
  sizeBytes?: number;
  included: boolean;
  note?: string;
  text?: string;
  dataUrl?: string;
  url?: string;
}

export interface ProjectOutput {
  description: string;
  format?: string;
  deliverables: string[];
}

export interface ProjectEnhancement {
  id: string;
  enabled: boolean;
  value?: string;
}

export interface UniversalProjectSchema {
  intent: string;
  objective: string;
  context: string;
  audience: string;
  references: ProjectReference[];
  constraints: string[];
  output: ProjectOutput;
  language: ProjectLanguage;
  targetTools: string[];
  enhancements: ProjectEnhancement[];
}

export type ProjectStatus = "active" | "draft" | "archived";

export interface Project {
  id: string;
  ownerId: string | null;
  title: string;
  engineId: ProjectEngineId;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  schema: UniversalProjectSchema;
}

export type ProjectWizardStep = "home" | "files" | "details" | "review" | "result";

export interface ProjectWizardSession {
  projectId: string;
  step: ProjectWizardStep;
  taskType: string;
  answers: Record<string, string | string[]>;
  activity: Array<{ at: string; action: string }>;
  generatedPrompt?: string;
}

export interface ProjectWorkspaceState {
  version: 1;
  currentProjectId: string;
  projects: Project[];
  sessions: Record<string, ProjectWizardSession>;
}
