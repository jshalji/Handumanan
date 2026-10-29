import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  buildHeritageSiteCityMap,
  buildHeritageSiteNameMap,
  groupCommunityPhotosByCity,
  normalizeCommunityPhotos,
  resolveHeritageSiteName,
  sortCommunityReviews,
} from '../src/lib/admin-community';
import {
  requestPasswordReset,
  validatePasswordResetEmail,
} from '../src/lib/password-reset';

test('photo normalization retains valid photo documents even when a thumbnail URL is missing', () => {
  const photos = normalizeCommunityPhotos([
    { id: 'stored-only', siteId: 'site-a', storagePath: 'visitorPhotos/site-a/photo.jpg' },
  ]);

  assert.equal(photos.length, 1);
  assert.equal(photos[0].id, 'stored-only');
  assert.equal(photos[0].imageUrl, '');
});

test('photo normalization includes both timestamp schemas and sorts current createdAt first', () => {
  const photos = normalizeCommunityPhotos([
    { id: 'created-old', siteId: 'site-a', imageUrl: 'a.jpg', createdAt: new Date('2024-01-01T00:00:00Z') },
    { id: 'uploaded-new', siteId: 'site-b', photoUrl: 'b.jpg', uploadedAt: '2025-01-01T00:00:00Z', userName: 'Legacy User' },
    { id: 'both', siteId: 'site-c', imageUrl: 'c.jpg', createdAt: '2024-06-01T00:00:00Z', uploadedAt: '2026-01-01T00:00:00Z' },
    { id: 'no-time', siteId: 'site-d', imageUrl: 'd.jpg' },
    { id: 'no-image', siteId: 'site-e', createdAt: '2026-02-01T00:00:00Z' },
    { id: 'no-site', imageUrl: 'admin.jpg', uploadedAt: '2026-03-01T00:00:00Z' },
  ]);

  assert.deepEqual(photos.map(photo => photo.id), ['no-site', 'no-image', 'uploaded-new', 'both', 'created-old', 'no-time']);
  assert.equal(photos[0].siteId, '');
  assert.equal(photos[1].imageUrl, '');
  assert.equal(photos[2].userName, 'Legacy User');
});

test('photo normalization recovers a missing site ID from its real visitor-photo document path', () => {
  const photos = normalizeCommunityPhotos([
    {
      id: 'photo-from-path',
      imageUrl: 'photo.jpg',
      __documentPath: 'heritageSites/real-site/visitorPhotos/photo-from-path',
    },
  ]);

  assert.equal(photos[0].siteId, 'real-site');
});

test('photo normalization accepts known older site-id and image field aliases', () => {
  const photos = normalizeCommunityPhotos([
    { id: 'legacy', heritageSiteId: 'site-legacy', photoUrl: 'legacy.jpg' },
  ]);

  assert.equal(photos.length, 1);
  assert.equal(photos[0].siteId, 'site-legacy');
  assert.equal(photos[0].imageUrl, 'legacy.jpg');
});

test('review sorting retains every review document, including records without timestamps', () => {
  const reviews = sortCommunityReviews([
    { id: 'older', createdAt: '2023-01-01T00:00:00Z' },
    { id: 'newer', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'legacy-no-time', comment: 'A saved review without a timestamp' },
  ]);

  assert.deepEqual(reviews.map(review => review.id), ['newer', 'older', 'legacy-no-time']);
  assert.equal(reviews.length, 3);
});

test('heritage site names resolve by site ID, prefer Firestore names, and fall back explicitly', () => {
  const names = buildHeritageSiteNameMap(
    [{ id: 'site-1', name: 'Official Firestore Name' }, { id: 'site-2', name: 'Second Site' }],
    [{ id: 'site-1', name: 'Static Name' }, { id: 'site-3', name: 'Built-in Site' }],
  );

  assert.equal(resolveHeritageSiteName('site-1', names), 'Official Firestore Name');
  assert.equal(resolveHeritageSiteName('site-3', names), 'Built-in Site');
  assert.equal(resolveHeritageSiteName('Official Firestore Name', names), 'Unknown heritage site');
  assert.equal(resolveHeritageSiteName('missing-id', names), 'Unknown heritage site');
});

