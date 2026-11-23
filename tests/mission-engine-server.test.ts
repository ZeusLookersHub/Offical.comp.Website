import assert from 'node:assert/strict';
import { test } from 'node:test';
import { answer, blueprintById, confirmBrief, createSession, submitIntake, nextStep, type Blueprint, type Session } from '../core/mission-engine/index.ts';
import { compose, extract, sanitizeSession } from '../server/engine/engine.ts';
import { createEngineHandler } from '../server/engine/handler.ts';
import { serverShape } from '../scripts/build-engine-blueprints.ts';
import { privateBlueprints } from '../server/engine/private-blueprints.ts';
import { routeFromEnv } from '../server/engine/router.ts';
const serverBlueprints = serverShape() as unknown as Blueprint[];
const lookup = (id: string) => serverBlueprints.find(b => b.id === id);
import { createChatJsonModel, createGeminiJsonModel, modelFromEnv, ModelError, type JsonModel } from '../server/engine/model.ts';
import { describeReference, createGeminiVision, createDeepSeekVision, visionFromEnv, visionWithBackup } from '../server/engine/vision.ts';

const photo = blueprintById('product-photo')!;

function scripted(replies: unknown[]): JsonModel & { calls: { system: string; user: string }[] } {
  const calls: { system: string; user: string }[] = [];
  return { id: 'mock', calls, async complete({ system, user }) { calls.push({ system, user }); return { json: replies.shift() }; } };
}

function confirmedPerfume(): Session {
  let s = (submitIntake(createSession(photo, 'ar', 'p'), photo, 'إعلان ممول لبرفان DAVIDOFF فخم') as { value: Session }).value;
  const replies: Record<string, string> = { product: 'زجاجة برفان زرقا بغطا فضي', basis: 'new' };
  for (let step = nextStep(s, photo); step.type === 'question'; step = nextStep(s, photo)) {
    s = (answer(s, photo, step.question.slot, replies[step.question.slot]) as { value: Session }).value;
  }
  return (confirmBrief(s, photo) as { value: Session }).value;
}

const good = {
  title: 'إعلان DAVIDOFF', prompt: 'Luxury product photo of a deep blue perfume bottle, label reads "DAVIDOFF", black marble, rim light, clean space at the top.',
  negative: 'text, letters, watermark, extra logos', params: { aspectRatio: '4:5' }, textOverlay: { mode: 'add-later' },
  variants: { universal: 'Deep blue perfume bottle, label reads "DAVIDOFF", black marble.' }, checklist: ['a', 'b', 'c', 'd'], summary: 's',
  coverage: { product: 'deep blue perfume bottle', style: 'Luxury product photo', usage: 'clean space at the top' },
};

test('compose: gate failure triggers exactly one targeted repair', async () => {
  const model = scripted([{ ...good, prompt: good.prompt.replace('DAVIDOFF', 'DAVIE DOVE') }, good]);
  const result = await compose(model, photo, confirmedPerfume());
  assert.equal(result.attempts, 2);
  assert.equal(result.report.ok, true);
  assert.match(model.calls[0].system, /ROLE: Senior product photographer/);
  assert.match(model.calls[1].user, /brand-verbatim/);
  assert.match(model.calls[1].user, /DAVIE DOVE/);
});

test('compose: a clean first answer is not sent back; a failed repair is reported honestly', async () => {
  const once = scripted([good]);
  assert.equal((await compose(once, photo, confirmedPerfume())).attempts, 1);
  const bad = { ...good, params: { aspectRatio: '1:1' } };
  const stubborn = scripted([bad, bad]);
  const result = await compose(stubborn, photo, confirmedPerfume());
  assert.equal(result.report.ok, false);
  assert.equal(result.report.results.find(r => r.id === 'size')!.ok, false);
});

