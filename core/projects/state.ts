import type {
  Project, ProjectWizardSession, ProjectWorkspaceState,
} from "./types";
import { validateProjectWorkspaceState } from "./validation";
import type { ProjectRepository } from "./repository";

export class ProjectStateManager {
  constructor(private readonly repository: ProjectRepository) {}

  load(): ProjectWorkspaceState | null {
    const result = validateProjectWorkspaceState(this.repository.load());
    return result.valid ? result.value : null;
  }

  save(state: ProjectWorkspaceState): ProjectWorkspaceState {
    const result = validateProjectWorkspaceState(state);
    if (!result.valid) throw new Error("invalid_project_workspace: " + result.errors.join("; "));
    this.repository.save(result.value);
    return result.value;
  }

  upsert(project: Project, session: ProjectWizardSession): ProjectWorkspaceState {
    const state = this.load();
    if (!state) {
      return this.save({
        version: 1,
        currentProjectId: project.id,
        projects: [{ ...project, status: "active" }],
        sessions: { [project.id]: session },
      });
    }
    const projects = state.projects.filter((item) => item.id !== project.id);
    projects.push({ ...project, status: "active" });
    const nextProjects = projects.map((item) =>
      item.id !== project.id && item.status === "active" ? { ...item, status: "draft" as const } : item);
    return this.save({
      ...state,
      currentProjectId: project.id,
      projects: nextProjects,
      sessions: { ...state.sessions, [project.id]: session },
    });
  }

  select(projectId: string): ProjectWorkspaceState {
    const state = this.load();
    if (!state || !state.projects.some((project) => project.id === projectId && project.status !== "archived")) {
      throw new Error("project_not_selectable");
    }
    return this.save({
      ...state,
      currentProjectId: projectId,
      projects: state.projects.map((project) => project.id === projectId
        ? { ...project, status: "active" }
        : project.status === "active" ? { ...project, status: "draft" } : project),
    });
  }
}
