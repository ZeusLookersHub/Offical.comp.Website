import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { Agent, AgentToolRegistry, createAgentTools, type AgentOptions, type AgentRequest, type AgentToolId,
  type AgentReasoner, type ToolContext, type ToolInvocation } from '../core/agent';
import { PROJECT_ENGINES } from '../core/projects/engines';
import { MemoryProjectRepository } from '../core/projects/repository';
import type { Project, ProjectWorkspaceState } from '../core/projects/types';
import { routeDeterministic } from '../core/brain';
import { evaluateQuestions, getQuestionSchema } from '../core/question-engine';
import { createAgentPersistence } from '../services/lookersAiAgentPersistence';
import { reasonNext } from '../core/agent/reasoning';

const now = '2026-10-08T00:00:00.000Z';
const project = (): Project => ({ id: 'p1', ownerId: null, title: 'Explicit title', engineId: 'other', status: 'active', createdAt: now, updatedAt: now,
  schema: { intent: 'Prepare supplied information', objective: 'Explain it clearly', context: '', audience: '', references: [],
    constraints: ['Do not invent facts'], output: { description: 'A brief', format: 'PDF', deliverables: [] }, language: 'en', targetTools: [], enhancements: [] } });
const request = (): AgentRequest => ({ project: project() });
const agent = (extra: Partial<AgentOptions> = {}, registry?: AgentToolRegistry) => new Agent({ access: { projectId: 'p1' }, ...extra }, registry);
const context = (p = project()): ToolContext => ({ project: p, access: { projectId: p.id }, signal: new AbortController().signal });
const invoke = (toolId: AgentToolId, input: Record<string, unknown> = {}): ToolInvocation => ({ toolId, input });
const workspace = (p = project()): ProjectWorkspaceState => ({ version: 1, currentProjectId: p.id, projects: [p],
  sessions: { [p.id]: { projectId: p.id, step: 'review', taskType: 'general', answers: { idea: p.schema.intent }, activity: [] } } });

test('valid canonical request without Brain, AI or tools returns a structured ready decision', async () => {
  const r = await agent().run(request());
  assert.equal(r.decision.action, 'complete'); assert.equal(r.decision.reason, 'ready_for_next_stage');
  assert.equal(r.steps, 0); assert.equal(r.error, undefined);
  assert.deepEqual(r.project, project());
});

test('incomplete project asks the exact Stage 03 question without calling tools or AI', async () => {
  const req = request(); req.project.schema.intent = '';
  const expected = evaluateQuestions({ project: req.project });
  let called = false;
  const r = await agent({ reasoner: { reason: async () => { called = true; return null; } } }).run(req);
  assert.equal(r.decision.action, 'ask_question'); assert.equal(r.decision.questionId, expected.question?.id);
  assert.equal(called, false); assert.equal(r.steps, 0);
});

test('known factual gaps in CV are asked, never filled by reasoner hints', async () => {
  const req = request(); req.project.engineId = 'cv';
  const r = await agent({ reasoner: { reason: async () => ({ experience: 'Invented CEO' }) } }).run(req);
  assert.equal(r.decision.action, 'ask_question');
  assert.ok(['details.targetRole', 'details.experience'].includes(r.decision.questionId!));
  assert.deepEqual(r.project, req.project); assert.ok(!JSON.stringify(r).includes('Invented CEO'));
});

test('Question Engine confirmation, user overrides and Arabic question selection are retained', async () => {
  const req = request(); req.project.engineId = 'visual.image'; req.project.schema.language = 'ar';
  req.questionSession = { projectId: 'p1', engineId: 'visual.image', fields: {
    'details.subject': { source: 'user', value: 'Bottle' }, 'details.aspectRatio': { source: 'inference', value: '9:16' },
  } };
  const pending = await agent().run(req);
  assert.equal(pending.decision.action, 'needs_confirmation');
  assert.equal(pending.decision.questionId, 'details.aspectRatio');
  req.questionSession.fields['details.aspectRatio'] = { source: 'user', value: '1:1' };
  const resolved = await agent().run(req);
  assert.equal(resolved.decision.action, 'complete');
  assert.equal(resolved.questionState?.fields.find(f => f.field === 'details.aspectRatio')?.value, '1:1');
  assert.equal(resolved.project?.schema.language, 'ar');
});

