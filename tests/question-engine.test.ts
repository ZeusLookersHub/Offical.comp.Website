import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { PROJECT_ENGINE_IDS } from '../core/projects/engines';
import { routeDeterministic } from '../core/brain';
import type { Project } from '../core/projects/types';
import { answerQuestion, evaluateQuestions, getQuestionSchema, inferQuestion, questionsFromBrain,
  validateQuestionSchema, type Field, type QuestionDefinition, type QuestionInput, type QuestionSession } from '../core/question-engine';
import { createProjectDraft, questions, type TaskType } from '../data/lookersAi';
import { planDraftQuestions } from '../services/lookersAiQuestions';

const now = '2026-10-07T20:00:00.000Z';
const project = (): Project => ({ id: 'p1', ownerId: null, title: '', engineId: 'other', status: 'active', createdAt: now, updatedAt: now,
  schema: { intent: '', objective: '', context: '', audience: '', constraints: [], references: [],
    output: { description: '', deliverables: [] }, language: 'en', targetTools: [], enhancements: [] } });
const def = (field: Field, extra: Partial<QuestionDefinition> = {}): QuestionDefinition => ({
  id: field, field, label: { en: `Question ${field}`, ar: 'ما المعلومات المطلوبة؟' }, type: 'text',
  state: 'required', nature: 'factual', critical: true, inferable: false, userOverride: true, priority: 70, ...extra,
});
const input = (...definitions: QuestionDefinition[]): QuestionInput => ({ project: project(), schema: { engineId: 'other', definitions } });
const session = (fields: QuestionSession['fields']): QuestionSession => ({ projectId: 'p1', engineId: 'other', fields });
const technical = () => input(def('details.format', { nature: 'technical', critical: false, inferable: true }));

test('required missing, already known, optional missing, and completion', () => {
  const i = input(def('objective'), def('audience', { state: 'optional', critical: false }));
  assert.equal(evaluateQuestions(i).question?.field, 'objective');
  assert.equal(evaluateQuestions(i).progress.percent, 0);
  i.project.schema.objective = 'Explain the product';
  const r = evaluateQuestions(i);
  assert.equal(r.status, 'complete');
  assert.equal(r.question, undefined);
  assert.equal(r.progress.percent, 100);
  assert.deepEqual(r.knownFields, ['objective']);
  assert.equal(r.fields[1].required, false);
});

test('conditional question activates only for the matching answered dependency', () => {
  const i = input(def('details.hasText'), def('details.exactText', { state: 'conditional',
    requiredWhen: [{ field: 'details.hasText', equals: 'yes' }] }));
  assert.deepEqual(evaluateQuestions(i).missingFields, ['details.hasText']);
  i.session = session({ 'details.hasText': { source: 'user', value: 'no' } });
  assert.equal(evaluateQuestions(i).status, 'complete');
  i.session.fields['details.hasText'].value = 'yes';
  assert.equal(evaluateQuestions(i).question?.field, 'details.exactText');
});

test('critical factual fields never reach inference or accept forged inferred values', async () => {
  const i = input(def('details.price'));
  i.session = session({ 'details.price': { source: 'inference', value: '$500', confirmed: true } });
  let called = false;
  const r = await inferQuestion(i, { infer: async () => { called = true; return {}; } });
  assert.equal(called, false);
  assert.equal(r.result.status, 'needs_question');
  assert.equal(r.result.fields[0].value, undefined);
  assert.deepEqual(r.result.criticalFields, ['details.price']);
});

test('safe inference is available and requires user confirmation', async () => {
  const i = technical();
  assert.deepEqual(evaluateQuestions(i).inferableFields, ['details.format']);
  const r = await inferQuestion(i, { infer: async req => ({ field: req.field, value: 'Landscape', confidence: .9 }) });
  assert.equal(r.result.status, 'needs_confirmation');
  assert.equal(r.result.progress.percent, 0);
  const next = answerQuestion({ ...i, session: r.session }, 'details.format', 'Portrait', now);
  assert.equal(evaluateQuestions({ ...i, ...next }).status, 'complete');
  assert.equal(next.session.fields['details.format'].value, 'Portrait');
});

