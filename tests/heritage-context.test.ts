import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  isInformationQuery,
  isFollowUpQuery,
  isCorrectionQuery,
  extractConversationContext,
  isTourPlanningMode,
} from '../src/lib/heritage-intent';

test('information queries are detected', () => {
  assert.equal(isInformationQuery('tell me about casa gorordo'), true);
  assert.equal(isInformationQuery('what are the visiting hours'), true);
  assert.equal(isInformationQuery('plan a trip'), false);
});

test('follow-up and correction queries are detected', () => {
  assert.equal(isFollowUpQuery('what about museums'), true);
  assert.equal(isFollowUpQuery('plan a trip'), false);
  assert.equal(isCorrectionQuery('no i meant churches'), true);
  assert.equal(isCorrectionQuery('hello'), false);
});

test('extractConversationContext captures last city and intent', () => {
  const ctx = extractConversationContext([
    { role: 'user', content: [{ text: 'Plan a trip to heritage sites in Cebu City' }] },
    { role: 'model', content: [{ text: 'I can help build a heritage tour for you.' }] },
  ], []);
  assert.equal(ctx.lastCity, 'Cebu City');
  assert.equal(ctx.lastIntent, 'itinerary');
});

test('informational follow-ups do not force tour-planning mode', () => {
  const history = [
    { role: 'user', content: [{ text: 'Plan a trip to heritage sites' }] },
    { role: 'model', content: [{ text: "I'd love to help plan a heritage tour for you! How much time do you have for the visit?" }] },
  ];
  assert.equal(isTourPlanningMode(history, 'tell me about casa gorordo'), false);
});

test('spelled-out durations activate planning mode', () => {
  assert.equal(isTourPlanningMode([], 'plan a two-hour heritage trip'), true);
});
