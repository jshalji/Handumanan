import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { isConversationalMessage, isTourPlanningMode, isExplicitTourRequest } from '../src/lib/heritage-intent';

const tourPlanningHistory = [
  { role: 'user', content: [{ text: 'Plan a trip to heritage sites' }] },
  { role: 'model', content: [{ text: "I'd love to help plan a heritage tour for you! How much time do you have for the visit?" }] },
];

test('conversational messages are detected', () => {
  assert.equal(isConversationalMessage('hello'), true);
  assert.equal(isConversationalMessage('hi'), true);
  assert.equal(isConversationalMessage('thank you'), true);
  assert.equal(isConversationalMessage('salamat'), true);
  assert.equal(isConversationalMessage('bye'), true);
  assert.equal(isConversationalMessage('goodbye'), true);
  assert.equal(isConversationalMessage('my name is matty'), true);
  assert.equal(isConversationalMessage('china'), true);
  assert.equal(isConversationalMessage('india'), true);
});

test('non-conversational messages are not falsely detected', () => {
  assert.equal(isConversationalMessage('plan a trip'), false);
  assert.equal(isConversationalMessage('what are the visiting hours'), false);
  assert.equal(isConversationalMessage('tell me about casa gorordo'), false);
  assert.equal(isConversationalMessage('how much time do you have'), false);
});

test('greetings do not trigger tour planning mode even with tour history', () => {
  assert.equal(isTourPlanningMode(tourPlanningHistory, 'hello'), false);
  assert.equal(isTourPlanningMode(tourPlanningHistory, 'hi'), false);
  assert.equal(isTourPlanningMode(tourPlanningHistory, 'hey'), false);
});

test('thanks do not trigger tour planning mode even with tour history', () => {
  assert.equal(isTourPlanningMode(tourPlanningHistory, 'thank you'), false);
  assert.equal(isTourPlanningMode(tourPlanningHistory, 'thanks'), false);
  assert.equal(isTourPlanningMode(tourPlanningHistory, 'salamat'), false);
});

test('farewells do not trigger tour planning mode even with tour history', () => {
  assert.equal(isTourPlanningMode(tourPlanningHistory, 'bye'), false);
  assert.equal(isTourPlanningMode(tourPlanningHistory, 'goodbye'), false);
  assert.equal(isTourPlanningMode(tourPlanningHistory, 'see you'), false);
});

test('unrelated messages do not trigger tour planning mode even with tour history', () => {
  assert.equal(isTourPlanningMode(tourPlanningHistory, 'my name is matty'), false);
  assert.equal(isTourPlanningMode(tourPlanningHistory, 'china'), false);
  assert.equal(isTourPlanningMode(tourPlanningHistory, 'india'), false);
  assert.equal(isTourPlanningMode(tourPlanningHistory, 'chinia'), false);
});

test('explicit tour request activates planning mode', () => {
  assert.equal(isTourPlanningMode([], 'plan a trip to heritage sites'), true);
  assert.equal(isTourPlanningMode([], 'make an itinerary'), true);
  assert.equal(isTourPlanningMode([], 'create a tour for me'), true);
});

test('planning update phrases continue planning mode', () => {
  assert.equal(isTourPlanningMode(tourPlanningHistory, '2 hours'), true);
  assert.equal(isTourPlanningMode(tourPlanningHistory, 'walking'), true);
  assert.equal(isTourPlanningMode(tourPlanningHistory, 'churches'), true);
});

test('isExplicitTourRequest detects standalone tour requests', () => {
  assert.equal(isExplicitTourRequest('plan a trip to heritage sites', []), true);
  assert.equal(isExplicitTourRequest('make an itinerary', []), true);
  assert.equal(isExplicitTourRequest('hello', []), false);
  assert.equal(isExplicitTourRequest('thank you', []), false);
});

test('empty history does not trigger planning mode for non-tour messages', () => {
  assert.equal(isTourPlanningMode([], 'hello'), false);
  assert.equal(isTourPlanningMode([], 'thank you'), false);
  assert.equal(isTourPlanningMode([], 'bye'), false);
});