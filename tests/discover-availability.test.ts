import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ALL_DAYS_OF_WEEK,
  DEPRECATED_HERITAGE_SITE_IDS,
  getAdmissionDisplay,
  getExploreVerificationBadge,
  getSiteById,
  HERITAGE_SITES,
  isSiteVisibleToUser,
  mergeAdminSitesWithStatic,
  normalizeHeritageSite,
  normalizeOperatingSchedule,
  searchSites,
  type HeritageSite,
  type OperatingSchedule,
  type ScheduleVerificationSource,
} from '../src/lib/heritage-data';
import {
  evaluateSiteOperatingStatus,
  evaluateSubFacilityOperatingStatus,
  evaluateVisitWindow,
  getSiteAvailability,
  hasVerifiedVisitingHours,
  isGlobalAccessPolicyVerified,
  isSiteOpenForVisit,
} from '../src/lib/site-availability';
import {
  formatDailyOperatingSchedule,
  formatWeeklyVisitingHours,
  getDailyVisitingTime,
  getWeeklyScheduleRows,
} from '../src/lib/visiting-hours';

const MOCK_OFFICIAL_SOURCE: ScheduleVerificationSource = {
  title: 'Official Heritage Schedule Reference',
  publisher: 'Official Heritage Operator',
  url: 'https://official-heritage.example.org/schedule',
  sourceType: 'Official Museum / Institution Website',
  checkedDate: '2026-11-23',
  supportedClaims: [
    'global_visitor_access_policy',
    'interior_access_policy',
    'interior_regular_schedule',
    'exterior_grounds_access_policy',
    'exterior_grounds_regular_schedule',
    'exterior_street_visibility',
    'temporary_closure',
    'special_schedule',
    'sub_facility_access_policy',
    'sub_facility_regular_schedule',
  ],
};

function cloneSiteWithSchedule(
  baseSiteId: string,
  mutator: (schedule: OperatingSchedule, site: HeritageSite) => void
): HeritageSite {
  const base = getSiteById(baseSiteId);
  assert.ok(base, `Expected site ${baseSiteId} to exist in HERITAGE_SITES`);
  const cloned: HeritageSite = JSON.parse(JSON.stringify(base));
  cloned.operatingSchedule = normalizeOperatingSchedule(cloned.operatingSchedule, cloned);
  mutator(cloned.operatingSchedule, cloned);
  return cloned;
}

test('Preserves all 42 active heritage site IDs and existing classification integrity', () => {
  assert.equal(HERITAGE_SITES.length, 42, 'HERITAGE_SITES must contain all 42 active heritage sites');
  for (const site of HERITAGE_SITES) {
    assert.equal(
      DEPRECATED_HERITAGE_SITE_IDS.includes(site.id),
      false,
      `Active site ${site.id} must not be deprecated`
    );
    assert.ok(site.operatingSchedule, `Site ${site.id} must have a normalized operatingSchedule`);
  }

  // Group A (3 sites with verified interior schedules)
  assert.equal(hasVerifiedVisitingHours(getSiteById('cebu-casa-gorordo')), true);
  assert.equal(hasVerifiedVisitingHours(getSiteById('cebu-national-museum')), true);
  assert.equal(hasVerifiedVisitingHours(getSiteById('cebu-usc-museum')), true);

  // Group B (3 sites: primary scope unverified; cebu-basilica has 2 verified sub-facilities)
  assert.equal(hasVerifiedVisitingHours(getSiteById('cebu-basilica')), false);
  assert.equal(hasVerifiedVisitingHours(getSiteById('cebu-rizal-memorial-library')), false);
  assert.equal(hasVerifiedVisitingHours(getSiteById('cebu-sugbu-chinese-museum')), false);
});

test('Scenario #1: Verified weekday open (Casa Gorordo Museum on Wednesday 10:30 AM Asia/Manila)', () => {
  const casaGorordo = getSiteById('cebu-casa-gorordo')!;
  const wed1030Am = new Date('2026-11-11T10:30:00+08:00');
  const result = evaluateSiteOperatingStatus(casaGorordo, wed1030Am);

  assert.equal(result.calculatedStatus, 'Open Now');
  assert.equal(result.isOpen, true);
  assert.equal(result.isClosingSoon, false);
  assert.equal(result.scheduleVerified, true);
  assert.equal(result.policyVerified, true);
  assert.equal(isSiteOpenForVisit(casaGorordo, wed1030Am), true);
});

test('Scenario #2: Verified closing soon (Casa Gorordo Museum on Wednesday 4:40 PM Asia/Manila, 20m before 5:00 PM)', () => {
  const casaGorordo = getSiteById('cebu-casa-gorordo')!;
  const wed440Pm = new Date('2026-11-11T16:40:00+08:00');
  const result = evaluateSiteOperatingStatus(casaGorordo, wed440Pm);

  assert.equal(result.calculatedStatus, 'Closing Soon');
  assert.equal(result.isOpen, true);
  assert.equal(result.isClosingSoon, true);
  assert.equal(result.interiorEvaluation.closesAt, '5:00 PM');
});

test('Scenario #3: Verified exact close boundary (Casa Gorordo Museum on Wednesday 5:00 PM Asia/Manila)', () => {
  const casaGorordo = getSiteById('cebu-casa-gorordo')!;
  const wed500Pm = new Date('2026-11-11T17:00:00+08:00');
  const result = evaluateSiteOperatingStatus(casaGorordo, wed500Pm);

  assert.equal(result.interiorEvaluation.isOpen, false);
  assert.equal(result.interiorEvaluation.calculatedStatus, 'Closed');
  assert.equal(result.isOpen, false);
  assert.equal(isSiteOpenForVisit(casaGorordo, wed500Pm), false);
});

test('Scenario #4: Verified Mon–Sat schedule evaluated on unspecified Sunday (Casa Gorordo Museum on Sunday 11:00 AM)', () => {
  const casaGorordo = getSiteById('cebu-casa-gorordo')!;
  const sun1100Am = new Date('2026-11-15T11:00:00+08:00');
  const result = evaluateSiteOperatingStatus(casaGorordo, sun1100Am);

  assert.equal(result.calculatedStatus, 'Hours Unverified');
  assert.equal(result.isOpen, null);
  assert.equal(isSiteOpenForVisit(casaGorordo, sun1100Am), false);
});

test('Scenario #5: Verified daily open (National Museum of the Philippines – Cebu on Sunday 2:00 PM)', () => {
  const nationalMuseum = getSiteById('cebu-national-museum')!;
  const sun200Pm = new Date('2026-11-15T14:00:00+08:00');
  const result = evaluateSiteOperatingStatus(nationalMuseum, sun200Pm);

  assert.equal(result.calculatedStatus, 'Open Now');
  assert.equal(result.isOpen, true);
  assert.equal(result.interiorEvaluation.closesAt, '6:00 PM');
});

