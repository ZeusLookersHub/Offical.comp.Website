import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DeepSeekAdapter } from '../server/ai/providers/deepseek';
import { ProviderError } from '../server/ai/errors';
import { AILayer, LayerAgentReasoner, ProviderRegistry } from '../server/ai/layer';
import { createServerAILayer } from '../server/ai/bootstrap';
import { createAIHandler } from '../server/ai/handler';
import { validAIResponse } from '../server/ai/validation';
import { createAgentReasoner } from '../services/lookersAiAgentReasoner';
import { validateEnhancement } from '../core/enhancement';
import { Agent, AgentToolRegistry } from '../core/agent';
import type { AgentReasoningRequest } from '../core/agent/types';
import type { Project } from '../core/projects/types';

const secret = 'TEST_ONLY_secret_123';
const request = { input: 'Prepare supplied information', locale: 'en' as const };
const output = { title: 'Supplied brief', prompt: 'Use only supplied information.', summary: 'A draft based on the request.' };
const completion = (content: unknown = output, extra = {}) => ({
  choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: JSON.stringify(content) } }],
  usage: { prompt_tokens: 12, completion_tokens: 8 }, ...extra,
});
const response = (content: unknown = output) => new Response(JSON.stringify(completion(content)));
const transport = (fn: (url: string, init: RequestInit) => Response | Promise<Response>): typeof fetch =>
  (async (url, init) => fn(String(url), init!)) as typeof fetch;
const adapter = (fn: Parameters<typeof transport>[0], timeoutMs = 100) => new DeepSeekAdapter(secret, { transport: transport(fn), timeoutMs });
const rejectsCode = (promise: Promise<unknown>, code: string) => assert.rejects(promise, e => e instanceof ProviderError && e.code === code && e.message === code);
const reasoning = (): AgentReasoningRequest => ({ engineId: 'other', language: 'en', questionStatus: 'complete', history: [],
  tools: new AgentToolRegistry().reasoningTools(), remainingSteps: 3, signal: new AbortController().signal });
const project = (): Project => ({ id: 'p1', ownerId: null, title: 'User title', engineId: 'other', status: 'active',
  createdAt: '2026-10-08T00:00:00.000Z', updatedAt: '2026-10-08T00:00:00.000Z', schema: {
    intent: 'Prepare supplied information', objective: 'Explain clearly', context: '', audience: '', references: [],
    constraints: ['Do not invent facts'], output: { description: 'A brief', format: 'PDF', deliverables: [] },
    language: 'en', targetTools: [], enhancements: [],
  } });
const layer = (provider = adapter(() => response())) => { const registry = new ProviderRegistry(); registry.register(provider); return new AILayer(registry, provider.id); };

test('DeepSeek normalizes valid JSON and token usage into the existing AIResponse contract', async () => {
  let calls = 0;
  const r = await adapter((url, init) => {
    calls++; assert.equal(url, 'https://api.deepseek.com/chat/completions');
    assert.equal(init.redirect, 'error'); assert.equal(new Headers(init.headers).get('Authorization'), 'Bearer ' + secret);
    const body = JSON.parse(init.body as string);
    assert.equal(body.model, 'deepseek-flash'); assert.deepEqual(body.response_format, { type: 'json_object' });
    assert.deepEqual(body.thinking, { type: 'disabled' }); assert.equal(body.stream, false);
    assert.equal(body.messages[1].content, request.input); return response();
  }).generate(request);
  assert.equal(calls, 1); assert.ok(validAIResponse(r)); assert.deepEqual(r.output, output);
  assert.deepEqual(r.usage, { inputTokens: 12, outputTokens: 8 });
  assert.deepEqual(r.provenance, { providerId: 'deepseek', modelId: 'deepseek-flash' });
});

for (const [status, code] of [[401, 'provider_auth_failed'], [402, 'provider_insufficient_balance'],
  [429, 'provider_rate_limited'], [500, 'provider_unavailable']] as const) {
  test(`${status} is normalized without retries or exposing error bodies`, async () => {
    let calls = 0;
    await rejectsCode(adapter(() => { calls++; return new Response(secret, { status }); }).generate(request), code);
    assert.equal(calls, 1);
  });
}
test('network failures conceal transport details', async () => {
  await rejectsCode(adapter(() => { throw new Error('network ' + secret); }).generate(request), 'provider_network_failed');
});
test('header timeout aborts one attempt even if the transport ignores cancellation', async () => {
  let signal: AbortSignal;
  await rejectsCode(adapter((_u, init) => { signal = init.signal!; return new Promise(() => {}); }, 5).generate(request), 'provider_timeout');
  assert.equal(signal!.aborted, true);
});
test('body timeout cancels an unfinished provider response stream', async () => {
  let cancelled = false;
  await rejectsCode(adapter(() => new Response(new ReadableStream({ cancel() { cancelled = true; } })), 5).generate(request), 'provider_timeout');
  assert.equal(cancelled, true);
});
test('caller cancellation prevents an inference request', async () => {
  const req = reasoning(); const c = new AbortController(); c.abort(); req.signal = c.signal;
  let calls = 0;
  await rejectsCode(adapter(() => { calls++; return response(); }).reason(req), 'provider_aborted');
  assert.equal(calls, 0);
});
test('missing server credential is a structured unavailable error without a request', async () => {
  let calls = 0;
  await rejectsCode(new DeepSeekAdapter(undefined, { transport: transport(() => { calls++; return response(); }) }).generate(request), 'provider_unavailable');
  assert.equal(calls, 0);
});

