import type { ProjectRepository } from "../core/projects/repository";
import type { ProjectWorkspaceState } from "../core/projects/types";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Browser storage adapter; the Core knows only the ProjectRepository contract. */
export class LocalStorageProjectRepository implements ProjectRepository {
  constructor(
    private readonly getStorage: () => StorageLike | undefined,
    private readonly key = "lookers-ai-project-core-v1",
  ) {}

  load(): unknown | null {
    try {
      const storage = this.getStorage();
      const raw = storage?.getItem(this.key);
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