test('Scenario #6: Split-shift lunch break (Sto. Niño Museum sub-facility at 12:15 PM vs 11:30 AM & 1:30 PM)', () => {
  const basilica = getSiteById('cebu-basilica')!;
  const museumSub = basilica.operatingSchedule!.subFacilities!.find(
    s => s.id === 'basilica-basement-museum'
  )!;

  const thu1130Am = new Date('2026-11-12T11:30:00+08:00');
  const morningEval = evaluateSubFacilityOperatingStatus(basilica, museumSub, thu1130Am);
  assert.equal(morningEval.isOpen, true);
  assert.equal(morningEval.calculatedStatus, 'Closing Soon');

  const thu1215Pm = new Date('2026-11-12T12:15:00+08:00');
  const lunchEval = evaluateSubFacilityOperatingStatus(basilica, museumSub, thu1215Pm);
  assert.equal(lunchEval.isOpen, false);
  assert.equal(lunchEval.calculatedStatus, 'Closed');
  assert.match(lunchEval.nextTransitionLabel || '', /1:00 PM/);

  const thu130Pm = new Date('2026-11-12T13:30:00+08:00');
  const afternoonEval = evaluateSubFacilityOperatingStatus(basilica, museumSub, thu130Pm);
  assert.equal(afternoonEval.isOpen, true);
  assert.equal(afternoonEval.calculatedStatus, 'Open Now');
});

test('Scenario #7: Unverified site with legacy visitingHours string (Fort San Pedro on Wednesday 10:00 AM)', () => {
  const fortSanPedro = getSiteById('cebu-fort-san-pedro')!;
  const wed1000Am = new Date('2026-11-11T10:00:00+08:00');
  const result = evaluateSiteOperatingStatus(fortSanPedro, wed1000Am);

  assert.equal(result.calculatedStatus, 'Hours Unverified');
  assert.equal(result.isOpen, null);
  assert.equal(hasVerifiedVisitingHours(fortSanPedro), false);
  assert.equal(isSiteOpenForVisit(fortSanPedro, wed1000Am), false);
  assert.equal(getSiteAvailability(fortSanPedro, wed1000Am).isOpen, false);
});

test('Scenario #8: Conflicting official schedule (Sugbu Chinese Heritage Museum on Friday 9:00 AM)', () => {
  const sugbuChinese = getSiteById('cebu-sugbu-chinese-museum')!;
  const fri900Am = new Date('2026-11-13T09:00:00+08:00');
  const result = evaluateSiteOperatingStatus(sugbuChinese, fri900Am);

  assert.equal(result.calculatedStatus, 'Requires Confirmation');
  assert.equal(result.isOpen, null);
  assert.equal(
    result.verificationStatusLabel,
    'Requires Clarification (Official Source Discrepancy)'
  );
  assert.equal(isSiteOpenForVisit(sugbuChinese, fri900Am), false);
});

test('Scenario #9: Verified exterior complex gates vs unverified main church interior (Basilica at 5:30 AM)', () => {
  const basilica = getSiteById('cebu-basilica')!;
  const wed530Am = new Date('2026-11-11T05:30:00+08:00');
  const result = evaluateSiteOperatingStatus(basilica, wed530Am);

  assert.equal(result.interiorEvaluation.isOpen, null);
  assert.equal(result.interiorEvaluation.calculatedStatus, 'Hours Unverified');

  const gatesEval = result.subFacilityEvaluations.find(
    s => s.subFacilityId === 'basilica-complex-gates'
  )!;
  const museumEval = result.subFacilityEvaluations.find(
    s => s.subFacilityId === 'basilica-basement-museum'
  )!;

  assert.equal(gatesEval.isOpen, true);
  assert.equal(gatesEval.calculatedStatus, 'Open Now');
  assert.equal(museumEval.isOpen, false);
  assert.equal(museumEval.calculatedStatus, 'Closed');
});

test('Scenario #10: Interior closed after hours while street visibility is verified -> Exterior Viewable Now', () => {
  const site = cloneSiteWithSchedule('cebu-casa-gorordo', sched => {
    sched.exteriorStreetVisibility = {
      status: 'Viewable from Public Street',
      isVerified: true,
      sources: [MOCK_OFFICIAL_SOURCE],
      lastVerifiedDate: '2026-11-23',
    };
  });

  const wed700Pm = new Date('2026-11-11T19:00:00+08:00');
  const result = evaluateSiteOperatingStatus(site, wed700Pm);

  assert.equal(result.interiorEvaluation.isOpen, false);
  assert.equal(result.interiorEvaluation.calculatedStatus, 'Closed');
  assert.equal(result.calculatedStatus, 'Exterior Viewable Now');
  assert.equal(result.isOpen, false);
});

test('Scenario #11: Unverified sub-facility (Rizal Memorial Library ground-floor CCPL at 2:30 AM)', () => {
  const rizalLibrary = getSiteById('cebu-rizal-memorial-library')!;
  const wed230Am = new Date('2026-11-11T02:30:00+08:00');
  const result = evaluateSiteOperatingStatus(rizalLibrary, wed230Am);

  assert.equal(result.isOpen, null);
  assert.equal(result.calculatedStatus, 'Hours Unverified');
  const ccplSub = result.subFacilityEvaluations.find(
    s => s.subFacilityId === 'ccpl-ground-floor-library'
  )!;
  assert.equal(ccplSub.isOpen, null);
  assert.equal(ccplSub.calculatedStatus, 'Hours Unverified');
});

test('Scenario #12: Overnight schedule crossing midnight (open 18:00 to 02:00 evaluated at 01:15 AM next day)', () => {
  const overnightSite = cloneSiteWithSchedule('cebu-national-museum', sched => {
    sched.interiorAccess.regularHours.friday = {
      state: 'open',
      periods: [{ open: '18:00', close: '02:00' }],
    };
    sched.interiorAccess.regularHours.saturday = {
      state: 'open',
      periods: [{ open: '18:00', close: '02:00' }],
    };
  });

  const sat115Am = new Date('2026-11-14T01:15:00+08:00');
  const result = evaluateSiteOperatingStatus(overnightSite, sat115Am);
  assert.equal(result.isOpen, true);
  assert.equal(result.calculatedStatus, 'Open Now');

  const sat140Am = new Date('2026-11-14T01:40:00+08:00');
  const closingSoonResult = evaluateSiteOperatingStatus(overnightSite, sat140Am);
  assert.equal(closingSoonResult.isOpen, true);
  assert.equal(closingSoonResult.calculatedStatus, 'Closing Soon');
  assert.equal(closingSoonResult.isClosingSoon, true);

  const sat200Am = new Date('2026-11-14T02:00:00+08:00');
  const closedResult = evaluateSiteOperatingStatus(overnightSite, sat200Am);
  assert.equal(closedResult.isOpen, false);
  assert.equal(closedResult.calculatedStatus, 'Closed');
});

