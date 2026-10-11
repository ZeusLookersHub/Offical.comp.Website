import type { AgentPersistencePort } from '../core/agent';
import type { ProjectRepository } from '../core/projects/repository';
import type { Project } from '../core/projects/types';
import { ProjectStateManager } from '../core/projects/state';
import { validateProject } from '../core/projects/validation';
import { equal } from '../core/agent/validation';

/**
 * Stage 04 checkpoints an existing, application-approved canonical snapshot only.
 * New user edits are saved by the existing application flow before creating this port.
 * No model-authored patch, session rewrite, archive transition, or project switch is accepted.
 */
export function createAgentPersistence(repository: ProjectRepository, approved: Project): AgentPersistencePort {
  if (!validateProject(approved).valid) throw new Error('invalid_approved_project');
  const snapshot = structuredClone(approved);
  const manager = new ProjectStateManager(repository);
  return {
    async save(project, signal) {
      if (signal.aborted || !equal(project, snapshot)) throw new Error('unapproved_snapshot');
      const workspace = manager.load();
      const stored = workspace?.projects.find(p => p.id === snapshot.id);
      if (!workspace || workspace.currentProjectId !== snapshot.id || stored?.status === 'archived' || !equal(stored, snapshot))
        throw new Error('stale_snapshot');
      // The existing repository contract is synchronous: no await between revision check and save.
      if (signal.aborted) throw new Error('aborted');
      manager.save(structuredClone(workspace));
      return { saved: true, projectId: snapshot.id, updatedAt: snapshot.updatedAt };
    },
  };
}
