import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  generateLocalItinerary,
  isSiteOpenAtDateTime,
  isSiteOpenForEntireVisit,
  resolveDiscoverFutureCompatibleSites,
  resolvePlannerCandidates,
  sanitizeGeneratedItinerary,
  serializeSitesForPlanner,
  type PlannerItineraryOutput,
} from '../src/lib/itinerary-planner';

// Fixed deterministic timestamps in Asia/Manila (+08:00)
const WEDNESDAY_DAYTIME_2PM = new Date('2026-11-11T14:00:00+08:00');
const WEDNESDAY_AFTER_HOURS_11PM = new Date('2026-11-11T23:00:00+08:00');
const SATURDAY_AFTERNOON_2PM = new Date('2026-11-14T14:00:00+08:00');
const SATURDAY_NIGHT_9PM = new Date('2026-11-14T21:00:00+08:00');
const SUNDAY_MORNING_915AM = new Date('2026-11-15T09:15:00+08:00');
const MONDAY_MORNING_10AM = new Date('2026-11-16T10:00:00+08:00');

const SAMPLE_MUSEUM_9AM = {
  id: 'cebu-casa-gorordo',
  name: 'Casa Gorordo Museum',
  city: 'Cebu City',
  visitingHours: 'Monday to Sunday, 9:00 AM - 5:00 PM',
  coordinates: { lat: 10.2999, lng: 123.90483 },
  isActive: true,
  status: 'Active',
  demolitionStatus: 'Non-Demolished',
  accessibilityStatus: 'Accessible',
};

const SAMPLE_MUSEUM_10AM = {
  id: 'cebu-sugbu-chinese-museum',
  name: 'Sugbu Chinese Heritage Museum',
  city: 'Cebu City',
  visitingHours: 'Monday to Sunday, 10:00 AM - 5:00 PM',
  coordinates: { lat: 10.29386, lng: 123.90268 },
  isActive: true,
  status: 'Active',
  demolitionStatus: 'Non-Demolished',
  accessibilityStatus: 'Accessible',
};

const SAMPLE_WEEKDAY_LIBRARY = {
  id: 'cebu-rizal-memorial-library',
  name: 'Rizal Memorial Library and Museum',
  city: 'Cebu City',
  visitingHours: 'Monday to Friday, 8:00 AM - 5:00 PM',
  coordinates: { lat: 10.30931, lng: 123.89274 },
  isActive: true,
  status: 'Active',
  demolitionStatus: 'Non-Demolished',
  accessibilityStatus: 'Accessible',
};

const SAMPLE_CLOSED_ON_MONDAYS_SITE = {
  id: 'custom-closed-monday-museum',
  name: 'Parian Heritage Gallery',
  city: 'Cebu City',
  visitingHours: 'Tuesday to Sunday, 9:00 AM - 5:00 PM (Closed on Mondays)',
  coordinates: { lat: 10.2985, lng: 123.9041 },
  isActive: true,
  status: 'Active',
  demolitionStatus: 'Non-Demolished',
  accessibilityStatus: 'Accessible',
};