test('Scenario #13: Special holiday closure overriding regular verified open day (Dec 25)', () => {
  const site = cloneSiteWithSchedule('cebu-national-museum', sched => {
    sched.specialSchedules = [
      {
        id: 'christmas-closure',
        label: 'Christmas Day Closure',
        startDate: '2026-12-25',
        endDate: '2026-12-25',
        scope: 'full_site',
        state: 'closed',
        periods: [],
        isVerified: true,
        sources: [MOCK_OFFICIAL_SOURCE],
      },
    ];
  });

  const dec25At11Am = new Date('2026-12-25T11:00:00+08:00');
  const result = evaluateSiteOperatingStatus(site, dec25At11Am);

  assert.equal(result.calculatedStatus, 'Closed');
  assert.equal(result.isOpen, false);
  assert.equal(result.interiorEvaluation.activeSpecialSchedule?.id, 'christmas-closure');
});

test('Scenario #14: Active temporary closure overriding verified open schedule', () => {
  const site = cloneSiteWithSchedule('cebu-casa-gorordo', sched => {
    sched.temporaryClosures = [
      {
        id: 'conservation-closure',
        reason: 'Annual conservation maintenance',
        startDate: '2026-11-10',
        endDate: '2026-11-12',
        scope: 'interior_only',
        isVerified: true,
        sources: [MOCK_OFFICIAL_SOURCE],
      },
    ];
  });

  const wed1000Am = new Date('2026-11-11T10:00:00+08:00');
  const result = evaluateSiteOperatingStatus(site, wed1000Am);

  assert.equal(result.calculatedStatus, 'Temporarily Closed');
  assert.equal(result.isOpen, false);
  assert.equal(result.interiorEvaluation.activeTemporaryClosure?.id, 'conservation-closure');
});

test('Scenario #15: Demolished or permanently closed site', () => {
  const demolishedSite = cloneSiteWithSchedule('cebu-patria', (sched, site) => {
    sched.physicalPreservationStatus = 'Demolished / Lost';
    site.demolitionStatus = 'Demolished';
  });

  const wed1000Am = new Date('2026-11-11T10:00:00+08:00');
  const result = evaluateSiteOperatingStatus(demolishedSite, wed1000Am);

  assert.equal(result.calculatedStatus, 'Permanently Closed');
  assert.equal(result.isOpen, false);
});

test('Scenario #16: Private residence / restricted exterior-only site', () => {
  const privateSite = cloneSiteWithSchedule('cebu-yap-sandiego', sched => {
    sched.visitorAccessStatus = 'Private Residence';
    sched.verification.visitorAccessStatusVerified = true;
    sched.verification.visitorAccessStatusSources = [MOCK_OFFICIAL_SOURCE];
  });

  const wed1000Am = new Date('2026-11-11T10:00:00+08:00');
  const result = evaluateSiteOperatingStatus(privateSite, wed1000Am);

  assert.equal(result.calculatedStatus, 'Private Residence');
  assert.equal(result.isOpen, false);
});

test('Scenario #17: By-appointment-only site', () => {
  const appointmentSite = cloneSiteWithSchedule('cebu-uspf-jose-rizal-museum', sched => {
    sched.interiorAccess.policyStatus = 'By Appointment Only';
    sched.interiorAccess.policyVerified = true;
    sched.interiorAccess.policySources = [MOCK_OFFICIAL_SOURCE];
  });

  const wed1000Am = new Date('2026-11-11T10:00:00+08:00');
  const result = evaluateSiteOperatingStatus(appointmentSite, wed1000Am);

  assert.equal(result.calculatedStatus, 'By Appointment Only');
  assert.equal(result.isOpen, false);
});

test('Scenario #18: Full-interval visit window evaluation across closing boundary (4:30 PM to 5:15 PM)', () => {
  const casaGorordo = getSiteById('cebu-casa-gorordo')!;
  const visitStart = new Date('2026-11-11T16:30:00+08:00');
  const visitEnd = new Date('2026-11-11T17:15:00+08:00');

  const windowResult = evaluateVisitWindow(casaGorordo, visitStart, visitEnd);
  assert.equal(windowResult.status, 'closed_during_window');
  assert.equal(windowResult.isOpenForEntireWindow, false);
  assert.equal(windowResult.triState, false);
  assert.equal(
    windowResult.firstBlockingTimestampIso,
    new Date('2026-11-11T17:00:00+08:00').toISOString()
  );
  assert.equal(windowResult.firstBlockingStatus, 'Closed');
  assert.ok(windowResult.firstBlockingReason);

  const validWindow = evaluateVisitWindow(
    casaGorordo,
    new Date('2026-11-11T16:00:00+08:00'),
    new Date('2026-11-11T17:00:00+08:00')
  );
  assert.equal(validWindow.status, 'confirmed_open_entire_window');
  assert.equal(validWindow.isOpenForEntireWindow, true);
  assert.equal(validWindow.triState, true);
  assert.equal(validWindow.firstBlockingTimestampIso, null);
  assert.equal(validWindow.firstBlockingReason, null);
});

