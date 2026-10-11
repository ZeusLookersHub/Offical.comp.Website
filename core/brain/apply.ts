import { isProjectEngineId } from "../projects/engines";
import type { Project } from "../projects/types";
import type { BrainDecision } from "./types";

/**
 * Applies a resolved Brain decision to a canonical Project. Pure: returns the same object when nothing changes.
 * Archived projects are never modified, and clarification decisions never change a project.
 */
export const applyBrainDecision = (project: Project, decision: BrainDecision, now: string): Project => {
  if (decision.status !== "resolved" || !isProjectEngineId(decision.engineId)) return project;
  if (project.status === "archived" || project.engineId === decision.engineId) return project;
  return { ...project, engineId: decision.engineId, updatedAt: now };
};