test('currently open sites remain preferred over currently closed sites in both AI sanitization and local fallback', () => {
  // At Sunday 9:15 AM Manila time:
  // - Casa Gorordo (9:00 AM - 5:00 PM, Mon-Sun) is OPEN
  // - Sugbu Chinese Museum (10:00 AM - 5:00 PM, Mon-Sun) is CLOSED (opens at 10 AM)
  // - Rizal Memorial Library (8:00 AM - 5:00 PM, Mon-Fri) is CLOSED (Sunday)
  const candidateSites = [SAMPLE_MUSEUM_9AM, SAMPLE_MUSEUM_10AM, SAMPLE_WEEKDAY_LIBRARY];
  const input = {
    selectedSitesJson: serializeSitesForPlanner(candidateSites),
    availableTimeHours: 4,
    startingLocation: 'Cebu City',
  };

  const resolution = resolvePlannerCandidates(input, SUNDAY_MORNING_915AM);
  assert.equal(resolution.mode, 'open-now');
  assert.deepEqual(
    resolution.sites.map(site => site.id),
    ['cebu-casa-gorordo']
  );

  const localResult = generateLocalItinerary(input, SUNDAY_MORNING_915AM);
  assert.deepEqual(
    localResult.itinerary.map(stop => stop.siteId),
    ['cebu-casa-gorordo']
  );
  assert.match(localResult.summary, /from the available sites/i);

  const simulatedAiOutput: PlannerItineraryOutput = {
    itinerary: [
      {
        siteId: 'cebu-sugbu-chinese-museum',
        siteName: 'Sugbu Chinese Heritage Museum',
        estimatedVisitDurationMinutes: 45,
        description: 'Visit Sugbu Chinese Heritage Museum.',
      },
      {
        siteId: 'cebu-casa-gorordo',
        siteName: 'Casa Gorordo Museum',
        estimatedVisitDurationMinutes: 45,
        description: 'Visit Casa Gorordo Museum.',
      },
    ],
    summary: 'AI summary',
    routeSuggestion: 'AI route',
    totalEstimatedDurationMinutes: 90,
  };

  const aiSanitizedResult = sanitizeGeneratedItinerary(
    simulatedAiOutput,
    input,
    SUNDAY_MORNING_915AM
  );
  assert.deepEqual(
    aiSanitizedResult.itinerary.map(stop => stop.siteId),
    ['cebu-casa-gorordo']
  );
  assert.match(aiSanitizedResult.summary, /using only available Handumanan sites/i);
});

test('weekday-only site on a weekend is scheduled for the next Monday opening window', () => {
  const input = {
    selectedSitesJson: serializeSitesForPlanner([SAMPLE_WEEKDAY_LIBRARY]),
    availableTimeHours: 2,
    startingLocation: 'Cebu City',
  };

  // Saturday 2:00 PM -> Rizal Memorial Library (Mon-Fri, 8:00 AM - 5:00 PM) is closed all weekend
  assert.equal(isSiteOpenAtDateTime(SAMPLE_WEEKDAY_LIBRARY, SATURDAY_AFTERNOON_2PM), false);

  const resolution = resolvePlannerCandidates(input, SATURDAY_AFTERNOON_2PM);
  assert.equal(resolution.mode, 'future-daytime');
  assert.ok(resolution.plannedDate, 'Must resolve a concrete future plannedDate');
  assert.match(resolution.plannedWindowLabel || '', /^Monday, Nov 16 at 8:00 AM$/);
  assert.equal(isSiteOpenAtDateTime(SAMPLE_WEEKDAY_LIBRARY, resolution.plannedDate), true);

  const localResult = generateLocalItinerary(input, SATURDAY_AFTERNOON_2PM);
  assert.deepEqual(
    localResult.itinerary.map(stop => stop.siteId),
    ['cebu-rizal-memorial-library']
  );
  assert.match(localResult.summary, /Monday, Nov 16 at 8:00 AM/);
  assert.match(localResult.routeSuggestion, /Monday, Nov 16 at 8:00 AM/);

  const aiResult = sanitizeGeneratedItinerary(
    {
      itinerary: [],
      summary: '',
      routeSuggestion: '',
      totalEstimatedDurationMinutes: 0,
    },
    input,
    SATURDAY_AFTERNOON_2PM
  );
  assert.deepEqual(
    aiResult.itinerary.map(stop => stop.siteId),
    ['cebu-rizal-memorial-library']
  );
  assert.match(aiResult.summary, /Monday, Nov 16 at 8:00 AM/);
});

test('site with a day-off qualifier is closed on its day off and scheduled for the next open day', () => {
  // Monday 10:00 AM -> Parian Heritage Gallery is "Tuesday to Sunday, 9:00 AM - 5:00 PM (Closed on Mondays)"
  assert.equal(isSiteOpenAtDateTime(SAMPLE_CLOSED_ON_MONDAYS_SITE, MONDAY_MORNING_10AM), false);

  const input = {
    selectedSitesJson: serializeSitesForPlanner([SAMPLE_CLOSED_ON_MONDAYS_SITE]),
    availableTimeHours: 2,
    startingLocation: 'Cebu City',
  };

  const resolution = resolvePlannerCandidates(input, MONDAY_MORNING_10AM);
  assert.equal(resolution.mode, 'future-daytime');
  assert.ok(resolution.plannedDate);
  assert.match(resolution.plannedWindowLabel || '', /^Tuesday, Nov 17 at 9:00 AM$/);
  assert.equal(isSiteOpenAtDateTime(SAMPLE_CLOSED_ON_MONDAYS_SITE, resolution.plannedDate), true);

  const localResult = generateLocalItinerary(input, MONDAY_MORNING_10AM);
  assert.deepEqual(
    localResult.itinerary.map(stop => stop.siteId),
    ['custom-closed-monday-museum']
  );
  assert.match(localResult.summary, /Tuesday, Nov 17 at 9:00 AM/);
});