test('intake extraction keeps only candidates with real evidence', async () => {
  const model = scripted([{ candidates: [
    { slot: 'product', value: 'blue perfume bottle with silver cap', evidence: 'blue perfume bottle with a silver cap' },
    { slot: 'brandName', value: 'Davidoff', evidence: 'davidoff' },
    { slot: 'style', value: 'luxury-dark', evidence: 'something fancy' },
  ] }]);
  const out = await extract(model, photo, 'Ad for our blue perfume bottle with a silver cap, DAVIDOFF, luxury mood');
  assert.deepEqual(out.candidates.map(c => c.slot), ['product']);
  assert.ok(out.model, 'the answer names the model that produced it');
});

test('server rebuilds the session and refuses unconfirmed or tampered ones', async () => {
  const s = confirmedPerfume();
  assert.ok('session' in await sanitizeSession(s, lookup));
  assert.deepEqual(await sanitizeSession({ ...s, phase: 'brief' }, lookup), { error: 'not_confirmed' });
  assert.deepEqual(await sanitizeSession({ ...s, blueprintVersion: 99 }, lookup), { error: 'version_mismatch' });
  assert.deepEqual(await sanitizeSession({ ...s, values: { ...s.values, style: { value: 'hacked', source: 'user' } } }, lookup), { error: 'invalid_session' });
});

test('handler: anonymous auth, origin and op routing', async () => {
  const env = (k: string) => ({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_ANON_KEY: 'anon' } as Record<string, string>)[k];
  const saved: unknown[] = [];
  const authOk: typeof fetch = async (u, init) => {
    if (String(u).includes('/rest/v1/lookers_engine_results')) { saved.push(JSON.parse(String(init!.body))); return new Response(JSON.stringify([{ id: '00000000-0000-4000-8000-000000000001' }]), { status: 201 }); }
    return new Response(JSON.stringify({ id: 'u1', is_anonymous: true }), { status: 200 });
  };
  const handler = createEngineHandler({ env, model: scripted([good]), transport: authOk, blueprints: lookup });
  const post = (body: unknown, headers: Record<string, string> = { Authorization: 'Bearer t', Origin: 'https://lookershub.com' }) =>
    handler(new Request('https://fn/lookers-ai-engine', { method: 'POST', headers, body: JSON.stringify(body) }));
  assert.equal((await post({ op: 'compose' }, { Origin: 'https://lookershub.com' })).status, 401);
  assert.equal((await post({ op: 'compose' }, { Authorization: 'Bearer t', Origin: 'https://evil.example' })).status, 403);
  assert.equal((await post({ op: 'nope' })).status, 400);
  assert.equal((await post({ op: 'nope' }, { Authorization: 'Bearer t', Origin: 'https://offical-comp-website-2e784yao4-zeuslookershubs-projects.vercel.app' })).status, 400, 'team preview allowed');
  assert.equal((await post({ op: 'nope' }, { Authorization: 'Bearer t', Origin: 'https://evil-zeuslookershubs-projects.vercel.app.evil.com' })).status, 403);
  const res = await post({ op: 'compose', session: confirmedPerfume() });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.report.ok, true);
  assert.equal(data.resultId, '00000000-0000-4000-8000-000000000001');
  assert.equal((saved[0] as { gates_passed: number }).gates_passed, data.report.passed);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://lookershub.com');
});

test('the engine payload is never published: no plaintext copy in the repo', async () => {
  const { existsSync } = await import('node:fs');
  for (const path of ['server/engine/blueprints.json', 'server/engine/blueprints.generated.ts']) {
    assert.equal(existsSync(path), false, `${path} must not exist — the payload is uploaded to the locked table, not committed`);
  }
  const { readFileSync } = await import('node:fs');
  const ignored = readFileSync('.gitignore', 'utf8');
  for (const rule of ['.env', '.engine/']) assert.ok(ignored.includes(rule), `.gitignore must cover ${rule}`);
});

