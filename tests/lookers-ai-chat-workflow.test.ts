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