test('future daytime itinerary stops share one valid planned visiting period and exclude sites closed at that period', () => {
  // 1. Overlapping schedules after hours on Wednesday 11:00 PM:
  // - Casa Gorordo (9:00 AM - 5:00 PM)
  // - Sugbu Chinese Heritage Museum (10:00 AM - 5:00 PM)
  // At Thursday 9:00 AM only Casa Gorordo is open, whereas at Thursday 10:00 AM BOTH are open.
  const overlappingInput = {
    selectedSitesJson: serializeSitesForPlanner([SAMPLE_MUSEUM_9AM, SAMPLE_MUSEUM_10AM]),
    availableTimeHours: 4,
    startingLocation: 'Cebu City',
  };

  const overlappingResolution = resolvePlannerCandidates(
    overlappingInput,
    WEDNESDAY_AFTER_HOURS_11PM
  );
  assert.equal(overlappingResolution.mode, 'future-daytime');
  assert.match(
    overlappingResolution.plannedWindowLabel || '',
    /^Thursday, Nov 12 at 10:00 AM$/
  );
  for (const site of overlappingResolution.sites) {
    assert.equal(
      isSiteOpenAtDateTime(site, overlappingResolution.plannedDate!),
      true,
      `Selected site ${site.name} must be open at the shared plannedDate`
    );
  }

  // 2. Saturday night 9:00 PM with a Mon-Fri site + a Tue-Sun (Closed on Mondays) site:
  // Neither Sunday nor Monday has both open; Tuesday at 9:00 AM has BOTH open simultaneously.
  const crossScheduleInput = {
    selectedSitesJson: serializeSitesForPlanner([
      SAMPLE_WEEKDAY_LIBRARY,
      SAMPLE_CLOSED_ON_MONDAYS_SITE,
    ]),
    availableTimeHours: 4,
    startingLocation: 'Cebu City',
  };

  const crossResolution = resolvePlannerCandidates(crossScheduleInput, SATURDAY_NIGHT_9PM);
  assert.equal(crossResolution.mode, 'future-daytime');
  assert.match(crossResolution.plannedWindowLabel || '', /^Tuesday, Nov 17 at 9:00 AM$/);
  assert.deepEqual(
    crossResolution.sites.map(site => site.id),
    ['cebu-rizal-memorial-library', 'custom-closed-monday-museum']
  );
  for (const site of crossResolution.sites) {
    assert.equal(isSiteOpenAtDateTime(site, crossResolution.plannedDate!), true);
  }

  // 3. Strictly disjoint schedules (Monday-only site vs. Tuesday-only site):
  // Must select only the stop open at the chosen period and never combine mutually exclusive stops.
  const mondayOnlySite = {
    ...SAMPLE_MUSEUM_9AM,
    id: 'monday-only-site',
    name: 'Monday Archive',
    visitingHours: 'Monday to Monday, 9:00 AM - 5:00 PM',
  };
  const tuesdayOnlySite = {
    ...SAMPLE_MUSEUM_10AM,
    id: 'tuesday-only-site',
    name: 'Tuesday Gallery',
    visitingHours: 'Tuesday to Tuesday, 10:00 AM - 4:00 PM',
  };
  const disjointInput = {
    selectedSitesJson: serializeSitesForPlanner([mondayOnlySite, tuesdayOnlySite]),
    availableTimeHours: 4,
    startingLocation: 'Cebu City',
  };

  const disjointResolution = resolvePlannerCandidates(disjointInput, SATURDAY_NIGHT_9PM);
  assert.equal(disjointResolution.mode, 'future-daytime');
  assert.equal(disjointResolution.sites.length, 1);
  assert.equal(disjointResolution.sites[0].id, 'monday-only-site');
  assert.equal(
    isSiteOpenAtDateTime(disjointResolution.sites[0], disjointResolution.plannedDate!),
    true
  );
  assert.equal(
    isSiteOpenAtDateTime(tuesdayOnlySite, disjointResolution.plannedDate!),
    false
  );
});

