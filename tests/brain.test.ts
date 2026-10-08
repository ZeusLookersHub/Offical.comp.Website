import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { Brain, applyBrainDecision, normalizeText, routeDeterministic } from "../core/brain";
import type { BrainAIReasoner, BrainReasoningRequest, BrainRequest } from "../core/brain";
import type { Project, ProjectEngineId } from "../core/projects/types";

const ts = "2026-10-02T12:00:00.000Z";
const project = (engineId: ProjectEngineId = "cv", status: Project["status"] = "active"): Project => ({
  id: "p1", ownerId: null, title: "P", engineId, status, createdAt: ts, updatedAt: ts,
  schema: {
    intent: "Create", objective: "Land a job", context: "", audience: "Recruiters",
    references: [{ id: "r1", name: "old-cv.pdf", kind: "document", included: true, dataUrl: "data:SECRET" }],
    constraints: ["One page"], output: { description: "CV", format: "PDF", deliverables: [] },
    language: "en", targetTools: [], enhancements: [],
  },
});
const req = (input: string, extra: Partial<BrainRequest> = {}): BrainRequest => ({ input, language: "en", ...extra });

class SpyReasoner implements BrainAIReasoner {
  calls: BrainReasoningRequest[] = [];
  constructor(private readonly answer: () => Promise<unknown>) {}
  reason(request: BrainReasoningRequest) { this.calls.push(request); return this.answer() as Promise<{ engineId: string | null; confidence: number }>; }
}
const ask = (reasoner: BrainAIReasoner) => new Brain({ reasoner, aiTimeoutMs: 50 });

test("normalization unifies Arabic variants, strips diacritics and punctuation", () => {
  assert.equal(normalizeText("  Résumé!!  "), "resume");
  assert.equal(normalizeText("سِيرَة ذَاتِيَّة"), "سيره ذاتيه");
  assert.equal(normalizeText("أهلاً بالـعالم"), "اهلا بالعالم");
  assert.equal(normalizeText(undefined), "");
});

test("explicit output resolves deterministically without AI and beats conflicting text", async () => {
  const table: Array<[string, ProjectEngineId]> = [
    ["image", "visual.image"], ["video", "visual.video"], ["CV", "cv"], ["PowerPoint", "powerpoint"], ["xlsx", "excel"],
    ["report", "report"], ["proposal", "proposal"], ["business-plan", "business-plan"], ["project/product", "project-product"],
    ["visual.image", "visual.image"], ["صورة", "visual.image"], ["other", "other"],
  ];
  const spy = new SpyReasoner(async () => { throw new Error("must not be called"); });
  for (const [output, engineId] of table) {
    const decision = await ask(spy).decide(req("anything", { context: { output } }));
    assert.equal(decision.engineId, engineId, output);
    assert.equal(decision.status, "resolved");
    assert.equal(decision.source, "explicit_output");
  }
  const conflict = await ask(spy).decide(req("make an image", { context: { output: "video" } }));
  assert.equal(conflict.engineId, "visual.video");
  assert.equal(spy.calls.length, 0);
});

test("clear English and Arabic requests resolve deterministically without AI", async () => {
  const cases: Array<[string, ProjectEngineId]> = [
    ["Create a photo of a red car", "visual.image"], ["I need a short video clip", "visual.video"],
    ["Write my resume", "cv"], ["Build a pitch deck", "powerpoint"], ["Make an Excel sheet for sales", "excel"],
    ["Prepare a quarterly report", "report"], ["Draft a proposal for the client", "proposal"],
    ["Write a business plan", "business-plan"], ["Write a PRD for my MVP", "project-product"],
    ["اعمل لي صورة لمنتج", "visual.image"], ["محتاج فيديو قصير", "visual.video"], ["اكتب لي سيرة ذاتية", "cv"],
    ["اعمل للشركة عرض تقديمي", "powerpoint"], ["محتاج جدول بيانات اكسل", "excel"], ["اكتب التقرير الشهري", "report"],
    ["محتاج عرض مقترح لعميل", "proposal"], ["اعمل خطة عمل", "business-plan"], ["عايز فكرة تطبيق جوال", "project-product"],
  ];
  const spy = new SpyReasoner(async () => { throw new Error("must not be called"); });
  for (const [input, engineId] of cases) {
    const decision = await ask(spy).decide(req(input, { language: /[\u0600-\u06FF]/.test(input) ? "ar" : "en" }));
    assert.equal(decision.engineId, engineId, input);
    assert.equal(decision.status, "resolved", input);
    assert.ok(decision.confidence >= 0.9, input);
  }
  assert.equal(spy.calls.length, 0);
});