test('private blueprints: service key only, shape checked, cached, hot-swapped, stale copy kept', async () => {
  const full = serverBlueprints, one = serverBlueprints.slice(0, 1);
  let rows: { payload: unknown[] }[] = [{ payload: full }];
  let fetches = 0, clock = 0, sentKey = '', sentAuth = '';
  const transport: typeof fetch = async (_u, init) => {
    fetches++;
    const headers = new Headers(init?.headers);
    sentKey = headers.get('apikey') ?? ''; sentAuth = headers.get('Authorization') ?? '';
    return new Response(JSON.stringify(rows));
  };
  const get = privateBlueprints('https://db.example', 'service-key', transport, 1000, () => clock);
  assert.equal((await get('pitch-deck'))?.id, 'pitch-deck');
  assert.equal(sentKey, 'service-key', 'read with the service key, so RLS with no policy still lets it through');
  assert.equal(sentAuth, 'Bearer service-key');
  await get('product-photo');
  assert.equal(fetches, 1, 'cached');

  rows = [{ payload: one }];
  clock = 2000;
  assert.equal(await get('pitch-deck'), undefined, 'updating the row goes live without a redeploy');

  rows = [{ payload: [{ id: 'half-written' }] }];
  clock = 4000;
  assert.equal((await get('product-photo'))?.id, 'product-photo', 'a half-written payload is refused and the cached copy is used');

  const noKey = privateBlueprints('https://db.example', '', transport);
  await assert.rejects(noKey('pitch-deck'), /blueprints_unconfigured/);
  const down = privateBlueprints('https://db.example', 'k', async () => new Response('', { status: 500 }));
  await assert.rejects(down('pitch-deck'), /blueprints_unavailable/);
});

test('model adapter: JSON mode, key never echoed, timeouts mapped', async () => {
  const transport: typeof fetch = async (_u, init) => {
    const body = JSON.parse(String(init!.body));
    assert.equal(body.response_format.type, 'json_object');
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }], usage: { prompt_tokens: 5, completion_tokens: 2 } }));
  };
  const m = createChatJsonModel({ url: 'https://api.example/chat', key: 'sk-secret', model: 'm', transport });
  assert.deepEqual((await m.complete({ system: 's', user: 'u', maxTokens: 10 })).json, { ok: true });
  const leaky = createChatJsonModel({ url: 'u', key: 'sk-secret', model: 'm', transport: async () => new Response('{"choices":[{"message":{"content":"{\\"k\\":\\"sk-secret\\"}"}}]}') });
  await assert.rejects(leaky.complete({ system: 's', user: 'u', maxTokens: 10 }), /model_bad_output/);
  const slow = createChatJsonModel({ url: 'u', key: 'k', model: 'm', timeoutMs: 20, transport: () => new Promise<Response>(() => {}) });
  await assert.rejects(slow.complete({ system: 's', user: 'u', maxTokens: 10 }), /model_timeout/);
});

test('vision: description + evidence-checked candidates; label text must be read verbatim', async () => {
  const vision = { id: 'v', describe: async () => ({ modelId: 'v', output: {
    description: 'زجاجة برفان زرقا غامقة بغطا فضي، والليبل مكتوب عليه "DAVIDOFF" على خلفية رخام إسود.',
    candidates: [
      { slot: 'product', value: 'زجاجة برفان زرقا غامقة بغطا فضي', evidence: 'زجاجة برفان زرقا غامقة بغطا فضي' },
      { slot: 'brandName', value: 'DAVIDOFF', evidence: 'DAVIDOFF' },
      { slot: 'scene', value: 'gold sand', evidence: 'gold sand' },
    ] } }) };
  const out = await describeReference(vision, photo, { mimeType: 'image/jpeg', data: 'A'.repeat(200) }, 'ar');
  assert.match(out.description, /DAVIDOFF/);
  assert.deepEqual(out.candidates.map(c => c.slot), ['product', 'brandName']);
});