test('inactive and demolished sites passed through the Discover payload helper are excluded', () => {
  const discoverRawSites = [
    {
      ...SAMPLE_MUSEUM_9AM,
      id: 'inactive-bool-site',
      name: 'Inactive Bool Site',
      isActive: false,
      status: 'Active',
    },
    {
      ...SAMPLE_MUSEUM_9AM,
      id: 'inactive-status-site',
      name: 'Inactive Status Site',
      isActive: true,
      status: 'Inactive',
    },
    {
      ...SAMPLE_MUSEUM_9AM,
      id: 'demolished-site',
      name: 'Demolished Landmark',
      demolitionStatus: 'Demolished',
    },
    SAMPLE_MUSEUM_10AM,
  ];

  // Client-side Discover future-compatibility filter
  const discoverCompatible = resolveDiscoverFutureCompatibleSites(
    discoverRawSites,
    4,
    WEDNESDAY_AFTER_HOURS_11PM
  );
  assert.deepEqual(
    discoverCompatible.sites.map(site => site.id),
    ['cebu-sugbu-chinese-museum']
  );

  // Server-side planner payload serialized via serializeSitesForPlanner (even if raw sites were passed)
  const serializedPayload = serializeSitesForPlanner(discoverRawSites);
  const parsedPayload = JSON.parse(serializedPayload);
  assert.equal(parsedPayload[0].isActive, false);
  assert.equal(parsedPayload[1].status, 'Inactive');
  assert.equal(parsedPayload[2].demolitionStatus, 'Demolished');

  const input = {
    selectedSitesJson: serializedPayload,
    availableTimeHours: 4,
    startingLocation: 'Cebu City',
  };

  const localResult = generateLocalItinerary(input, WEDNESDAY_AFTER_HOURS_11PM);
  assert.deepEqual(
    localResult.itinerary.map(stop => stop.siteId),
    ['cebu-sugbu-chinese-museum']
  );

  const aiResult = sanitizeGeneratedItinerary(
    {
      itinerary: [
        {
          siteId: 'demolished-site',
          siteName: 'Demolished Landmark',
          estimatedVisitDurationMinutes: 40,
          description: 'Invalid stop',
        },
        {
          siteId: 'inactive-bool-site',
          siteName: 'Inactive Bool Site',
          estimatedVisitDurationMinutes: 40,
          description: 'Invalid stop',
        },
        {
          siteId: 'cebu-sugbu-chinese-museum',
          siteName: 'Sugbu Chinese Heritage Museum',
          estimatedVisitDurationMinutes: 45,
          description: 'Currently open right now',
        },
      ],
      summary: 'AI summary',
      routeSuggestion: 'AI route',
      totalEstimatedDurationMinutes: 125,
    },
    input,
    WEDNESDAY_AFTER_HOURS_11PM
  );

  assert.deepEqual(
    aiResult.itinerary.map(stop => stop.siteId),
    ['cebu-sugbu-chinese-museum']
  );
  assert.doesNotMatch(
    aiResult.itinerary[0].description,
    /\b(currently\s+(?:open|available)|open\s+right\s+now)\b/i
  );
});