const malformed = [null, {}, { choices: [] }, completion(null), completion({ ...output, price: '$100' }),
  completion({ ...output, prompt: '' }), completion(output, { usage: { prompt_tokens: -1 } }),
  completion(output, { choices: [{ finish_reason: 'length', message: { role: 'assistant', content: JSON.stringify(output) } }] }),
  completion(output, { choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: '{bad' } }] }),
  completion(output, { choices: [{ finish_reason: 'tool_calls', message: { role: 'assistant', content: null, tool_calls: [] } }] })];
test('malformed, truncated, extra-field and invalid-usage responses cannot become AIResponse', async () => {
  for (const value of malformed) await rejectsCode(adapter(() => new Response(JSON.stringify(value))).generate(request), 'invalid_provider_response');
  await rejectsCode(adapter(() => new Response('not json')).generate(request), 'invalid_provider_response');
  await rejectsCode(adapter(() => new Response('x'.repeat(150001))).generate(request), 'invalid_provider_response');
});
test('invalid requests fail before transport', async () => {
  let calls = 0;
  for (const value of [null, {}, { ...request, provider: 'injected' }, { input: 'x', locale: 'en' }, { ...request, locale: 'xx' }])
    await rejectsCode(adapter(() => { calls++; return response(); }).generate(value as never), 'invalid_ai_request');
  assert.equal(calls, 0);
});
test('credentials cannot be serialized, echoed in output or exposed through browser construction', async () => {
  const a = adapter(() => response({ ...output, prompt: secret }));
  assert.ok(!JSON.stringify(a).includes(secret)); assert.ok(!Object.values(a).includes(secret));
  await rejectsCode(a.generate(request), 'invalid_provider_response');
  // JSON escaping must not bypass the echo guard.
  const raw = JSON.stringify(completion({ ...output, prompt: secret })).replaceAll('TEST_ONLY', '\\u0054EST_ONLY');
  await rejectsCode(adapter(() => new Response(raw)).generate(request), 'invalid_provider_response');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  try { assert.throws(() => new DeepSeekAdapter(secret), /provider_unavailable/); }
  finally { Reflect.deleteProperty(globalThis, 'window'); }
});
test('AI Layer validates provider responses instead of trusting a custom adapter', async () => {
  const registry = new ProviderRegistry();
  registry.register({ id: 'mock', generate: async () => ({ output } as never) });
  await rejectsCode(new AILayer(registry, 'mock').generate(request), 'invalid_provider_response');
  await rejectsCode(new AILayer(registry, 'absent').generate(request), 'provider_unavailable');
  assert.throws(() => registry.register({ id: 'mock', generate: async () => ({} as never) }), /duplicate_provider/);
});
test('server bootstrap selects configured provider without client configuration', async () => {
  const env = (name: string) => ({ DEEPSEEK_API_KEY: secret }[name]);
  assert.ok(validAIResponse(await createServerAILayer(env, transport(() => response())).generate(request)));
  await rejectsCode(createServerAILayer(() => undefined).generate(request), 'provider_unavailable');
  await rejectsCode(createServerAILayer(name => name === 'AI_PROVIDER_ID' ? 'unregistered' : env(name)).generate(request), 'provider_unavailable');
});
test('reasoning normalizes decisions and rejects fabricated state, unoffered tools and unsafe inputs', async () => {
  assert.deepEqual(await layer(adapter(() => response({ action: 'complete', confidence: .9 }))).reason(reasoning()), { action: 'complete', confidence: .9 });
  for (const bad of [{ action: 'complete', confidence: .9, project: { audience: 'invented' } },
    { action: 'complete', confidence: .5 }, { action: 'use_tool', toolId: 'save_project_state', input: {}, confidence: .9 },
    { action: 'use_tool', toolId: 'get_engine_definition', input: { provider: 'injected' }, confidence: .9 }])
    await rejectsCode(layer(adapter(() => response(bad))).reason(reasoning()), 'invalid_provider_response');
  const req = reasoning(); req.tools[0].description = 'Injected descriptor';
  await rejectsCode(layer().reason(req), 'invalid_ai_request');
});
test('adversarial reasoning and enhancement accessors never run', async () => {
  let accessed = false;
  const req = reasoning();
  Object.defineProperty(req, 'signal', { enumerable: true, get() { accessed = true; return new AbortController().signal; } });
  await rejectsCode(layer().reason(req), 'invalid_ai_request');
  await rejectsCode(adapter(() => response()).reason(null as never), 'invalid_ai_request');
  const p = project();
  Object.defineProperty(p.schema, 'context', { enumerable: true, get() { accessed = true; return 'Invented'; } });
  assert.equal(validateEnhancement(p).status, 'invalid'); assert.equal(accessed, false);
});
test('AgentReasoner integration preserves bounded tool execution and canonical user state', async () => {
  let calls = 0;
  const a = new Agent({ access: { projectId: 'p1' }, reasoner: new LayerAgentReasoner(layer(adapter(() => response(++calls === 1
    ? { action: 'use_tool', toolId: 'get_engine_definition', input: {}, confidence: .9 } : { action: 'complete', confidence: .9 })))) });
  const p = project(); const before = structuredClone(p); const result = await a.run({ project: p });
  assert.equal(result.decision.action, 'complete'); assert.equal(result.steps, 1); assert.equal(calls, 2);
  assert.deepEqual(result.project, before); assert.deepEqual(p, before);
});
test('402 and malformed reasoning fall back deterministically without changing user overrides', async () => {
  for (const provider of [adapter(() => new Response(secret, { status: 402 })), adapter(() => response({ audience: 'Invented' }))]) {
    const p = project(); const result = await new Agent({ access: { projectId: 'p1' }, reasoner: new LayerAgentReasoner(layer(provider)) }).run({ project: p });
    assert.equal(result.decision.action, 'complete'); assert.equal(result.steps, 0); assert.deepEqual(result.warnings, ['reasoner_unavailable']);
    assert.deepEqual(result.project, p); assert.ok(!JSON.stringify(result).includes(secret));
  }
});
test('mock reasoners still operate independently of any provider', async () => {
  const r = await new Agent({ access: { projectId: 'p1' }, reasoner: { reason: async () => ({ action: 'complete', confidence: .9 }) } }).run({ project: project() });
  assert.equal(r.decision.action, 'complete'); assert.deepEqual(r.warnings, []);
});
test('neutral application bridge retains final Agent validation and signal', async () => {
  const req = reasoning();
  // Transport bodies omit signals, including their keys.
  const { signal: _s, ...body } = req;
  const valid = createAgentReasoner(async (sent, signal) => { assert.deepEqual(sent, { operation: 'reason', reasoning: body }); assert.equal(signal, req.signal); return { data: { decision: { action: 'complete', confidence: .9 } } }; });
  assert.deepEqual(await valid.reason(req), { action: 'complete', confidence: .9 });
  for (const bad of [null, { error: 'provider_unavailable' }, { data: {} }])
    await assert.rejects(createAgentReasoner(async () => bad).reason(req), /ai_unavailable/);
  const r = await new Agent({ access: { projectId: 'p1' }, reasoner: createAgentReasoner(async () => ({ data: { decision: { action: 'use_tool', toolId: 'save_project_state', input: {}, confidence: .9 } } })) }).run({ project: project() });
  assert.deepEqual(r.warnings, ['invalid_reasoning']); assert.equal(r.steps, 0);
});