test('gemini adapter: inline image, JSON mode, key in header only', async () => {
  let seen: { url: string; headers: Record<string, string>; body: any } | undefined;
  const transport: typeof fetch = async (u, init) => {
    seen = { url: String(u), headers: init!.headers as Record<string, string>, body: JSON.parse(String(init!.body)) };
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"description":"ok","candidates":[]}' }] } }] }));
  };
  const g = createGeminiVision({ key: 'g-key', transport });
  assert.deepEqual(await g.describe({ prompt: 'p', image: { mimeType: 'image/png', data: 'B'.repeat(200) } }),
    { output: { description: 'ok', candidates: [] }, modelId: 'gemini-3.5-flash-lite' });
  assert.match(seen!.url, /gemini-3\.5-flash-lite:generateContent$/);
  assert.ok(!seen!.url.includes('g-key'));
  assert.equal(seen!.headers['x-goog-api-key'], 'g-key');
  assert.equal(seen!.body.generationConfig.responseMimeType, 'application/json');
  assert.equal(seen!.body.contents[0].parts[1].inline_data.mime_type, 'image/png');
});

test('deepseek vision: image_url data URL in a user message, JSON mode; used when no Gemini key', async () => {
  let body: any;
  const transport: typeof fetch = async (_u, init) => { body = JSON.parse(String(init!.body)); return new Response(JSON.stringify({ choices: [{ message: { content: '{"description":"d","candidates":[]}' } }] })); };
  const v = createDeepSeekVision({ key: 'ds', transport });
  assert.deepEqual(await v.describe({ prompt: 'p', image: { mimeType: 'image/jpeg', data: 'C'.repeat(200) } }),
    { output: { description: 'd', candidates: [] }, modelId: 'deepseek-flash' });
  assert.equal(body.model, 'deepseek-flash');
  assert.equal(body.response_format.type, 'json_object');
  assert.match(body.messages[0].content[1].image_url.url, /^data:image\/jpeg;base64,C+$/);
  assert.equal(visionFromEnv(k => ({ DEEPSEEK_API_KEY: 'x' } as Record<string, string>)[k])?.id, 'deepseek-flash');
  assert.match(visionFromEnv(k => ({ DEEPSEEK_API_KEY: 'x', GEMINI_API_KEY: 'g' } as Record<string, string>)[k])!.id, /gemini/);
  assert.equal(visionFromEnv(() => undefined), null);
});

test('gemini text model: systemInstruction + JSON mode; key stays in the header', async () => {
  let seen: any;
  const transport: typeof fetch = async (u, init) => {
    seen = { url: String(u), headers: init!.headers as Record<string, string>, body: JSON.parse(String(init!.body)) };
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"title":"ok"}' }] } }], usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 3 } }));
  };
  const m = createGeminiJsonModel({ key: 'g-key', transport });
  const out = await m.complete({ system: 'rules', user: 'brief', maxTokens: 500 });
  assert.deepEqual(out.json, { title: 'ok' });
  assert.deepEqual(out.usage, { inputTokens: 7, outputTokens: 3 });
  assert.match(seen.url, /gemini-3\.5-flash-lite:generateContent$/);
  assert.ok(!seen.url.includes('g-key'));
  assert.equal(seen.headers['x-goog-api-key'], 'g-key');
  assert.equal(seen.body.systemInstruction.parts[0].text, 'rules');
  assert.equal(seen.body.generationConfig.responseMimeType, 'application/json');
  const leak = createGeminiJsonModel({ key: 'g-key', transport: async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"k":"g-key"}' }] } }] })) });
  await assert.rejects(leak.complete({ system: 's', user: 'u', maxTokens: 10 }), /model_bad_output/);
});

test('modelFromEnv: Gemini wins when its key is present; ENGINE_PROVIDER forces a choice', () => {
  const env = (o: Record<string, string>) => (k: string) => o[k];
  assert.equal(modelFromEnv(env({ GEMINI_API_KEY: 'g', DEEPSEEK_API_KEY: 'd' }))!.id, 'gemini-3.5-flash-lite');
  assert.equal(modelFromEnv(env({ DEEPSEEK_API_KEY: 'd' }))!.id, 'deepseek-flash');
  assert.equal(modelFromEnv(env({ GEMINI_API_KEY: 'g', DEEPSEEK_API_KEY: 'd', ENGINE_PROVIDER: 'deepseek' }))!.id, 'deepseek-flash');
  assert.equal(modelFromEnv(env({ GEMINI_API_KEY: 'g', ENGINE_MODEL: 'gemini-4-argon' }))!.id, 'gemini-4-argon');
  assert.equal(modelFromEnv(env({})), null);
});

