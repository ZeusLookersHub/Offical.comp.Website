import {
  emptyProjectState, type Lang, type ProjectAttachment, type ProjectDraft, type TaskType, type UserProjectState,
} from "../data/lookersAi";
import { LocalStorageProjectRepository } from "./localStorageProjectRepository";
import { ProjectStateManager } from "../core/projects/state";
import { validateProjectWorkspaceState } from "../core/projects/validation";
import type {
  Project, ProjectEngineId, ProjectReference, ProjectWizardSession, ProjectWorkspaceState,
} from "../core/projects/types";

const CORE_STORAGE_KEY = "lookers-ai-project-core-v1";
const STORAGE_KEY = "lookers-ai-project-state-v1";
const LEGACY_STORAGE_KEY = "lookers-ai-memory-v1";

const browserStorage = () => typeof window === "undefined" ? undefined : window.localStorage;
const repository = new LocalStorageProjectRepository(browserStorage, CORE_STORAGE_KEY);
const manager = new ProjectStateManager(repository);

const answerText = (answers: ProjectDraft["answers"], key: string): string => {
  const value = answers[key];
  return Array.isArray(value) ? value.join(", ") : String(value || "");
};

// Temporary compatibility translation for the First Draft UI; engine routing belongs to a later Brain/Router stage.
const engineForTask = (task: TaskType): ProjectEngineId => {
  if (task === "image") return "visual.image";
  if (task === "campaign") return "business";
  return "other";
};

export const projectFromDraft = (draft: ProjectDraft, status: Project["status"], language: Lang): Project => {
  const answers = draft.answers;
  const constraintAnswers = [answerText(answers, "constraints"), answerText(answers, "avoid")]
    .map((value) => value.trim()).filter(Boolean);
  const tools = answerText(answers, "tools").split(/[,\n]/).map((tool) => tool.trim()).filter(Boolean);
  const deliverable = answerText(answers, "deliverable") || answerText(answers, "outcome");
  const references: ProjectReference[] = draft.attachments.map((attachment) => ({
    id: attachment.id,
    name: attachment.name,
    kind: attachment.kind,
    mimeType: attachment.mime,
    sizeBytes: attachment.size,
    included: attachment.include,
    note: attachment.note,
    ...(attachment.text ? { text: attachment.text } : {}),
    ...(attachment.dataUrl ? { dataUrl: attachment.dataUrl } : {}),
  }));

  return {
    id: draft.id,
    ownerId: null,
    title: draft.title,
    engineId: engineForTask(draft.taskType),
    status,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    schema: {
      intent: answerText(answers, "idea"),
      objective: answerText(answers, "purpose") || answerText(answers, "outcome"),
      context: answerText(answers, "context"),
      audience: answerText(answers, "audience") || answerText(answers, "users"),
      references,
      constraints: constraintAnswers,
      output: {
        description: deliverable,
        ...(answerText(answers, "format") ? { format: answerText(answers, "format") } : {}),
        deliverables: deliverable ? [deliverable] : [],
      },
      language,
      targetTools: tools,
      enhancements: [],
    },
  };
};

const wizardFromDraft = (draft: ProjectDraft): ProjectWizardSession => ({
  projectId: draft.id,
  step: draft.step,
  taskType: draft.taskType,
  answers: draft.answers,
  activity: draft.activity,
  ...(draft.generatedPrompt ? { generatedPrompt: draft.generatedPrompt } : {}),
});

const attachmentFromReference = (reference: ProjectReference): ProjectAttachment => ({
  id: reference.id,
  name: reference.name,
  mime: reference.mimeType || "application/octet-stream",
  size: reference.sizeBytes || 0,
  kind: reference.kind === "image" || reference.kind === "text" ? reference.kind : "file",
  include: reference.included,
  note: reference.note || "",
  ...(reference.text ? { text: reference.text } : {}),
  ...(reference.dataUrl ? { dataUrl: reference.dataUrl } : {}),
});

const draftFromProject = (project: Project, session: ProjectWizardSession): ProjectDraft => ({
  id: project.id,
  title: project.title,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
  step: session.step,
  taskType: session.taskType as TaskType,
  answers: session.answers,
  attachments: project.schema.references.map(attachmentFromReference),
  activity: session.activity,
  ...(session.generatedPrompt ? { generatedPrompt: session.generatedPrompt } : {}),
});

