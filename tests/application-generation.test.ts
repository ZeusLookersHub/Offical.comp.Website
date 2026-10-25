import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createProjectDraft, compileLookersPrompt } from '../data/lookersAi';
import { createApplicationGenerator } from '../services/lookersAiApplicationGeneration';
import { promptTemplates } from '../data/promptLibrary';
import { initializeLibraryDraft } from '../services/lookersAiPromptLibrary';

const envelope = { data: { id: 'test-result', output: { title: 'Draft', prompt: 'Provider draft', summary: 'Summary' }, provenance: { providerId: 'test', modelId: 'test' } }, identity: { userId: 'anonymous-test', isAnonymous: true } };
test('real application path requires the canonical Agent decision before existing transport', async () => {
  const draft = createProjectDraft(); draft.taskType = 'image';
  draft.answers = { idea: 'Product photo', purpose: 'Instagram image', subject: 'Actual amber bottle', format: '4:5', imageText: 'Verified label' };
  draft.attachments = [
    { id: 'included', name: 'brief.txt', mime: 'text/plain', size: 20, kind: 'text', include: true, note: '', text: 'Approved packaging' },
    { id: 'excluded', name: 'secret.txt', mime: 'text/plain', size: 20, kind: 'text', include: false, note: '', text: 'EXCLUDED_SENTINEL' },
  ];
  const before = structuredClone(draft); let calls = 0;
  const run = createApplicationGenerator(async (body, signal) => {
    calls++; assert.equal(signal.aborted, false);
    assert.deepEqual(Object.keys(body).sort(), ['language', 'prompt']);
    const sent = body as { prompt: string; language: string };
    assert.ok(sent.prompt.includes('Actual amber bottle')); assert.ok(sent.prompt.includes('4:5'));
    assert.ok(sent.prompt.includes('Approved packaging')); assert.ok(!sent.prompt.includes('EXCLUDED_SENTINEL'));
    return envelope;
  });
  const result = await run(draft, 'en', new AbortController().signal);
  assert.equal(result.agent.decision.action, 'complete'); assert.equal(result.enhancement.status, 'ready');
  assert.equal(result.agent.project?.id, draft.id); assert.equal(result.agent.project?.engineId, 'visual.image');
  assert.equal(result.agent.project?.schema.output.format, '4:5');
  assert.equal(result.source, 'ai'); assert.equal(result.prompt, 'Provider draft'); assert.equal(calls, 1);
  assert.deepEqual(draft, before);
});
test('missing subject, ratio or objective asks for real input and makes zero provider calls', async () => {
  for (const missing of ['subject', 'format', 'purpose']) {
    const draft = createProjectDraft(); draft.taskType = 'image';
    draft.answers = { idea: 'An image with facts buried in unrelated context', purpose: 'Image', subject: 'Bottle', format: '4:5', context: 'Do not infer the subject from this' };
    delete draft.answers[missing]; let calls = 0;
    const result = await createApplicationGenerator(async () => { calls++; return envelope; })(draft, 'ar', new AbortController().signal);
    assert.equal(result.agent.decision.action, 'ask_question'); assert.equal(result.enhancement.status, 'needs_input');
    assert.equal(calls, 0); assert.equal(result.source, 'local');
  }
});
test('all bilingual templates use the same Agent gate, retaining overrides and tool choice', async () => {
  for (const template of promptTemplates) for (const lang of ['en', 'ar'] as const) {
    const draft = initializeLibraryDraft(template, Object.fromEntries(template.inputs.map(i => [i.id, 'Verified user input'])), lang, template.tools[0]);
    if (draft.taskType === 'image') draft.answers.format = '1:1';
    let calls = 0; const before = structuredClone(draft);
    const result = await createApplicationGenerator(async () => { calls++; return envelope; })(draft, lang, new AbortController().signal);
    assert.equal(result.agent.decision.action, 'complete', template.id); assert.equal(result.enhancement.status, 'ready');
    assert.equal(calls, 1); assert.equal(result.agent.project?.schema.targetTools[0], template.tools[0]); assert.deepEqual(draft, before);
  }
});
test('provider failure stays labelled local; cancellation never invokes transport', async () => {
  const draft = createProjectDraft(); draft.answers = { idea: 'Reply draft', purpose: 'Concise response' };
  const result = await createApplicationGenerator(async () => { throw new Error('unavailable'); })(draft, 'en', new AbortController().signal);
  assert.equal(result.source, 'local'); assert.equal(result.prompt, compileLookersPrompt(draft, 'en'));
  const controller = new AbortController(); controller.abort(); let calls = 0;
  await assert.rejects(createApplicationGenerator(async () => { calls++; return envelope; })(draft, 'en', controller.signal), /aborted/);
  assert.equal(calls, 0);
});

test('ready adaptive chat and optional refinements use the real Agent gate and existing transport', async () => {
  const draft = createProjectDraft();
  draft.answers = { idea: 'A fragrance video', topicId: 'text-to-video', contentType: 'video',
    videoSubject: 'Approved amber bottle', goal: 'Introduce the fragrance', duration: '20 seconds',
    format: '9:16', tools: 'Runway', videoStyle: 'cinematic', videoAudio: 'voiceover',
    voiceoverScript: 'Meet your new fragrance', constraints: 'Do not change the label', output: 'A shot list for Runway' };
  let calls = 0; const before = structuredClone(draft);
  const result = await createApplicationGenerator(async body => {
    calls++;
    for (const value of ['Approved amber bottle','20 seconds','cinematic','Meet your new fragrance','Do not change the label','Runway']) {
      assert.ok((body as { prompt: string }).prompt.includes(value), value);
    }
    return envelope;
  })(draft, 'en', new AbortController().signal);
  assert.equal(result.agent.decision.action, 'complete');
  assert.equal(result.enhancement.status, 'ready');
  assert.equal(result.agent.project?.schema.objective, draft.answers.goal);
  assert.equal(result.source, 'ai'); assert.equal(calls, 1);
  assert.deepEqual(draft, before);
});

test('adaptive image objective aliases do not bypass missing canonical requirements', async () => {
  const draft = createProjectDraft(); draft.taskType = 'image';
  draft.answers = { idea: 'Product image', goal: 'Promote a new bottle', subject: 'Amber bottle' };
  let calls = 0;
  const result = await createApplicationGenerator(async () => { calls++; return envelope; })(draft, 'en', new AbortController().signal);
  assert.equal(result.agent.decision.action, 'ask_question'); assert.equal(calls, 0);
});