test('Scenario #19: Multi-day temporary closure (continuous vs daily_window with overnight spill)', () => {
  const continuousSite = cloneSiteWithSchedule('cebu-national-museum', sched => {
    sched.temporaryClosures = [
      {
        id: 'continuous-maint',
        reason: 'Continuous electrical maintenance',
        startDate: '2026-11-10',
        endDate: '2026-11-12',
        startTime: '14:00',
        endTime: '12:00',
        multiDayTimeMode: 'continuous',
        scope: 'full_site',
        isVerified: true,
        sources: [MOCK_OFFICIAL_SOURCE],
      },
    ];
  });

  assert.equal(
    evaluateSiteOperatingStatus(continuousSite, new Date('2026-11-10T11:00:00+08:00'))
      .calculatedStatus,
    'Open Now'
  );
  assert.equal(
    evaluateSiteOperatingStatus(continuousSite, new Date('2026-11-11T11:00:00+08:00'))
      .calculatedStatus,
    'Temporarily Closed'
  );
  assert.equal(
    evaluateSiteOperatingStatus(continuousSite, new Date('2026-11-12T13:00:00+08:00'))
      .calculatedStatus,
    'Open Now'
  );

  const dailyWindowSite = cloneSiteWithSchedule('cebu-national-museum', sched => {
    for (const day of ALL_DAYS_OF_WEEK) {
      sched.interiorAccess.regularHours[day] = { state: 'open_24_hours', periods: [] };
    }
    sched.temporaryClosures = [
      {
        id: 'nightly-fumigation',
        reason: 'Nightly fumigation window (10 PM - 2 AM)',
        startDate: '2026-11-10',
        endDate: '2026-11-12',
        startTime: '22:00',
        endTime: '02:00',
        multiDayTimeMode: 'daily_window',
        scope: 'full_site',
        isVerified: true,
        sources: [MOCK_OFFICIAL_SOURCE],
      },
    ];
  });

  assert.equal(
    evaluateSiteOperatingStatus(dailyWindowSite, new Date('2026-11-10T01:00:00+08:00'))
      .calculatedStatus,
    'Open 24 Hours'
  );
  assert.equal(
    evaluateSiteOperatingStatus(dailyWindowSite, new Date('2026-11-11T01:30:00+08:00'))
      .calculatedStatus,
    'Temporarily Closed'
  );
  assert.equal(
    evaluateSiteOperatingStatus(dailyWindowSite, new Date('2026-11-11T12:00:00+08:00'))
      .calculatedStatus,
    'Open 24 Hours'
  );
  assert.equal(
    evaluateSiteOperatingStatus(dailyWindowSite, new Date('2026-11-13T01:30:00+08:00'))
      .calculatedStatus,
    'Temporarily Closed'
  );
  assert.equal(
    evaluateSiteOperatingStatus(dailyWindowSite, new Date('2026-11-13T02:30:00+08:00'))
      .calculatedStatus,
    'Open 24 Hours'
  );
});

test('Scenario #20: Verified interior schedule does NOT verify exterior grounds', () => {
  const casaGorordo = getSiteById('cebu-casa-gorordo')!;
  const wed1030Am = new Date('2026-11-11T10:30:00+08:00');
  const result = evaluateSiteOperatingStatus(casaGorordo, wed1030Am);

  assert.equal(result.interiorEvaluation.scheduleVerified, true);
  assert.equal(result.interiorEvaluation.isOpen, true);
  assert.equal(result.exteriorGroundsEvaluation.scheduleVerified, false);
  assert.equal(result.exteriorGroundsEvaluation.isOpen, null);
  assert.equal(result.exteriorGroundsEvaluation.calculatedStatus, 'Hours Unverified');
});

test('Scenario #21: Scope verification does NOT verify global visitorAccessStatus', () => {
  const site = cloneSiteWithSchedule('cebu-casa-gorordo', sched => {
    sched.visitorAccessStatus = 'Private Residence';
    sched.verification.visitorAccessStatusVerified = false;
    sched.interiorAccess.policyStatus = 'Guided / Ticketed Interior';
    sched.interiorAccess.policyVerified = true;
  });

  assert.equal(isGlobalAccessPolicyVerified(site.operatingSchedule!), false);
  const wed1030Am = new Date('2026-11-11T10:30:00+08:00');
  const result = evaluateSiteOperatingStatus(site, wed1030Am);

  assert.equal(result.calculatedStatus, 'Open Now');
  assert.equal(result.isOpen, true);
});

test('Scenario #22: Parent temporary closure inherited by sub-facility (non-overridable)', () => {
  const basilica = cloneSiteWithSchedule('cebu-basilica', sched => {
    sched.subFacilities!.forEach(sub => {
      sub.allowParentPolicyOverride = true;
    });
    sched.temporaryClosures = [
      {
        id: 'complex-disinfection',
        reason: 'Complex-wide safety inspection',
        startDate: '2026-11-11',
        endDate: '2026-11-11',
        scope: 'full_site',
        isVerified: true,
        sources: [MOCK_OFFICIAL_SOURCE],
      },
    ];
  });

  const wed1000Am = new Date('2026-11-11T10:00:00+08:00');
  const result = evaluateSiteOperatingStatus(basilica, wed1000Am);

  for (const subEval of result.subFacilityEvaluations) {
    assert.equal(
      subEval.calculatedStatus,
      'Temporarily Closed',
      `Sub-facility ${subEval.subFacilityId} must inherit parent temporary closure`
    );
    assert.equal(subEval.isOpen, false);
  }
});

test('Scenario #23: Overlapping special schedules deterministic precedence (date span & scope specificity)', () => {
  const site = cloneSiteWithSchedule('cebu-national-museum', sched => {
    sched.specialSchedules = [
      {
        id: 'fiesta-5-day-open',
        label: '5-Day Heritage Week Extended Hours',
        startDate: '2026-11-10',
        endDate: '2026-11-14',
        scope: 'full_site',
        state: 'open',
        periods: [{ open: '08:00', close: '21:00' }],
        isVerified: true,
        sources: [MOCK_OFFICIAL_SOURCE],
      },
      {
        id: 'midweek-1-day-closure',
        label: '1-Day Gallery Fumigation',
        startDate: '2026-11-11',
        endDate: '2026-11-11',
        scope: 'interior_only',
        state: 'closed',
        periods: [],
        isVerified: true,
        sources: [MOCK_OFFICIAL_SOURCE],
      },
    ];
  });

  const nov11Result = evaluateSiteOperatingStatus(site, new Date('2026-11-11T10:00:00+08:00'));
  assert.equal(nov11Result.calculatedStatus, 'Closed');
  assert.equal(nov11Result.isOpen, false);
  assert.equal(nov11Result.interiorEvaluation.activeSpecialSchedule?.id, 'midweek-1-day-closure');

  const nov12Result = evaluateSiteOperatingStatus(site, new Date('2026-11-12T19:30:00+08:00'));
  assert.equal(nov12Result.calculatedStatus, 'Open Now');
  assert.equal(nov12Result.isOpen, true);
  assert.equal(nov12Result.interiorEvaluation.activeSpecialSchedule?.id, 'fiesta-5-day-open');
});

test('Scenario #24: Today special schedule suppresses yesterday overnight carry-over unless allowYesterdayOvernightCarryOver is true', () => {
  const buildOvernightWithTodaySpecial = (allowCarryOver: boolean) =>
    cloneSiteWithSchedule('cebu-national-museum', sched => {
      sched.interiorAccess.regularHours.friday = {
        state: 'open',
        periods: [{ open: '18:00', close: '02:00' }],
      };
      sched.specialSchedules = [
        {
          id: 'sat-afternoon-special',
          label: 'Saturday Afternoon Special Event',
          startDate: '2026-11-14',
          endDate: '2026-11-14',
          scope: 'interior_only',
          state: 'open',
          periods: [{ open: '13:00', close: '18:00' }],
          allowYesterdayOvernightCarryOver: allowCarryOver,
          isVerified: true,
          sources: [MOCK_OFFICIAL_SOURCE],
        },
      ];
    });

  const sat100Am = new Date('2026-11-14T01:00:00+08:00');

  const suppressedSite = buildOvernightWithTodaySpecial(false);
  const suppressedEval = evaluateSiteOperatingStatus(suppressedSite, sat100Am);
  assert.equal(suppressedEval.isOpen, false);
  assert.equal(suppressedEval.calculatedStatus, 'Closed');

  const permittedSite = buildOvernightWithTodaySpecial(true);
  const permittedEval = evaluateSiteOperatingStatus(permittedSite, sat100Am);
  assert.equal(permittedEval.isOpen, true);
  assert.equal(permittedEval.calculatedStatus, 'Open Now');
});