test('user values override defaults and suggestions, including explicit cleared values', () => {
  const i = input(def('details.usage'), def('details.ratio', { nature: 'technical', critical: false, inferable: true,
    defaultRule: { when: [{ field: 'details.usage', equals: 'story' }], value: '9:16' } }));
  i.session = session({ 'details.usage': { source: 'user', value: 'story' } });
  assert.equal(evaluateQuestions(i).fields[1].source, 'default');
  i.session.fields['details.ratio'] = { source: 'user', value: '1:1' };
  assert.equal(evaluateQuestions(i).fields[1].value, '1:1');
  i.session.fields['details.ratio'].value = '';
  assert.equal(evaluateQuestions(i).question?.field, 'details.ratio');
  assert.equal(evaluateQuestions(i).fields[1].value, undefined);
});

test('highest value required question wins over low value and optional questions', () => {
  const r = evaluateQuestions(input(def('details.style', { nature: 'creative', inferable: true, critical: false, priority: 100 }),
    def('details.price', { priority: 50 }), def('details.client', { state: 'optional', priority: 100 })));
  assert.equal(r.question?.field, 'details.price');
});

test('dependency unlock breaks ties and prerequisites are requested before dependents', () => {
  const i = input(def('details.a'), def('details.z'), def('details.dependent', { dependencies: ['details.z'], priority: 100 }));
  assert.equal(evaluateQuestions(i).question?.field, 'details.z');
  const next = answerQuestion(i, 'details.z', 'ready', now);
  assert.equal(evaluateQuestions({ ...i, ...next }).question?.field, 'details.dependent');
});

test('optional prerequisites of required fields are promoted rather than skipped', () => {
  const i = input(def('details.parent', { state: 'optional', critical: false }), def('details.child', { dependencies: ['details.parent'] }));
  assert.equal(evaluateQuestions(i).question?.field, 'details.parent');
  assert.equal(evaluateQuestions(i).progress.required, 2);
});

test('canonical Project values are reused, input is not mutated, and arrays retain their shape', () => {
  const i = input(def('objective'), def('constraints', { type: 'multi' }), def('output.description'));
  i.project.schema.objective = 'Launch'; i.project.schema.constraints = ['No invented prices'];
  i.project.schema.output.description = 'A brief';
  const before = JSON.stringify(i);
  const r = evaluateQuestions(i);
  assert.equal(r.status, 'complete');
  assert.equal(JSON.stringify(i), before);
  (r.fields[1].value as string[]).push('changed');
  assert.deepEqual(i.project.schema.constraints, ['No invented prices']);
});

test('references require trusted exact evidence from actual included text', () => {
  const i = input(def('details.client'));
  i.project.schema.references = [{ id: 'r', name: 'Acme.pdf', kind: 'document', included: true }];
  i.evidence = [{ field: 'details.client', referenceId: 'r', value: 'Acme', excerpt: 'Client: Acme', trusted: true }];
  assert.equal(evaluateQuestions(i).status, 'needs_question');
  i.project.schema.references[0].text = 'Client: Acme';
  assert.equal(evaluateQuestions(i).fields[0].source, 'reference');
  i.evidence[0].trusted = false;
  assert.equal(evaluateQuestions(i).status, 'needs_question');
  i.evidence[0].trusted = true;
  i.project.schema.references[0].included = false;
  assert.equal(evaluateQuestions(i).status, 'needs_question');
  i.project.schema.references[0].included = true;
  i.evidence[0].value = 'Invented';
  assert.equal(evaluateQuestions(i).status, 'needs_question');
});

test('conflicting references require confirmation; explicit user answer resolves conflict', () => {
  const i = input(def('details.client'));
  i.project.schema.references = [{ id: 'r', name: 'brief.txt', kind: 'text', included: true, text: 'Client: Acme. Client: Beta.' }];
  i.evidence = ['Acme', 'Beta'].map(value => ({ field: 'details.client', referenceId: 'r', value, excerpt: `Client: ${value}`, trusted: true }));
  assert.equal(evaluateQuestions(i).status, 'needs_confirmation');
  const next = answerQuestion(i, 'details.client', 'Acme', now);
  assert.equal(evaluateQuestions({ ...i, ...next }).status, 'complete');
});

