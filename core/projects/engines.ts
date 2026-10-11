import type { ProjectEngineId } from "./types";

export interface ProjectEngineDefinition {
  id: ProjectEngineId | "visual";
  parentId?: "visual";
  kind: "group" | "engine";
  label: { en: string; ar: string };
}

export const PROJECT_ENGINES: readonly ProjectEngineDefinition[] = [
  { id: "visual", kind: "group", label: { en: "Visual", ar: "مرئي" } },
  { id: "visual.image", parentId: "visual", kind: "engine", label: { en: "Image", ar: "صورة" } },
  { id: "visual.video", parentId: "visual", kind: "engine", label: { en: "Video", ar: "فيديو" } },
  { id: "business", kind: "engine", label: { en: "Business", ar: "أعمال" } },
  { id: "cv", kind: "engine", label: { en: "CV", ar: "سيرة ذاتية" } },
  { id: "powerpoint", kind: "engine", label: { en: "PowerPoint", ar: "PowerPoint" } },
  { id: "excel", kind: "engine", label: { en: "Excel", ar: "Excel" } },
  { id: "report", kind: "engine", label: { en: "Report", ar: "تقرير" } },
  { id: "proposal", kind: "engine", label: { en: "Proposal", ar: "عرض مقترح" } },
  { id: "business-plan", kind: "engine", label: { en: "Business Plan", ar: "خطة عمل" } },
  { id: "project-product", kind: "engine", label: { en: "Project / Product", ar: "مشروع / منتج" } },
  { id: "other", kind: "engine", label: { en: "Other", ar: "أخرى" } },
] as const;

export const PROJECT_ENGINE_IDS = PROJECT_ENGINES
  .filter((engine): engine is ProjectEngineDefinition & { id: ProjectEngineId } => engine.kind === "engine")
  .map((engine) => engine.id) as readonly ProjectEngineId[];

export const isProjectEngineId = (value: unknown): value is ProjectEngineId =>
  typeof value === "string" && (PROJECT_ENGINE_IDS as readonly string[]).includes(value);