test('photo albums resolve city only through the photo site ID and place unknown records in Unassigned', () => {
  const siteCities = buildHeritageSiteCityMap(
    [
      { id: 'known-site', city: 'Talisay City' },
      { id: 'site-with-invalid-city', city: 'Cebu Province' },
    ],
    [
      { id: 'known-site', city: 'Cebu City' },
      { id: 'site-with-invalid-city', city: 'Mandaue City' },
      { id: 'built-in-site', city: 'Lapu-Lapu City' },
    ],
  );
  const photos = normalizeCommunityPhotos([
    { id: 'photo-a', siteId: 'known-site', imageUrl: 'a.jpg', caption: 'Not Talisay, maybe Cebu' },
    { id: 'photo-b', siteId: 'built-in-site', imageUrl: 'b.jpg' },
    { id: 'photo-c', siteId: 'missing-site', imageUrl: 'c.jpg', caption: 'Mandaue' },
    { id: 'photo-d', imageUrl: 'd.jpg', caption: 'Cebu City' },
  ]);
  const albums = groupCommunityPhotosByCity(photos, siteCities);

  assert.deepEqual(albums['Talisay City'].map(photo => photo.id), ['photo-a']);
  assert.deepEqual(albums['Lapu-Lapu City'].map(photo => photo.id), ['photo-b']);
  assert.deepEqual(albums['Cebu City'], []);
  assert.deepEqual(albums['Mandaue City'], []);
  assert.deepEqual(albums.Unassigned.map(photo => photo.id).sort(), ['photo-c', 'photo-d']);
});

test('every visitor photo appears in exactly one album and album counts equal the grouped records', () => {
  const albums = groupCommunityPhotosByCity(
    normalizeCommunityPhotos([
      { id: 'cebu', siteId: 'cebu-site', imageUrl: 'cebu.jpg' },
      { id: 'talisay', siteId: 'talisay-site', imageUrl: 'talisay.jpg' },
      { id: 'unknown', siteId: 'unknown-site', imageUrl: 'unknown.jpg' },
    ]),
    new Map([['cebu-site', 'Cebu City'], ['talisay-site', 'Talisay City']]),
  );
  const groupedPhotos = Object.values(albums).flat();

  assert.equal(groupedPhotos.length, 3);
  assert.equal(new Set(groupedPhotos.map(photo => photo.id)).size, 3);
  assert.equal(Object.values(albums).reduce((count, photos) => count + photos.length, 0), 3);
  assert.equal(albums['Cebu City'].length, 1);
  assert.equal(albums['Talisay City'].length, 1);
  assert.equal(albums.Unassigned.length, 1);
});

test('reset email validation rejects malformed addresses before calling Firebase', async () => {
  assert.equal(validatePasswordResetEmail('not-an-email'), false);
  let wasSent = false;
  const result = await requestPasswordReset('not-an-email', async () => { wasSent = true; });
  assert.equal(result.status, 'invalid');
  assert.equal(wasSent, false);
});

test('password reset reports loading then privacy-preserving success without sending real email in tests', async () => {
  const states: boolean[] = [];
  const result = await requestPasswordReset(
    '  person@example.com  ',
    async email => { assert.equal(email, 'person@example.com'); },
    state => states.push(state),
  );

  assert.deepEqual(states, [true, false]);
  assert.equal(result.status, 'success');
  assert.match(result.message, /if an account matches/i);
  assert.match(result.message, /spam folder/i);
});

test('Firebase user-not-found is reported as the same neutral reset success', async () => {
  const result = await requestPasswordReset('person@example.com', async () => {
    throw Object.assign(new Error('private user detail'), { code: 'auth/user-not-found' });
  });
  assert.equal(result.status, 'success');
  assert.doesNotMatch(result.message, /private user detail/i);
});

test('password reset handles network failures and always clears its loading state', async () => {
  const states: boolean[] = [];
  const result = await requestPasswordReset(
    'person@example.com',
    async () => { throw Object.assign(new Error('secret firebase details'), { code: 'auth/network-request-failed' }); },
    state => states.push(state),
  );

  assert.deepEqual(states, [true, false]);
  assert.equal(result.status, 'error');
  assert.match(result.message, /connection/i);
  assert.doesNotMatch(result.message, /secret firebase details/i);
});

test('password reset reports Firebase failures without exposing raw provider details', async () => {
  const result = await requestPasswordReset('person@example.com', async () => {
    throw Object.assign(new Error('provider internal detail'), { code: 'auth/too-many-requests' });
  });

  assert.equal(result.status, 'error');
  assert.match(result.message, /try again later/i);
  assert.doesNotMatch(result.message, /provider internal detail/i);
});