test('Scenario #25: Partial-second visit window crossing closing minute (16:59:30 to 17:00:10)', () => {
  const casaGorordo = getSiteById('cebu-casa-gorordo')!;
  const start = new Date('2026-11-11T16:59:30+08:00');
  const end = new Date('2026-11-11T17:00:10+08:00');

  const res = evaluateVisitWindow(casaGorordo, start, end);
  assert.equal(res.status, 'closed_during_window');
  assert.equal(res.isOpenForEntireWindow, false);
  assert.equal(
    res.firstBlockingTimestampIso,
    new Date('2026-11-11T17:00:00+08:00').toISOString()
  );
  assert.equal(res.firstBlockingStatus, 'Closed');
});

test('Scenario #26: Sub-facility two-gate override security (verified schedule alone cannot override parent restriction without verified sub-facility access policy)', () => {
  const site = cloneSiteWithSchedule('cebu-basilica', sched => {
    sched.visitorAccessStatus = 'By Appointment Only';
    sched.verification.visitorAccessStatusVerified = true;
    sched.verification.visitorAccessStatusSources = [MOCK_OFFICIAL_SOURCE];

    const museum = sched.subFacilities!.find(s => s.id === 'basilica-basement-museum')!;
    museum.allowParentPolicyOverride = true;
    museum.visitorAccessStatus = 'Guided / Ticketed Entry';
    museum.visitorAccessStatusVerified = false;
    museum.isVerified = true;
  });

  const wed1000Am = new Date('2026-11-11T10:00:00+08:00');
  const museumSub = site.operatingSchedule!.subFacilities!.find(
    s => s.id === 'basilica-basement-museum'
  )!;
  const subEval = evaluateSubFacilityOperatingStatus(site, museumSub, wed1000Am);

  assert.equal(subEval.calculatedStatus, 'By Appointment Only');
  assert.equal(subEval.isOpen, false);

  museumSub.visitorAccessStatusVerified = true;
  museumSub.policySources = [MOCK_OFFICIAL_SOURCE];
  const authorizedEval = evaluateSubFacilityOperatingStatus(site, museumSub, wed1000Am);
  assert.equal(authorizedEval.calculatedStatus, 'Open Now');
  assert.equal(authorizedEval.isOpen, true);
});

test('Scenario #27: Mandatory parent special closure (enforceOnSubFacilities: true) overrides sub-facility special opening', () => {
  const site = cloneSiteWithSchedule('cebu-basilica', sched => {
    sched.specialSchedules = [
      {
        id: 'mandatory-complex-lockdown',
        label: 'Complex-Wide Security Lockdown',
        startDate: '2026-11-11',
        endDate: '2026-11-11',
        scope: 'full_site',
        state: 'closed',
        periods: [],
        enforceOnSubFacilities: true,
        isVerified: true,
        sources: [MOCK_OFFICIAL_SOURCE],
      },
    ];

    const museum = sched.subFacilities!.find(s => s.id === 'basilica-basement-museum')!;
    museum.specialSchedules = [
      {
        id: 'sub-special-exhibit-open',
        label: 'Special Museum Exhibit Opening',
        startDate: '2026-11-11',
        endDate: '2026-11-11',
        scope: 'interior_only',
        state: 'open',
        periods: [{ open: '08:00', close: '20:00' }],
        isVerified: true,
        sources: [MOCK_OFFICIAL_SOURCE],
      },
    ];
  });

  const wed1000Am = new Date('2026-11-11T10:00:00+08:00');
  const museumSub = site.operatingSchedule!.subFacilities!.find(
    s => s.id === 'basilica-basement-museum'
  )!;
  const subEval = evaluateSubFacilityOperatingStatus(site, museumSub, wed1000Am);

  assert.equal(subEval.calculatedStatus, 'Closed');
  assert.equal(subEval.isOpen, false);
  assert.equal(subEval.activeSpecialSchedule?.id, 'mandatory-complex-lockdown');
});

test('Scenario #28: Visit window > 24 hours rejected & sub-minute start timestamp clamped so firstBlockingTimestampIso >= visitStart', () => {
  const casaGorordo = getSiteById('cebu-casa-gorordo')!;

  const over24h = evaluateVisitWindow(
    casaGorordo,
    new Date('2026-11-11T09:00:00+08:00'),
    new Date('2026-11-12T10:00:00+08:00')
  );
  assert.equal(over24h.status, 'invalid_window');
  assert.equal(over24h.isOpenForEntireWindow, false);

  const startAt170030 = new Date('2026-11-11T17:00:30+08:00');
  const endAt171500 = new Date('2026-11-11T17:15:00+08:00');
  const clampedRes = evaluateVisitWindow(casaGorordo, startAt170030, endAt171500);

  assert.equal(clampedRes.status, 'closed_during_window');
  assert.equal(clampedRes.firstBlockingTimestampIso, startAt170030.toISOString());
  assert.ok(
    new Date(clampedRes.firstBlockingTimestampIso!).getTime() >= startAt170030.getTime(),
    'firstBlockingTimestampIso must never be earlier than visitStart'
  );
});

