import test from "node:test";
import assert from "node:assert/strict";
import { isProjectEngineId } from "../core/projects/engines";
import { MemoryProjectRepository } from "../core/projects/repository";
import { ProjectStateManager } from "../core/projects/state";
import { validateProject, validateProjectWorkspaceState } from "../core/projects/validation";
import type { Project, ProjectWorkspaceState, ProjectWizardSession } from "../core/projects/types";
import { LocalStorageProjectRepository } from "../services/localStorageProjectRepository";
import { lookersAiProjectState } from "../services/lookersAiProjectState";
import { emptyProjectState } from "../data/lookersAi";

const timestamp = "2026-10-02T12:00:00.000Z";
const project = (id = "p1", status: Project["status"] = "active"): Project => ({
  id, ownerId: null, title: "Project", engineId: "other", status,
  createdAt: timestamp, updatedAt: timestamp,
  schema: {
    intent: "Create", objective: "Outcome", context: "", audience: "",
    references: [{ id: "ref-1", name: "reference.png", kind: "image", included: true, sizeBytes: 10 }],
    constraints: [], output: { description: "Deliverable", deliverables: ["Prompt"] },
    language: "en", targetTools: [], enhancements: [],
  },
});
const session = (id = "p1"): ProjectWizardSession => ({
  projectId: id, step: "home", taskType: "general", answers: {},
  activity: [{ at: timestamp, action: "created" }],
});
const workspace = (currentId = "p1"): ProjectWorkspaceState => ({
  version: 1, currentProjectId: currentId,
  projects: [project(currentId)],
  sessions: { [currentId]: session(currentId) },
});

test("engine registry accepts only canonical engine IDs", () => {
  assert.equal(isProjectEngineId("visual.image"), true);
  assert.equal(isProjectEngineId("business-plan"), true);
  assert.equal(isProjectEngineId("campaign"), false);
  assert.equal(isProjectEngineId("openrouter"), false);
});

test("project validation rejects bad engine IDs, timestamps, references, and output", () => {
  assert.equal(validateProject(project()).valid, true);
  assert.equal(validateProject({ ...project(), engineId: "campaign" }).valid, false);
  assert.equal(validateProject({ ...project(), createdAt: "October 2, 2026" }).valid, false);
  assert.equal(validateProject({ ...project(), updatedAt: "2026-02-30T12:00:00Z" }).valid, false);
  assert.equal(validateProject({ ...project(), schema: { ...project().schema, references: [{ id: "", name: "x", kind: "invalid", included: true }] } }).valid, false);
  assert.equal(validateProject({ ...project(), schema: { ...project().schema, output: { description: "x", deliverables: "wrong" } } }).valid, false);
});

test("workspace validation rejects duplicate IDs, missing/archived current projects, and malformed/missing sessions", () => {
  assert.equal(validateProjectWorkspaceState(workspace()).valid, true);
  assert.equal(validateProjectWorkspaceState({ ...workspace(), projects: [project(), project()] }).valid, false);
  assert.equal(validateProjectWorkspaceState({ ...workspace(), currentProjectId: "missing" }).valid, false);
  assert.equal(validateProjectWorkspaceState({ ...workspace(), projects: [project("p1", "archived")] }).valid, false);
  assert.equal(validateProjectWorkspaceState({ ...workspace(), sessions: {} }).valid, false);
  assert.equal(validateProjectWorkspaceState({ ...workspace(), sessions: { p1: { ...session(), activity: [{ at: "bad", action: "x" }] } } }).valid, false);
  assert.equal(validateProjectWorkspaceState({ ...workspace(), sessions: { p1: session(), orphan: session("orphan") } }).valid, false);
});

test("state manager saves, loads, upserts, and selects through ProjectRepository", () => {
  const repository = new MemoryProjectRepository();
  const manager = new ProjectStateManager(repository);
  manager.save(workspace());
  assert.equal(manager.load()?.currentProjectId, "p1");
  const second = { ...project("p2"), title: "Second" };
  const afterUpsert = manager.upsert(second, session("p2"));
  assert.equal(afterUpsert.currentProjectId, "p2");
  assert.equal(afterUpsert.projects.find((item) => item.id === "p1")?.status, "draft");
  const afterSelect = manager.select("p1");
  assert.equal(afterSelect.currentProjectId, "p1");
  assert.throws(() => manager.select("missing"), /project_not_selectable/);
});

test("state manager rejects corrupted repository state without accepting it", () => {
  const repository = { load: () => ({ broken: true }), save: () => undefined };
  assert.equal(new ProjectStateManager(repository).load(), null);
});

test("browser repository treats malformed storage JSON as empty", () => {
  const repository = new LocalStorageProjectRepository(() => ({
    getItem: () => "{not-json",
    setItem: () => undefined,
  }));
  assert.equal(repository.load(), null);
});

test("legacy Lookers AI state migrates at the adapter boundary and preserves draft data", () => {
  const legacy = emptyProjectState();
  legacy.current.title = "Legacy draft";
  legacy.current.answers.idea = "A preserved idea";
  legacy.current.attachments = [{
    id: "legacy-ref", name: "brief.txt", mime: "text/plain", size: 5,
    kind: "text", include: true, note: "", text: "Reference",
  }];
  legacy.current.activity.push({ at: timestamp, action: "edited" });
  const values = new Map<string, string>([["lookers-ai-project-state-v1", JSON.stringify(legacy)]]);
  const fakeWindow = { localStorage: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  } };
  Object.defineProperty(globalThis, "window", { configurable: true, value: fakeWindow });
  try {
    const loaded = lookersAiProjectState.load("en");
    assert.equal(loaded.current.title, "Legacy draft");
    assert.equal(loaded.current.answers.idea, "A preserved idea");
    assert.equal(loaded.current.attachments[0]?.text, "Reference");
    const persisted = JSON.parse(values.get("lookers-ai-project-core-v1") || "null") as ProjectWorkspaceState;
    assert.equal(validateProjectWorkspaceState(persisted).valid, true);
  } finally {
    Reflect.deleteProperty(globalThis, "window");
  }
});
