import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { getRatingSummaryState, groupReviewsBySiteId } from '../src/lib/review-ratings';

const loaded = { isLoading: false, isAvailable: true, error: null };

test('zero reviews produce an empty rating state, not a numeric score', () => {
  assert.deepEqual(getRatingSummaryState([], loaded), {
    status: 'empty',
    average: null,
    count: 0,
    counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
});

test('one valid review produces its actual score and a count of one', () => {
  const summary = getRatingSummaryState([{ rating: 4 }], loaded);
  assert.equal(summary.status, 'rated');
  assert.equal(summary.average, 4);
  assert.equal(summary.count, 1);
});

test('multiple valid reviews produce their arithmetic mean and rating breakdown', () => {
  const summary = getRatingSummaryState([{ rating: 5 }, { rating: 4 }, { rating: 2 }], loaded);
  assert.equal(summary.status, 'rated');
  assert.equal(summary.average, 11 / 3);
  assert.equal(summary.count, 3);
  assert.deepEqual(summary.counts, { 1: 0, 2: 1, 3: 0, 4: 1, 5: 1 });
});

test('missing, nonnumeric, nonfinite, and out-of-range ratings do not count', () => {
  const summary = getRatingSummaryState([
    {},
    { rating: '5' },
    { rating: 0 },
    { rating: 5.1 },
    { rating: Number.NaN },
    { rating: Number.POSITIVE_INFINITY },
  ], loaded);
  assert.deepEqual(summary, {
    status: 'empty',
    average: null,
    count: 0,
    counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
});

test('review loading errors produce an unavailable state, not an empty state', () => {
  const summary = getRatingSummaryState(null, {
    isLoading: false,
    isAvailable: true,
    error: new Error('Firestore unavailable'),
  });
  assert.equal(summary.status, 'unavailable');
  assert.equal(summary.average, null);
  assert.equal(summary.count, 0);
});

test('pending review loads produce a loading state', () => {
  const summary = getRatingSummaryState(null, {
    isLoading: true,
    isAvailable: true,
    error: null,
  });
  assert.equal(summary.status, 'loading');
  assert.equal(summary.average, null);
});

test('review collection-group documents are grouped by their heritage-site path only', () => {
  const grouped = groupReviewsBySiteId([
    { rating: 5, __documentPath: 'heritageSites/site-a/reviews/review-1' },
    { rating: 4, __documentPath: 'heritageSites/site-a/reviews/review-2' },
    { rating: 3, __documentPath: 'heritageSites/site-b/reviews/review-3' },
    { rating: 5, __documentPath: 'users/user-a/reviews/review-4' },
    { rating: 5, siteId: 'site-c' },
  ]);

  assert.deepEqual([...grouped.keys()], ['site-a', 'site-b']);
  assert.deepEqual(grouped.get('site-a')?.map(review => review.rating), [5, 4]);
  assert.deepEqual(grouped.get('site-b')?.map(review => review.rating), [3]);
});