test('Scenario #29: Verified schedule with unverified visitor-access policy (USC Museum & special opening with unverified policy)', () => {
  const uscMuseum = getSiteById('cebu-usc-museum')!;

  const wed1000Am = new Date('2026-11-11T10:00:00+08:00');
  const openHourEval = evaluateSiteOperatingStatus(uscMuseum, wed1000Am);
  assert.equal(openHourEval.scheduleVerified, true);
  assert.equal(openHourEval.policyVerified, false);
  assert.equal(openHourEval.calculatedStatus, 'Hours Unverified');
  assert.equal(openHourEval.isOpen, null);

  const wed700Pm = new Date('2026-11-11T19:00:00+08:00');
  const afterHoursEval = evaluateSiteOperatingStatus(uscMuseum, wed700Pm);
  assert.equal(afterHoursEval.calculatedStatus, 'Closed');
  assert.equal(afterHoursEval.isOpen, false);

  const visitStart = new Date('2026-11-11T10:00:00+08:00');
  const visitEnd = new Date('2026-11-11T11:00:00+08:00');
  const windowRes = evaluateVisitWindow(uscMuseum, visitStart, visitEnd);
  assert.equal(windowRes.status, 'unverified_during_window');
  assert.equal(windowRes.isOpenForEntireWindow, false);
  assert.equal(windowRes.triState, null);
  assert.equal(windowRes.firstBlockingTimestampIso, null);
  assert.equal(windowRes.firstBlockingStatus, null);
  assert.equal(windowRes.firstBlockingReason, null);
  assert.equal(windowRes.firstUnverifiedTimestampIso, visitStart.toISOString());
  assert.equal(windowRes.firstUnverifiedStatus, 'Hours Unverified');
  assert.ok(windowRes.firstUnverifiedReason);

  const specialOnUsc = cloneSiteWithSchedule('cebu-usc-museum', sched => {
    sched.specialSchedules = [
      {
        id: 'usc-special-open',
        label: 'University Heritage Open House',
        startDate: '2026-11-11',
        endDate: '2026-11-11',
        scope: 'interior_only',
        state: 'open',
        periods: [{ open: '08:00', close: '18:00' }],
        isVerified: true,
        sources: [MOCK_OFFICIAL_SOURCE],
      },
    ];
  });
  const specialEval = evaluateSiteOperatingStatus(specialOnUsc, wed1000Am);
  assert.equal(specialEval.calculatedStatus, 'Hours Unverified');
  assert.equal(specialEval.isOpen, null);
});

test('Scenario #30: Mixed unverified + confirmed-closed visit window prioritizes closed_during_window over unverified_during_window', () => {
  const casaGorordo = getSiteById('cebu-casa-gorordo')!;
  const visitStart = new Date('2026-11-15T23:30:00+08:00');
  const visitEnd = new Date('2026-11-16T01:00:00+08:00');

  const res = evaluateVisitWindow(casaGorordo, visitStart, visitEnd);

  assert.equal(res.status, 'closed_during_window');
  assert.equal(res.isOpenForEntireWindow, false);
  assert.equal(res.triState, false);
  assert.equal(
    res.firstUnverifiedTimestampIso,
    new Date('2026-11-15T23:30:00+08:00').toISOString()
  );
  assert.equal(res.firstUnverifiedStatus, 'Hours Unverified');
  assert.ok(res.firstUnverifiedReason);
  assert.equal(
    res.firstBlockingTimestampIso,
    new Date('2026-11-16T00:00:00+08:00').toISOString()
  );
  assert.equal(res.firstBlockingStatus, 'Closed');
  assert.ok(res.firstBlockingReason);
});

test('Scenario #31: Sub-facility overnight carry-over verification & winning closed special schedule blocks carry-over', () => {
  const siteA = cloneSiteWithSchedule('cebu-basilica', sched => {
    const sub = sched.subFacilities!.find(s => s.id === 'basilica-complex-gates')!;
    sub.isVerified = false;
    sub.verifiedDays = [];
    sub.visitorAccessStatus = 'Publicly Accessible';
    sub.visitorAccessStatusVerified = true;
    sub.policySources = [MOCK_OFFICIAL_SOURCE];
    sub.specialSchedules = [
      {
        id: 'vigil-overnight',
        label: 'Friday Night Pilgrim Vigil',
        startDate: '2026-11-13',
        endDate: '2026-11-13',
        scope: 'exterior_grounds_only',
        state: 'open',
        periods: [{ open: '18:00', close: '02:00' }],
        isVerified: true,
        sources: [MOCK_OFFICIAL_SOURCE],
      },
    ];
  });

  const sat100Am = new Date('2026-11-14T01:00:00+08:00');
  const subA = siteA.operatingSchedule!.subFacilities!.find(
    s => s.id === 'basilica-complex-gates'
  )!;
  const evalA = evaluateSubFacilityOperatingStatus(siteA, subA, sat100Am);
  assert.equal(evalA.isOpen, true);
  assert.equal(evalA.calculatedStatus, 'Open Now');

  const siteB = cloneSiteWithSchedule('cebu-basilica', sched => {
    const sub = sched.subFacilities!.find(s => s.id === 'basilica-complex-gates')!;
    sub.specialSchedules = [
      {
        id: 'vigil-overnight',
        label: 'Friday Night Pilgrim Vigil',
        startDate: '2026-11-13',
        endDate: '2026-11-13',
        scope: 'exterior_grounds_only',
        state: 'open',
        periods: [{ open: '18:00', close: '02:00' }],
        isVerified: true,
        sources: [MOCK_OFFICIAL_SOURCE],
      },
      {
        id: 'sat-emergency-closure',
        label: 'Saturday Maintenance Closure',
        startDate: '2026-11-14',
        endDate: '2026-11-14',
        scope: 'exterior_grounds_only',
        state: 'closed',
        periods: [],
        allowYesterdayOvernightCarryOver: true,
        isVerified: true,
        sources: [MOCK_OFFICIAL_SOURCE],
      },
    ];
  });

  const subB = siteB.operatingSchedule!.subFacilities!.find(
    s => s.id === 'basilica-complex-gates'
  )!;
  const evalB = evaluateSubFacilityOperatingStatus(siteB, subB, sat100Am);
  assert.equal(evalB.isOpen, false);
  assert.equal(evalB.calculatedStatus, 'Closed');
  assert.equal(evalB.activeSpecialSchedule?.id, 'sat-emergency-closure');
});

test('Visiting hours formatter never fabricates 9:00 AM - 5:00 PM fallback for unverified schedules', () => {
  const fortSanPedro = getSiteById('cebu-fort-san-pedro')!;
  const rows = getWeeklyScheduleRows(fortSanPedro);
  assert.equal(rows.length, 7);
  for (const row of rows) {
    assert.equal(row.isVerified, false);
    assert.equal(row.formattedHours, 'Not specified (Unverified)');
  }
  assert.equal(
    getDailyVisitingTime(undefined, undefined),
    'Not specified (Unverified)'
  );
  assert.match(formatWeeklyVisitingHours(fortSanPedro), /unverified/i);

  const casaGorordo = getSiteById('cebu-casa-gorordo')!;
  const casaRows = getWeeklyScheduleRows(casaGorordo);
  const monRow = casaRows.find(r => r.key === 'monday')!;
  const sunRow = casaRows.find(r => r.key === 'sunday')!;
  assert.equal(monRow.isVerified, true);
  assert.equal(monRow.formattedHours, '9:00 AM – 5:00 PM');
  assert.equal(sunRow.isVerified, false);
  assert.equal(sunRow.formattedHours, 'Not specified (Unverified)');
  assert.equal(
    formatDailyOperatingSchedule(
      {
        state: 'open',
        periods: [{ open: '09:00', close: '17:00' }],
      },
      true
    ),
    '9:00 AM – 5:00 PM'
  );
});