test('origins: the site, localhost and our previews pass; others only with the test flag', async () => {
  const make = (env: Record<string, string>) => createEngineHandler({
    env: name => env[name], model: null, vision: null, blueprints: async () => undefined,
    transport: async () => new Response('{}', { status: 500 }),
  });
  const ask = async (handler: ReturnType<typeof createEngineHandler>, origin: string) =>
    (await handler(new Request('https://fn/', { method: 'OPTIONS', headers: { Origin: origin } }))).status;

  const base = { SUPABASE_URL: 'https://db', SUPABASE_ANON_KEY: 'k' };
  const closed = make(base);
  assert.equal(await ask(closed, 'https://lookershub.com'), 204);
  assert.equal(await ask(closed, 'http://localhost:3000'), 204);
  assert.equal(await ask(closed, 'https://site-git-branch-zeuslookershubs-projects.vercel.app'), 204);
  assert.equal(await ask(closed, 'https://someone-else.vercel.app'), 403, 'a stranger\'s preview is refused by default');
  assert.equal(await ask(closed, 'https://evil.example'), 403);

  const open = make({ ...base, ENGINE_ALLOW_VERCEL_PREVIEWS: '1' });
  assert.equal(await ask(open, 'https://someone-else.vercel.app'), 204, 'the flag opens previews while testing');
  assert.equal(await ask(open, 'https://evil.example'), 403, 'and nothing else');

  const listed = make({ ...base, ENGINE_ALLOWED_ORIGINS: 'https://staging.lookershub.com' });
  assert.equal(await ask(listed, 'https://staging.lookershub.com'), 204);
});

test('routing: each job gets the model that suits its shape, and covers for itself', async () => {
  const calls: string[] = [];
  const transport: typeof fetch = async (url) => {
    const target = String(url).includes('deepseek') ? 'deepseek' : 'gemini';
    calls.push(target);
    return target === 'gemini'
      ? new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"ideas":["a"]}' }] } }] }))
      : new Response(JSON.stringify({ choices: [{ message: { content: '{"ideas":["a"]}' } }] }));
  };
  const env = (v: Record<string, string>) => (name: string) => v[name];
  const both = { GEMINI_API_KEY: 'g', DEEPSEEK_API_KEY: 'd' };

  const route = routeFromEnv(env(both), transport);
  assert.match(route.plan.compose, /^deepseek/, 'the long, paid-token job stays on DeepSeek');
  assert.match(route.plan.ideas, /^gemini/, 'the high-volume job sits on the free tier');
  assert.match(route.plan.intake, /^gemini/);

  // Each one still has the other behind it.
  for (const op of ['compose', 'intake', 'ideas'] as const) assert.match(route.plan[op], /→/, `${op} has a backup`);

  // An explicit route wins.
  const flipped = routeFromEnv(env({ ...both, ENGINE_ROUTE: 'ideas:deepseek, compose:gemini' }), transport);
  assert.match(flipped.plan.ideas, /^deepseek/);
  assert.match(flipped.plan.compose, /^gemini/);

  // A pinned provider still pins everything, so an existing setting keeps its behaviour.
  const pinned = routeFromEnv(env({ ...both, ENGINE_PROVIDER: 'deepseek' }), transport);
  for (const op of ['compose', 'intake', 'ideas'] as const) assert.match(pinned.plan[op], /^deepseek/);

  // One key configured: everything runs there, with nothing to fail over to.
  const only = routeFromEnv(env({ DEEPSEEK_API_KEY: 'd' }), transport);
  assert.equal(only.plan.compose, 'deepseek-flash');
  assert.equal(only.plan.ideas, 'deepseek-flash');
  assert.equal(routeFromEnv(env({}), transport).for('compose'), null);
});

