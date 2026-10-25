import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createProjectDraft } from '../data/lookersAi';
import { extractIdeaContext, mergeIdeaContext } from '../services/lookersAiContextExtraction';
import { nextChatTurn, submitChatAnswer, explainChatQuestion } from '../services/lookersAiChatWorkflow';

test('extracts explicit video facts and preserves user answers', () => {
  const draft = createProjectDraft();
  const extracted = extractIdeaContext('عايز فيديو 15 ثانية 9:16 على TikTok', 'general');
  assert.equal(extracted.taskType, 'general');
  const merged = mergeIdeaContext(draft, extracted);
  assert.equal(merged.answers.contentType, 'video');
  assert.equal(merged.answers.duration, '15 seconds');
  assert.equal(merged.answers.format, '9:16');
  assert.equal(merged.answers.platform, 'TikTok');
  assert.equal(draft.answers.duration, undefined);
});

test('starts with helpful conversational introduction', () => {
  const turn = nextChatTurn(createProjectDraft(), 'ar');
  assert.equal(turn.status, 'question');
  if (turn.status === 'question') {
    assert.equal(turn.question.id, 'idea');
    assert.ok(turn.question.help.length > 0);
  }
});

test('routes video to dedicated questions without repeating supplied duration and ratio', () => {
  const draft = createProjectDraft();
  const first = submitChatAnswer(draft, 'ar', 'idea', 'عايز فيديو 15 ثانية 9:16 على TikTok');
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(first.turn.status, 'question');
  if (first.turn.status !== 'question') return;
  assert.equal(first.turn.question.id, 'videoSubject');
  const subject = submitChatAnswer(first.draft, 'ar', 'videoSubject', 'زجاجة عطر فاخرة');
  assert.equal(subject.ok, true);
  if (!subject.ok) return;
  assert.equal(subject.turn.status, 'question');
  if (subject.turn.status !== 'question') return;
  assert.equal(subject.turn.question.id, 'videoGoal');
  const goal = submitChatAnswer(subject.draft, 'ar', 'videoGoal', 'ad');
  assert.equal(goal.ok, true);
  if (!goal.ok) return;
  assert.equal(goal.turn.status, 'ready');
});

test('rejects unknown choices and allows explicit help without state mutation', () => {
  const draft = mergeIdeaContext(createProjectDraft(), extractIdeaContext('video 15 seconds 9:16', 'general'));
  const prepared = { ...draft, answers: { ...draft.answers, videoSubject: 'Perfume' } };
  const before = nextChatTurn(prepared, 'en');
  assert.ok(explainChatQuestion(prepared, 'en'));
  assert.deepEqual(nextChatTurn(prepared, 'en'), before);
  const invalid = submitChatAnswer(prepared, 'en', 'videoGoal', 'anything');
  assert.equal(invalid.ok, false);
});

test('does not override user-supplied selections', () => {
  const draft = { ...createProjectDraft(), answers: { format: '1:1' } };
  const merged = mergeIdeaContext(draft, extractIdeaContext('video 9:16', 'general'));
  assert.equal(merged.answers.format, '1:1');
});

// Adaptive interview and refinement regressions (headless contract).
import { getChatRefinements, submitChatRefinement, skipChatRefinements } from '../services/lookersAiChatWorkflow';
import { projectFromDraft } from '../services/lookersAiProjectState';
import { compileLookersPrompt } from '../data/lookersAi';

const videoDraft = () => ({ ...createProjectDraft(), answers: {
  topicId: 'text-to-video', idea: 'A product video', videoSubject: 'Verified perfume bottle',
  goal: 'Introduce the fragrance', duration: '20 seconds', format: '9:16', tools: 'Runway',
} });

test('extracts labelled explicit audience, goal, output and tool with verbatim evidence', () => {
  const idea = 'video ٢٠ ثانية 9 x 16; audience: new customers; goal: sell perfume; output: JSON; tool: Runway';
  const facts = extractIdeaContext(idea, 'general').facts;
  for (const [field, value] of Object.entries({ audience: 'new customers', purpose: 'sell perfume', output: 'JSON', tools: 'Runway', duration: '20 seconds', format: '9:16' })) {
    const fact = facts.find(f => f.field === field);
    assert.equal(fact?.value, value, field);
    assert.ok(idea.includes(fact!.evidence));
  }
});

test('ambiguous timings and ratios remain unknown and multiple platforms are retained', () => {
  const facts = extractIdeaContext('video 15 seconds or 30 seconds 9:16 or 1:1 for TikTok and YouTube', 'general').facts;
  assert.ok(!facts.some(f => f.field === 'duration' || f.field === 'format'));
  assert.equal(facts.find(f => f.field === 'platform')?.value, 'TikTok, YouTube');
  assert.ok(!facts.some(f => f.field === 'audience' || f.field === 'purpose'));
});