test('Admission accuracy across all 42 heritage sites distinguishes free, paid, unverified, and not_available without defaulting missing to free', () => {
  assert.equal(HERITAGE_SITES.length, 42);
  for (const site of HERITAGE_SITES) {
    const adm = getAdmissionDisplay(site);
    assert.ok(
      ['free', 'paid', 'unverified', 'not_available'].includes(adm.status),
      `Site ${site.id} must have a valid admission status`
    );
    assert.ok(adm.displayLabel.trim().length > 0, `Site ${site.id} must have a displayLabel`);
  }

  // Missing fee must never default to Free Admission
  const missingAdmission = getAdmissionDisplay({ id: 'test-missing', name: 'Missing Fee Site' });
  assert.equal(missingAdmission.status, 'not_available');
  assert.equal(missingAdmission.isVerified, false);
  assert.doesNotMatch(missingAdmission.displayLabel, /free admission/i);

  // Verified Free Admission
  const nationalMuseumAdm = getAdmissionDisplay(getSiteById('cebu-national-museum'));
  assert.equal(nationalMuseumAdm.status, 'free');
  assert.equal(nationalMuseumAdm.isVerified, true);

  // Verified Paid Admission with categories
  const sugbuChineseAdm = getAdmissionDisplay(getSiteById('cebu-sugbu-chinese-museum'));
  assert.equal(sugbuChineseAdm.status, 'paid');
  assert.equal(sugbuChineseAdm.isVerified, true);
  assert.ok((sugbuChineseAdm.rates?.length || 0) >= 3);

  const museoSugboAdm = getAdmissionDisplay(getSiteById('cebu-museo-sugbo'));
  assert.equal(museoSugboAdm.status, 'paid');
  assert.equal(museoSugboAdm.isVerified, true);
  assert.ok(
    museoSugboAdm.sources?.some(s => s.url === 'https://www.sunstar.com.ph/cebu/museo-sugbo-reopens'),
    'Museo Sugbo must cite the specific SunStar Cebu article URL'
  );
  assert.ok(
    museoSugboAdm.sources?.some(s => s.url.includes('cebu.gov.ph/2383/')),
    'Museo Sugbo must cite the official Cebu Provincial Government announcement'
  );

  // Facility-specific separation: Basilica Church (free) vs Basement Museum (unverified)
  const basilicaAdm = getAdmissionDisplay(getSiteById('cebu-basilica'));
  assert.equal(basilicaAdm.status, 'free');
  assert.equal(basilicaAdm.policyKind, 'mixed_subfacilities');
  assert.equal(basilicaAdm.subFacilities?.length, 2);
  assert.equal(basilicaAdm.subFacilities?.[0].status, 'free');
  assert.equal(basilicaAdm.subFacilities?.[0].isVerified, true);
  assert.equal(basilicaAdm.subFacilities?.[1].status, 'unverified');
  assert.equal(basilicaAdm.subFacilities?.[1].isVerified, false);

  // Facility-specific separation: Ground-Floor Public Library (free) vs Upper-Floor Museum (unverified)
  const rizalLibraryAdm = getAdmissionDisplay(getSiteById('cebu-rizal-memorial-library'));
  assert.equal(rizalLibraryAdm.status, 'unverified');
  assert.equal(rizalLibraryAdm.isVerified, false);
  assert.equal(rizalLibraryAdm.policyKind, 'mixed_subfacilities');
  assert.equal(rizalLibraryAdm.subFacilities?.[0].status, 'free');
  assert.equal(rizalLibraryAdm.subFacilities?.[0].isVerified, true);
  assert.equal(rizalLibraryAdm.subFacilities?.[1].status, 'unverified');
  assert.equal(rizalLibraryAdm.subFacilities?.[1].isVerified, false);

  // Open public access (LGU-listed, no formal fee table) vs unverified public spaces without official URLs
  const mactanShrineAdm = getAdmissionDisplay(getSiteById('llc-mactan-shrine'));
  assert.equal(mactanShrineAdm.status, 'free');
  assert.equal(mactanShrineAdm.isVerified, false);
  assert.equal(mactanShrineAdm.policyKind, 'open_public_access');
  assert.ok((mactanShrineAdm.sources?.length || 0) > 0);

  const fuenteAdm = getAdmissionDisplay(getSiteById('cebu-fuente-osmena'));
  assert.equal(fuenteAdm.status, 'unverified');
  assert.equal(fuenteAdm.isVerified, false);

  // Unverified Paid Admission (official page does not publish fixed price table)
  const casaGorordoAdm = getAdmissionDisplay(getSiteById('cebu-casa-gorordo'));
  assert.equal(casaGorordoAdm.status, 'unverified');
  assert.equal(casaGorordoAdm.isVerified, false);

  // Not Available
  const cityHallAdm = getAdmissionDisplay(getSiteById('cebu-city-hall'));
  assert.equal(cityHallAdm.status, 'not_available');
  assert.equal(cityHallAdm.isVerified, false);

  // Stale Firestore legacy entranceFee string must not override audited admissionInfo
  const staticRizal = getSiteById('cebu-rizal-memorial-library')!;
  const mergedRizal = normalizeHeritageSite(
    { id: 'cebu-rizal-memorial-library', entranceFee: 'Free Admission' },
    staticRizal
  );
  const mergedRizalAdm = getAdmissionDisplay(mergedRizal);
  assert.equal(mergedRizalAdm.status, 'unverified');
  assert.equal(mergedRizalAdm.isVerified, false);
  assert.equal(mergedRizalAdm.subFacilities?.length, 2);
  assert.equal(mergedRizal.entranceFee, staticRizal.admissionInfo?.displayLabel);
});