test('routing: a rate-limited free tier falls through to the paid one, and says who answered', async () => {
  let geminiCalls = 0;
  const transport: typeof fetch = async (url) => {
    if (String(url).includes('deepseek')) return new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }] }));
    geminiCalls++;
    return new Response('quota', { status: 429 });
  };
  const route = routeFromEnv((n: string) => ({ GEMINI_API_KEY: 'g', DEEPSEEK_API_KEY: 'd' } as Record<string, string>)[n], transport);
  const result = await route.for('ideas')!.complete({ system: 's', user: 'u', maxTokens: 50 });
  assert.deepEqual(result.json, { ok: true }, 'the answer still arrives');
  assert.equal(result.modelId, 'deepseek-flash', 'and reports the model that actually answered');
  assert.equal(geminiCalls, 1, 'the free tier was tried first, once');

  // An auth failure is a real fault, not a quota blip: it must surface, not be papered over.
  const badKey: typeof fetch = async (url) => String(url).includes('deepseek')
    ? new Response(JSON.stringify({ choices: [{ message: { content: '{}' } }] }))
    : new Response('nope', { status: 401 });
  const route2 = routeFromEnv((n: string) => ({ GEMINI_API_KEY: 'g', DEEPSEEK_API_KEY: 'd' } as Record<string, string>)[n], badKey);
  await assert.rejects(route2.for('ideas')!.complete({ system: 's', user: 'u', maxTokens: 50 }), /model_auth_failed/);
});

test('every answer names the model that produced it', async () => {
  // The bug this prevents: a working result read as proof that a particular provider served it.
  // (photo is the product-photo blueprint, defined at the top of this file.)
  const extracted = await extract(scripted([{ candidates: [] }]), photo, 'anything');
  assert.equal(typeof extracted.model, 'string');
  assert.ok(extracted.model.length > 0);

  const vision = { id: 'test-vision-model', describe: async () => ({ modelId: 'test-vision-model', output: { description: 'a dark bottle on a light background', candidates: [] } }) };
  const described = await describeReference(vision, photo, { mimeType: 'image/jpeg', data: 'x'.repeat(200) }, 'en');
  assert.equal(described.model, 'test-vision-model', 'describe says which eyes looked at the image');

  const blind = { id: 'empty-vision', describe: async () => ({ modelId: 'empty-vision', output: {} }) };
  const nothing = await describeReference(blind, photo, { mimeType: 'image/jpeg', data: 'x'.repeat(200) }, 'en');
  assert.equal(nothing.model, 'empty-vision', 'even an empty answer names its source');
});

test('the Gemini key is found under the names actually in use, and the name is reported', async () => {
  const transport: typeof fetch = async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{}' }] } }] }));
  const env = (v: Record<string, string>) => (n: string) => v[n];

  // The canonical name wins when both are present.
  const both = routeFromEnv(env({ GEMINI_API_KEY: 'canonical', gemini_Free_API_Key: 'theirs', DEEPSEEK_API_KEY: 'd' }), transport);
  assert.equal(both.geminiKeyName, 'GEMINI_API_KEY');

  // A key stored under the name the dashboard already uses is still found — text and vision alike.
  const theirs = routeFromEnv(env({ gemini_Free_API_Key: 'theirs', DEEPSEEK_API_KEY: 'd' }), transport);
  assert.equal(theirs.geminiKeyName, 'gemini_Free_API_Key');
  assert.match(theirs.plan.ideas, /^gemini/, 'and it is routed, not ignored');
  assert.match(visionFromEnv(env({ gemini_Free_API_Key: 'theirs' }), transport)!.id, /^gemini/, 'vision finds it too');

  // No key at all is reported as such rather than guessed at.
  assert.equal(routeFromEnv(env({ DEEPSEEK_API_KEY: 'd' }), transport).geminiKeyName, 'none');
  assert.equal(visionFromEnv(env({ DEEPSEEK_API_KEY: 'd' }), transport)?.id.startsWith('gemini'), false);
});

