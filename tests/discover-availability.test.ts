import test from 'node:test';
import assert from 'node:assert/strict';

import { HERITAGE_SITES } from '../src/lib/heritage-data';
import { getSiteAvailability, hasVerifiedVisitingHours } from '../src/lib/site-availability';

type AvailabilityFilter = 'all' | 'open' | 'closed';
type SiteAvailabilityStatus = 'open' | 'closed' | 'unverified';

function getDiscoverSiteAvailabilityStatus(site: any, date = new Date()): SiteAvailabilityStatus {
  const availability = getSiteAvailability(site, date);
  if (availability.isOpen) return 'open';
  if (!hasVerifiedVisitingHours(site)) return 'unverified';
  return 'closed';
}

function filterSitesByAvailability<T>(sites: T[], filter: AvailabilityFilter, date = new Date()) {
  const mapped = sites.map(site => ({
    site,
    status: getDiscoverSiteAvailabilityStatus(site, date),
  }));
  if (filter === 'open') return mapped.filter(item => item.status === 'open');
  if (filter === 'closed') return mapped.filter(item => item.status === 'closed');
  return mapped;
}

test('Discover availability status distinguishes Open Now, Closed, and Hours Unverified using Manila time', () => {
  const twoAmManila = new Date('2026-11-19T02:00:00+08:00');
  const tenAmManila = new Date('2026-11-19T10:00:00+08:00');

  const open24h = { id: 's-24h', visitingHours: 'Monday to Sunday, 24 Hours' };
  const daytime = { id: 's-day', visitingHours: 'Monday to Sunday, 8:00 AM - 5:00 PM' };
  const overnight = { id: 's-night', visitingHours: 'Monday to Sunday, 8:00 PM - 4:00 AM' };
  const missingHours = { id: 's-missing', visitingHours: '' };
  const unverifiedHours = { id: 's-unverified', visitingHours: 'Requires verification' };
  const uninterpretableHours = { id: 's-appt', visitingHours: 'By appointment only' };

  assert.equal(getDiscoverSiteAvailabilityStatus(open24h, twoAmManila), 'open');
  assert.equal(getDiscoverSiteAvailabilityStatus(daytime, twoAmManila), 'closed');
  assert.equal(getDiscoverSiteAvailabilityStatus(daytime, tenAmManila), 'open');
  assert.equal(getDiscoverSiteAvailabilityStatus(overnight, twoAmManila), 'open');
  assert.equal(getDiscoverSiteAvailabilityStatus(missingHours, twoAmManila), 'unverified');
  assert.equal(getDiscoverSiteAvailabilityStatus(unverifiedHours, twoAmManila), 'unverified');
  assert.equal(getDiscoverSiteAvailabilityStatus(uninterpretableHours, twoAmManila), 'unverified');

  const corpus = [open24h, daytime, overnight, missingHours, unverifiedHours, uninterpretableHours];
  assert.equal(filterSitesByAvailability(corpus, 'all', twoAmManila).length, 6);
  assert.deepEqual(
    filterSitesByAvailability(corpus, 'open', twoAmManila).map(x => x.site.id),
    ['s-24h', 's-night']
  );
  assert.deepEqual(
    filterSitesByAvailability(corpus, 'closed', twoAmManila).map(x => x.site.id),
    ['s-day']
  );
});

test('Discover availability filters preserve all Cebu City sites at night under All and separate Open Now from Closed', () => {
  const twoAmManila = new Date('2026-11-19T02:00:00+08:00');
  const cebuCitySites = HERITAGE_SITES.filter(site => site.city === 'Cebu City');

  const allItems = filterSitesByAvailability(cebuCitySites, 'all', twoAmManila);
  const openItems = filterSitesByAvailability(cebuCitySites, 'open', twoAmManila);
  const closedItems = filterSitesByAvailability(cebuCitySites, 'closed', twoAmManila);

  assert.equal(allItems.length, cebuCitySites.length);
  assert.ok(openItems.some(item => item.site.id === 'cebu-plaza-sugbo'));
  assert.ok(closedItems.some(item => item.site.id === 'cebu-fort-san-pedro'));
  assert.equal(
    openItems.every(item => item.status === 'open'),
    true
  );
  assert.equal(
    closedItems.every(item => item.status === 'closed'),
    true
  );
  assert.ok(openItems.length + closedItems.length <= allItems.length);
});