test('Scenario #34: Verification status visibility rules — Pending Verification & LGU Verified visible, Needs Revision & Rejected hidden, Inactive hidden, and unverify/reverify preserves data without duplicates', () => {
  const staticCross = getSiteById('cebu-cross')!;

  // 1. LGU Verified and active site appears in the public Site Directory & search (by name, city, location, or category)
  const verifiedOverride = {
    id: 'mandaue-presidencia',
    verificationStatus: 'LGU Verified',
    verifiedBy: 'LGU Reviewer',
  };
  const verifiedList = mergeAdminSitesWithStatic([verifiedOverride], null);
  assert.equal(verifiedList.length, 42);
  const verifiedPresidencia = verifiedList.find(s => s.id === 'mandaue-presidencia')!;
  assert.ok(verifiedPresidencia);
  assert.equal(verifiedPresidencia.verificationStatus, 'LGU Verified');
  assert.deepEqual(getExploreVerificationBadge(verifiedPresidencia), {
    status: 'LGU Verified',
    label: 'LGU Verified',
    tone: 'green',
  });
  assert.equal(isSiteVisibleToUser(verifiedPresidencia, null), true);
  assert.equal(isSiteVisibleToUser(verifiedPresidencia, 'user'), true);
  assert.equal(
    searchSites('Mandaue Presidencia', 'All', 'All', null, verifiedList).some(s => s.id === 'mandaue-presidencia'),
    true
  );
  assert.equal(
    searchSites('Mandaue City', 'All', 'All', null, verifiedList).some(s => s.id === 'mandaue-presidencia'),
    true
  );
  assert.equal(
    searchSites('Poblacion, Mandaue City', 'All', 'All', null, verifiedList).some(s => s.id === 'mandaue-presidencia'),
    true
  );

  // 2. Removing LGU Verified status (resetting to Pending Verification or clearing) keeps the site visible and preserves fields
  for (const statusAfterUnverify of ['Pending Verification', ''] as const) {
    const pendingList = mergeAdminSitesWithStatic(
      [{ id: 'cebu-cross', verificationStatus: statusAfterUnverify }],
      null
    );
    assert.equal(pendingList.length, 42, `Site count must remain 42 for status "${statusAfterUnverify}"`);
    const pendingCross = pendingList.find(s => s.id === 'cebu-cross')!;
    assert.ok(pendingCross);
    assert.equal(pendingCross.verificationStatus, 'Pending Verification');
    assert.equal(getExploreVerificationBadge(pendingCross), null);
    assert.equal(isSiteVisibleToUser(pendingCross, null), true);
    assert.equal(isSiteVisibleToUser(pendingCross, 'user'), true);
    assert.equal(
      searchSites('Magellan', 'Cebu City', 'All', null, pendingList).some(s => s.id === 'cebu-cross'),
      true
    );

    // Unrelated site information is preserved
    assert.equal(pendingCross.name, staticCross.name);
    assert.equal(pendingCross.description, staticCross.description);
    assert.equal(pendingCross.imageUrl, staticCross.imageUrl);
    assert.deepEqual(pendingCross.coordinates, staticCross.coordinates);
    assert.equal(pendingCross.isActive, true);
    assert.equal(pendingCross.status, 'Active');
  }

  // 3. Needs Revision and Rejected sites are hidden from public listings, search, and public detail views
  for (const hiddenStatus of ['Needs Revision', 'Rejected'] as const) {
    const hiddenList = mergeAdminSitesWithStatic(
      [{ id: 'cebu-cross', verificationStatus: hiddenStatus }],
      null
    );
    assert.equal(hiddenList.length, 41, `Site with status "${hiddenStatus}" must be hidden from public directory`);
    assert.equal(hiddenList.some(s => s.id === 'cebu-cross'), false);
    assert.equal(
      isSiteVisibleToUser({ ...staticCross, verificationStatus: hiddenStatus }, null),
      false
    );
    assert.equal(
      getExploreVerificationBadge({ ...staticCross, verificationStatus: hiddenStatus }),
      null
    );
    assert.equal(
      isSiteVisibleToUser({ ...staticCross, verificationStatus: hiddenStatus }, 'user'),
      false
    );
    assert.equal(
      searchSites('Magellan', 'Cebu City', 'All', null, [
        { ...staticCross, verificationStatus: hiddenStatus },
      ]).length,
      0
    );
  }

  // 4. Re-verifying the site does not create duplicate records, and legacy duplicate Firestore IDs are excluded
  const reverifiedList = mergeAdminSitesWithStatic(
    [
      { id: 'cebu-cross', verificationStatus: 'LGU Verified' },
      { id: 'cebu-provincial-capitol', name: 'Cebu Provincial Capitol', verificationStatus: 'LGU Verified' },
      { id: 'fuente-osmeña-circle', name: 'Fuente Osmeña Circle', verificationStatus: 'LGU Verified' },
    ],
    null
  );
  assert.equal(reverifiedList.length, 42);
  assert.equal(reverifiedList.filter(s => s.id === 'cebu-cross').length, 1);
  assert.equal(reverifiedList.find(s => s.id === 'cebu-cross')?.verificationStatus, 'LGU Verified');
  assert.equal(reverifiedList.some(s => s.id === 'cebu-provincial-capitol'), false);
  assert.equal(reverifiedList.some(s => s.id === 'fuente-osmeña-circle'), false);
  assert.equal(reverifiedList.filter(s => s.name === 'Cebu Provincial Capitol').length, 1);
  assert.equal(reverifiedList.filter(s => s.name === 'Fuente Osmeña Circle').length, 1);

  // 5. Intentionally unpublished or inactive sites are hidden even if LGU Verified or Pending Verification
  const inactiveByFlag = mergeAdminSitesWithStatic(
    [{ id: 'cebu-cross', isActive: false, verificationStatus: 'LGU Verified' }],
    null
  );
  assert.equal(inactiveByFlag.length, 41);
  assert.equal(inactiveByFlag.some(s => s.id === 'cebu-cross'), false);
  assert.equal(
    isSiteVisibleToUser({ id: 'cebu-cross', isActive: false, verificationStatus: 'LGU Verified' }, null),
    false
  );
  assert.equal(
    getExploreVerificationBadge({ id: 'cebu-cross', isActive: false, verificationStatus: 'LGU Verified' }),
    null
  );

  const inactiveByStatus = mergeAdminSitesWithStatic(
    [{ id: 'cebu-cross', status: 'Inactive', verificationStatus: 'Pending Verification' }],
    null
  );
  assert.equal(inactiveByStatus.length, 41);
  assert.equal(inactiveByStatus.some(s => s.id === 'cebu-cross'), false);
  assert.equal(
    isSiteVisibleToUser({ id: 'cebu-cross', status: 'Inactive', verificationStatus: 'Pending Verification' }, null),
    false
  );
  assert.equal(
    getExploreVerificationBadge({ id: 'cebu-cross', status: 'Inactive', verificationStatus: 'Pending Verification' }),
    null
  );

  // 6. Generic badge resolution across all 42 heritage sites without hardcoding site IDs
  for (const site of HERITAGE_SITES) {
    assert.equal(getExploreVerificationBadge({ ...site, verificationStatus: 'Pending Verification' }), null);
    assert.deepEqual(getExploreVerificationBadge({ ...site, verificationStatus: 'LGU Verified' }), {
      status: 'LGU Verified',
      label: 'LGU Verified',
      tone: 'green',
    });
    assert.equal(getExploreVerificationBadge({ ...site, verificationStatus: 'Needs Revision' }), null);
    assert.equal(getExploreVerificationBadge({ ...site, verificationStatus: 'Rejected' }), null);
  }
});
