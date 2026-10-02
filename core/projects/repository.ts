import type { ProjectWorkspaceState } from "./types";

/** Persistence-neutral boundary consumed by the Core state manager. */
export interface ProjectRepository {
  load(): unknown | null;
  save(state: ProjectWorkspaceState): void;
}

/** In-memory implementation useful for isolated execution and verification. */
export class MemoryProjectRepository implements ProjectRepository {
  private state: ProjectWorkspaceState | null = null;

  load(): unknown | null {
    return this.state;
  }

  save(state: ProjectWorkspaceState): void {
    this.state = state;
  }
}
