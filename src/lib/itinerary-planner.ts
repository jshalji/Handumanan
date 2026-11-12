import { isSiteOpenForVisit } from '@/lib/site-availability';

export type PlannerSite = {
  id?: string;
  siteId?: string;
  name?: string;
  siteName?: string;
  city?: string;
  category?: string;
  visitingHours?: string;
  isActive?: boolean;
  status?: string;
  demolitionStatus?: string;
  accessibilityStatus?: string;
  coordinates?: { lat: number; lng: number };
  latitude?: number;
  longitude?: number;
};

export type PlannerInput = {
  selectedSitesJson?: string;
  startingLocation?: string;
  interests?: string[];
  siteDatabase?: string;
  availableTimeHours?: number;
};

export type PlannerItineraryStop = {
  siteId: string;
  siteName: string;
  estimatedVisitDurationMinutes: number;
  estimatedTravelDurationMinutes?: number;
  description: string;
};

export type PlannerItineraryOutput = {
  itinerary: PlannerItineraryStop[];
  summary: string;
  routeSuggestion: string;
  totalEstimatedDurationMinutes: number;
  totalEstimatedTravelDurationMinutes?: number;
  bufferMinutes?: number;
};

export type PlannerPlanningMode = 'open-now' | 'future-daytime' | 'none';

export type PlannerCandidateResolution = {
  sites: PlannerSite[];
  mode: PlannerPlanningMode;
  plannedDate?: Date;
  plannedWindowLabel?: string;
};

const MANILA_TIME_ZONE = 'Asia/Manila';

const DAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const DAY_ALIASES: Record<string, string> = {
  sun: 'sunday',
  sundays: 'sunday',
  mon: 'monday',
  mondays: 'monday',
  tue: 'tuesday',
  tues: 'tuesday',
  tuesdays: 'tuesday',
  wed: 'wednesday',
  weds: 'wednesday',
  wednesdays: 'wednesday',
  thu: 'thursday',
  thur: 'thursday',
  thurs: 'thursday',
  thursdays: 'thursday',
  fri: 'friday',
  fridays: 'friday',
  sat: 'saturday',
  saturdays: 'saturday',
};

const EXPLICIT_UNAVAILABLE_HOURS_PATTERN =
  /\b(permanently\s+closed|temporarily\s+closed|currently\s+closed|closed\s+indefinitely|closed\s+for\s+\w+|closed\s+to\s+(?:the\s+)?public|closed\s+to\s+visitors|closed\s+until\b|temporarily\s+unavailable|not\s+open|unavailable|no\s+public\s+access|inaccessible)\b/i;

const DAY_OFF_CLAUSE_PATTERN =
  /\(?\bclosed\s+(?:on\s+|every\s+)?((?:(?:mon(?:day)?s?|tue(?:s|sday|day)?s?|wed(?:nesday|s)?s?|thu(?:r|rs|rsday|rday|day)?s?|fri(?:day)?s?|sat(?:urday)?s?|sun(?:day)?s?|weekends?|weekdays?)(?:\s*(?:,|and|&|\/)\s*)?)+)\)?/gi;

const DAY_TOKEN_PATTERN =
  /\b(mon(?:day)?s?|tue(?:s|sday|day)?s?|wed(?:nesday|s)?s?|thu(?:r|rs|rsday|rday|day)?s?|fri(?:day)?s?|sat(?:urday)?s?|sun(?:day)?s?|weekends?|weekdays?)\b/gi;