test('explicitly unavailable or permanently closed sites remain excluded and return an empty itinerary when no valid site exists', () => {
  const unavailableSites = [
    {
      ...SAMPLE_MUSEUM_9AM,
      id: 'permanently-closed-site',
      name: 'Permanently Closed Museum',
      visitingHours: 'Permanently closed',
    },
    {
      ...SAMPLE_MUSEUM_9AM,
      id: 'temporarily-closed-site',
      name: 'Temporarily Closed Ancestral House',
      visitingHours: 'Temporarily closed (formerly 9:00 AM - 5:00 PM)',
    },
    {
      ...SAMPLE_MUSEUM_9AM,
      id: 'closed-renovation-site',
      name: 'Renovation Site',
      visitingHours: 'Closed for renovation',
    },
    {
      ...SAMPLE_MUSEUM_9AM,
      id: 'plain-closed-site',
      name: 'Plain Closed Site',
      visitingHours: 'Closed',
    },
    {
      ...SAMPLE_MUSEUM_9AM,
      id: 'unavailable-hours-site',
      name: 'Unavailable Hours Site',
      visitingHours: 'Temporarily unavailable',
    },
    {
      ...SAMPLE_MUSEUM_9AM,
      id: 'not-open-site',
      name: 'Restricted Site',
      visitingHours: 'Not open to the public',
    },
    {
      ...SAMPLE_MUSEUM_9AM,
      id: 'inaccessible-status-site',
      name: 'Inaccessible Status Site',
      accessibilityStatus: 'Temporarily Closed',
    },
    {
      ...SAMPLE_MUSEUM_9AM,
      id: 'unparseable-hours-site',
      name: 'Unparseable Schedule Site',
      visitingHours: 'Schedule pending internal review',
    },
  ];

  const input = {
    selectedSitesJson: serializeSitesForPlanner(unavailableSites),
    availableTimeHours: 4,
    startingLocation: 'Cebu City',
  };

  const resolution = resolvePlannerCandidates(input, WEDNESDAY_AFTER_HOURS_11PM);
  assert.equal(resolution.mode, 'none');
  assert.deepEqual(resolution.sites, []);

  const emptyLocal = generateLocalItinerary(input, WEDNESDAY_AFTER_HOURS_11PM);
  assert.deepEqual(emptyLocal.itinerary, []);
  assert.equal(emptyLocal.summary, 'No heritage sites were available to generate a route.');

  const emptyAi = sanitizeGeneratedItinerary(
    {
      itinerary: unavailableSites.map(site => ({
        siteId: site.id,
        siteName: site.name,
        estimatedVisitDurationMinutes: 40,
        description: 'Should be removed',
      })),
      summary: 'AI summary',
      routeSuggestion: 'AI route',
      totalEstimatedDurationMinutes: 160,
    },
    input,
    WEDNESDAY_AFTER_HOURS_11PM
  );
  assert.deepEqual(emptyAi.itinerary, []);
  assert.equal(emptyAi.summary, 'No currently open heritage sites were available for this itinerary.');
});

test('duplicate sites by ID or name are deduplicated in both daytime and after-hours planning', () => {
  const duplicateSites = [
    SAMPLE_MUSEUM_9AM,
    { ...SAMPLE_MUSEUM_9AM },
    {
      ...SAMPLE_MUSEUM_9AM,
      id: 'cebu-casa-gorordo-duplicate-id',
      name: 'Casa Gorordo Museum',
    },
    SAMPLE_MUSEUM_10AM,
  ];

  const input = {
    selectedSitesJson: serializeSitesForPlanner(duplicateSites),
    availableTimeHours: 4,
    startingLocation: 'Cebu City',
  };

  for (const now of [WEDNESDAY_DAYTIME_2PM, WEDNESDAY_AFTER_HOURS_11PM]) {
    const localResult = generateLocalItinerary(input, now);
    assert.deepEqual(
      localResult.itinerary.map(stop => stop.siteId),
      ['cebu-sugbu-chinese-museum', 'cebu-casa-gorordo']
    );

    const aiResult = sanitizeGeneratedItinerary(
      {
        itinerary: [
          {
            siteId: 'cebu-casa-gorordo',
            siteName: 'Casa Gorordo Museum',
            estimatedVisitDurationMinutes: 40,
            description: 'First visit',
          },
          {
            siteId: 'cebu-casa-gorordo',
            siteName: 'Casa Gorordo Museum',
            estimatedVisitDurationMinutes: 40,
            description: 'Duplicate visit',
          },
          {
            siteId: 'cebu-casa-gorordo-duplicate-id',
            siteName: 'Casa Gorordo Museum',
            estimatedVisitDurationMinutes: 40,
            description: 'Duplicate by name',
          },
        ],
        summary: 'AI summary',
        routeSuggestion: 'AI route',
        totalEstimatedDurationMinutes: 120,
      },
      input,
      now
    );
    assert.deepEqual(
      aiResult.itinerary.map(stop => stop.siteId),
      ['cebu-casa-gorordo', 'cebu-sugbu-chinese-museum']
    );
  }
});