test("ambiguous requests report candidates and ambiguous fields instead of guessing", async () => {
  const business = await new Brain().decide(req("Make something for my business"));
  assert.equal(business.status, "needs_clarification");
  assert.equal(business.engineId, null);
  assert.equal(business.confidence, 0);
  assert.deepEqual(business.candidates, ["business", "report", "proposal", "business-plan", "project-product"]);
  assert.deepEqual(business.ambiguousFields, ["output"]);

  const visual = await new Brain().decide(req("I need a visual for my launch"));
  assert.deepEqual(visual.candidates, ["visual.image", "visual.video"]);
  assert.equal(visual.intent, "create_visual");

  const multi = await new Brain().decide(req("A business plan as a presentation"));
  assert.equal(multi.status, "needs_clarification");
  assert.deepEqual(multi.candidates, ["powerpoint", "business-plan"]);

  const none = routeDeterministic(req("hello there"));
  assert.equal(none.decision.status, "needs_clarification");
  assert.deepEqual(none.decision.ambiguousFields, ["intent", "output"]);
  assert.ok(none.askAi);
});

test("the verb \"resume\" does not route to the CV engine", () => {
  assert.equal(routeDeterministic(req("Let's resume the project")).decision.engineId, null);
  assert.equal(routeDeterministic(req("please resume working on it")).decision.engineId, null);
  assert.equal(routeDeterministic(req("Update my resume with my new job")).decision.engineId, "cv");
});

test("existing project continues only when there is no new signal and a specific engine", async () => {
  const cont = await new Brain().decide(req("make it shorter", { existingProject: project("cv") }));
  assert.equal(cont.engineId, "cv");
  assert.equal(cont.source, "existing_project");
  assert.equal(cont.confidence, 0.7);
  assert.deepEqual(cont.knownFields, {
    language: "en", objective: "Land a job", audience: "Recruiters", constraints: ["One page"],
    outputFormat: "PDF", references: ["old-cv.pdf"],
  });
  assert.ok(!JSON.stringify(cont).includes("SECRET"));

  assert.equal((await new Brain().decide(req("make it shorter", { existingProject: project("other") }))).status, "needs_clarification");
  assert.equal((await new Brain().decide(req("make it shorter", { existingProject: project("cv", "archived") }))).status, "needs_clarification");
  const changed = await new Brain().decide(req("now make a video", { existingProject: project("cv") }));
  assert.equal(changed.engineId, "visual.video");
  assert.ok(changed.reasons.some((reason) => reason.includes("Differs")));
});

test("AI is consulted only for ambiguity, only among candidates, and its confidence is capped", async () => {
  const spy = new SpyReasoner(async () => ({ engineId: "visual.video", confidence: 0.99 }));
  const decision = await ask(spy).decide(req("I need a visual for my launch"));
  assert.equal(spy.calls.length, 1);
  assert.deepEqual(spy.calls[0].candidates.map((candidate) => candidate.id), ["visual.image", "visual.video"]);
  assert.ok(spy.calls[0].signal instanceof AbortSignal);
  assert.equal(decision.status, "resolved");
  assert.equal(decision.engineId, "visual.video");
  assert.equal(decision.source, "ai");
  assert.equal(decision.confidence, 0.85);
  assert.deepEqual(decision.ambiguousFields, []);
  assert.equal(decision.knownFields.output, undefined);
});

test("empty input never reaches AI", async () => {
  const spy = new SpyReasoner(async () => ({ engineId: "cv", confidence: 1 }));
  const decision = await ask(spy).decide(req("   "));
  assert.equal(spy.calls.length, 0);
  assert.equal(decision.status, "needs_clarification");
});