test('Arabic/English questions and empty projects have sensible localized first questions', () => {
  for (const lang of ['ar', 'en'] as const) {
    const p = project(); p.schema.language = lang;
    const r = evaluateQuestions({ project: p });
    assert.equal(r.question?.field, 'intent');
    assert.equal(r.label, lang === 'ar' ? 'ما الذي تريد إنشاءه؟' : 'What would you like to create?');
  }
});

test('canonical registry schemas validate and specialized fields stay engine-specific', () => {
  for (const engineId of PROJECT_ENGINE_IDS) assert.deepEqual(validateQuestionSchema(getQuestionSchema(engineId)), [], engineId);
  assert.ok(getQuestionSchema('visual.video').definitions.some(d => d.field === 'details.duration'));
  assert.ok(!getQuestionSchema('visual.image').definitions.some(d => d.field === 'details.duration'));
  const schema = getQuestionSchema('cv'); schema.definitions.length = 0;
  assert.ok(getQuestionSchema('cv').definitions.length > 0);
});

test('Story aspect-ratio default works in both languages without guessing generic Instagram use', () => {
  for (const usage of ['Instagram Story', 'قصة إنستغرام', 'Instagram']) {
    const p = project(); p.engineId = 'visual.image'; p.schema.intent = 'Image'; p.schema.objective = 'Advert';
    const s: QuestionSession = { projectId: p.id, engineId: p.engineId, fields: {
      'details.subject': { source: 'user', value: 'Bottle' }, 'details.usage': { source: 'user', value: usage },
    } };
    const r = evaluateQuestions({ project: p, session: s });
    const ratio = r.fields.find(f => f.field === 'details.aspectRatio');
    assert.equal(ratio?.value, usage === 'Instagram' ? undefined : '9:16');
  }
});

test('malformed or incompatible definitions fail safely, including cycles and unsafe defaults', () => {
  const good = def('objective');
  const bad: unknown[] = [null, {}, { engineId: 'made-up', definitions: [good] }, { engineId: 'other', definitions: [] },
    { engineId: 'other', definitions: [good, good] }, ...[
      { field: '__proto__' }, { inferable: true }, { label: { en: 'Only English' } }, { type: 'multi' },
      { userOverride: false }, { priority: NaN }, { state: 'conditional' }, { dependencies: ['details.missing'] },
      { dependencies: ['objective'] }, { defaultRule: { when: [{ field: 'objective', equals: 'x' }], value: 'invented' } },
      { type: 'single' }, { askWhen: [{ field: 'objective', equals: 'x' }] },
    ].map(extra => ({ engineId: 'other', definitions: [{ ...good, ...extra }] })),
    { engineId: 'other', definitions: [def('details.a', { dependencies: ['details.b'] }), def('details.b', { dependencies: ['details.a'] })] },
  ];
  for (const schema of bad) assert.equal(evaluateQuestions({ project: project(), schema: schema as never }).status, 'invalid', JSON.stringify(schema));
});

test('malformed project and mismatched schema return invalid, never completion', () => {
  assert.equal(evaluateQuestions(null as never).status, 'invalid');
  assert.equal(evaluateQuestions({ project: {} } as never).status, 'invalid');
  assert.equal(evaluateQuestions({ project: project(), schema: getQuestionSchema('cv') }).status, 'invalid');
});

test('provider unavailable, errors and timeout leave deterministic questions and hide error details', async () => {
  const i = technical();
  assert.equal((await inferQuestion(i)).result.status, 'needs_question');
  const failed = await inferQuestion(i, { infer: async () => { throw new Error('secret'); } });
  assert.equal(failed.result.status, 'needs_question');
  assert.ok(!JSON.stringify(failed).includes('secret'));
  let signal: AbortSignal;
  const timed = await inferQuestion(i, { infer: req => { signal = req.signal; return new Promise(() => {}); } }, 5);
  assert.ok(timed.result.reasons.includes('inference_timeout'));
  assert.equal(signal!.aborted, true);
});