test('sequential validation keeps first stop that fits visiting hours but excludes a later stop that closes before arrival in both AI sanitization and local fallback', () => {
  // Start at Wednesday 4:15 PM Manila time (+08:00):
  // - Stop 1: Fort San Pedro (8:00 AM - 7:00 PM), closest to Cebu City origin (10.29257, 123.90566)
  //   -> Travel ~5 min (arrives 4:20 PM), visit 30-45 min (departs 4:50 PM - 5:05 PM) -> OPEN for entire visit.
  // - Stop 2: Casa Gorordo Museum (9:00 AM - 5:00 PM) (10.2999, 123.90483)
  //   -> Reached after Stop 1 (~4:56 PM in local fallback or ~5:11 PM in AI sanitization)
  //   -> Closes at 5:00 PM before arrival / before visit can complete -> MUST BE EXCLUDED.
  const WEDNESDAY_415PM = new Date('2026-11-11T16:15:00+08:00');
  const fortSanPedro = {
    id: 'cebu-fort-san-pedro',
    name: 'Fort San Pedro',
    city: 'Cebu City',
    visitingHours: 'Monday to Sunday, 8:00 AM - 7:00 PM',
    coordinates: { lat: 10.29257, lng: 123.90566 },
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
  };

  const input = {
    selectedSitesJson: serializeSitesForPlanner([fortSanPedro, SAMPLE_MUSEUM_9AM]),
    availableTimeHours: 4,
    startingLocation: 'Cebu City',
  };

  // Both sites are open at the initial 4:15 PM start time:
  const resolution = resolvePlannerCandidates(input, WEDNESDAY_415PM);
  assert.equal(resolution.mode, 'open-now');
  assert.equal(resolution.sites.length, 2);

  // Local fallback validates cumulative arrival + visit duration and excludes Casa Gorordo:
  const localResult = generateLocalItinerary(input, WEDNESDAY_415PM);
  assert.deepEqual(
    localResult.itinerary.map(stop => stop.siteId),
    ['cebu-fort-san-pedro']
  );

  // AI sanitization validates cumulative arrival + visit duration (and does not re-pad Casa Gorordo):
  const aiResult = sanitizeGeneratedItinerary(
    {
      itinerary: [
        {
          siteId: 'cebu-fort-san-pedro',
          siteName: 'Fort San Pedro',
          estimatedVisitDurationMinutes: 45,
          description: 'First stop at Fort San Pedro.',
        },
        {
          siteId: 'cebu-casa-gorordo',
          siteName: 'Casa Gorordo Museum',
          estimatedVisitDurationMinutes: 40,
          description: 'Second stop that arrives after 5:00 PM closing.',
        },
      ],
      summary: 'AI summary',
      routeSuggestion: 'AI route',
      totalEstimatedDurationMinutes: 85,
    },
    input,
    WEDNESDAY_415PM
  );

  assert.deepEqual(
    aiResult.itinerary.map(stop => stop.siteId),
    ['cebu-fort-san-pedro']
  );

  // Also verify future-daytime mode (Wednesday 11:00 PM -> planned Thursday 9:00 AM):
  // - Stop 1: Casa Gorordo Museum (9:00 AM - 5:00 PM), closer to Cebu City start
  //   -> arrives ~9:06 AM, departs ~9:36 AM (local) / ~9:46 AM (AI) -> OPEN for entire visit.
  // - Stop 2: Morning Chapel (9:00 AM - 9:35 AM), farther from Cebu City start
  //   -> open at the 9:00 AM shared start time, but closes at 9:35 AM before the user arrives (~9:42 AM / ~9:52 AM).
  const morningChapel = {
    id: 'cebu-morning-chapel',
    name: 'Morning Heritage Chapel',
    city: 'Cebu City',
    visitingHours: 'Monday to Sunday, 9:00 AM - 9:35 AM',
    coordinates: { lat: 10.305, lng: 123.908 },
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
  };
  const futureInput = {
    selectedSitesJson: serializeSitesForPlanner([SAMPLE_MUSEUM_9AM, morningChapel]),
    availableTimeHours: 4,
    startingLocation: 'Cebu City',
  };

  const futureResolution = resolvePlannerCandidates(futureInput, WEDNESDAY_AFTER_HOURS_11PM);
  assert.equal(futureResolution.mode, 'future-daytime');
  assert.equal(futureResolution.sites.length, 2);

  const futureLocalResult = generateLocalItinerary(futureInput, WEDNESDAY_AFTER_HOURS_11PM);
  assert.deepEqual(
    futureLocalResult.itinerary.map(stop => stop.siteId),
    ['cebu-casa-gorordo']
  );

  const futureAiResult = sanitizeGeneratedItinerary(
    {
      itinerary: [
        {
          siteId: 'cebu-casa-gorordo',
          siteName: 'Casa Gorordo Museum',
          estimatedVisitDurationMinutes: 40,
          description: 'First future stop.',
        },
        {
          siteId: 'cebu-morning-chapel',
          siteName: 'Morning Heritage Chapel',
          estimatedVisitDurationMinutes: 35,
          description: 'Second future stop that closes before arrival.',
        },
      ],
      summary: 'AI summary',
      routeSuggestion: 'AI route',
      totalEstimatedDurationMinutes: 75,
    },
    futureInput,
    WEDNESDAY_AFTER_HOURS_11PM
  );
  assert.deepEqual(
    futureAiResult.itinerary.map(stop => stop.siteId),
    ['cebu-casa-gorordo']
  );
});