test('extracts explicit prose markers without assuming platform dimensions or a target audience', () => {
  const facts = extractIdeaContext('video targeting hotel managers; in order to explain booking; output as PDF; using Canva', 'general').facts;
  assert.equal(facts.find(f => f.field === 'audience')?.value, 'hotel managers');
  assert.equal(facts.find(f => f.field === 'purpose')?.value, 'explain booking');
  assert.equal(facts.find(f => f.field === 'tools')?.value, 'Canva');
  assert.equal(facts.find(f => f.field === 'output')?.value, 'PDF');
  assert.ok(!extractIdeaContext('video for TikTok', 'general').facts.some(f => f.field === 'format' || f.field === 'audience'));
});

test('confirmed canonical aliases, cleared values and task selection beat extracted context', () => {
  const draft = { ...createProjectDraft(), taskType: 'presentation' as const,
    answers: { goal: 'Explain, never sell', format: '', audience: 'Confirmed audience', tools: ['Canva'] } };
  const before = structuredClone(draft);
  const merged = mergeIdeaContext(draft, extractIdeaContext('video 9:16; goal: sell; audience: others; tools: Runway', 'general'));
  assert.equal(merged.taskType, 'presentation');
  assert.equal(merged.answers.purpose, undefined);
  assert.deepEqual(merged.answers.goal, draft.answers.goal);
  assert.equal(merged.answers.format, '');
  assert.deepEqual(merged.answers.tools, ['Canva']);
  assert.equal(merged.answers.audience, 'Confirmed audience');
  assert.deepEqual(draft, before);
});

test('fully explicit video idea skips answered questions and can generate immediately', () => {
  const draft = createProjectDraft(); draft.answers.topicId = 'text-to-video';
  const result = submitChatAnswer(draft, 'ar', 'idea', 'video 15 seconds 9:16; scene: perfume on marble; goal: show the new bottle; audience: shoppers; tool: Runway');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.turn.status, 'ready');
  assert.equal(projectFromDraft(result.draft, 'active', 'ar').schema.objective, 'show the new bottle');
});

test('sparse video asks at most four necessary follow-ups including duration and dimensions', () => {
  let draft = createProjectDraft(); draft.answers = { topicId: 'text-to-video', idea: 'A video' };
  const answers: Record<string, string> = { videoSubject: 'Bottle', goal: 'Introduce bottle', duration: '15 seconds', format: '9:16' };
  const ids: string[] = [];
  while (nextChatTurn(draft, 'en').status === 'question') {
    const turn = nextChatTurn(draft, 'en'); if (turn.status !== 'question') break;
    ids.push(turn.question.id); assert.ok(ids.length <= 4);
    const result = submitChatAnswer(draft, 'en', turn.question.id, answers[turn.question.id]);
    assert.equal(result.ok, true); if (!result.ok) break; draft = result.draft;
  }
  assert.deepEqual(ids, ['videoSubject', 'goal', 'duration', 'format']);
});

test('conditional voice-over refinement appears only after voice-over is selected', () => {
  const draft = videoDraft();
  assert.equal(nextChatTurn(draft, 'en').status, 'ready');
  assert.ok(!getChatRefinements(draft, 'en').questions.some(q => q.id === 'voiceoverScript'));
  const selected = submitChatRefinement(draft, 'en', 'videoAudio', 'voiceover');
  assert.equal(selected.ok, true); if (!selected.ok) return;
  assert.equal(selected.turn.status, 'ready');
  assert.ok(getChatRefinements(selected.draft, 'en').questions.some(q => q.id === 'voiceoverScript'));
  const silent = { ...selected.draft, answers: { ...selected.draft.answers, videoAudio: 'silent' } };
  assert.ok(!getChatRefinements(silent, 'en').questions.some(q => q.id === 'voiceoverScript'));
  assert.equal(submitChatRefinement(silent, 'en', 'voiceoverScript', 'Unwanted words').ok, false);
});

test('optional refinement collection and skip never block generation or mutate a draft', () => {
  const draft = videoDraft(); const before = structuredClone(draft);
  const refinements = getChatRefinements(draft, 'ar');
  assert.equal(refinements.canGenerate, true); assert.equal(refinements.canSkip, true);
  assert.ok(refinements.questions.every(q => !q.required && q.canSkip));
  assert.equal(skipChatRefinements(draft, 'ar').status, 'ready');
  assert.deepEqual(draft, before);
  const missing = { ...draft, answers: { ...draft.answers, goal: '' } };
  assert.equal(getChatRefinements(missing, 'ar').canGenerate, false);
  assert.equal(submitChatRefinement(missing, 'ar', 'videoStyle', 'cinematic').ok, false);
});

