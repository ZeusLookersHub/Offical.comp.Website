import assert from 'node:assert/strict';
import { test } from 'node:test';
import { answer, blueprintById, confirmBrief, createSession, submitIntake, nextStep, type Session } from '../core/mission-engine/index.ts';
import { compose, extract, sanitizeSession } from '../server/engine/engine.ts';
import { createEngineHandler } from '../server/engine/handler.ts';
import { serverBlueprints } from '../server/engine/blueprints.generated.ts';
import { remoteBlueprints } from '../server/engine/remote-blueprints.ts';
const lookup = (id: string) => serverBlueprints.find(b => b.id === id);
import { createChatJsonModel, type JsonModel } from '../server/engine/model.ts';

const photo = blueprintById('product-photo')!;

function scripted(replies: unknown[]): JsonModel & { calls: { system: string; user: string }[] } {
  const calls: { system: string; user: string }[] = [];
  return { id: 'mock', calls, async complete({ system, user }) { calls.push({ system, user }); return { json: replies.shift() }; } };
}

function confirmedPerfume(): Session {
  let s = (submitIntake(createSession(photo, 'ar', 'p'), photo, 'إعلان ممول لبرفان DAVIDOFF فخم') as { value: Session }).value;
  const step = nextStep(s, photo);
  if (step.type === 'question') s = (answer(s, photo, 'product', 'زجاجة برفان زرقا بغطا فضي') as { value: Session }).value;
  return (confirmBrief(s, photo) as { value: Session }).value;
}

const good = {
  title: 'إعلان DAVIDOFF', prompt: 'Luxury product photo of a deep blue perfume bottle, label reads "DAVIDOFF", black marble, rim light, clean space at the top.',
  negative: 'text, letters, watermark, extra logos', params: { aspectRatio: '4:5' }, textOverlay: { mode: 'add-later' },
  variants: { universal: 'Deep blue perfume bottle, label reads "DAVIDOFF", black marble.' }, checklist: ['a', 'b', 'c', 'd'], summary: 's',
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
  assert.deepEqual(out.map(c => c.slot), ['product']);
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

test('server blueprints are in sync with the full blueprints', async () => {
  const { serverBlueprints } = await import('../server/engine/blueprints.generated.ts');
  const { serverShape } = await import('../scripts/build-engine-blueprints.ts');
  assert.deepEqual(JSON.parse(JSON.stringify(serverBlueprints)), JSON.parse(JSON.stringify(serverShape())), 'run npm run build:engine-blueprints');
});

test('remote blueprints: hash checked, cached, retried after failure', async () => {
  const body = JSON.stringify(serverBlueprints);
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body)))].map(b => b.toString(16).padStart(2, '0')).join('');
  let calls = 0;
  const ok = remoteBlueprints('https://raw/x.json', hash, async () => { calls++; return new Response(body); });
  assert.equal((await ok('product-photo'))?.id, 'product-photo');
  await ok('pitch-deck');
  assert.equal(calls, 1, 'cached');
  const tampered = remoteBlueprints('https://raw/x.json', hash, async () => new Response(body.replace('DAVIDOFF', 'DAVIE DOVE')));
  await assert.rejects(tampered('product-photo'), /blueprints_integrity/);
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