test("unusable AI answers fall back to clarification with invalid_ai_response or no error", async () => {
  const invalid: unknown[] = [
    { engineId: "cv", confidence: 0.9 }, { engineId: "visual.image", confidence: 7 }, { engineId: 5, confidence: 0.9 },
    null, "visual.image", { engineId: "visual.image" },
  ];
  for (const answer of invalid) {
    const decision = await ask(new SpyReasoner(async () => answer)).decide(req("I need a visual"));
    assert.equal(decision.status, "needs_clarification", JSON.stringify(answer));
    assert.equal(decision.errorCode, "invalid_ai_response", JSON.stringify(answer));
  }
  const unsure = await ask(new SpyReasoner(async () => ({ engineId: null, confidence: 0.9 }))).decide(req("I need a visual"));
  assert.equal(unsure.status, "needs_clarification");
  assert.equal(unsure.errorCode, undefined);
  const low = await ask(new SpyReasoner(async () => ({ engineId: "visual.image", confidence: 0.4 }))).decide(req("I need a visual"));
  assert.equal(low.status, "needs_clarification");
  assert.equal(low.errorCode, undefined);
});

test("AI failures are normalized, never throw, and never leak error details", async () => {
  const limited = await ask(new SpyReasoner(async () => { throw Object.assign(new Error("sk-secret"), { code: "provider_rate_limited" }); }))
    .decide(req("I need a visual"));
  assert.equal(limited.errorCode, "provider_rate_limited");
  const unknown = await ask(new SpyReasoner(async () => { throw new Error("sk-secret stack"); })).decide(req("I need a visual"));
  assert.equal(unknown.errorCode, "provider_unavailable");
  for (const decision of [limited, unknown]) {
    assert.equal(decision.status, "needs_clarification");
    assert.ok(!JSON.stringify(decision).includes("sk-secret"));
  }
  const slow = new SpyReasoner(() => new Promise(() => undefined));
  const timedOut = await ask(slow).decide(req("I need a visual"));
  assert.equal(timedOut.errorCode, "provider_timeout");
  assert.equal(slow.calls[0].signal.aborted, true);
});

test("Brain tolerates malformed requests and does not mutate its input", async () => {
  for (const bad of [null, undefined, {}, { input: 42 }, { input: "x".repeat(100000), language: "zz" }]) {
    const decision = await new Brain().decide(bad as unknown as BrainRequest);
    assert.equal(decision.status, "needs_clarification");
  }
  const existing = project("cv");
  const snapshot = JSON.stringify(existing);
  await new Brain().decide(req("make a video", { existingProject: existing, context: { output: "image" } }));
  assert.equal(JSON.stringify(existing), snapshot);
});

test("applyBrainDecision updates only resolved decisions on non-archived projects, purely", async () => {
  const base = project("other");
  const resolved = await new Brain().decide(req("Write my resume"));
  const next = applyBrainDecision(base, resolved, "2026-10-03T00:00:00.000Z");
  assert.equal(next.engineId, "cv");
  assert.equal(next.updatedAt, "2026-10-03T00:00:00.000Z");
  assert.equal(base.engineId, "other");
  assert.equal(applyBrainDecision(base, await new Brain().decide(req("I need a visual")), "x"), base);
  assert.equal(applyBrainDecision(project("other", "archived"), resolved, "x").engineId, "other");
  assert.equal(applyBrainDecision(next, resolved, "x"), next);
});

test("Brain stays provider-neutral, UI-neutral and persistence-neutral", () => {
  const forbidden = /openrouter|deepseek|gemini|gemma|anthropic|claude|openai|gpt|supabase|fetch\s*\(|XMLHttpRequest|localStorage|process\.env|import\.meta\.env|https?:\/\//i;
  const badImport = /from\s+["'](?:\.\.\/)+(?:services|pages|data|components)|from\s+["']react/;
  const files = readdirSync("core/brain").filter((name) => name.endsWith(".ts"));
  assert.ok(files.length >= 5);
  for (const file of files) {
    const source = readFileSync(`core/brain/${file}`, "utf8");
    assert.ok(!forbidden.test(source), `${file} contains provider/network/storage coupling`);
    assert.ok(!badImport.test(source), `${file} imports UI/service code`);
  }
});