test('forged, incomplete or stale cached Question Engine state cannot bypass required questions', async () => {
  for (const state of [{ status: 'complete' }, {}, { ...evaluateQuestions({ project: project() }), missingFields: ['invented'] }]) {
    const req = request(); req.questionState = state as never;
    assert.equal((await agent().run(req)).error, 'invalid_question_state');
  }
  const req = request(); req.questionState = evaluateQuestions({ project: req.project });
  assert.equal((await agent().run(req)).decision.action, 'complete');
  req.project.schema.intent = '';
  assert.equal((await agent().run(req)).error, 'invalid_question_state');
});

test('Brain ambiguity and engine conflicts require confirmation and preserve chosen engine', async () => {
  const req = request();
  req.brainDecision = routeDeterministic({ input: 'A visual', language: 'en' }).decision;
  assert.equal((await agent().run(req)).decision.reason, 'brain_clarification_required');
  req.brainDecision = routeDeterministic({ input: 'Create an image', language: 'en' }).decision;
  req.brainDecision.knownFields.client = 'Untrusted client';
  const r = await agent().run(req);
  assert.equal(r.decision.reason, 'engine_override_conflict'); assert.equal(r.project?.engineId, 'other');
  assert.ok(!JSON.stringify(r).includes('Untrusted client'));
  req.brainDecision = routeDeterministic({ input: 'Do the task', language: 'en', context: { output: 'other' } }).decision;
  assert.equal((await agent().run(req)).decision.action, 'complete');
});

test('missing projects, malformed Brain inputs, unknown request properties and foreign sessions fail safely', async () => {
  for (const req of [null, {}, { project: null }, { ...request(), context: { apiKey: 'secret' } }, { ...request(), operations: 'bad' }])
    assert.equal((await agent().run(req as never)).error, 'invalid_request');
  assert.equal((await agent().run({ ...request(), brainDecision: { status: 'resolved' } } as never)).error, 'invalid_brain_decision');
  assert.equal((await agent().run({ ...request(), questionSession: { projectId: 'other', engineId: 'other', fields: {} } })).error, 'invalid_question_state');
});

test('tool reads canonical schema, Core engine registry and Stage 03 question definitions', async () => {
  const registry = new AgentToolRegistry(); const c = context();
  for (const [call, expected] of [
    [invoke('get_project_schema'), c.project.schema],
    [invoke('get_engine_definition'), PROJECT_ENGINES.find(e => e.id === c.project.engineId)],
    [invoke('get_question_definition', { questionId: 'intent' }), getQuestionSchema('other').definitions.find(q => q.id === 'intent')],
  ] as const) {
    const r = await registry.invoke(call, c); assert.equal(r.ok, true);
    if (r.ok) assert.deepEqual(r.value, expected);
  }
});

test('valid explicit tool queue executes once per step and returns validated results', async () => {
  const req = request(); req.operations = [invoke('get_engine_definition'), invoke('validate_prompt', { prompt: 'Use supplied facts.' })];
  const r = await agent().run(req);
  assert.equal(r.decision.action, 'complete'); assert.equal(r.steps, 2); assert.equal(r.trace.length, 2);
  assert.ok(r.trace.every(t => t.decision.action === 'use_tool' && t.result?.ok));
});

test('unknown tools and prototype names are rejected rather than executed', async () => {
  for (const id of ['shell', 'fetch', '__proto__', 'constructor']) {
    const req = request(); req.operations = [{ toolId: id, input: {} }] as never;
    assert.equal((await agent().run(req)).error, 'unknown_tool');
  }
});

test('malformed tool inputs and injected provider or repository properties never execute', async () => {
  let called = false;
  const tools = createAgentTools().map(t => ({ ...t, execute: async () => { called = true; return {}; } }));
  const registry = new AgentToolRegistry(tools);
  for (const call of [invoke('get_project_schema', { projectId: 'other' }), invoke('get_engine_definition', { providerId: 'injected' }),
    invoke('get_question_definition'), invoke('get_reference', { referenceId: 123 }),
    invoke('save_project_state', { project: { schema: { objective: 'invented' } } }), invoke('validate_prompt', { prompt: {} })]) {
    const r = await registry.invoke(call, context());
    assert.equal(r.ok, false); if (!r.ok) assert.equal(r.error, 'invalid_tool_input');
  }
  assert.equal(called, false);
});

test('malformed tool outputs and wrong-but-well-shaped facts are rejected', async () => {
  for (const value of [null, {}, { ...project().schema, objective: 'Invented fact' }]) {
    const tools = createAgentTools().map(t => t.id === 'get_project_schema' ? { ...t, execute: async () => value } : t);
    const r = await agent({}, new AgentToolRegistry(tools)).run({ ...request(), operations: [invoke('get_project_schema')] });
    assert.equal(r.error, 'invalid_tool_output');
    assert.deepEqual(r.project, project());
  }
});

