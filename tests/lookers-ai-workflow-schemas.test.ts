import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createProjectDraft } from '../data/lookersAi';
import { workflowFamilies } from '../services/lookersAiWorkflowFamilies';
import { workflowSchemas, validateWorkflowSchemas } from '../services/lookersAiWorkflowSchemas';
import { nextChatTurn, submitChatAnswer, explainChatQuestion } from '../services/lookersAiChatWorkflow';

test('all families have clear bilingual questions and help examples', () => {
  assert.deepEqual(validateWorkflowSchemas(), []);
  assert.equal(Object.keys(workflowSchemas).length, workflowFamilies.length);
  for (const family of workflowFamilies) {
    assert.ok(workflowSchemas[family].steps.length >= 2);
    assert.ok(workflowSchemas[family].steps.filter(s => !s.optional).length <= 4);
  }
});

test('selected topic uses its family instead of generic questions', () => {
  const draft = createProjectDraft();
  draft.answers.topicId = 'email-draft';
  const first = submitChatAnswer(draft, 'ar', 'idea', 'عايز أبعت اعتذار للعميل');
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(first.turn.status, 'question');
  if (first.turn.status !== 'question') return;
  assert.equal(first.turn.question.id, 'message');
  assert.ok(first.turn.question.help.includes('مثال'));
});

test('help does not change state or advance the conversation', () => {
  const draft = createProjectDraft();
  draft.answers.topicId = 'landing-page';
  draft.answers.idea = 'Build a landing page for a hotel';
  const before = JSON.stringify(draft);
  const question = nextChatTurn(draft, 'en');
  assert.equal(question.status, 'question');
  const explanation = explainChatQuestion(draft, 'en');
  assert.ok(explanation?.includes('For example'));
  assert.equal(JSON.stringify(draft), before);
  assert.deepEqual(nextChatTurn(draft, 'en'), question);
});

test('existing answers skip questions and invalid selections cannot advance', () => {
  const draft = createProjectDraft();
  draft.answers.topicId = 'product-photography';
  draft.answers.idea = 'Perfume ad';
  draft.answers.subject = 'Perfume bottle';
  const next = nextChatTurn(draft, 'en');
  assert.equal(next.status, 'question');
  if (next.status !== 'question') return;
  assert.equal(next.question.id, 'goal');
  assert.equal(submitChatAnswer(draft, 'en', 'format', '1:1').ok, false);
});