test('a failed vision call reports the provider reason instead of one opaque code', async () => {
  const seen: unknown[] = [];
  const warn = console.warn; console.warn = (...a) => { seen.push(a[1]); };
  try {
    const notFound: typeof fetch = async () => new Response('{"error":{"message":"models/typo is not found","status":"NOT_FOUND"}}', { status: 404 });
    const vision = createGeminiVision({ key: 'SECRET-KEY', model: 'typo', transport: notFound });
    await assert.rejects(() => vision.describe({ prompt: 'p', image: { mimeType: 'image/png', data: 'x'.repeat(200) } }),
      (e: Error) => e instanceof ModelError && e.code === 'model_unavailable');

    const logged = seen[0] as { status: number; model: string; body: string };
    assert.equal(logged.status, 404, 'the upstream status is in the log');
    assert.equal(logged.model, 'typo');
    assert.match(logged.body, /NOT_FOUND/, 'and so is the provider wording');

    // A key echoed back by the provider never reaches the log.
    seen.length = 0;
    const echoes: typeof fetch = async () => new Response('{"error":"bad key SECRET-KEY"}', { status: 400 });
    await assert.rejects(() => createGeminiVision({ key: 'SECRET-KEY', transport: echoes })
      .describe({ prompt: 'p', image: { mimeType: 'image/png', data: 'x'.repeat(200) } }));
    assert.ok(!JSON.stringify(seen).includes('SECRET-KEY'), 'the key is scrubbed');
  } finally { console.warn = warn; }
});

test('a vision failure costs the image reading, not the request', async () => {
  const warn = console.warn; console.warn = () => {};
  try {
    const quotaWall: typeof fetch = async () => new Response('{"error":"quota"}', { status: 429 });
    const ok: typeof fetch = async () => new Response(JSON.stringify({
      choices: [{ message: { content: '{"description":"عبوة سودا على خلفية بيضا","candidates":[]}' } }],
    }));
    const paired = visionWithBackup(
      createGeminiVision({ key: 'gemini-test-key', transport: quotaWall }),
      createDeepSeekVision({ key: 'deepseek-test-key', transport: ok }));
    assert.match(paired.id, /^gemini-3\.5-flash-lite→deepseek/, 'the id names both');
    const out = await paired.describe({ prompt: 'p', image: { mimeType: 'image/png', data: 'x'.repeat(200) } });
    assert.match((out.output as { description: string }).description, /عبوة/, 'the backup answered');
    assert.equal(out.modelId, 'deepseek-flash', 'and the result says so, not the pair name');

    // Garbage from the primary is not something a second model can fix, so it is not retried.
    let calls = 0;
    const garbage: typeof fetch = async () => new Response('not json');
    await assert.rejects(() => visionWithBackup(
      createGeminiVision({ key: 'gemini-test-key', transport: garbage }),
      { id: 'b', describe: async () => { calls++; return { modelId: 'b', output: {} }; } },
    ).describe({ prompt: 'p', image: { mimeType: 'image/png', data: 'x'.repeat(200) } }));
    assert.equal(calls, 0);
  } finally { console.warn = warn; }
});

test('a failed text-model call reports the provider reason too', async () => {
  const seen: unknown[] = [];
  const warn = console.warn; console.warn = (...a) => { seen.push(a[1]); };
  try {
    const refused: typeof fetch = async () => new Response('{"error":{"message":"API has not been used in project","status":"PERMISSION_DENIED"}}', { status: 403 });
    await assert.rejects(() => createGeminiJsonModel({ key: 'KEY-ABC', transport: refused })
      .complete({ system: 's', user: 'u', maxTokens: 100 }),
      (e: Error) => e instanceof ModelError && e.code === 'model_auth_failed');
    const logged = seen[0] as { status: number; body: string; provider: string };
    assert.equal(logged.status, 403);
    assert.equal(logged.provider, 'gemini');
    assert.match(logged.body, /PERMISSION_DENIED/, 'the reason is readable instead of guessed at');
    assert.ok(!JSON.stringify(seen).includes('KEY-ABC'), 'and the key is scrubbed');
  } finally { console.warn = warn; }
});