test('tool exceptions are normalized and raw details do not escape', async () => {
  const tools = createAgentTools().map(t => ({ ...t, execute: async () => { throw new Error('private token'); } }));
  const r = await agent({}, new AgentToolRegistry(tools)).run({ ...request(), operations: [invoke('get_project_schema')] });
  assert.equal(r.error, 'tool_failed'); assert.ok(!JSON.stringify(r).includes('private token'));
});

test('tool execution is time bounded and receives an aborted signal on timeout', async () => {
  let abort: AbortSignal;
  const tools = createAgentTools().map(t => ({ ...t, execute: async (_i, c) => {
    abort = c.signal; return new Promise(() => {});
  } }));
  const r = await agent({ timeoutMs: 5 }, new AgentToolRegistry(tools)).run({ ...request(), operations: [invoke('get_project_schema')] });
  assert.equal(r.error, 'tool_timeout'); assert.equal(abort!.aborted, true);
});

test('maximum steps and repeated tool loop are enforced', async () => {
  const req = request(); req.operations = [invoke('get_project_schema'), invoke('get_engine_definition')];
  const limited = await agent({ maxSteps: 1 }).run(req);
  assert.equal(limited.error, 'step_limit'); assert.equal(limited.steps, 1);
  req.operations = [invoke('get_project_schema'), invoke('get_project_schema')];
  const loop = await agent().run(req); assert.equal(loop.error, 'tool_loop'); assert.equal(loop.steps, 1);
  for (const maxSteps of [0, -1, 1.5, 17, Infinity, NaN]) assert.equal((await agent({ maxSteps }).run(request())).error, 'invalid_options');
});

test('input project, user answers, constraints, format and excluded references remain unchanged', async () => {
  const req = request(); req.project.schema.references = [{ id: 'r', name: 'Private', kind: 'text', included: false, text: 'Sensitive' }];
  req.operations = [invoke('get_project_schema')]; const before = structuredClone(req);
  const r = await agent().run(req);
  assert.deepEqual(req, before); assert.deepEqual(r.project, before.project);
  r.project!.schema.constraints.push('changed result');
  assert.deepEqual(req, before);
});

test('mutating tool implementation receives isolated project and cannot alter Agent snapshot', async () => {
  const tools = createAgentTools().map(t => t.id === 'get_project_schema' ? { ...t, execute: async (_i, c) => {
    c.project.schema.objective = 'invented'; return c.project.schema;
  } } : t);
  const r = await agent({}, new AgentToolRegistry(tools)).run({ ...request(), operations: [invoke('get_project_schema')] });
  assert.equal(r.error, 'invalid_tool_output'); assert.deepEqual(r.project, project());
});

test('included references are project-scoped and are never fetched or extracted', async () => {
  const c = context(); c.project.schema.references = [
    { id: 'r', name: 'Brief', kind: 'text', included: true, text: 'Existing data' },
    { id: 'excluded', name: 'Private', kind: 'text', included: false, text: 'Private' },
  ];
  const registry = new AgentToolRegistry();
  const r = await registry.invoke(invoke('get_reference', { referenceId: 'r' }), c);
  assert.equal(r.ok, true); if (r.ok) assert.deepEqual(r.value, c.project.schema.references[0]);
  for (const referenceId of ['excluded', 'foreign']) {
    const denied = await registry.invoke(invoke('get_reference', { referenceId }), c);
    if (denied.ok === false) assert.equal(denied.error, 'unauthorized'); else assert.fail('reference disclosed');
  }
});

test('tool profiles and authorized owner memory remain unavailable boundaries', async () => {
  const registry = new AgentToolRegistry(); const c = context();
  const profile = await registry.invoke(invoke('get_tool_profile', { profileId: 'future' }), c);
  assert.equal(profile.ok, true); if (profile.ok) assert.deepEqual(profile.value, { available: false, profileId: 'future' });
  const denied = await registry.invoke(invoke('get_owner_memory'), c);
  assert.equal(denied.ok, false); if (!denied.ok) assert.equal(denied.error, 'unauthorized');
  c.project.ownerId = 'owner'; c.access.ownerId = 'owner';
  const unavailable = await registry.invoke(invoke('get_owner_memory'), c);
  assert.equal(unavailable.ok, true); if (unavailable.ok) assert.deepEqual(unavailable.value, { available: false });
});

