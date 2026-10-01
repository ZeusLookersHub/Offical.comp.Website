import {
  emptyProjectState, type Lang, type ProjectAttachment, type ProjectDraft, type TaskType, type UserProjectState,
} from "../data/lookersAi";
import { LocalStorageProjectRepository } from "../core/projects/repository";
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

const engineForTask = (task: TaskType): ProjectEngineId => {
  if (task === "image") return "visual.image";
  if (task === "campaign") return "business";
  return "other";
};

const projectFromDraft = (draft: ProjectDraft, status: Project["status"], language: Lang): Project => {
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

const parseLegacyState = (storage: ReturnType<typeof browserStorage>): UserProjectState | null => {
  if (!storage) return null;
  for (const key of [STORAGE_KEY, LEGACY_STORAGE_KEY]) {
    try {
      const raw = storage.getItem(key);
      if (!raw) continue;
      const value = JSON.parse(raw) as UserProjectState;
      if (value?.version === 1 && value.current?.id && Array.isArray(value.archived)) return value;
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
