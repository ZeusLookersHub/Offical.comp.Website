import assert from 'node:assert/strict';
import { test } from 'node:test';
import { topicRegistry, resolveTopic, validateTopicRegistry } from '../services/lookersAiTopicRegistry';
import { workflowFamilies } from '../services/lookersAiWorkflowFamilies';

test('canonical registry contains 14 families and no duplicates or broken aliases', () => {
  assert.equal(workflowFamilies.length, 14);
  assert.deepEqual(validateTopicRegistry(), []);
  assert.ok(topicRegistry.length >= 100);
});

test('aliases resolve to the same canonical topic as direct entries', () => {
  assert.deepEqual(resolveTopic('product-photo'), resolveTopic('product-photography'));
  assert.equal(resolveTopic('video-storyboard')?.family, 'video');
  assert.equal(resolveTopic('career-cv')?.family, 'learning');
  assert.equal(resolveTopic('dashboard-design')?.family, 'data');
  assert.equal(resolveTopic('not-a-real-topic'), undefined);
});

test('similar tasks share a family without duplicating a workflow', () => {
  assert.equal(resolveTopic('social-post-design')?.family, resolveTopic('logo-concept')?.family);
  assert.equal(resolveTopic('sales-deck')?.family, resolveTopic('training-deck')?.family);
});