test('structural prompt validation makes no factual accuracy claim', async () => {
  const r = await new AgentToolRegistry().invoke(invoke('validate_prompt', { prompt: '  ' }), context());
  assert.equal(r.ok, true); if (r.ok) assert.deepEqual(r.value, { valid: false, scope: 'structure', length: 2 });
});

test('saving requires an explicit capability and an application port', async () => {
  const req = { ...request(), operations: [invoke('save_project_state')] };
  assert.equal((await agent().run(req)).error, 'unauthorized');
  assert.equal((await agent({ access: { projectId: 'p1', canSave: true } }).run(req)).error, 'unavailable');
  const archived = request(); archived.project.status = 'archived'; archived.operations = req.operations;
  assert.equal((await agent({ access: { projectId: 'p1', canSave: true } }).run(archived)).error, 'unauthorized');
});

test('save adapter uses Core repository boundary and preserves workspace/session state', async () => {
  const repository = new MemoryProjectRepository(); const initial = workspace(); repository.save(initial);
  const persistence = createAgentPersistence(repository, initial.projects[0]);
  const r = await agent({ access: { projectId: 'p1', canSave: true }, persistence }).run({ ...request(), operations: [invoke('save_project_state')] });
  assert.equal(r.decision.action, 'complete'); assert.deepEqual(repository.load(), initial);
  assert.equal(r.trace[0].result?.ok, true);
});

test('save adapter rejects stale snapshots even when updatedAt did not change', async () => {
  const repository = new MemoryProjectRepository(); repository.save(workspace());
  const persistence = createAgentPersistence(repository, project());
  const changed = workspace(); changed.projects[0].schema.output.format = 'DOCX'; repository.save(changed);
  const r = await agent({ access: { projectId: 'p1', canSave: true }, persistence }).run({ ...request(), operations: [invoke('save_project_state')] });
  assert.equal(r.error, 'tool_failed'); assert.deepEqual(repository.load(), changed);
});