const SCHEDULED_TIME_RANGE_PATTERN =
  /(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*(?:-|to|–)\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i;

const SCHEDULED_DAY_RANGE_PATTERN =
  /\b(mon(?:day)?|tue(?:s|sday|day)?|wed(?:nesday)?|thu(?:r|rs|rsday|rday|day)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\s*(?:-|to)\s*(mon(?:day)?|tue(?:s|sday|day)?|wed(?:nesday)?|thu(?:r|rs|rsday|rday|day)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/i;

const OPEN_SCHEDULE_KEYWORD_PATTERN =
  /\b(24\s*hours|open\s+access|daylight(?:\s+hours)?)\b/i;

const FALSE_OPEN_NOW_CLAIM_PATTERN =
  /\b(currently\s+(?:open|available)|open\s+(?:now|right\s+now|at\s+the\s+moment)|available\s+right\s+now)\b/i;

const DEFAULT_DAYTIME_CHECK_MINUTES = [
  8 * 60,
  8 * 60 + 30,
  9 * 60,
  10 * 60,
  11 * 60,
  13 * 60,
  14 * 60,
  15 * 60,
  16 * 60,
];

export function parsePlannerSites(input: PlannerInput): PlannerSite[] {
  try {
    const parsed = JSON.parse(input.selectedSitesJson || input.siteDatabase || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function serializeSitesForPlanner(sites: any[]): string {
  return JSON.stringify(
    (sites || []).map(site => ({
      id: site?.id ?? site?.siteId,
      name: site?.name ?? site?.siteName,
      city: site?.city,
      coordinates:
        site?.coordinates ||
        (site?.latitude !== undefined && site?.longitude !== undefined
          ? { lat: site.latitude, lng: site.longitude }
          : undefined),
      visitingHours: site?.visitingHours,
      isActive: site?.isActive,
      status: site?.status,
      demolitionStatus: site?.demolitionStatus,
      accessibilityStatus: site?.accessibilityStatus,
    }))
  );
}

export function getPlannerSiteId(site: PlannerSite) {
  return site.siteId || site.id || '';
}

export function getPlannerSiteName(site: PlannerSite) {
  return site.siteName || site.name || '';
}

export function normalizePlannerKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function getPlannerSiteKey(site: PlannerSite) {
  return normalizePlannerKey(getPlannerSiteId(site) || getPlannerSiteName(site));
}

function getManilaCalendarAndMinutes(date: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MANILA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const year = Number(parts.find(p => p.type === 'year')?.value || 1970);
  const month = Number(parts.find(p => p.type === 'month')?.value || 1);
  const day = Number(parts.find(p => p.type === 'day')?.value || 1);
  const weekday = (parts.find(p => p.type === 'weekday')?.value || 'Sunday').toLowerCase();
  const rawHour = Number(parts.find(p => p.type === 'hour')?.value || 0);
  const hour = rawHour === 24 ? 0 : rawHour;
  const minute = Number(parts.find(p => p.type === 'minute')?.value || 0);

  return {
    year,
    month,
    day,
    dayIndex: DAY_INDEX[weekday] ?? 0,
    minutes: hour * 60 + minute,
  };
}

function createManilaDate(
  baseYear: number,
  baseMonth: number,
  baseDay: number,
  dayOffset: number,
  minutesOfDay: number
): Date {
  // Asia/Manila is permanently UTC+08:00 without DST
  const baseMidnightUtcMs = Date.UTC(baseYear, baseMonth - 1, baseDay, -8, 0, 0, 0);
  return new Date(baseMidnightUtcMs + dayOffset * 86_400_000 + minutesOfDay * 60_000);
}

export function formatManilaPlannedSlot(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MANILA_TIME_ZONE,
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(date);

  const weekday = parts.find(p => p.type === 'weekday')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  const hour = parts.find(p => p.type === 'hour')?.value || '';
  const minute = parts.find(p => p.type === 'minute')?.value || '00';
  const dayPeriod = (parts.find(p => p.type === 'dayPeriod')?.value || '').toUpperCase();

  return `${weekday}, ${month} ${day} at ${hour}:${minute} ${dayPeriod}`.trim();
}

function parseTimeToMinutes(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'AM' && hour === 12) hour = 0;
  if (meridiem === 'PM' && hour !== 12) hour += 12;

  return hour * 60 + minute;
}

function parseOpeningMinutesFromHours(visitingHours?: string): number | null {
  const hours = String(visitingHours || '').trim();
  const match = hours.match(SCHEDULED_TIME_RANGE_PATTERN);
  if (!match) return null;
  return parseTimeToMinutes(match[1]);
}

function extractDayOffQualifierInfo(rawHours: string): {
  closedDays: Set<number>;
  cleanedHours: string;
} {
  const closedDays = new Set<number>();

  const cleanedHours = rawHours
    .replace(DAY_OFF_CLAUSE_PATTERN, (_fullMatch, daysGroup: string) => {
      const tokens = String(daysGroup || '').match(DAY_TOKEN_PATTERN) || [];
      for (const rawToken of tokens) {
        const token = rawToken.trim().toLowerCase().replace(/\.$/, '');
        if (token === 'weekend' || token === 'weekends') {
          closedDays.add(0);
          closedDays.add(6);
        } else if (token === 'weekday' || token === 'weekdays') {
          closedDays.add(1);
          closedDays.add(2);
          closedDays.add(3);
          closedDays.add(4);
          closedDays.add(5);
        } else {
          const canonical = DAY_ALIASES[token] || token;
          const idx = DAY_INDEX[canonical];
          if (idx !== undefined) {
            closedDays.add(idx);
          }
        }
      }
      return ' ';
    })
    .replace(/\(\s*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { closedDays, cleanedHours };
}

export function isSiteStructurallyEligible(site: PlannerSite | null | undefined): boolean {
  if (!site || !getPlannerSiteKey(site)) return false;

  if (site.isActive === false || String(site.status || '').trim().toLowerCase() === 'inactive') {
    return false;
  }

  if (String(site.demolitionStatus || '').trim().toLowerCase() === 'demolished') {
    return false;
  }

  if (/\b(closed|unavailable|demolished|inaccessible)\b/i.test(String(site.status || '').trim())) {
    return false;
  }

  if (
    /\b(permanently\s+closed|temporarily\s+closed|currently\s+closed|closed|unavailable|inaccessible|not\s+open)\b/i.test(
      String(site.accessibilityStatus || '').trim()
    )
  ) {
    return false;
  }

  return true;
}

export function isSiteOpenAtDateTime(
  site: PlannerSite | null | undefined,
  date: Date = new Date()
): boolean {
  if (!site || !isSiteStructurallyEligible(site)) return false;

  const hours = String(site.visitingHours || '').trim();
  const normalizedHours = hours.toLowerCase();

  if (!hours || normalizedHours.includes('requires verification')) {
    return isSiteOpenForVisit(site, date);
  }

  if (EXPLICIT_UNAVAILABLE_HOURS_PATTERN.test(hours)) {
    return false;
  }

  const { closedDays, cleanedHours } = extractDayOffQualifierInfo(hours);
  const normalizedCleaned = cleanedHours.toLowerCase();

  if (/\bclosed\b/i.test(normalizedCleaned)) {
    return false;
  }

  const hasRecognizableSchedule =
    SCHEDULED_TIME_RANGE_PATTERN.test(cleanedHours) ||
    SCHEDULED_DAY_RANGE_PATTERN.test(cleanedHours) ||
    OPEN_SCHEDULE_KEYWORD_PATTERN.test(cleanedHours);

  if (!hasRecognizableSchedule) {
    return false;
  }

  if (closedDays.size > 0) {
    const { dayIndex } = getManilaCalendarAndMinutes(date);
    if (closedDays.has(dayIndex)) {
      return false;
    }
    return isSiteOpenForVisit({ ...site, visitingHours: cleanedHours }, date);
  }

  return isSiteOpenForVisit(site, date);
}

export function isSiteOpenForEntireVisit(
  site: PlannerSite | null | undefined,
  arrivalTime: Date,
  visitDurationMinutes: number
): boolean {
  if (!site) return false;
  const duration = Math.max(0, Math.round(visitDurationMinutes));

  for (let elapsed = 0; elapsed <= duration; elapsed += 1) {
    const checkPoint = new Date(arrivalTime.getTime() + elapsed * 60_000);
    if (!isSiteOpenAtDateTime(site, checkPoint)) {
      return false;
    }
  }

  return true;
}

export function dedupePlannerSites(sites: PlannerSite[]): PlannerSite[] {
  const usedKeys = new Set<string>();
  const usedIds = new Set<string>();
  const usedNames = new Set<string>();

  return sites.filter(site => {
    const key = getPlannerSiteKey(site);
    const idKey = normalizePlannerKey(getPlannerSiteId(site));
    const nameKey = normalizePlannerKey(getPlannerSiteName(site));

    if (!key || usedKeys.has(key)) return false;
    if (idKey && usedIds.has(idKey)) return false;
    if (nameKey && usedNames.has(nameKey)) return false;

    usedKeys.add(key);
    if (idKey) usedIds.add(idKey);
    if (nameKey) usedNames.add(nameKey);
    return true;
  });
}

function collectCandidateDaytimeMinutes(sites: PlannerSite[]): number[] {
  const minuteSet = new Set<number>(DEFAULT_DAYTIME_CHECK_MINUTES);

  for (const site of sites) {
    const openingMinutes = parseOpeningMinutesFromHours(site.visitingHours);
    if (openingMinutes !== null && openingMinutes >= 6 * 60 && openingMinutes <= 17 * 60) {
      minuteSet.add(openingMinutes);
    }
  }

  return Array.from(minuteSet).sort((a, b) => a - b);
}

function findSharedFutureDaytimeSlot(
  structuralCandidates: PlannerSite[],
  now: Date,
  desiredStopCount: number
): { plannedDate: Date; openSites: PlannerSite[] } | null {
  if (structuralCandidates.length === 0) return null;

  const { year, month, day } = getManilaCalendarAndMinutes(now);
  const candidateMinutes = collectCandidateDaytimeMinutes(structuralCandidates);
  const maxHorizonMs = now.getTime() + 7 * 86_400_000;

  type DayBestSlot = {
    dayOffset: number;
    plannedDate: Date;
    openSites: PlannerSite[];
  };

  const bestByDay: DayBestSlot[] = [];

  for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
    let bestForDay: DayBestSlot | null = null;

    for (const minutesOfDay of candidateMinutes) {
      const slotDate = createManilaDate(year, month, day, dayOffset, minutesOfDay);
      if (slotDate.getTime() <= now.getTime() || slotDate.getTime() > maxHorizonMs) {
        continue;
      }

      const openSites = structuralCandidates.filter(site =>
        isSiteOpenAtDateTime(site, slotDate)
      );

      if (openSites.length === 0) continue;

      if (!bestForDay || openSites.length > bestForDay.openSites.length) {
        bestForDay = {
          dayOffset,
          plannedDate: slotDate,
          openSites,
        };
      }
    }

    if (bestForDay) {
      bestByDay.push(bestForDay);
    }
  }

  if (bestByDay.length === 0) {
    return null;
  }

  const maxOpenAcrossHorizon = Math.max(...bestByDay.map(slot => slot.openSites.length));
  const targetCompatibleCount = Math.min(
    maxOpenAcrossHorizon,
    Math.max(1, desiredStopCount)
  );

  const chosenSlot =
    bestByDay.find(slot => slot.openSites.length >= targetCompatibleCount) || bestByDay[0];

  return {
    plannedDate: chosenSlot.plannedDate,
    openSites: chosenSlot.openSites,
  };
}

export function resolvePlannerCandidates(
  input: PlannerInput,
  now: Date = new Date()
): PlannerCandidateResolution {
  const parsedSites = parsePlannerSites(input);
  const uniqueStructuralSites = dedupePlannerSites(
    parsedSites.filter(site => isSiteStructurallyEligible(site))
  );

  const openNowSites = uniqueStructuralSites.filter(site =>
    isSiteOpenAtDateTime(site, now)
  );

  if (openNowSites.length > 0) {
    return {
      sites: openNowSites,
      mode: 'open-now',
    };
  }

  const desiredStopCount = Math.max(1, Math.ceil(input.availableTimeHours || 4));
  const futureSlot = findSharedFutureDaytimeSlot(
    uniqueStructuralSites,
    now,
    desiredStopCount
  );

  if (futureSlot && futureSlot.openSites.length > 0) {
    return {
      sites: futureSlot.openSites,
      mode: 'future-daytime',
      plannedDate: futureSlot.plannedDate,
      plannedWindowLabel: formatManilaPlannedSlot(futureSlot.plannedDate),
    };
  }

  return {
    sites: [],
    mode: 'none',
  };
}

export function resolveDiscoverFutureCompatibleSites<T extends PlannerSite>(
  sites: T[],
  desiredStopCount: number,
  now: Date = new Date()
): { sites: T[]; plannedDate?: Date; plannedWindowLabel?: string } {
  const structuralSites = (sites || []).filter(site => isSiteStructurallyEligible(site));
  const slot = findSharedFutureDaytimeSlot(structuralSites, now, desiredStopCount);
  if (!slot || slot.openSites.length === 0) {
    return { sites: [] };
  }

  const allowedKeys = new Set(slot.openSites.map(site => getPlannerSiteKey(site)));
  return {
    sites: structuralSites.filter(site => allowedKeys.has(getPlannerSiteKey(site))),
    plannedDate: slot.plannedDate,
    plannedWindowLabel: formatManilaPlannedSlot(slot.plannedDate),
  };
}

function estimateDistanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function startCoordsFor(location: string | undefined): { lat: number; lng: number } {
  const key = (location || '').toLowerCase();
  if (key.includes('mandaue')) return { lat: 10.3236, lng: 123.9223 };
  if (key.includes('lapu') || key.includes('mactan')) return { lat: 10.3103, lng: 123.9593 };
  if (key.includes('talisay')) return { lat: 10.2447, lng: 123.8494 };
  return { lat: 10.29365, lng: 123.90196 };
}

function computeTravelFromPosition(
  prevPos: { lat: number; lng: number },
  site: PlannerSite
): {
  travelMinutes: number;
  nextPos: { lat: number; lng: number };
  distanceKm: number | null;
} {
  const coords = site.coordinates || {
    lat: site.latitude,
    lng: site.longitude,
  };
  if (
    coords &&
    Number.isFinite(Number(coords.lat)) &&
    Number.isFinite(Number(coords.lng))
  ) {
    const dest = { lat: Number(coords.lat), lng: Number(coords.lng) };
    const distanceKm = estimateDistanceKm(prevPos, dest);
    const travelMinutes = Math.max(
      5,
      Math.round(((distanceKm * 1.35) / 22) * 60) + 3
    );
    return { travelMinutes, nextPos: dest, distanceKm };
  }
  return { travelMinutes: 0, nextPos: prevPos, distanceKm: null };
}

export function sanitizeGeneratedItinerary(
  output: PlannerItineraryOutput,
  input: PlannerInput,
  now: Date = new Date()
): PlannerItineraryOutput {
  const {
    sites: availableSites,
    mode,
    plannedDate,
    plannedWindowLabel,
  } = resolvePlannerCandidates(input, now);
  const isFutureDaytime = mode === 'future-daytime';
  const routeStartTime = isFutureDaytime && plannedDate ? plannedDate : now;
  const windowPhrase = plannedWindowLabel
    ? `for ${plannedWindowLabel}`
    : 'for regular daytime visiting hours';

  const allowedById = new Map(availableSites.map(site => [getPlannerSiteId(site), site]));
  const allowedByName = new Map(
    availableSites.map(site => [getPlannerSiteName(site).toLowerCase(), site])
  );
  const targetStopCount = Math.max(
    1,
    Math.min(availableSites.length, Math.ceil(input.availableTimeHours || 4))
  );
  const usedKeys = new Set<string>();
  const usedIds = new Set<string>();
  const usedNames = new Set<string>();

  const startPoint = startCoordsFor(input.startingLocation);
  let prevPos = startPoint;
  let elapsedMinutes = 0;
  let totalTravel = 0;
  const withTravel: PlannerItineraryOutput['itinerary'] = [];

  for (const stop of output.itinerary || []) {
    const sourceSite =
      allowedById.get(stop.siteId) ||
      allowedByName.get(String(stop.siteName || '').toLowerCase());
    if (!sourceSite) continue;

    const key = getPlannerSiteKey(sourceSite);
    const idKey = normalizePlannerKey(getPlannerSiteId(sourceSite));
    const nameKey = normalizePlannerKey(getPlannerSiteName(sourceSite));
    if (
      !key ||
      usedKeys.has(key) ||
      (idKey && usedIds.has(idKey)) ||
      (nameKey && usedNames.has(nameKey))
    ) {
      continue;
    }

    const visitDuration = Math.min(
      60,
      Math.max(30, Math.round(stop.estimatedVisitDurationMinutes || 40))
    );
    const { travelMinutes, nextPos } = computeTravelFromPosition(prevPos, sourceSite);
    const arrivalTime = new Date(
      routeStartTime.getTime() + (elapsedMinutes + travelMinutes) * 60_000
    );

    if (!isSiteOpenForEntireVisit(sourceSite, arrivalTime, visitDuration)) {
      continue;
    }

    usedKeys.add(key);
    if (idKey) usedIds.add(idKey);
    if (nameKey) usedNames.add(nameKey);
    prevPos = nextPos;
    elapsedMinutes += travelMinutes + visitDuration;
    totalTravel += travelMinutes;

    const rawDescription = String(stop.description || '').trim();
    const description = isFutureDaytime
      ? !rawDescription || FALSE_OPEN_NOW_CLAIM_PATTERN.test(rawDescription)
        ? `Plan to visit ${getPlannerSiteName(sourceSite)} ${windowPhrase} during its daytime visiting hours${sourceSite.visitingHours ? ` (${sourceSite.visitingHours})` : ''}.`
        : rawDescription
      : rawDescription || `Visit ${getPlannerSiteName(sourceSite)} as part of the open heritage route.`;

    withTravel.push({
      siteId: getPlannerSiteId(sourceSite),
      siteName: getPlannerSiteName(sourceSite),
      estimatedVisitDurationMinutes: visitDuration,
      estimatedTravelDurationMinutes: travelMinutes,
      description,
    });
  }

  for (const site of availableSites) {
    if (withTravel.length >= targetStopCount) break;

    const key = getPlannerSiteKey(site);
    const idKey = normalizePlannerKey(getPlannerSiteId(site));
    const nameKey = normalizePlannerKey(getPlannerSiteName(site));
    if (
      usedKeys.has(key) ||
      (idKey && usedIds.has(idKey)) ||
      (nameKey && usedNames.has(nameKey))
    ) {
      continue;
    }

    const visitDuration = 40;
    const { travelMinutes, nextPos } = computeTravelFromPosition(prevPos, site);
    const arrivalTime = new Date(
      routeStartTime.getTime() + (elapsedMinutes + travelMinutes) * 60_000
    );

    if (!isSiteOpenForEntireVisit(site, arrivalTime, visitDuration)) {
      continue;
    }

    usedKeys.add(key);
    if (idKey) usedIds.add(idKey);
    if (nameKey) usedNames.add(nameKey);
    prevPos = nextPos;
    elapsedMinutes += travelMinutes + visitDuration;
    totalTravel += travelMinutes;

    withTravel.push({
      siteId: getPlannerSiteId(site),
      siteName: getPlannerSiteName(site),
      estimatedVisitDurationMinutes: visitDuration,
      estimatedTravelDurationMinutes: travelMinutes,
      description: isFutureDaytime
        ? `Added for a future daytime visit ${windowPhrase} during its listed visiting hours${site.visitingHours ? ` (${site.visitingHours})` : ''}.`
        : `Added because this heritage site is currently available and fits the requested tour.`,
    });
  }

  const totalVisit = withTravel.reduce(
    (total, stop) => total + stop.estimatedVisitDurationMinutes,
    0
  );
  const bufferMinutes = Math.max(10, Math.min(45, Math.round(totalTravel)));
  const totalEstimatedDurationMinutes = totalVisit + totalTravel + bufferMinutes;

  return {
    itinerary: withTravel,
    summary:
      withTravel.length > 0
        ? isFutureDaytime
          ? `Prepared a ${withTravel.length}-stop future daytime route ${windowPhrase} during regular visiting hours (selected Handumanan sites are currently outside their visiting schedules).`
          : `Prepared a ${withTravel.length}-stop route using only available Handumanan sites.`
        : 'No currently open heritage sites were available for this itinerary.',
    routeSuggestion:
      withTravel.length > 0
        ? isFutureDaytime
          ? `For a future daytime visit ${windowPhrase}, start from ${input.startingLocation || 'your current location'}, then visit ${withTravel.map(stop => stop.siteName).join(' -> ')}.`
          : `Start from ${input.startingLocation || 'your current location'}, then visit ${withTravel.map(stop => stop.siteName).join(' -> ')}.`
        : 'No route is available because there are no eligible open sites.',
    totalEstimatedDurationMinutes,
    totalEstimatedTravelDurationMinutes: totalTravel,
    bufferMinutes,
  };
}

export function generateLocalItinerary(
  input: PlannerInput,
  now: Date = new Date()
): PlannerItineraryOutput {
  const availableTimeMinutes = Math.max(30, (input.availableTimeHours || 4) * 60);
  const {
    sites: pool,
    mode,
    plannedDate,
    plannedWindowLabel,
  } = resolvePlannerCandidates(input, now);
  const isFutureDaytime = mode === 'future-daytime';
  const routeStartTime = isFutureDaytime && plannedDate ? plannedDate : now;
  const windowPhrase = plannedWindowLabel
    ? `for ${plannedWindowLabel}`
    : 'for regular daytime visiting hours';

  const startPoint = startCoordsFor(input.startingLocation);
  const selectedSites: PlannerSite[] = [];
  const travelMinutes: number[] = [];
  const used = new Set<string>();
  let currentPos = startPoint;
  let usedMinutes = 0;
  const visitMinutes = (_site: any, _index: number) => 30;

  while (selectedSites.length < pool.length) {
    let best: PlannerSite | null = null;
    let bestDist = Infinity;
    let bestTravelMin = 0;
    let bestNextPos = currentPos;

    for (const site of pool) {
      if (used.has(getPlannerSiteKey(site))) continue;

      const { travelMinutes: candidateTravelMin, nextPos, distanceKm } =
        computeTravelFromPosition(currentPos, site);
      if (distanceKm === null) continue;

      const visit = visitMinutes(site, selectedSites.length);
      if (
        usedMinutes + candidateTravelMin + visit > availableTimeMinutes &&
        selectedSites.length > 0
      ) {
        continue;
      }

      const arrivalTime = new Date(
        routeStartTime.getTime() + (usedMinutes + candidateTravelMin) * 60_000
      );
      if (!isSiteOpenForEntireVisit(site, arrivalTime, visit)) {
        continue;
      }

      if (distanceKm < bestDist) {
        bestDist = distanceKm;
        best = site;
        bestTravelMin = candidateTravelMin;
        bestNextPos = nextPos;
      }
    }

    if (!best) break;

    const visit = visitMinutes(best, selectedSites.length);
    selectedSites.push(best);
    travelMinutes.push(bestTravelMin);
    used.add(getPlannerSiteKey(best));
    usedMinutes += bestTravelMin + visit;
    currentPos = bestNextPos;
  }

  const itinerary = selectedSites.map((site, index) => {
    const siteId = getPlannerSiteId(site);
    const siteName = getPlannerSiteName(site);
    return {
      siteId,
      siteName,
      estimatedVisitDurationMinutes: 30,
      estimatedTravelDurationMinutes: travelMinutes[index] || 0,
      description: isFutureDaytime
        ? index === 0
          ? `Start here ${windowPhrase} during daytime visiting hours${site.visitingHours ? ` (${site.visitingHours})` : ''} to set the historical context for the route${site.city ? ` in ${site.city}` : ''}.`
          : `Continue here next ${windowPhrase} during daytime visiting hours${site.visitingHours ? ` (${site.visitingHours})` : ''} for a smooth heritage stop sequence${site.city ? ` around ${site.city}` : ''}.`
        : index === 0
          ? `Start here to set the historical context for the route${site.city ? ` in ${site.city}` : ''}.`
          : `Continue here next for a smooth heritage stop sequence${site.city ? ` around ${site.city}` : ''}.`,
    };
  });

  const totalTravel = travelMinutes.reduce((t, m) => t + m, 0);
  const totalVisit = itinerary.reduce(
    (total, stop) => total + stop.estimatedVisitDurationMinutes,
    0
  );
  const bufferMinutes = Math.max(10, Math.min(45, Math.round(totalTravel)));
  const totalEstimatedDurationMinutes = totalVisit + totalTravel + bufferMinutes;
  const routeSuggestion =
    itinerary.length > 0
      ? isFutureDaytime
        ? `For a future daytime visit ${windowPhrase}, start from ${input.startingLocation || 'your current location'}, then visit ${itinerary.map(stop => stop.siteName).join(' -> ')}.`
        : `Start from ${input.startingLocation || 'your current location'}, then visit ${itinerary.map(stop => stop.siteName).join(' -> ')}.`
      : 'No route is available yet.';

  return {
    itinerary,
    summary:
      itinerary.length > 0
        ? isFutureDaytime
          ? `Auto-generated a ${itinerary.length}-stop future daytime Cebu heritage route ${windowPhrase} during regular visiting hours (selected sites are currently outside their visiting schedules).`
          : `Auto-generated a ${itinerary.length}-stop Cebu heritage route from the available sites.`
        : 'No heritage sites were available to generate a route.',
    routeSuggestion,
    totalEstimatedDurationMinutes,
    totalEstimatedTravelDurationMinutes: totalTravel,
    bufferMinutes,
  };
}