test('sequential validation excludes a stop that is open upon arrival but closes during its estimated visit duration, without reintroducing it via padding or pool[0]', () => {
  // At Wednesday 4:40 PM Manila time (+08:00):
  // - Casa Gorordo Museum (9:00 AM - 5:00 PM) is still open at 4:40 PM and upon arrival (~4:46 PM),
  //   but a 30-min (local) or 40-min (AI) visit ends at 5:16 PM / 5:26 PM (past 5:00 PM closing).
  const WEDNESDAY_440PM = new Date('2026-11-11T16:40:00+08:00');
  const arrivalAt446Pm = new Date('2026-11-11T16:46:00+08:00');

  assert.equal(isSiteOpenAtDateTime(SAMPLE_MUSEUM_9AM, arrivalAt446Pm), true);
  assert.equal(isSiteOpenForEntireVisit(SAMPLE_MUSEUM_9AM, arrivalAt446Pm, 30), false);

  const singleClosingSoonInput = {
    selectedSitesJson: serializeSitesForPlanner([SAMPLE_MUSEUM_9AM]),
    availableTimeHours: 2,
    startingLocation: 'Cebu City',
  };

  // Candidate resolution sees it is open at 4:40 PM:
  const resolution = resolvePlannerCandidates(singleClosingSoonInput, WEDNESDAY_440PM);
  assert.equal(resolution.mode, 'open-now');
  assert.equal(resolution.sites.length, 1);

  // Local fallback must NOT force pool[0] into the itinerary when the visit cannot complete before closing:
  const localEmpty = generateLocalItinerary(singleClosingSoonInput, WEDNESDAY_440PM);
  assert.deepEqual(localEmpty.itinerary, []);
  assert.equal(localEmpty.summary, 'No heritage sites were available to generate a route.');
  assert.equal(localEmpty.routeSuggestion, 'No route is available yet.');

  // AI sanitization must exclude the stop AND must NOT reinsert it via fallback padding:
  const aiEmpty = sanitizeGeneratedItinerary(
    {
      itinerary: [
        {
          siteId: 'cebu-casa-gorordo',
          siteName: 'Casa Gorordo Museum',
          estimatedVisitDurationMinutes: 40,
          description: 'Arrives before 5 PM but closes mid-visit.',
        },
      ],
      summary: 'AI summary',
      routeSuggestion: 'AI route',
      totalEstimatedDurationMinutes: 40,
    },
    singleClosingSoonInput,
    WEDNESDAY_440PM
  );
  assert.deepEqual(aiEmpty.itinerary, []);
  assert.equal(
    aiEmpty.summary,
    'No currently open heritage sites were available for this itinerary.'
  );
  assert.equal(
    aiEmpty.routeSuggestion,
    'No route is available because there are no eligible open sites.'
  );

  // Also verify future-daytime mode when a site is open at the 9:00 AM planned start and upon arrival (~9:06 AM),
  // but closes at 9:25 AM during the 30-40 minute visit:
  const briefWindowSite = {
    id: 'cebu-brief-window',
    name: 'Brief Window Gallery',
    city: 'Cebu City',
    visitingHours: 'Monday to Sunday, 9:00 AM - 9:25 AM',
    coordinates: { lat: 10.2999, lng: 123.90483 },
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
  };
  const futureBriefInput = {
    selectedSitesJson: serializeSitesForPlanner([briefWindowSite]),
    availableTimeHours: 2,
    startingLocation: 'Cebu City',
  };

  const futureBriefResolution = resolvePlannerCandidates(
    futureBriefInput,
    WEDNESDAY_AFTER_HOURS_11PM
  );
  assert.equal(futureBriefResolution.mode, 'future-daytime');
  assert.equal(futureBriefResolution.sites.length, 1);

  const futureLocalEmpty = generateLocalItinerary(
    futureBriefInput,
    WEDNESDAY_AFTER_HOURS_11PM
  );
  assert.deepEqual(futureLocalEmpty.itinerary, []);

  const futureAiEmpty = sanitizeGeneratedItinerary(
    {
      itinerary: [
        {
          siteId: 'cebu-brief-window',
          siteName: 'Brief Window Gallery',
          estimatedVisitDurationMinutes: 40,
          description: 'Arrives at 9:06 AM but closes at 9:25 AM before visit finishes.',
        },
      ],
      summary: 'AI summary',
      routeSuggestion: 'AI route',
      totalEstimatedDurationMinutes: 40,
    },
    futureBriefInput,
    WEDNESDAY_AFTER_HOURS_11PM
  );
  assert.deepEqual(futureAiEmpty.itinerary, []);
});

