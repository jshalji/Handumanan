import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  buildHeritageSiteCityMap,
  buildHeritageSiteNameMap,
  getCommunityPostDeletionTargets,
  groupCommunityPhotosByCity,
  normalizeCommunityPhotos,
  normalizeCommunityReviews,
  resolveHeritageSiteName,
  sortCommunityReviews,
} from '../src/lib/admin-community';
import {
  buildAutoProvisionUserPayload,
  resolveProvisionedDisplayName,
} from '../src/firebase/provider';
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

test('review normalization recovers missing siteId from __documentPath and legacy aliases while sorting newest first', () => {
  const reviews = normalizeCommunityReviews([
    {
      id: 'path-only',
      comment: 'Great landmark!',
      createdAt: '2025-01-01T00:00:00Z',
      __documentPath: 'heritageSites/cebu-basilica/reviews/path-only',
    },
    {
      id: 'alias-site-id',
      heritageSiteId: 'llc-mactan-shrine',
      heritageSiteName: 'Liberty Shrine (Mactan Shrine)',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'direct-site-id',
      siteId: 'marcelo-fernan-bridge',
      siteName: 'Marcelo Fernan Bridge',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'missing-site-id',
      siteName: 'Legacy Saved Landmark',
      comment: 'No recoverable site ID',
      createdAt: '2023-01-01T00:00:00Z',
    },
  ]);

  assert.deepEqual(reviews.map(review => review.id), ['alias-site-id', 'path-only', 'direct-site-id', 'missing-site-id']);
  assert.equal(reviews[0].siteId, 'llc-mactan-shrine');
  assert.equal(reviews[0].siteName, 'Liberty Shrine (Mactan Shrine)');
  assert.equal(reviews[1].siteId, 'cebu-basilica');
  assert.equal(reviews[2].siteId, 'marcelo-fernan-bridge');
  assert.equal(reviews[3].siteId, '');
  assert.equal(reviews[3].siteName, 'Legacy Saved Landmark');
});

test('community post deletion targets handle review-only, single-photo, multi-photo, and combined posts without duplicates', () => {
  const reviewOnly = getCommunityPostDeletionTargets({
    rawReviewId: 'rev-1',
  });
  assert.deepEqual(reviewOnly, {
    reviewId: 'rev-1',
    photoIds: [],
    storagePaths: [],
  });

  const singlePhoto = getCommunityPostDeletionTargets({
    photos: [{ id: 'photo-1', storagePath: 'visitorPhotos/site-1/p1.jpg' }],
  });
  assert.deepEqual(singlePhoto, {
    reviewId: null,
    photoIds: ['photo-1'],
    storagePaths: ['visitorPhotos/site-1/p1.jpg'],
  });

  const multiPhoto = getCommunityPostDeletionTargets({
    photos: [
      { id: 'photo-1', storagePath: 'visitorPhotos/site-1/p1.jpg' },
      { id: 'photo-2', storagePath: 'visitorPhotos/site-1/p2.jpg' },
      { id: 'photo-1', storagePath: 'visitorPhotos/site-1/p1.jpg' },
      { id: 'photo-3', storagePath: '' },
    ],
  });
  assert.deepEqual(multiPhoto, {
    reviewId: null,
    photoIds: ['photo-1', 'photo-2', 'photo-3'],
    storagePaths: ['visitorPhotos/site-1/p1.jpg', 'visitorPhotos/site-1/p2.jpg'],
  });

  const combinedPost = getCommunityPostDeletionTargets({
    rawReviewId: 'rev-combined',
    photos: [
      { id: 'photo-a', storagePath: 'visitorPhotos/site-1/a.jpg' },
      { id: 'photo-b', storagePath: 'visitorPhotos/site-1/b.jpg' },
    ],
  });
  assert.deepEqual(combinedPost, {
    reviewId: 'rev-combined',
    photoIds: ['photo-a', 'photo-b'],
    storagePaths: ['visitorPhotos/site-1/a.jpg', 'visitorPhotos/site-1/b.jpg'],
  });
});

test('display name resolution and auto-provisioning preserve chosen registration name and existing role', () => {
  assert.equal(
    resolveProvisionedDisplayName({
      pendingDisplayName: 'Maria Clara',
      authDisplayName: null,
      email: 'mclara@example.com',
    }),
    'Maria Clara',
  );

  assert.equal(
    resolveProvisionedDisplayName({
      existingDisplayName: 'Existing User Name',
      pendingDisplayName: 'Fallback',
      authDisplayName: 'Auth Name',
      email: 'user@example.com',
    }),
    'Existing User Name',
  );

  const newAccountPayload = buildAutoProvisionUserPayload({
    uid: 'uid-1',
    email: 'explorer@example.com',
    authDisplayName: null,
    pendingDisplayName: 'Juan Dela Cruz',
    existingData: null,
    timestampValue: 'NOW',
  });
  assert.deepEqual(newAccountPayload, {
    uid: 'uid-1',
    displayName: 'Juan Dela Cruz',
    email: 'explorer@example.com',
    role: 'user',
    createdAt: 'NOW',
    updatedAt: 'NOW',
  });

  const alreadyCompletePayload = buildAutoProvisionUserPayload({
    uid: 'uid-admin',
    email: 'admin@example.com',
    authDisplayName: 'Ignored Auth Name',
    pendingDisplayName: 'Ignored Pending Name',
    existingData: { displayName: 'System Admin', role: 'admin', email: 'admin@example.com' },
    timestampValue: 'NOW',
  });
  assert.equal(alreadyCompletePayload, null);

  // Existing profile missing role: repairs only role without overwriting existing displayName
  const missingRolePayload = buildAutoProvisionUserPayload({
    uid: 'uid-missing-role',
    email: 'elena@example.com',
    authDisplayName: 'Different Auth Name',
    pendingDisplayName: 'Different Pending Name',
    existingData: {
      displayName: 'Elena Cruz',
      email: 'elena@example.com',
      city: 'Cebu City',
    },
    timestampValue: 'NOW',
  });
  assert.deepEqual(missingRolePayload, {
    uid: 'uid-missing-role',
    role: 'user',
    updatedAt: 'NOW',
  });
  assert.equal('displayName' in (missingRolePayload || {}), false);

  // Existing profile missing displayName: repairs only displayName without overwriting existing role
  const missingDisplayNamePayload = buildAutoProvisionUserPayload({
    uid: 'uid-missing-name',
    email: 'officer@cebu.gov.ph',
    authDisplayName: 'Officer Santos',
    pendingDisplayName: 'Officer M. Santos',
    existingData: {
      displayName: '   ',
      role: 'lgu',
      email: 'officer@cebu.gov.ph',
      assignedCity: 'Cebu City',
    },
    timestampValue: 'NOW',
  });
  assert.deepEqual(missingDisplayNamePayload, {
    uid: 'uid-missing-name',
    displayName: 'Officer M. Santos',
    updatedAt: 'NOW',
  });
  assert.equal('role' in (missingDisplayNamePayload || {}), false);
});