test('repository bypass, unapproved changes, cancellation and false save acknowledgements fail', async () => {
  const repository = new MemoryProjectRepository(); repository.save(workspace());
  const port = createAgentPersistence(repository, project()); const changed = project(); changed.schema.audience = 'Invented';
  await assert.rejects(port.save(changed, new AbortController().signal), /unapproved_snapshot/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(port.save(project(), controller.signal));
  const r = await agent({ access: { projectId: 'p1', canSave: true }, persistence: { save: async () => ({ saved: true, projectId: 'foreign', updatedAt: now }) } })
    .run({ ...request(), operations: [invoke('save_project_state')] });
  assert.equal(r.error, 'invalid_tool_output'); assert.deepEqual(repository.load(), workspace());
});

test('reasoner selects allowed read tools and then stops without seeing private data', async () => {
  let calls = 0;
  const reasoner: AgentReasoner = { reason: async r => {
    calls++; assert.ok(!JSON.stringify(r).includes('Private company')); assert.ok(!JSON.stringify(r).includes('Secret ref'));
    assert.ok(!r.tools.some(t => t.id === 'save_project_state'));
    return calls === 1 ? { action: 'use_tool', toolId: 'get_engine_definition', input: {}, confidence: .9 } : { action: 'complete', confidence: .9 };
  } };
  const req = request(); req.project.schema.context = 'Private company';
  req.project.schema.references = [{ id: 'r', name: 'Secret ref', kind: 'text', included: true, text: 'Private' }];
  const r = await agent({ reasoner }).run(req);
  assert.equal(r.decision.action, 'complete'); assert.equal(r.steps, 1); assert.equal(calls, 2);
});

test('reasoner failure or timeout safely falls back to deterministic readiness', async () => {
  for (const reasoner of [{ reason: async () => { throw new Error('private token'); } }, { reason: async () => new Promise(() => {}) }]) {
    const r = await agent({ reasoner, timeoutMs: 5 }).run(request());
    assert.equal(r.decision.action, 'complete'); assert.equal(r.warnings.length, 1);
    assert.ok(!JSON.stringify(r).includes('private token')); assert.equal(r.steps, 0);
  }
});

test('malformed, unsupported or provider-specific reasoning cannot trigger tools or change facts', async () => {
  const bad = [null, {}, 'complete', { action: 'complete', confidence: 2 }, { action: 'complete', confidence: .5 },
    { action: 'complete', confidence: .9, providerId: 'injected' }, { action: 'ask_question', questionId: 'invented', confidence: .9 },
    { action: 'use_tool', toolId: 'save_project_state', input: {}, confidence: .9 },
    { action: 'use_tool', toolId: 'get_owner_memory', input: {}, confidence: .9 },
    { action: 'use_tool', toolId: 'arbitrary_code', input: {}, confidence: .9 }];
  for (const value of bad) {
    const r = await agent({ reasoner: { reason: async () => value } }).run(request());
    assert.deepEqual(r.warnings, ['invalid_reasoning']); assert.equal(r.steps, 0); assert.deepEqual(r.project, project());
  }
});

test('reasoner tool loops and excessive non-repeating calls are bounded', async () => {
  const repeat = await agent({ reasoner: { reason: async () => ({ action: 'use_tool', toolId: 'get_project_schema', input: {}, confidence: .9 }) } }).run(request());
  assert.equal(repeat.error, 'tool_loop'); assert.equal(repeat.steps, 1);
  let n = 0;
  const limit = await agent({ maxSteps: 2, reasoner: { reason: async () => ({ action: 'use_tool', toolId: 'get_tool_profile', input: { profileId: String(++n) }, confidence: .9 }) } }).run(request());
  assert.equal(limit.error, 'step_limit'); assert.equal(limit.steps, 2); assert.equal(n, 2);
});

test('application authorization does not come from the request or another project', async () => {
  const r = await agent({ access: { projectId: 'someone-else' } }).run(request());
  assert.equal(r.error, 'unauthorized'); assert.equal(r.project, undefined);
  assert.equal((await agent().run({ ...request(), access: { projectId: 'p1', canSave: true } } as never)).error, 'invalid_request');
});

test('caller cancellation prevents calls and interrupts a waiting reasoner', async () => {
  const c = new AbortController(); c.abort();
  assert.equal((await agent().run(request(), c.signal)).error, 'aborted');
  const pending = new AbortController();
  const r = await agent({ reasoner: { reason: async () => { pending.abort(); return new Promise(() => {}); } } }).run(request(), pending.signal);
  assert.equal(r.error, 'aborted');
});

test('adversarial cyclic and excessive request structures are rejected', async () => {
  const cyclic = request() as unknown as Record<string, unknown>; cyclic.context = cyclic;
  assert.equal((await agent().run(cyclic as never)).error, 'invalid_request');
  assert.equal((await agent().run({ ...request(), operations: Array(33).fill(invoke('get_project_schema')) })).error, 'invalid_request');
});

test('Agent modules remain independent of providers, network, storage, UI and application services', () => {
  const forbidden = /openrouter|deepseek|gemini|gemma|anthropic|claude|openai|supabase|fetch\s*\(|XMLHttpRequest|localStorage|process\.env|import\.meta\.env|https?:\/\/|eval\s*\(|new Function|child_process/i;
  for (const file of readdirSync('core/agent').filter(f => f.endsWith('.ts'))) {
    const source = readFileSync(`core/agent/${file}`, 'utf8');
    assert.ok(!forbidden.test(source), file);
    assert.ok(!/from\s+['"](?:\.\.\/)+(?:services|pages|data|components)|from\s+['"]react/.test(source), file);
  }
});

test('critique: excluded reference content cannot be read through the schema tool', async () => {
  const c = context(); c.project.schema.references = [
    { id: 'yes', name: 'Included', kind: 'text', included: true, text: 'Visible' },
    { id: 'no', name: 'Excluded', kind: 'text', included: false, text: 'DO_NOT_DISCLOSE' },
  ];
  const r = await new AgentToolRegistry().invoke(invoke('get_project_schema'), c);
  assert.equal(r.ok, true); assert.ok(!JSON.stringify(r).includes('DO_NOT_DISCLOSE'));
  assert.equal(c.project.schema.references.length, 2);
});

test('critique: accessor-bearing request data is rejected without invoking accessors', async () => {
  let executed = false;
  const req = request();
  Object.defineProperty(req.project.schema, 'context', { enumerable: true, get() { executed = true; return 'Injected'; } });
  const r = await agent().run(req);
  assert.equal(r.error, 'invalid_request'); assert.equal(executed, false);
});

test('critique: accepted reasoning decisions do not retain mutable port-owned references', async () => {
  const raw = { action: 'use_tool', toolId: 'get_engine_definition', input: {}, confidence: .9 };
  const r = await reasonNext({ reason: async () => raw }, {
    engineId: 'other', language: 'en', questionStatus: 'complete', history: [],
    tools: new AgentToolRegistry().reasoningTools(), remainingSteps: 2,
  }, 100);
  raw.toolId = 'save_project_state';
  assert.equal(r.decision?.action, 'use_tool');
  if (r.decision?.action === 'use_tool') assert.equal(r.decision.toolId, 'get_engine_definition');
});