test('multiple stops that all fit sequentially within their respective visiting hours are preserved in both AI sanitization and local fallback', () => {
  const jesuitHouse = {
    id: 'cebu-jesuit-house',
    name: '1730 Jesuit House',
    city: 'Cebu City',
    visitingHours: 'Monday to Sunday, 9:00 AM - 4:30 PM',
    coordinates: { lat: 10.29869, lng: 123.90401 },
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
  };

  const threeSites = [SAMPLE_MUSEUM_10AM, jesuitHouse, SAMPLE_MUSEUM_9AM];
  const input = {
    selectedSitesJson: serializeSitesForPlanner(threeSites),
    availableTimeHours: 4,
    startingLocation: 'Cebu City',
  };

  // Test both daytime (Wednesday 2:00 PM) and after-hours future daytime (Wednesday 11:00 PM -> Thursday 10:00 AM)
  for (const now of [WEDNESDAY_DAYTIME_2PM, WEDNESDAY_AFTER_HOURS_11PM]) {
    const localResult = generateLocalItinerary(input, now);
    assert.equal(localResult.itinerary.length, 3);
    assert.deepEqual(
      localResult.itinerary.map(stop => stop.siteId),
      ['cebu-sugbu-chinese-museum', 'cebu-jesuit-house', 'cebu-casa-gorordo']
    );

    const aiResult = sanitizeGeneratedItinerary(
      {
        itinerary: [
          {
            siteId: 'cebu-sugbu-chinese-museum',
            siteName: 'Sugbu Chinese Heritage Museum',
            estimatedVisitDurationMinutes: 40,
            description: 'Stop 1',
          },
          {
            siteId: 'cebu-jesuit-house',
            siteName: '1730 Jesuit House',
            estimatedVisitDurationMinutes: 35,
            description: 'Stop 2',
          },
          {
            siteId: 'cebu-casa-gorordo',
            siteName: 'Casa Gorordo Museum',
            estimatedVisitDurationMinutes: 45,
            description: 'Stop 3',
          },
        ],
        summary: 'AI summary',
        routeSuggestion: 'AI route',
        totalEstimatedDurationMinutes: 120,
      },
      input,
      now
    );

    assert.equal(aiResult.itinerary.length, 3);
    assert.deepEqual(
      aiResult.itinerary.map(stop => stop.siteId),
      ['cebu-sugbu-chinese-museum', 'cebu-jesuit-house', 'cebu-casa-gorordo']
    );
  }
});
