import { isProjectEngineId } from "./engines";
import type {
  Project, ProjectWorkspaceState, ProjectWizardSession, UniversalProjectSchema,
} from "./types";

export type ValidationResult<T> =
  | { valid: true; value: T; errors: [] }
  | { valid: false; value: null; errors: string[] };

const pass = <T>(value: T): ValidationResult<T> => ({ valid: true, value, errors: [] });
const fail = <T>(...errors: string[]): ValidationResult<T> => ({ valid: false, value: null, errors });
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);

const isTimestamp = (value: unknown): value is string => {
  if (!isString(value)) return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second, , zone, offsetHour, offsetMinute] = match;
  const y = Number(year), m = Number(month), d = Number(day);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  if (m < 1 || m > 12 || d < 1 || d > daysInMonth) return false;
  if (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) return false;
  if (zone !== "Z" && (Number(offsetHour) > 23 || Number(offsetMinute) > 59)) return false;
  return Number.isFinite(Date.parse(value));
};

const referenceKinds = new Set(["image", "video", "document", "text", "file", "link", "other"]);
const wizardSteps = new Set(["home", "files", "details", "review", "result"]);

const validateReference = (value: unknown, index: number): string[] => {
  if (!isRecord(value)) return ["references[" + index + "] must be an object"];
  const errors: string[] = [];
  if (!isString(value.id) || !value.id.trim()) errors.push("references[" + index + "].id is required");
  if (!isString(value.name) || !value.name.trim()) errors.push("references[" + index + "].name must be a non-empty string");
  if (!isString(value.kind) || !referenceKinds.has(value.kind)) errors.push("references[" + index + "].kind is unsupported");
  if (typeof value.included !== "boolean") errors.push("references[" + index + "].included must be boolean");
  if (value.sizeBytes !== undefined && (!Number.isFinite(value.sizeBytes) || (value.sizeBytes as number) < 0)) {
    errors.push("references[" + index + "].sizeBytes must be non-negative");
  }
  for (const key of ["mimeType", "note", "text", "dataUrl", "url"] as const) {
    if (value[key] !== undefined && !isString(value[key])) errors.push("references[" + index + "]." + key + " must be a string");
  }
  return errors;
};

export const validateUniversalProjectSchema = (value: unknown): ValidationResult<UniversalProjectSchema> => {
  if (!isRecord(value)) return fail("schema must be an object");
  const errors: string[] = [];
  for (const key of ["intent", "objective", "context", "audience"] as const) {
    if (!isString(value[key])) errors.push(key + " must be a string");
  }
  if (value.language !== "en" && value.language !== "ar") errors.push("language must be en or ar");
  if (!Array.isArray(value.references)) errors.push("references must be an array");
  else value.references.forEach((reference, index) => errors.push(...validateReference(reference, index)));
  if (!isStringArray(value.constraints)) errors.push("constraints must be a string array");
  if (!isStringArray(value.targetTools)) errors.push("targetTools must be a string array");
  if (!Array.isArray(value.enhancements) || !value.enhancements.every((item) =>
    isRecord(item) && isString(item.id) && item.id.trim().length > 0 && typeof item.enabled === "boolean" &&
    (item.value === undefined || isString(item.value)))) {
    errors.push("enhancements must contain id, enabled, and optional string value");
  }
  if (!isRecord(value.output)) errors.push("output must be an object");
  else {
    if (!isString(value.output.description)) errors.push("output.description must be a string");
    if (value.output.format !== undefined && !isString(value.output.format)) errors.push("output.format must be a string");
    if (!isStringArray(value.output.deliverables)) errors.push("output.deliverables must be a string array");
  }
  if (errors.length) return fail(...errors);
  return pass(value as unknown as UniversalProjectSchema);
};

export const validateProject = (value: unknown): ValidationResult<Project> => {
  if (!isRecord(value)) return fail("project must be an object");
  const errors: string[] = [];
  if (!isString(value.id) || !value.id.trim()) errors.push("id is required");
  if (value.ownerId !== null && !isString(value.ownerId)) errors.push("ownerId must be a string or null");
  if (!isString(value.title)) errors.push("title must be a string");
  if (!isProjectEngineId(value.engineId)) errors.push("engineId is unsupported");
  if (!["active", "draft", "archived"].includes(String(value.status))) errors.push("status is unsupported");
  if (!isTimestamp(value.createdAt)) errors.push("createdAt must be a valid ISO timestamp");
  if (!isTimestamp(value.updatedAt)) errors.push("updatedAt must be a valid ISO timestamp");
  const schema = validateUniversalProjectSchema(value.schema);
  if (!schema.valid) errors.push(...schema.errors.map((error) => "schema." + error));
  if (errors.length) return fail(...errors);
  return pass({ ...(value as unknown as Project), schema: schema.value });
};

const validateSession = (value: unknown, key: string): string[] => {
  if (!isRecord(value)) return ["sessions." + key + " must be an object"];
  const errors: string[] = [];
  if (value.projectId !== key) errors.push("sessions." + key + ".projectId must match its key");
  if (!wizardSteps.has(String(value.step))) errors.push("sessions." + key + ".step is unsupported");
  if (!isString(value.taskType) || !value.taskType.trim()) errors.push("sessions." + key + ".taskType must be a non-empty string");
  if (!isRecord(value.answers) || !Object.values(value.answers).every((answer) =>
    isString(answer) || isStringArray(answer))) errors.push("sessions." + key + ".answers is invalid");
  if (!Array.isArray(value.activity) || !value.activity.every((item) =>
    isRecord(item) && isTimestamp(item.at) && isString(item.action) && item.action.trim().length > 0)) {
    errors.push("sessions." + key + ".activity is invalid");
  }
  if (value.generatedPrompt !== undefined && !isString(value.generatedPrompt)) {
    errors.push("sessions." + key + ".generatedPrompt must be a string");
  }
  return errors;
};

export const validateProjectWorkspaceState = (value: unknown): ValidationResult<ProjectWorkspaceState> => {
  if (!isRecord(value) || value.version !== 1) return fail("workspace version is unsupported");
  if (!isString(value.currentProjectId) || !value.currentProjectId) return fail("currentProjectId is required");
  if (!Array.isArray(value.projects)) return fail("projects must be an array");
  if (!isRecord(value.sessions)) return fail("sessions must be an object");

  const errors: string[] = [];
  const ids = new Set<string>();
  const projects: Project[] = [];
  for (const rawProject of value.projects) {
    const result = validateProject(rawProject);
    if (!result.valid) errors.push(...result.errors.map((error) => "projects: " + error));
    else {
      if (ids.has(result.value.id)) errors.push("project ids must be unique");
      ids.add(result.value.id);
      projects.push(result.value);
    }
  }
  if (!ids.has(value.currentProjectId)) errors.push("current project must exist");
  const current = projects.find((project) => project.id === value.currentProjectId);
  if (current?.status === "archived") errors.push("current project cannot be archived");

  const sessions: Record<string, ProjectWizardSession> = {};
  for (const [id, session] of Object.entries(value.sessions)) {
    if (!ids.has(id)) errors.push("session has no matching project " + id);
    errors.push(...validateSession(session, id));
    if (ids.has(id)) sessions[id] = session as unknown as ProjectWizardSession;
  }
  for (const id of ids) if (!sessions[id]) errors.push("missing wizard session for project " + id);
  if (errors.length) return fail(...errors);
  return pass({ version: 1, currentProjectId: value.currentProjectId, projects, sessions });
};