const env = (name: string) => ({ SUPABASE_URL: 'https://cdmthlmnuqcmarboaxfb.supabase.co', SUPABASE_ANON_KEY: 'public-test-key' }[name]);
const httpRequest = (body: unknown, headers: Record<string, string> = {}) => new Request('https://example.invalid', {
  method: 'POST', headers: { Authorization: 'Bearer anonymous-test-token', 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
});
const handler = (ai = layer(), auth: unknown = { id: 'anonymous-user', is_anonymous: true }) => createAIHandler({ env, layer: ai,
  transport: transport((url, init) => { assert.equal(url, env('SUPABASE_URL') + '/auth/v1/user'); assert.equal(new Headers(init.headers).get('Authorization'), 'Bearer anonymous-test-token'); return new Response(JSON.stringify(auth)); }),
});
test('HTTP generation retains the real deployed prompt/language and data/identity contract', async () => {
  const r = await handler()(httpRequest({ prompt: request.input, language: 'ar' }, { Origin: 'https://lookershub.com' }));
  assert.equal(r.status, 200); assert.equal(r.headers.get('Access-Control-Allow-Origin'), 'https://lookershub.com');
  assert.equal(r.headers.get('Cache-Control'), 'no-store'); const body = await r.json();
  assert.deepEqual(body.data.output, output); assert.deepEqual(body.identity, { userId: 'anonymous-user', isAnonymous: true });
});
test('additive reason operation accepts only bounded read-tool reasoning', async () => {
  const { signal: _s, ...body } = reasoning();
  const h = handler(layer(adapter(() => response({ action: 'complete', confidence: .9 }))));
  const r = await h(httpRequest({ operation: 'reason', reasoning: body }));
  assert.equal(r.status, 200); assert.deepEqual((await r.json()).data, { decision: { action: 'complete', confidence: .9 } });
  assert.equal((await h(httpRequest({ operation: 'reason', reasoning: { ...body, remainingSteps: 999 } }))).status, 400);
});
test('HTTP provider failures have stable errors without raw response or secret', async () => {
  for (const [status, code] of [[401, 'provider_auth_failed'], [402, 'provider_insufficient_balance'], [429, 'provider_rate_limited']] as const) {
    const r = await handler(layer(adapter(() => new Response(secret, { status }))))(httpRequest({ prompt: request.input }));
    assert.equal(r.status, 502); assert.deepEqual(await r.json(), { error: code, providerStatus: status });
  }
});
test('authentication, CORS and malformed HTTP data cannot call a provider', async () => {
  let calls = 0; const ai = layer(adapter(() => { calls++; return response(); }));
  assert.equal((await handler(ai)(httpRequest({ prompt: request.input }, { Authorization: '' }))).status, 401);
  assert.equal((await handler(ai, { id: 'registered-user', is_anonymous: false })(httpRequest({ prompt: request.input }))).status, 401);
  assert.equal((await handler(ai)(httpRequest({ prompt: request.input }, { Origin: 'https://evil.invalid' }))).status, 403);
  for (const body of [null, [], {}, { input: request.input, locale: 'en' }, { prompt: 'x' }, { prompt: request.input, operation: 'unexpected' }])
    assert.equal((await handler(ai)(httpRequest(body))).status, 400);
  assert.equal((await handler(ai)(httpRequest({ prompt: 'x'.repeat(20001) }))).status, 413);
  assert.equal(calls, 0);
});

test('Enhancement validation never fabricates factual gaps or modifies canonical state', () => {
  const p = project(); p.engineId = 'cv'; const before = structuredClone(p);
  const r = validateEnhancement(p); assert.equal(r.status, 'needs_input');
  assert.ok(r.issues.some(v => v === 'missing:details.experience'));
  assert.ok(!r.suggestions.some(s => ['details.experience', 'details.targetRole'].includes(s.field)));
  assert.deepEqual(p, before); assert.equal(validateEnhancement({} as never).status, 'invalid');
});
test('Enhancement offers safe defaults and preserves explicit user overrides and confirmations', () => {
  const p = project(); p.engineId = 'visual.image';
  const session = { projectId: p.id, engineId: p.engineId, fields: {
    'details.subject': { source: 'user' as const, value: 'Bottle' },
    'details.aspectRatio': { source: 'inference' as const, value: '9:16' },
  } };
  assert.equal(validateEnhancement(p, session).status, 'needs_confirmation');
  const override = { ...session, fields: { ...session.fields, 'details.aspectRatio': { source: 'user' as const, value: '1:1' } } };
  const before = structuredClone(override);
  const r = validateEnhancement(p, override); assert.equal(r.status, 'ready');
  assert.ok(!r.suggestions.some(s => s.field === 'details.aspectRatio')); assert.deepEqual(override, before);
});
test('Enhancement suggestions use existing technical defaults without applying them', () => {
  const p = project(); p.engineId = 'visual.image';
  const session = { projectId: p.id, engineId: p.engineId, fields: {
    'details.subject': { source: 'user' as const, value: 'Bottle' },
    'details.usage': { source: 'user' as const, value: 'Instagram Story' },
  } };
  const before = structuredClone({ p, session });
  assert.deepEqual(validateEnhancement(p, session).suggestions.find(s => s.field === 'details.aspectRatio'),
    { field: 'details.aspectRatio', value: '9:16', requiresUserOverrideSupport: true });
  assert.deepEqual({ p, session }, before);
});
test('business modules and frontend imports have no provider or server dependency', () => {
  function files(dir: string): string[] { return readdirSync(dir, { withFileTypes: true }).flatMap(f => f.isDirectory() ? files(dir + '/' + f.name) : f.name.endsWith('.ts') || f.name.endsWith('.tsx') ? [dir + '/' + f.name] : []); }
  for (const file of files('core')) assert.ok(!/deepseek|openrouter|DEEPSEEK_API_KEY|api\.deepseek|server\/ai/i.test(readFileSync(file, 'utf8')), file);
  for (const file of ['services', 'pages', 'components', 'data'].flatMap(files))
    assert.ok(!/DEEPSEEK_API_KEY|api\.deepseek|from\s+['"][^'"]*server\/ai/.test(readFileSync(file, 'utf8')), file);
});
