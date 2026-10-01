import type { ProjectWorkspaceState } from "./types";

export interface ProjectRepository {
  load(): unknown | null;
  save(state: ProjectWorkspaceState): void;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class LocalStorageProjectRepository implements ProjectRepository {
  constructor(
    private readonly getStorage: () => StorageLike | undefined,
    private readonly key = "lookers-ai-project-core-v1",
  ) {}

  load(): unknown | null {
    const storage = this.getStorage();
    if (!storage) return null;
    try {
      const raw = storage.getItem(this.key);
      return raw ? JSON.parse(raw) as unknown : null;
    } catch {
      return null;
    }
  }

  save(state: ProjectWorkspaceState): void {
    const storage = this.getStorage();
    if (!storage) throw new Error("project_storage_unavailable");
    storage.setItem(this.key, JSON.stringify(state));
  }
}

export class MemoryProjectRepository implements ProjectRepository {
  private state: ProjectWorkspaceState | null = null;

  load(): unknown | null {
    return this.state;
  }

  save(state: ProjectWorkspaceState): void {
    this.state = state;
  }
}