test('malformed, low-confidence and wrong-field inference results are rejected', async () => {
  for (const response of [null, 'x', {}, { field: 'details.format', value: '', confidence: .9 },
    { field: 'details.price', value: '$99', confidence: .9 }, { field: 'details.format', value: 42, confidence: .9 },
    { field: 'details.format', value: 'PDF', confidence: 9 }, { field: 'details.format', value: 'PDF', confidence: .2 },
    { field: 'details.format', value: 'PDF', confidence: .9, extra: 'injected' }]) {
    const r = await inferQuestion(technical(), { infer: async () => response });
    assert.equal(r.result.status, 'needs_question');
    assert.ok(r.result.reasons.includes('invalid_inference'));
  }
});

test('inference receives no factual values, references or identity, and makes one attempt', async () => {
  const i = technical(); i.project.schema.context = 'private identity';
  i.project.schema.references = [{ id: 'r', name: 'private-file', kind: 'text', included: true, text: 'private credentials' }];
  let calls = 0;
  await inferQuestion(i, { infer: async req => {
    calls++; assert.ok(!JSON.stringify(req).includes('private'));
    return { field: req.field, value: 'PDF', confidence: .9 };
  } });
  assert.equal(calls, 1);
});

test('answers update canonical fields immutably, specialized fields stay in scoped session', () => {
  const i = input(def('objective'), def('details.role'));
  const updated = answerQuestion(i, 'objective', 'Find work', now);
  assert.equal(updated.project.schema.objective, 'Find work');
  assert.equal(i.project.schema.objective, '');
  const second = answerQuestion({ ...i, ...updated }, 'details.role', 'Designer', now);
  assert.equal(second.session.fields['details.role'].value, 'Designer');
  assert.equal((second.project.schema as unknown as Record<string, unknown>).details, undefined);
  assert.throws(() => answerQuestion(i, 'objective', '', now), /invalid_answer/);
  assert.throws(() => answerQuestion(i, 'objective', 'Valid', 'invalid'), /invalid_project_update/);
  i.project.status = 'archived';
  assert.throws(() => answerQuestion(i, 'objective', 'Valid', now), /invalid_question_update/);
});

test('sessions from another project or engine cannot supply known fields', () => {
  const i = input(def('details.client')); i.session = session({ 'details.client': { source: 'user', value: 'Acme' } });
  i.session.projectId = 'someone-else';
  assert.equal(evaluateQuestions(i).status, 'needs_question');
  i.session.projectId = 'p1'; i.session.engineId = 'cv';
  assert.equal(evaluateQuestions(i).status, 'needs_question');
});

test('Brain route is reused without copying model hints or bypassing ambiguity', () => {
  const p = project();
  const unclear = routeDeterministic({ input: 'A visual', language: 'en' }).decision;
  assert.equal(questionsFromBrain({ project: p }, unclear, now).status, 'needs_route');
  const decision = routeDeterministic({ input: 'Write a CV', language: 'en' }).decision;
  decision.knownFields.experience = 'invented';
  const routed = questionsFromBrain({ project: p }, decision, now);
  assert.equal(routed.project.engineId, 'cv');
  assert.ok(routed.result?.missingFields.includes('details.experience'));
  assert.equal(p.engineId, 'other');
});

test('First Draft adapter preserves controls and examples, reuses canonical data and excludes optional progress', () => {
  for (const taskType of ['image', 'campaign', 'dashboard', 'general'] as TaskType[]) {
    const draft = createProjectDraft(); draft.taskType = taskType;
    let r = planDraftQuestions(draft, 'ar');
    assert.equal(r.result.status, 'needs_question'); assert.equal(r.percent, 0);
    assert.equal(r.missing[0].id, 'idea');
    assert.deepEqual(r.fields, questions[taskType]);
    draft.answers.idea = 'A project';
    for (const q of questions[taskType].filter(q => !q.optional)) draft.answers[q.id] = q.options?.[0].value || 'An explicit answer';
    r = planDraftQuestions(draft, 'en');
    assert.equal(r.percent, 100, taskType); assert.equal(r.missing.length, 0);
    assert.deepEqual(r.fields, questions[taskType]);
  }
  const draft = createProjectDraft(); draft.answers.idea = 'A project'; draft.answers.purpose = 'Existing objective';
  assert.equal(planDraftQuestions(draft, 'en').result.status, 'complete');
});