test('invalid, out-of-order, hidden and oversized answers cannot advance or save state', () => {
  const draft = videoDraft(); delete (draft.answers as Record<string, unknown>).format;
  const before = structuredClone(draft);
  assert.equal(submitChatAnswer(draft, 'en', 'format', 'forged').ok, false);
  assert.equal(submitChatAnswer(draft, 'en', 'duration', '15 seconds').ok, false);
  assert.equal(submitChatRefinement(draft, 'en', 'videoStyle', 'cinematic').ok, false);
  assert.deepEqual(draft, before);
  const corrupt = { ...draft, answers: { ...draft.answers, format: 'unknown' } };
  assert.equal(nextChatTurn(corrupt, 'en').status, 'question');
  const empty = createProjectDraft();
  assert.equal(submitChatAnswer(empty, 'en', 'idea', ' ').ok, false);
  assert.equal(submitChatAnswer(empty, 'en', 'idea', 'x'.repeat(4001)).ok, false);
});

test('Arabic explanations cover meaning, purpose and example for video and conditional questions', () => {
  const draft = videoDraft(); delete (draft.answers as Record<string, unknown>).duration;
  const before = structuredClone(draft);
  const help = explainChatQuestion(draft, 'ar');
  assert.match(help!, /قولّي/); assert.match(help!, /عشان/); assert.match(help!, /مثال/);
  assert.match(help!, /ثانية|دقيقة/);
  assert.deepEqual(draft, before);
  const ready = videoDraft(); ready.answers = { ...ready.answers, videoAudio: 'voiceover' } as typeof ready.answers;
  const optionalBefore = structuredClone(ready);
  const scriptHelp = explainChatQuestion(ready, 'ar', 'voiceoverScript');
  assert.match(scriptHelp!, /بالحرف/); assert.match(scriptHelp!, /عشان/); assert.match(scriptHelp!, /مثال/);
  assert.notEqual(scriptHelp, help);
  assert.deepEqual(ready, optionalBefore);
  assert.equal(explainChatQuestion(ready, 'en', 'nonexistent'), null);
  assert.equal(nextChatTurn(ready, 'en').status, 'ready');
});

test('saved refinements, tool selection and constraints survive prompt compilation and canonical conversion', () => {
  const draft = videoDraft();
  const selected = submitChatRefinement(draft, 'en', 'videoStyle', 'cinematic');
  assert.equal(selected.ok, true); if (!selected.ok) return;
  selected.draft.answers.constraints = 'Keep the approved label unchanged';
  selected.draft.answers.output = 'A Runway prompt with a shot list';
  const project = projectFromDraft(selected.draft, 'active', 'en');
  assert.equal(project.schema.intent, draft.answers.idea);
  assert.equal(project.schema.objective, draft.answers.goal);
  assert.deepEqual(project.schema.targetTools, ['Runway']);
  assert.equal(project.schema.output.description, 'A Runway prompt with a shot list');
  const prompt = compileLookersPrompt(selected.draft, 'en');
  for (const value of ['cinematic', '20 seconds', '9:16', 'Verified perfume bottle', 'Runway', 'Keep the approved label unchanged']) {
    assert.ok(project.schema.context.includes(value), value);
    assert.ok(prompt.includes(value), value);
  }
});

test('negated timings and destinations are not positive facts; explicit video subject is reusable', () => {
  const facts = extractIdeaContext('A 15-second video of a perfume bottle on TikTok, not Instagram; not 30 seconds', 'general').facts;
  assert.equal(facts.find(f => f.field === 'duration')?.value, '15 seconds');
  assert.equal(facts.find(f => f.field === 'platform')?.value, 'TikTok');
  assert.equal(facts.find(f => f.field === 'videoSubject')?.value, 'a perfume bottle');
});

test('confirmed subject and tool arrays skip matching questions without rewriting answers', () => {
  const draft = { ...videoDraft(), answers: { idea: 'A video', contentType: 'video', subject: 'Confirmed bottle',
    purpose: 'Introduce bottle', duration: '15 seconds', format: '9:16', tools: ['Runway', 'Sora'] } };
  const before = structuredClone(draft);
  assert.equal(nextChatTurn(draft, 'en').status, 'ready');
  assert.ok(!getChatRefinements(draft, 'en').questions.some(q => q.id === 'tools'));
  assert.deepEqual(draft, before);
});

test('optional presentation explanations have a relevant Egyptian example and preserve state', () => {
  const draft = { ...createProjectDraft(), taskType: 'presentation' as const, answers: {
    idea: 'Quarterly presentation', presentationType: 'business', audience: 'Board', purpose: 'Approve the plan' } };
  const before = structuredClone(draft);
  const help = explainChatQuestion(draft, 'ar', 'slideCount');
  assert.match(help!, /كام شريحة/); assert.match(help!, /عشان/); assert.match(help!, /10 شرائح/);
  assert.deepEqual(draft, before);
  assert.equal(nextChatTurn(draft, 'ar').status, 'ready');
});