const stateFromWorkspace = (workspace: ProjectWorkspaceState): UserProjectState => {
  const currentProject = workspace.projects.find((project) => project.id === workspace.currentProjectId);
  if (!currentProject) return emptyProjectState();
  const current = draftFromProject(currentProject, workspace.sessions[currentProject.id]);
  const archived = workspace.projects
    .filter((project) => project.status === "archived")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map((project) => draftFromProject(project, workspace.sessions[project.id]));
  return { version: 1, current, archived };
};

const workspaceFromState = (state: UserProjectState, language: Lang): ProjectWorkspaceState => {
  const projects = [
    projectFromDraft(state.current, "active", language),
    ...state.archived.map((project) => projectFromDraft(project, "archived", language)),
  ];
  const sessions = Object.fromEntries([
    state.current,
    ...state.archived,
  ].map((draft) => [draft.id, wizardFromDraft(draft)]));
  return {
    version: 1,
    currentProjectId: state.current.id,
    projects,
    sessions,
  };
};

const isLegacyDraft = (value: unknown): value is ProjectDraft => {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<ProjectDraft>;
  const validSteps = ["home", "files", "details", "review", "result"];
  const validTasks = ["image", "campaign", "dashboard", "general"];
  const isTimestamp = (text: unknown) => typeof text === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(text) && Number.isFinite(Date.parse(text));
  const answersAreValid = !!draft.answers && typeof draft.answers === "object" &&
    Object.values(draft.answers).every((answer) => typeof answer === "string" ||
      (Array.isArray(answer) && answer.every((item) => typeof item === "string")));
  const attachmentsAreValid = Array.isArray(draft.attachments) && draft.attachments.every((item) =>
    !!item && typeof item.id === "string" && typeof item.name === "string" &&
    typeof item.mime === "string" && typeof item.size === "number" && item.size >= 0 &&
    ["image", "text", "file"].includes(item.kind) && typeof item.include === "boolean" &&
    typeof item.note === "string" &&
    (item.text === undefined || typeof item.text === "string") &&
    (item.dataUrl === undefined || typeof item.dataUrl === "string"));
  const activityIsValid = Array.isArray(draft.activity) && draft.activity.every((item) =>
    !!item && isTimestamp(item.at) && typeof item.action === "string");
  return typeof draft.id === "string" && !!draft.id &&
    typeof draft.title === "string" && isTimestamp(draft.createdAt) && isTimestamp(draft.updatedAt) &&
    validSteps.includes(String(draft.step)) && validTasks.includes(String(draft.taskType)) &&
    answersAreValid && attachmentsAreValid && activityIsValid &&
    (draft.generatedPrompt === undefined || typeof draft.generatedPrompt === "string");
};

const parseLegacyState = (storage: ReturnType<typeof browserStorage>): UserProjectState | null => {
  if (!storage) return null;
  for (const key of [STORAGE_KEY, LEGACY_STORAGE_KEY]) {
    try {
      const raw = storage.getItem(key);
      if (!raw) continue;
      const value = JSON.parse(raw) as Partial<UserProjectState>;
      if (value?.version === 1 && isLegacyDraft(value.current) &&
          Array.isArray(value.archived) && value.archived.every(isLegacyDraft)) {
        const ids = [value.current.id, ...value.archived.map((item) => item.id)];
        if (new Set(ids).size !== ids.length || value.archived.some((item) => item.id === value.current!.id)) continue;
        return value as UserProjectState;
      }
    } catch {
      // Try the other previous storage key.
    }
  }
  return null;
};


export const lookersAiProjectState = {
  load(language: Lang): UserProjectState {
    const saved = manager.load();
    if (saved) return stateFromWorkspace(saved);
    const legacy = parseLegacyState(browserStorage());
    if (!legacy) return emptyProjectState();
    try { manager.save(workspaceFromState(legacy, language)); } catch { /* Keep the legacy draft usable if storage is unavailable. */ }
    return legacy;
  },

  save(state: UserProjectState, language: Lang): boolean {
    try {
      const workspace = workspaceFromState(state, language);
      const validation = validateProjectWorkspaceState(workspace);
      if (!validation.valid) return false;
      manager.save(validation.value);
      return true;
    } catch {
      return false;
    }
  },
};