test('Question Engine has no network, provider, storage, UI, or service coupling', () => {
  for (const file of readdirSync('core/question-engine').filter(f => f.endsWith('.ts'))) {
    const src = readFileSync(`core/question-engine/${file}`, 'utf8');
    assert.ok(!/openrouter|supabase|gemma|fetch\s*\(|localStorage|process\.env|import\.meta\.env|https?:\/\//i.test(src), file);
    assert.ok(!/from\s+['"](?:\.\.\/)+(?:services|pages|data|components)|from\s+['"]react/.test(src), file);
  }
});

test('critique regression: malformed default rules cannot make unknown values known', () => {
  for (const defaultRule of [null, {}, { value: '9:16' }, { when: [], value: '9:16' },
    { when: [{ field: 'details.missing', equals: 'yes' }], value: '9:16' }]) {
    const i = technical();
    i.schema!.definitions[0].defaultRule = defaultRule as never;
    assert.equal(evaluateQuestions(i).status, 'invalid');
  }
});

test('critique regression: hidden prerequisite never produces false completion', () => {
  const i = input(def('details.flag', { state: 'optional' }),
    def('details.parent', { state: 'optional', askWhen: [{ field: 'details.flag', equals: 'yes' }] }),
    def('details.child', { dependencies: ['details.parent'] }));
  i.session = session({ 'details.child': { source: 'user', value: 'already supplied' } });
  assert.equal(evaluateQuestions(i).status, 'invalid');
  assert.ok(evaluateQuestions(i).reasons.includes('inactive_required_dependency'));
});

test('critique regression: changing brief clears stale suggestions and recomputes defaults', async () => {
  const i = input(def('details.usage'), def('details.format', { nature: 'technical', critical: false, inferable: true,
    defaultRule: { when: [{ field: 'details.usage', equals: 'story' }], value: '9:16' } }));
  i.session = session({ 'details.usage': { source: 'user', value: 'web' } });
  const suggested = await inferQuestion(i, { infer: async () => ({ field: 'details.format', value: '1:1', confidence: .9 }) });
  assert.equal(suggested.result.status, 'needs_confirmation');
  const next = answerQuestion({ ...i, session: suggested.session }, 'details.usage', 'story', now);
  assert.equal(next.session.fields['details.format'], undefined);
  assert.equal(evaluateQuestions({ ...i, ...next }).fields[1].value, '9:16');
  const changed = answerQuestion({ ...i, ...next }, 'details.usage', 'web', now);
  assert.equal(evaluateQuestions({ ...i, ...changed }).fields[1].value, undefined);
});

test('invalid option selections and empty arrays never count as known', () => {
  const i = input(def('details.choice', { type: 'single', options: [{ value: 'yes', label: { en: 'Yes', ar: 'نعم' } }] }),
    def('constraints', { type: 'multi' }));
  i.session = session({ 'details.choice': { source: 'user', value: 'unknown' }, constraints: { source: 'user', value: [] } });
  assert.equal(evaluateQuestions(i).knownFields.length, 0);
  assert.equal(evaluateQuestions(i).missingFields.length, 2);
});

test('late inference cannot overwrite a user answer supplied while awaiting the port', async () => {
  const i = technical();
  i.session = session({});
  const pending = inferQuestion(i, { infer: async () => {
    i.session!.fields['details.format'] = { source: 'user', value: 'Portrait' };
    return { field: 'details.format', value: 'Landscape', confidence: .9 };
  } });
  const r = await pending;
  assert.equal(r.result.status, 'complete');
  assert.equal(r.result.fields[0].value, 'Portrait');
  assert.ok(r.result.reasons.includes('inference_context_changed'));
});
