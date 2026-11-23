import {
  ALL_DAYS_OF_WEEK,
  doesAccessScopeApply,
  normalizeHeritageSite,
  normalizeOperatingSchedule,
  type AccessScope,
  type AccessVerificationMetadata,
  type CalculatedRealtimeStatus,
  type DailyOperatingSchedule,
  type DayOfWeek,
  type EvaluatorTargetScope,
  type ExteriorStreetVisibilityInfo,
  type HeritageSite,
  type OperatingSchedule,
  type OperatingTimePeriod,
  type ScheduleVerificationSource,
  type SpecialScheduleEntry,
  type SubFacilitySchedule,
  type TemporaryClosureEntry,
  type VerifiableClaimType,
  type VisitorAccessStatus,
} from '@/lib/heritage-data';

export const MANILA_TIME_ZONE = 'Asia/Manila';
export const CLOSING_SOON_THRESHOLD_MINUTES = 30;
export const MAX_VISIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours (1,440 minutes)

export interface ScopeOperatingEvaluationResult {
  targetScope: EvaluatorTargetScope;
  calculatedStatus: CalculatedRealtimeStatus;
  /**
   * Tri-state boolean:
   * - `true`: Confirmed open right now in this scope (verified open access policy + verified open operating hours)
   * - `false`: Confirmed closed or restricted right now in this scope
   * - `null`: Access policy or operating schedule for this scope/day is unverified or not specified
   */
  isOpen: boolean | null;
  isClosingSoon: boolean;
  policyVerified: boolean;
  scheduleVerified: boolean;
  currentPeriod: OperatingTimePeriod | null;
  closesAt: string | null;
  nextTransitionLabel: string | null;
  activeTemporaryClosure: TemporaryClosureEntry | null;
  activeSpecialSchedule: SpecialScheduleEntry | null;
  reason: string;
}

export interface SubFacilityEvaluationResult extends ScopeOperatingEvaluationResult {
  subFacilityId: string;
  subFacilityName: string;
}

export interface SiteOperatingEvaluationResult {
  timezone: 'Asia/Manila';
  evaluatedAtIso: string;
  manilaDayOfWeek: DayOfWeek;
  manilaDateString: string; // "YYYY-MM-DD"
  manilaTimeString: string; // "HH:mm"
  calculatedStatus: CalculatedRealtimeStatus;
  isOpen: boolean | null;
  isClosingSoon: boolean;
  interiorEvaluation: ScopeOperatingEvaluationResult;
  exteriorGroundsEvaluation: ScopeOperatingEvaluationResult;
  exteriorStreetVisibility: ExteriorStreetVisibilityInfo;
  subFacilityEvaluations: SubFacilityEvaluationResult[];
  scheduleVerified: boolean;
  policyVerified: boolean;
  verificationStatusLabel: AccessVerificationMetadata['verificationStatusLabel'];
  displaySummary: string;
  statusDetailMessage: string;
}

export interface VisitWindowEvaluationOptions {
  /** Defaults to `site.operatingSchedule.primaryVisitorScope` */
  targetScope?: EvaluatorTargetScope;
  /** Optional specific sub-facility ID to evaluate instead of the primary scope */
  subFacilityId?: string;
}

export interface VisitWindowEvaluationResult {
  status:
    | 'confirmed_open_entire_window'
    | 'closed_during_window'
    | 'unverified_during_window'
    | 'invalid_window';
  isOpenForEntireWindow: boolean;
  triState: boolean | null;
  /**
   * Confirmed Closure Fields (populated ONLY when `status === 'closed_during_window'`; `null` otherwise)
   */
  firstBlockingTimestampIso: string | null;
  firstBlockingStatus: CalculatedRealtimeStatus | null;
  firstBlockingReason: string | null;
  /**
   * Unverified Slice Fields (populated whenever at least one slice in [visitStart, visitEnd) has `isOpen === null`; `null` otherwise)
   */
  firstUnverifiedTimestampIso: string | null;
  firstUnverifiedStatus: CalculatedRealtimeStatus | null;
  firstUnverifiedReason: string | null;
  /** Primary human-readable summary reason for the resolved window status */
  reason: string;
}

export type AvailabilityResult = {
  isOpen: boolean;
  triState: boolean | null;
  calculatedStatus: CalculatedRealtimeStatus;
  isClosingSoon: boolean;
  reason: string;
  evaluation: SiteOperatingEvaluationResult;
};

export interface ManilaDateParts {
  year: number;
  month: number;
  day: number;
  dateStr: string; // "YYYY-MM-DD"
  dayOfWeek: DayOfWeek;
  dayIndex: number; // 0 (Sunday) .. 6 (Saturday)
  hour: number; // 0..23
  minute: number; // 0..59
  currentMinutes: number; // 0..1439
  timeStr: string; // "HH:mm"
}

const DAY_NAME_TO_INDEX: Record<DayOfWeek, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const INDEX_TO_DAY_NAME: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export function getManilaDateParts(date: Date = new Date()): ManilaDateParts {
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
  const weekdayRaw = (parts.find(p => p.type === 'weekday')?.value || 'Sunday').toLowerCase() as DayOfWeek;
  const dayOfWeek: DayOfWeek = weekdayRaw in DAY_NAME_TO_INDEX ? weekdayRaw : 'sunday';
  const dayIndex = DAY_NAME_TO_INDEX[dayOfWeek];
  const rawHour = Number(parts.find(p => p.type === 'hour')?.value || 0);
  const hour = rawHour === 24 ? 0 : rawHour;
  const minute = Number(parts.find(p => p.type === 'minute')?.value || 0);
  const currentMinutes = hour * 60 + minute;

  const dateStr = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return {
    year,
    month,
    day,
    dateStr,
    dayOfWeek,
    dayIndex,
    hour,
    minute,
    currentMinutes,
    timeStr,
  };
}

export function isValidIsoDateString(dateStr?: string | null): dateStr is string {
  if (!dateStr || typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) return false;
  const [y, m, d] = dateStr.trim().split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function addManilaDays(dateStr: string, offsetDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + offsetDays));
  const year = dt.getUTCFullYear();
  const month = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dt.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysBetweenIsoDates(startDate: string, endDate: string): number {
  const [y1, m1, d1] = startDate.split('-').map(Number);
  const [y2, m2, d2] = endDate.split('-').map(Number);
  const ms1 = Date.UTC(y1, m1 - 1, d1);
  const ms2 = Date.UTC(y2, m2 - 1, d2);
  return Math.max(0, Math.round((ms2 - ms1) / 86_400_000));
}

export function getDayOfWeekFromDateStr(dateStr: string): DayOfWeek {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return INDEX_TO_DAY_NAME[dt.getUTCDay()] ?? 'sunday';
}

/**
 * Parses a 24-hour time token ("HH:mm") into minutes [0..1440].
 * - "00:00" -> 0
 * - "24:00" -> 1440 (when allow2400 is true; rejected when allow2400 is false)
 */
export function parseTimeStringToMinutes(
  value?: string | null,
  options?: { allow2400?: boolean }
): number | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  const allow2400 = options?.allow2400 !== false;

  if (trimmed === '24:00') {
    return allow2400 ? 1440 : null;
  }

  const match = trimmed.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour * 60 + minute;
}

export function format24HourTo12Hour(timeStr: string): string {
  const minutes = parseTimeStringToMinutes(timeStr, { allow2400: true });
  if (minutes === null) return timeStr;
  const normalizedMinutes = minutes === 1440 ? 0 : minutes;
  const hour24 = Math.floor(normalizedMinutes / 60);
  const min = normalizedMinutes % 60;
  const meridiem = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(min).padStart(2, '0')} ${meridiem}`;
}

// ============================================================================
// RULE 0 — CLAIM-SPECIFIC SOURCE VALIDATION & ACCESS-POLICY AUTHORIZATION
// ============================================================================

export function isValidVerificationSourceForClaim(
  source: ScheduleVerificationSource | null | undefined,
  requiredClaim: VerifiableClaimType
): boolean {
  if (!source || typeof source !== 'object') return false;
  const url = String(source.url || '').trim();
  const publisher = String(source.publisher || '').trim();
  const title = String(source.title || '').trim();
  const checkedDate = String(source.checkedDate || '').trim();

  if (!/^https?:\/\/\S+/i.test(url)) return false;
  if (!publisher || !title) return false;
  if (!isValidIsoDateString(checkedDate)) return false;
  if (!Array.isArray(source.supportedClaims)) return false;

  return source.supportedClaims.includes(requiredClaim);
}

export function hasVerifiedClaimSource(
  sources: ScheduleVerificationSource[] | null | undefined,
  requiredClaim: VerifiableClaimType
): boolean {
  if (!Array.isArray(sources) || sources.length === 0) return false;
  return sources.some(src => isValidVerificationSourceForClaim(src, requiredClaim));
}

export function isGlobalAccessPolicyVerified(schedule: OperatingSchedule): boolean {
  if (!schedule?.verification?.visitorAccessStatusVerified) return false;
  if (!schedule.visitorAccessStatus || schedule.visitorAccessStatus === 'Unknown / Unverified') {
    return false;
  }
  return hasVerifiedClaimSource(
    schedule.verification.visitorAccessStatusSources,
    'global_visitor_access_policy'
  );
}

export function isInteriorPolicyVerified(schedule: OperatingSchedule): boolean {
  const info = schedule?.interiorAccess;
  if (!info || !info.policyVerified) return false;
  if (!info.policyStatus || info.policyStatus === 'Unknown / Unverified') return false;
  return hasVerifiedClaimSource(info.policySources, 'interior_access_policy');
}

export function isInteriorScheduleVerified(schedule: OperatingSchedule): boolean {
  const info = schedule?.interiorAccess;
  if (!info || !info.scheduleVerified) return false;
  if (!Array.isArray(info.verifiedDays) || info.verifiedDays.length === 0) return false;
  return hasVerifiedClaimSource(info.scheduleSources, 'interior_regular_schedule');
}

export function isExteriorGroundsPolicyVerified(schedule: OperatingSchedule): boolean {
  const info = schedule?.exteriorGroundsAccess;
  if (!info || !info.policyVerified) return false;
  if (!info.policyStatus || info.policyStatus === 'Unknown / Unverified') return false;
  return hasVerifiedClaimSource(info.policySources, 'exterior_grounds_access_policy');
}

export function isExteriorGroundsScheduleVerified(schedule: OperatingSchedule): boolean {
  const info = schedule?.exteriorGroundsAccess;
  if (!info || !info.scheduleVerified) return false;
  if (!Array.isArray(info.verifiedDays) || info.verifiedDays.length === 0) return false;
  return hasVerifiedClaimSource(info.scheduleSources, 'exterior_grounds_regular_schedule');
}

export function isStreetVisibilityVerified(schedule: OperatingSchedule): boolean {
  const info = schedule?.exteriorStreetVisibility;
  if (!info || !info.isVerified) return false;
  if (!info.status || info.status === 'Unknown / Unverified') return false;
  return hasVerifiedClaimSource(info.sources, 'exterior_street_visibility');
}

export function isTemporaryClosureVerified(entry: TemporaryClosureEntry | null | undefined): boolean {
  if (!entry || entry.isVerified !== true) return false;
  if (!isValidIsoDateString(entry.startDate) || !isValidIsoDateString(entry.endDate)) return false;
  if (entry.endDate < entry.startDate) return false;

  if (entry.startTime !== undefined && entry.startTime !== '') {
    const startMin = parseTimeStringToMinutes(entry.startTime, { allow2400: false });
    if (startMin === null) return false;
  }
  if (entry.endTime !== undefined && entry.endTime !== '') {
    const endMin = parseTimeStringToMinutes(entry.endTime, { allow2400: true });
    if (endMin === null) return false;
    const effectiveStartMin =
      entry.startTime !== undefined && entry.startTime !== ''
        ? parseTimeStringToMinutes(entry.startTime, { allow2400: false }) ?? 0
        : 0;
    // Reject zero-length [00:00, 00:00) closure interval
    if (effectiveStartMin === 0 && endMin === 0) return false;
  }

  return hasVerifiedClaimSource(entry.sources, 'temporary_closure');
}

export function isSpecialScheduleVerified(entry: SpecialScheduleEntry | null | undefined): boolean {
  if (!entry || entry.isVerified !== true) return false;
  const hasExactDate = Boolean(entry.date && isValidIsoDateString(entry.date));
  const hasDateRange = Boolean(
    entry.startDate &&
      entry.endDate &&
      isValidIsoDateString(entry.startDate) &&
      isValidIsoDateString(entry.endDate) &&
      entry.endDate >= entry.startDate
  );
  if (!hasExactDate && !hasDateRange) return false;
  return hasVerifiedClaimSource(entry.sources, 'special_schedule');
}

export function isSubFacilityPolicyVerified(subFacility: SubFacilitySchedule | null | undefined): boolean {
  if (!subFacility || subFacility.visitorAccessStatusVerified !== true) return false;
  if (!subFacility.visitorAccessStatus || subFacility.visitorAccessStatus === 'Unknown / Unverified') {
    return false;
  }
  return hasVerifiedClaimSource(subFacility.policySources, 'sub_facility_access_policy');
}

export function isSubFacilityScheduleVerified(subFacility: SubFacilitySchedule | null | undefined): boolean {
  if (!subFacility || subFacility.isVerified !== true) return false;
  if (!Array.isArray(subFacility.verifiedDays) || subFacility.verifiedDays.length === 0) return false;
  return hasVerifiedClaimSource(subFacility.scheduleSources, 'sub_facility_regular_schedule');
}

export function isScopeOpenAccessPolicyAuthorized(
  schedule: OperatingSchedule,
  targetScope: EvaluatorTargetScope
): boolean {
  if (targetScope === 'interior') {
    if (!isInteriorPolicyVerified(schedule)) return false;
    return (
      schedule.interiorAccess.policyStatus === 'Publicly Accessible Interior' ||
      schedule.interiorAccess.policyStatus === 'Guided / Ticketed Interior'
    );
  }
  if (!isExteriorGroundsPolicyVerified(schedule)) return false;
  return (
    schedule.exteriorGroundsAccess.policyStatus === 'Publicly Accessible Grounds' ||
    schedule.exteriorGroundsAccess.policyStatus === 'Accessible Within Gate Hours' ||
    schedule.exteriorGroundsAccess.policyStatus === 'Ticketed / Guided Grounds'
  );
}

export function isSubFacilityOpenAccessPolicyAuthorized(
  subFacility: SubFacilitySchedule
): boolean {
  if (!isSubFacilityPolicyVerified(subFacility)) return false;
  return (
    subFacility.visitorAccessStatus === 'Publicly Accessible' ||
    subFacility.visitorAccessStatus === 'Guided / Ticketed Entry'
  );
}

/**
 * GATE 1 for Sub-Facility Override Security:
 * A verified operating schedule alone NEVER authorizes overriding a parent access restriction.
 * Overriding an overridable parent restriction strictly requires `allowParentPolicyOverride === true`
 * AND a verified sub-facility access policy (`isSubFacilityPolicyVerified(subFacility) === true`).
 */
export function canSubFacilityOverrideParentPolicy(
  subFacility: SubFacilitySchedule
): boolean {
  if (subFacility.allowParentPolicyOverride !== true) return false;
  if (!isSubFacilityPolicyVerified(subFacility)) return false;
  const allowedOverridePolicies: VisitorAccessStatus[] = [
    'Publicly Accessible',
    'Guided / Ticketed Entry',
    'By Appointment Only',
  ];
  return allowedOverridePolicies.includes(subFacility.visitorAccessStatus);
}

// ============================================================================
// RULE 2 — TEMPORARY CLOSURE BOUNDARY SEMANTICS
// ============================================================================

export function isWithinTemporaryClosure(
  entry: TemporaryClosureEntry,
  manila: Pick<ManilaDateParts, 'dateStr' | 'currentMinutes'>
): boolean {
  if (!isTemporaryClosureVerified(entry)) return false;

  const { dateStr: todayDate, currentMinutes } = manila;
  const hasStartTime = Boolean(entry.startTime && entry.startTime.trim());
  const hasEndTime = Boolean(entry.endTime && entry.endTime.trim());

  const startMin = hasStartTime
    ? parseTimeStringToMinutes(entry.startTime!, { allow2400: false }) ?? 0
    : 0;
  const endMin = hasEndTime
    ? parseTimeStringToMinutes(entry.endTime!, { allow2400: true }) ?? 1440
    : 1440;

  // 1. Single-Day Closure (startDate === endDate)
  if (entry.startDate === entry.endDate) {
    if (!hasStartTime && !hasEndTime) {
      return todayDate === entry.startDate;
    }
    if (hasStartTime && !hasEndTime) {
      // Defaults endTime to "24:00" on startDate (zero spill into next day)
      return todayDate === entry.startDate && currentMinutes >= startMin && currentMinutes < 1440;
    }
    if (!hasStartTime && hasEndTime) {
      // Defaults startTime to "00:00" on startDate (zero spill into next day)
      return todayDate === entry.startDate && currentMinutes >= 0 && currentMinutes < endMin;
    }
    // Both startTime and endTime provided on single-day closure
    if (endMin > startMin) {
      return todayDate === entry.startDate && currentMinutes >= startMin && currentMinutes < endMin;
    }
    if (endMin === 0) {
      // e.g. 22:00 to 00:00 -> active [22:00, 24:00) on startDate, zero spill into next day
      return todayDate === entry.startDate && currentMinutes >= startMin && currentMinutes < 1440;
    }
    // Overnight window starting on single startDate (0 < endMin <= startMin, e.g., 22:00 to 04:00)
    const nextDate = addManilaDays(entry.startDate, 1);
    return (
      (todayDate === entry.startDate && currentMinutes >= startMin) ||
      (todayDate === nextDate && currentMinutes < endMin)
    );
  }

  // 2. Multi-Day Closure (startDate < endDate)
  if (entry.multiDayTimeMode === 'daily_window') {
    if (endMin > startMin || endMin === 0) {
      const effectiveEnd = endMin === 0 ? 1440 : endMin;
      return (
        todayDate >= entry.startDate &&
        todayDate <= entry.endDate &&
        currentMinutes >= startMin &&
        currentMinutes < effectiveEnd
      );
    }
    // Daily overnight window (0 < endMin <= startMin):
    // Window started on each date D in [startDate, endDate] spills into D+1 during [0, endMin)
    const yesterdayDate = addManilaDays(todayDate, -1);
    return (
      (todayDate >= entry.startDate && todayDate <= entry.endDate && currentMinutes >= startMin) ||
      (yesterdayDate >= entry.startDate && yesterdayDate <= entry.endDate && currentMinutes < endMin)
    );
  }

  // Default: Multi-Day 'continuous' mode (never spills past endDate)
  if (todayDate < entry.startDate || todayDate > entry.endDate) return false;
  if (todayDate === entry.startDate) return currentMinutes >= startMin;
  if (todayDate === entry.endDate) return currentMinutes < endMin;
  return true; // Intermediate full day
}

// ============================================================================
// RULE 4 — DETERMINISTIC 6-TIER SPECIAL SCHEDULE PRECEDENCE COMPARATOR
// ============================================================================

export interface ScopedSpecialScheduleCandidate {
  entry: SpecialScheduleEntry;
  sourceLevel: 'parent_site' | 'sub_facility';
}

export function doesSpecialScheduleMatchDate(
  entry: SpecialScheduleEntry,
  dateStr: string
): boolean {
  if (entry.date && entry.date === dateStr) return true;
  if (
    !entry.date &&
    entry.startDate &&
    entry.endDate &&
    entry.startDate <= dateStr &&
    dateStr <= entry.endDate
  ) {
    return true;
  }
  return false;
}

export function compareSpecialSchedulePrecedence(
  a: ScopedSpecialScheduleCandidate,
  b: ScopedSpecialScheduleCandidate,
  dateStr: string
): number {
  // Tier 1: Mandatory Parent Special Closure (sourceLevel === 'parent_site' && state === 'closed' && enforceOnSubFacilities === true)
  const aMandatoryParentClosure =
    a.sourceLevel === 'parent_site' &&
    a.entry.state === 'closed' &&
    a.entry.enforceOnSubFacilities === true;
  const bMandatoryParentClosure =
    b.sourceLevel === 'parent_site' &&
    b.entry.state === 'closed' &&
    b.entry.enforceOnSubFacilities === true;
  if (aMandatoryParentClosure !== bMandatoryParentClosure) {
    return aMandatoryParentClosure ? -1 : 1;
  }

  // Tier 2: Date Match Specificity (exact-date outranks date-range)
  const aIsExact = Boolean(a.entry.date && a.entry.date === dateStr);
  const bIsExact = Boolean(b.entry.date && b.entry.date === dateStr);
  if (aIsExact !== bIsExact) {
    return aIsExact ? -1 : 1;
  }

  // Tier 3: Ownership Level ('sub_facility' outranks non-mandatory 'parent_site')
  if (a.sourceLevel !== b.sourceLevel) {
    return a.sourceLevel === 'sub_facility' ? -1 : 1;
  }

  // Tier 4: Explicit Numeric Priority ((priority ?? 0) descending)
  const aPriority = Number.isFinite(Number(a.entry.priority)) ? Number(a.entry.priority) : 0;
  const bPriority = Number.isFinite(Number(b.entry.priority)) ? Number(b.entry.priority) : 0;
  if (aPriority !== bPriority) {
    return bPriority - aPriority;
  }

  // Tier 5: Scope Specificity ('interior_only' / 'exterior_grounds_only' outranks 'full_site')
  const aScopeSpecific = a.entry.scope !== 'full_site';
  const bScopeSpecific = b.entry.scope !== 'full_site';
  if (aScopeSpecific !== bScopeSpecific) {
    return aScopeSpecific ? -1 : 1;
  }

  // Tier 6: Narrower Date Span, then Lexicographical ID
  const aSpan = aIsExact
    ? 0
    : daysBetweenIsoDates(a.entry.startDate || dateStr, a.entry.endDate || dateStr);
  const bSpan = bIsExact
    ? 0
    : daysBetweenIsoDates(b.entry.startDate || dateStr, b.entry.endDate || dateStr);
  if (aSpan !== bSpan) {
    return aSpan - bSpan;
  }

  return String(a.entry.id || '').localeCompare(String(b.entry.id || ''));
}

export function selectWinningSpecialSchedule(
  candidates: ScopedSpecialScheduleCandidate[],
  dateStr: string,
  targetScope: EvaluatorTargetScope
): ScopedSpecialScheduleCandidate | null {
  const matching = candidates.filter(
    c =>
      isSpecialScheduleVerified(c.entry) &&
      doesAccessScopeApply(c.entry.scope, targetScope) &&
      doesSpecialScheduleMatchDate(c.entry, dateStr)
  );
  if (matching.length === 0) return null;
  matching.sort((a, b) => compareSpecialSchedulePrecedence(a, b, dateStr));
  return matching[0];
}

// ============================================================================
// PERIOD EVALUATION & RULE 3 — OVERNIGHT CARRY-OVER ALGORITHM
// ============================================================================

interface ActivePeriodMatch {
  period: OperatingTimePeriod;
  remainingMinutes: number;
  closesAtFormatted: string;
}

function findActivePeriodForToday(
  periods: OperatingTimePeriod[],
  currentMinutes: number
): ActivePeriodMatch | null {
  for (const period of periods || []) {
    const openMin = parseTimeStringToMinutes(period.open, { allow2400: false });
    const closeMin = parseTimeStringToMinutes(period.close, { allow2400: true });
    if (openMin === null || closeMin === null) continue;

    // Case A: Standard daytime period (closeMin > openMin)
    if (closeMin > openMin) {
      if (currentMinutes >= openMin && currentMinutes < closeMin) {
        return {
          period,
          remainingMinutes: closeMin - currentMinutes,
          closesAtFormatted: format24HourTo12Hour(period.close),
        };
      }
    } else if (closeMin < openMin) {
      // Case B: Overnight period starting today (active during [openMin, 1440) on todayManila)
      if (currentMinutes >= openMin && currentMinutes < 1440) {
        return {
          period,
          remainingMinutes: 1440 - currentMinutes + closeMin,
          closesAtFormatted: format24HourTo12Hour(period.close),
        };
      }
    }
  }
  return null;
}

function findNextOpeningPeriodToday(
  periods: OperatingTimePeriod[],
  currentMinutes: number
): OperatingTimePeriod | null {
  let best: { period: OperatingTimePeriod; openMin: number } | null = null;
  for (const period of periods || []) {
    const openMin = parseTimeStringToMinutes(period.open, { allow2400: false });
    if (openMin === null || openMin <= currentMinutes) continue;
    if (!best || openMin < best.openMin) {
      best = { period, openMin };
    }
  }
  return best ? best.period : null;
}

function hasFullDayTemporaryClosureOnDate(
  closures: TemporaryClosureEntry[],
  dateStr: string,
  targetScope: EvaluatorTargetScope
): boolean {
  return closures.some(entry => {
    if (!isTemporaryClosureVerified(entry)) return false;
    if (!doesAccessScopeApply(entry.scope, targetScope)) return false;
    const hasStart = Boolean(entry.startTime && entry.startTime.trim());
    const hasEnd = Boolean(entry.endTime && entry.endTime.trim());
    if (!hasStart && !hasEnd) {
      return entry.startDate <= dateStr && dateStr <= entry.endDate;
    }
    return false;
  });
}

function evaluateYesterdayOvernightCarryOver(params: {
  todayDateStr: string;
  currentMinutes: number;
  targetScope: EvaluatorTargetScope;
  specialCandidates: ScopedSpecialScheduleCandidate[];
  temporaryClosures: TemporaryClosureEntry[];
  regularScheduleVerified: boolean;
  verifiedDays: DayOfWeek[];
  regularHours: Record<DayOfWeek, DailyOperatingSchedule>;
}): ActivePeriodMatch | null {
  const {
    todayDateStr,
    currentMinutes,
    targetScope,
    specialCandidates,
    temporaryClosures,
    regularScheduleVerified,
    verifiedDays,
    regularHours,
  } = params;

  const yesterdayDateStr = addManilaDays(todayDateStr, -1);
  const yesterdayDayOfWeek = getDayOfWeekFromDateStr(yesterdayDateStr);

  // Full-day verified temporary closure on yesterday prevented yesterday's overnight shift from starting
  if (hasFullDayTemporaryClosureOnDate(temporaryClosures, yesterdayDateStr, targetScope)) {
    return null;
  }

  // Resolve yesterday's authoritative verified periods (Path A: yesterday verified special schedule; Path B: yesterday verified regular schedule)
  let yesterdayPeriods: OperatingTimePeriod[] = [];
  const yesterdaySpecial = selectWinningSpecialSchedule(
    specialCandidates,
    yesterdayDateStr,
    targetScope
  );

  if (yesterdaySpecial) {
    if (yesterdaySpecial.entry.state !== 'open') {
      return null;
    }
    yesterdayPeriods = yesterdaySpecial.entry.periods || [];
  } else {
    if (!regularScheduleVerified || !verifiedDays.includes(yesterdayDayOfWeek)) {
      return null;
    }
    const yesterdayRegular = regularHours[yesterdayDayOfWeek];
    if (!yesterdayRegular || yesterdayRegular.state !== 'open') {
      return null;
    }
    yesterdayPeriods = yesterdayRegular.periods || [];
  }

  for (const period of yesterdayPeriods) {
    const openMin = parseTimeStringToMinutes(period.open, { allow2400: false });
    const closeMin = parseTimeStringToMinutes(period.close, { allow2400: true });
    if (openMin === null || closeMin === null) continue;
    if (closeMin > 0 && closeMin < openMin && currentMinutes < closeMin) {
      return {
        period,
        remainingMinutes: closeMin - currentMinutes,
        closesAtFormatted: format24HourTo12Hour(period.close),
      };
    }
  }

  return null;
}

// ============================================================================
// RULE 1 — MAIN-SITE SCOPE OPERATING STATUS EVALUATION
// ============================================================================

export function evaluateScopeOperatingStatus(
  schedule: OperatingSchedule,
  targetScope: EvaluatorTargetScope,
  now: Date = new Date(),
  siteContext?: Partial<HeritageSite> | null
): ScopeOperatingEvaluationResult {
  const manila = getManilaDateParts(now);
  const scopeInfo =
    targetScope === 'interior' ? schedule.interiorAccess : schedule.exteriorGroundsAccess;
  const scopePolicyVerified =
    targetScope === 'interior'
      ? isInteriorPolicyVerified(schedule)
      : isExteriorGroundsPolicyVerified(schedule);
  const scopeScheduleVerified =
    targetScope === 'interior'
      ? isInteriorScheduleVerified(schedule)
      : isExteriorGroundsScheduleVerified(schedule);
  const openAccessAuthorized = isScopeOpenAccessPolicyAuthorized(schedule, targetScope);

  const makeResult = (
    partial: Partial<ScopeOperatingEvaluationResult> &
      Pick<ScopeOperatingEvaluationResult, 'calculatedStatus' | 'isOpen' | 'reason'>
  ): ScopeOperatingEvaluationResult => ({
    targetScope,
    calculatedStatus: partial.calculatedStatus,
    isOpen: partial.isOpen,
    isClosingSoon: partial.isClosingSoon ?? false,
    policyVerified: scopePolicyVerified,
    scheduleVerified: scopeScheduleVerified,
    currentPeriod: partial.currentPeriod ?? null,
    closesAt: partial.closesAt ?? null,
    nextTransitionLabel: partial.nextTransitionLabel ?? null,
    activeTemporaryClosure: partial.activeTemporaryClosure ?? null,
    activeSpecialSchedule: partial.activeSpecialSchedule ?? null,
    reason: partial.reason,
  });

  // STEP 1: Physical Demolition / Permanent Closure (Highest Precedence)
  if (
    schedule.physicalPreservationStatus === 'Demolished / Lost' ||
    siteContext?.demolitionStatus === 'Demolished'
  ) {
    return makeResult({
      calculatedStatus: 'Permanently Closed',
      isOpen: false,
      reason: 'This heritage structure is recorded as demolished or permanently lost.',
    });
  }

  const globalPolicyVerified = isGlobalAccessPolicyVerified(schedule);
  if (
    globalPolicyVerified &&
    (schedule.visitorAccessStatus === 'Demolished / Lost' ||
      schedule.visitorAccessStatus === 'Permanently Closed')
  ) {
    return makeResult({
      calculatedStatus: 'Permanently Closed',
      isOpen: false,
      reason: 'This heritage site is permanently closed to visitors.',
    });
  }

  // STEP 2A: Global Restrictive Administrative Access Policy Gate
  if (globalPolicyVerified) {
    if (schedule.visitorAccessStatus === 'Temporarily Closed') {
      return makeResult({
        calculatedStatus: 'Temporarily Closed',
        isOpen: false,
        reason: 'This site is marked as temporarily closed.',
      });
    }
    if (schedule.visitorAccessStatus === 'Private Residence') {
      return makeResult({
        calculatedStatus: 'Private Residence',
        isOpen: false,
        reason: 'This site is a private residence without public visitor entry.',
      });
    }
    if (schedule.visitorAccessStatus === 'By Appointment Only') {
      return makeResult({
        calculatedStatus: 'By Appointment Only',
        isOpen: false,
        reason: 'Visitor access is by prior appointment only.',
      });
    }
    if (targetScope === 'interior') {
      if (schedule.visitorAccessStatus === 'Temporarily Closed Interior') {
        return makeResult({
          calculatedStatus: 'Temporarily Closed',
          isOpen: false,
          reason: 'Building interior is temporarily closed to visitors.',
        });
      }
      if (schedule.visitorAccessStatus === 'Exterior Access Only') {
        return makeResult({
          calculatedStatus: 'Closed',
          isOpen: false,
          reason: 'Interior is not open to public entry (exterior access only).',
        });
      }
    }
    if (targetScope === 'exterior_grounds') {
      if (schedule.visitorAccessStatus === 'Temporarily Closed Grounds') {
        return makeResult({
          calculatedStatus: 'Temporarily Closed',
          isOpen: false,
          reason: 'Exterior grounds are temporarily closed to visitors.',
        });
      }
      if (schedule.visitorAccessStatus === 'Restricted Grounds') {
        return makeResult({
          calculatedStatus: 'Closed',
          isOpen: false,
          reason: 'General public walk-in access to the exterior grounds is restricted.',
        });
      }
    }
  }

  // STEP 2B: Scope-Specific Restrictive Administrative Policy Gate
  if (targetScope === 'interior' && scopePolicyVerified) {
    const status = schedule.interiorAccess.policyStatus;
    if (status === 'Temporarily Closed Interior') {
      return makeResult({
        calculatedStatus: 'Temporarily Closed',
        isOpen: false,
        reason: 'Interior is temporarily closed to visitors.',
      });
    }
    if (
      status === 'No Public Interior Access' ||
      status === 'Not Applicable (Open-Air / Exterior Landmark)'
    ) {
      return makeResult({
        calculatedStatus: 'Closed',
        isOpen: false,
        reason: 'No public interior access is available for this site.',
      });
    }
    if (status === 'By Appointment Only') {
      return makeResult({
        calculatedStatus: 'By Appointment Only',
        isOpen: false,
        reason: 'Interior access is by prior appointment only.',
      });
    }
  }

  if (targetScope === 'exterior_grounds' && scopePolicyVerified) {
    const status = schedule.exteriorGroundsAccess.policyStatus;
    if (status === 'Temporarily Closed Grounds') {
      return makeResult({
        calculatedStatus: 'Temporarily Closed',
        isOpen: false,
        reason: 'Exterior grounds are temporarily closed to visitors.',
      });
    }
    if (status === 'Private Property Grounds') {
      return makeResult({
        calculatedStatus: 'Private Residence',
        isOpen: false,
        reason: 'Exterior grounds are private property without public walk-in access.',
      });
    }
    if (status === 'Restricted / Gated Compound') {
      return makeResult({
        calculatedStatus: 'Closed',
        isOpen: false,
        reason: 'General public walk-in access to the compound grounds is restricted.',
      });
    }
  }

  // STEP 3: Active Verified Temporary Closures Matching targetScope (Ahead of Schedule Verification Gate)
  const activeClosure = (schedule.temporaryClosures || []).find(
    entry =>
      doesAccessScopeApply(entry.scope, targetScope) &&
      isWithinTemporaryClosure(entry, manila)
  );
  if (activeClosure) {
    return makeResult({
      calculatedStatus: 'Temporarily Closed',
      isOpen: false,
      activeTemporaryClosure: activeClosure,
      reason: activeClosure.reason
        ? `Temporarily closed: ${activeClosure.reason}`
        : 'Temporarily closed during this date/time window.',
    });
  }

  const specialCandidates: ScopedSpecialScheduleCandidate[] = (
    schedule.specialSchedules || []
  ).map(entry => ({ entry, sourceLevel: 'parent_site' as const }));

  // STEP 4: Today's Applicable Verified Special Schedules Matching targetScope
  const winningSpecial = selectWinningSpecialSchedule(
    specialCandidates,
    manila.dateStr,
    targetScope
  );

  if (winningSpecial) {
    const sToday = winningSpecial.entry;

    // 4.1 Winning verified 'closed' special schedule ALWAYS prevents yesterday's overnight carry-over
    if (sToday.state === 'closed') {
      return makeResult({
        calculatedStatus: 'Closed',
        isOpen: false,
        activeSpecialSchedule: sToday,
        reason: `Closed today for ${sToday.label}.`,
      });
    }

    if (sToday.state === 'by_appointment') {
      return makeResult({
        calculatedStatus: 'By Appointment Only',
        isOpen: false,
        activeSpecialSchedule: sToday,
        reason: `By appointment only today (${sToday.label}).`,
      });
    }

    if (sToday.state === 'open_24_hours') {
      if (!openAccessAuthorized) {
        return makeResult({
          calculatedStatus: 'Hours Unverified',
          isOpen: null,
          activeSpecialSchedule: sToday,
          reason: `Special 24-hour schedule (${sToday.label}) is verified, but visitor entry policy is unverified.`,
        });
      }
      return makeResult({
        calculatedStatus: 'Open 24 Hours',
        isOpen: true,
        activeSpecialSchedule: sToday,
        reason: `Open 24 hours today (${sToday.label}).`,
      });
    }

    if (sToday.state === 'open') {
      const activeSpecialPeriod = findActivePeriodForToday(
        sToday.periods,
        manila.currentMinutes
      );
      if (activeSpecialPeriod) {
        if (!openAccessAuthorized) {
          return makeResult({
            calculatedStatus: 'Hours Unverified',
            isOpen: null,
            currentPeriod: activeSpecialPeriod.period,
            activeSpecialSchedule: sToday,
            reason: `Special schedule (${sToday.label}) is verified, but visitor entry policy is unverified.`,
          });
        }
        const isClosingSoon =
          activeSpecialPeriod.remainingMinutes > 0 &&
          activeSpecialPeriod.remainingMinutes <= CLOSING_SOON_THRESHOLD_MINUTES;
        return makeResult({
          calculatedStatus: isClosingSoon ? 'Closing Soon' : 'Open Now',
          isOpen: true,
          isClosingSoon,
          currentPeriod: activeSpecialPeriod.period,
          closesAt: activeSpecialPeriod.closesAtFormatted,
          nextTransitionLabel: `Closes at ${activeSpecialPeriod.closesAtFormatted}`,
          activeSpecialSchedule: sToday,
          reason: `Open today for ${sToday.label} until ${activeSpecialPeriod.closesAtFormatted}.`,
        });
      }

      // Outside sToday.periods: check if sToday allows yesterday's overnight carry-over
      if (sToday.allowYesterdayOvernightCarryOver === true) {
        const carryOver = evaluateYesterdayOvernightCarryOver({
          todayDateStr: manila.dateStr,
          currentMinutes: manila.currentMinutes,
          targetScope,
          specialCandidates,
          temporaryClosures: schedule.temporaryClosures || [],
          regularScheduleVerified: scopeScheduleVerified,
          verifiedDays: scopeInfo.verifiedDays || [],
          regularHours: scopeInfo.regularHours,
        });
        if (carryOver) {
          if (!openAccessAuthorized) {
            return makeResult({
              calculatedStatus: 'Hours Unverified',
              isOpen: null,
              currentPeriod: carryOver.period,
              activeSpecialSchedule: sToday,
              reason: 'Overnight operating hours are verified, but visitor entry policy is unverified.',
            });
          }
          const isClosingSoon =
            carryOver.remainingMinutes > 0 &&
            carryOver.remainingMinutes <= CLOSING_SOON_THRESHOLD_MINUTES;
          return makeResult({
            calculatedStatus: isClosingSoon ? 'Closing Soon' : 'Open Now',
            isOpen: true,
            isClosingSoon,
            currentPeriod: carryOver.period,
            closesAt: carryOver.closesAtFormatted,
            nextTransitionLabel: `Closes at ${carryOver.closesAtFormatted}`,
            activeSpecialSchedule: sToday,
            reason: `Open via overnight schedule until ${carryOver.closesAtFormatted}.`,
          });
        }
      }

      // Outside special opening periods and not in overnight carry-over:
      const isTodayRegularVerified =
        scopeScheduleVerified &&
        Array.isArray(scopeInfo.verifiedDays) &&
        scopeInfo.verifiedDays.includes(manila.dayOfWeek) &&
        scopeInfo.regularHours?.[manila.dayOfWeek]?.state !== 'not_specified';

      if (isTodayRegularVerified) {
        const nextPeriod = findNextOpeningPeriodToday(sToday.periods, manila.currentMinutes);
        return makeResult({
          calculatedStatus: 'Closed',
          isOpen: false,
          activeSpecialSchedule: sToday,
          nextTransitionLabel: nextPeriod
            ? `Opens today at ${format24HourTo12Hour(nextPeriod.open)}`
            : null,
          reason: `Currently outside special operating hours (${sToday.label}).`,
        });
      }
      // Regular hours are unverified -> fall through to Step 6 ('Hours Unverified', isOpen: null)
    }
  }

  // STEP 5: Yesterday's Overnight Carry-Over into Early Morning of Today (when no special schedule overrode today)
  if (!winningSpecial) {
    const carryOver = evaluateYesterdayOvernightCarryOver({
      todayDateStr: manila.dateStr,
      currentMinutes: manila.currentMinutes,
      targetScope,
      specialCandidates,
      temporaryClosures: schedule.temporaryClosures || [],
      regularScheduleVerified: scopeScheduleVerified,
      verifiedDays: scopeInfo.verifiedDays || [],
      regularHours: scopeInfo.regularHours,
    });
    if (carryOver) {
      if (!openAccessAuthorized) {
        return makeResult({
          calculatedStatus: 'Hours Unverified',
          isOpen: null,
          currentPeriod: carryOver.period,
          reason: 'Overnight operating hours are verified, but visitor entry policy is unverified.',
        });
      }
      const isClosingSoon =
        carryOver.remainingMinutes > 0 &&
        carryOver.remainingMinutes <= CLOSING_SOON_THRESHOLD_MINUTES;
      return makeResult({
        calculatedStatus: isClosingSoon ? 'Closing Soon' : 'Open Now',
        isOpen: true,
        isClosingSoon,
        currentPeriod: carryOver.period,
        closesAt: carryOver.closesAtFormatted,
        nextTransitionLabel: `Closes at ${carryOver.closesAtFormatted}`,
        reason: `Open via overnight schedule until ${carryOver.closesAtFormatted}.`,
      });
    }
  }

  // STEP 6: Scope-Specific Regular-Schedule Verification Gate (Strict Non-Reuse Across Scopes)
  if (!scopeScheduleVerified) {
    const isDiscrepancy =
      targetScope === schedule.primaryVisitorScope &&
      schedule.verification?.verificationStatusLabel ===
        'Requires Clarification (Official Source Discrepancy)';
    return makeResult({
      calculatedStatus: isDiscrepancy ? 'Requires Confirmation' : 'Hours Unverified',
      isOpen: null,
      reason: isDiscrepancy
        ? schedule.verification.verificationNotes ||
          'Official source lists conflicting schedules requiring direct confirmation.'
        : 'Operating hours for this scope are currently unverified.',
    });
  }

  if (
    !Array.isArray(scopeInfo.verifiedDays) ||
    !scopeInfo.verifiedDays.includes(manila.dayOfWeek)
  ) {
    return makeResult({
      calculatedStatus: 'Hours Unverified',
      isOpen: null,
      reason: `Operating status on ${manila.dayOfWeek} is not specified by the verified source.`,
    });
  }

  const todaySchedule = scopeInfo.regularHours?.[manila.dayOfWeek];
  if (!todaySchedule || todaySchedule.state === 'not_specified') {
    return makeResult({
      calculatedStatus: 'Hours Unverified',
      isOpen: null,
      reason: `Operating hours for ${manila.dayOfWeek} are not specified by the official source.`,
    });
  }

  // STEP 7: Today's Verified Scope-Specific Regular Daily Schedule Evaluation
  if (todaySchedule.state === 'closed') {
    return makeResult({
      calculatedStatus: 'Closed',
      isOpen: false,
      reason: `Regularly closed on ${manila.dayOfWeek}.`,
    });
  }

  if (todaySchedule.state === 'by_appointment') {
    return makeResult({
      calculatedStatus: 'By Appointment Only',
      isOpen: false,
      reason: `Open by prior appointment only on ${manila.dayOfWeek}.`,
    });
  }

  if (todaySchedule.state === 'open_24_hours') {
    if (!openAccessAuthorized) {
      return makeResult({
        calculatedStatus: 'Hours Unverified',
        isOpen: null,
        reason: '24-hour operating schedule is verified, but visitor entry policy is currently unverified.',
      });
    }
    return makeResult({
      calculatedStatus: 'Open 24 Hours',
      isOpen: true,
      reason: 'Open 24 hours today.',
    });
  }

  // todaySchedule.state === 'open'
  const activePeriod = findActivePeriodForToday(todaySchedule.periods, manila.currentMinutes);
  if (activePeriod) {
    if (!openAccessAuthorized) {
      return makeResult({
        calculatedStatus: 'Hours Unverified',
        isOpen: null,
        currentPeriod: activePeriod.period,
        reason: 'Operating hours are verified, but visitor entry policy is currently unverified.',
      });
    }
    const isClosingSoon =
      activePeriod.remainingMinutes > 0 &&
      activePeriod.remainingMinutes <= CLOSING_SOON_THRESHOLD_MINUTES;
    return makeResult({
      calculatedStatus: isClosingSoon ? 'Closing Soon' : 'Open Now',
      isOpen: true,
      isClosingSoon,
      currentPeriod: activePeriod.period,
      closesAt: activePeriod.closesAtFormatted,
      nextTransitionLabel: `Closes at ${activePeriod.closesAtFormatted}`,
      reason: isClosingSoon
        ? `Closing soon at ${activePeriod.closesAtFormatted}.`
        : `Open today until ${activePeriod.closesAtFormatted}.`,
    });
  }

  const nextOpeningToday = findNextOpeningPeriodToday(todaySchedule.periods, manila.currentMinutes);
  return makeResult({
    calculatedStatus: 'Closed',
    isOpen: false,
    nextTransitionLabel: nextOpeningToday
      ? `Opens today at ${format24HourTo12Hour(nextOpeningToday.open)}`
      : null,
    reason: nextOpeningToday
      ? `Currently closed; reopens today at ${format24HourTo12Hour(nextOpeningToday.open)}.`
      : `Currently closed (outside today's verified operating hours).`,
  });
}

// ============================================================================
// RULE 5 — SUB-FACILITY OPERATING STATUS EVALUATION & TWO-GATE SECURITY
// ============================================================================

export function evaluateSubFacilityOperatingStatus(
  site: Partial<HeritageSite> | null | undefined,
  subFacility: SubFacilitySchedule,
  now: Date = new Date()
): SubFacilityEvaluationResult {
  const parent = normalizeOperatingSchedule(site?.operatingSchedule, site);
  const manila = getManilaDateParts(now);
  const targetScope = subFacility.targetScope;
  const subPolicyVerified = isSubFacilityPolicyVerified(subFacility);
  const subScheduleVerified = isSubFacilityScheduleVerified(subFacility);
  const subOpenAccessAuthorized = isSubFacilityOpenAccessPolicyAuthorized(subFacility);

  const makeSubResult = (
    partial: Partial<SubFacilityEvaluationResult> &
      Pick<SubFacilityEvaluationResult, 'calculatedStatus' | 'isOpen' | 'reason'>
  ): SubFacilityEvaluationResult => ({
    subFacilityId: subFacility.id,
    subFacilityName: subFacility.name,
    targetScope,
    calculatedStatus: partial.calculatedStatus,
    isOpen: partial.isOpen,
    isClosingSoon: partial.isClosingSoon ?? false,
    policyVerified: subPolicyVerified,
    scheduleVerified: subScheduleVerified,
    currentPeriod: partial.currentPeriod ?? null,
    closesAt: partial.closesAt ?? null,
    nextTransitionLabel: partial.nextTransitionLabel ?? null,
    activeTemporaryClosure: partial.activeTemporaryClosure ?? null,
    activeSpecialSchedule: partial.activeSpecialSchedule ?? null,
    reason: partial.reason,
  });

  // STEP 1: Unconditional Non-Overridable Parent & Sub-Facility Permanent Closures
  if (
    parent.physicalPreservationStatus === 'Demolished / Lost' ||
    site?.demolitionStatus === 'Demolished'
  ) {
    return makeSubResult({
      calculatedStatus: 'Permanently Closed',
      isOpen: false,
      reason: 'Parent heritage site is demolished or permanently lost.',
    });
  }

  const parentGlobalVerified = isGlobalAccessPolicyVerified(parent);
  if (
    parentGlobalVerified &&
    (parent.visitorAccessStatus === 'Demolished / Lost' ||
      parent.visitorAccessStatus === 'Permanently Closed')
  ) {
    return makeSubResult({
      calculatedStatus: 'Permanently Closed',
      isOpen: false,
      reason: 'Parent heritage site is permanently closed.',
    });
  }

  if (
    subPolicyVerified &&
    (subFacility.visitorAccessStatus === 'Demolished / Lost' ||
      subFacility.visitorAccessStatus === 'Permanently Closed')
  ) {
    return makeSubResult({
      calculatedStatus: 'Permanently Closed',
      isOpen: false,
      reason: `${subFacility.name} is permanently closed.`,
    });
  }

  // STEP 2A: Unconditional Non-Overridable Parent & Sub-Facility Administrative Temporary Closures
  if (parentGlobalVerified && parent.visitorAccessStatus === 'Temporarily Closed') {
    return makeSubResult({
      calculatedStatus: 'Temporarily Closed',
      isOpen: false,
      reason: 'Parent heritage site is temporarily closed.',
    });
  }

  if (
    targetScope === 'interior' &&
    ((parentGlobalVerified && parent.visitorAccessStatus === 'Temporarily Closed Interior') ||
      (isInteriorPolicyVerified(parent) &&
        parent.interiorAccess.policyStatus === 'Temporarily Closed Interior'))
  ) {
    return makeSubResult({
      calculatedStatus: 'Temporarily Closed',
      isOpen: false,
      reason: 'Parent site interior is temporarily closed.',
    });
  }

  if (
    targetScope === 'exterior_grounds' &&
    ((parentGlobalVerified && parent.visitorAccessStatus === 'Temporarily Closed Grounds') ||
      (isExteriorGroundsPolicyVerified(parent) &&
        parent.exteriorGroundsAccess.policyStatus === 'Temporarily Closed Grounds'))
  ) {
    return makeSubResult({
      calculatedStatus: 'Temporarily Closed',
      isOpen: false,
      reason: 'Parent site exterior grounds are temporarily closed.',
    });
  }

  if (
    subPolicyVerified &&
    (subFacility.visitorAccessStatus === 'Temporarily Closed' ||
      (targetScope === 'interior' &&
        subFacility.visitorAccessStatus === 'Temporarily Closed Interior') ||
      (targetScope === 'exterior_grounds' &&
        subFacility.visitorAccessStatus === 'Temporarily Closed Grounds'))
  ) {
    return makeSubResult({
      calculatedStatus: 'Temporarily Closed',
      isOpen: false,
      reason: `${subFacility.name} is temporarily closed.`,
    });
  }

  // STEP 2B: Overridable Parent Administrative Restrictions & Two-Gate Override Security
  const canOverrideParent = canSubFacilityOverrideParentPolicy(subFacility);

  if (!canOverrideParent) {
    if (parentGlobalVerified && parent.visitorAccessStatus === 'Private Residence') {
      return makeSubResult({
        calculatedStatus: 'Private Residence',
        isOpen: false,
        reason: 'Parent site is a private residence without an authorized sub-facility policy override.',
      });
    }
    if (parentGlobalVerified && parent.visitorAccessStatus === 'By Appointment Only') {
      return makeSubResult({
        calculatedStatus: 'By Appointment Only',
        isOpen: false,
        reason: 'Parent site is by appointment only.',
      });
    }
    if (targetScope === 'interior') {
      if (
        (parentGlobalVerified && parent.visitorAccessStatus === 'Exterior Access Only') ||
        (isInteriorPolicyVerified(parent) &&
          (parent.interiorAccess.policyStatus === 'No Public Interior Access' ||
            parent.interiorAccess.policyStatus ===
              'Not Applicable (Open-Air / Exterior Landmark)'))
      ) {
        return makeSubResult({
          calculatedStatus: 'Closed',
          isOpen: false,
          reason: 'Parent site restricts public interior access.',
        });
      }
      if (
        isInteriorPolicyVerified(parent) &&
        parent.interiorAccess.policyStatus === 'By Appointment Only'
      ) {
        return makeSubResult({
          calculatedStatus: 'By Appointment Only',
          isOpen: false,
          reason: 'Parent site interior is by appointment only.',
        });
      }
    }
    if (targetScope === 'exterior_grounds') {
      if (
        isExteriorGroundsPolicyVerified(parent) &&
        parent.exteriorGroundsAccess.policyStatus === 'Private Property Grounds'
      ) {
        return makeSubResult({
          calculatedStatus: 'Private Residence',
          isOpen: false,
          reason: 'Parent site exterior grounds are private property.',
        });
      }
      if (
        (parentGlobalVerified && parent.visitorAccessStatus === 'Restricted Grounds') ||
        (isExteriorGroundsPolicyVerified(parent) &&
          parent.exteriorGroundsAccess.policyStatus === 'Restricted / Gated Compound')
      ) {
        return makeSubResult({
          calculatedStatus: 'Closed',
          isOpen: false,
          reason: 'Parent site exterior grounds are restricted.',
        });
      }
    }
  }

  // Evaluate sub-facility's own verified restrictive access policy
  if (subPolicyVerified) {
    if (subFacility.visitorAccessStatus === 'Private Residence') {
      return makeSubResult({
        calculatedStatus: 'Private Residence',
        isOpen: false,
        reason: `${subFacility.name} is a private residence.`,
      });
    }
    if (subFacility.visitorAccessStatus === 'By Appointment Only') {
      return makeSubResult({
        calculatedStatus: 'By Appointment Only',
        isOpen: false,
        reason: `${subFacility.name} is open by appointment only.`,
      });
    }
    if (targetScope === 'interior' && subFacility.visitorAccessStatus === 'Exterior Access Only') {
      return makeSubResult({
        calculatedStatus: 'Closed',
        isOpen: false,
        reason: `${subFacility.name} does not permit interior entry.`,
      });
    }
    if (
      targetScope === 'exterior_grounds' &&
      subFacility.visitorAccessStatus === 'Restricted Grounds'
    ) {
      return makeSubResult({
        calculatedStatus: 'Closed',
        isOpen: false,
        reason: `${subFacility.name} grounds access is restricted.`,
      });
    }
  }

  // STEP 3: Unconditional Non-Overridable Active Date/Time Temporary Closures (Parent + Sub-Facility)
  const combinedClosures: TemporaryClosureEntry[] = [
    ...(parent.temporaryClosures || []),
    ...(subFacility.temporaryClosures || []),
  ];
  const activeClosure = combinedClosures.find(
    entry =>
      doesAccessScopeApply(entry.scope, targetScope) &&
      isWithinTemporaryClosure(entry, manila)
  );
  if (activeClosure) {
    return makeSubResult({
      calculatedStatus: 'Temporarily Closed',
      isOpen: false,
      activeTemporaryClosure: activeClosure,
      reason: activeClosure.reason
        ? `Temporarily closed: ${activeClosure.reason}`
        : `${subFacility.name} is temporarily closed.`,
    });
  }

  // STEP 4: Dedicated Sub-Facility Special-Schedule Evaluation (Parent + Sub-Facility Resolved via Rule 4)
  const combinedSpecialCandidates: ScopedSpecialScheduleCandidate[] = [
    ...(parent.specialSchedules || []).map(entry => ({
      entry,
      sourceLevel: 'parent_site' as const,
    })),
    ...(subFacility.specialSchedules || []).map(entry => ({
      entry,
      sourceLevel: 'sub_facility' as const,
    })),
  ];

  const winningSpecial = selectWinningSpecialSchedule(
    combinedSpecialCandidates,
    manila.dateStr,
    targetScope
  );

  if (winningSpecial) {
    const sSubToday = winningSpecial.entry;

    // 4.1 Winning verified 'closed' special schedule ALWAYS prevents yesterday's overnight carry-over
    if (sSubToday.state === 'closed') {
      return makeSubResult({
        calculatedStatus: 'Closed',
        isOpen: false,
        activeSpecialSchedule: sSubToday,
        reason: `Closed today for ${sSubToday.label}.`,
      });
    }

    if (sSubToday.state === 'by_appointment') {
      return makeSubResult({
        calculatedStatus: 'By Appointment Only',
        isOpen: false,
        activeSpecialSchedule: sSubToday,
        reason: `By appointment only today (${sSubToday.label}).`,
      });
    }

    if (sSubToday.state === 'open_24_hours') {
      if (!subOpenAccessAuthorized) {
        return makeSubResult({
          calculatedStatus: 'Hours Unverified',
          isOpen: null,
          activeSpecialSchedule: sSubToday,
          reason: `Special 24-hour schedule (${sSubToday.label}) is verified, but ${subFacility.name} visitor access policy is unverified.`,
        });
      }
      return makeSubResult({
        calculatedStatus: 'Open 24 Hours',
        isOpen: true,
        activeSpecialSchedule: sSubToday,
        reason: `${subFacility.name} is open 24 hours today (${sSubToday.label}).`,
      });
    }

    if (sSubToday.state === 'open') {
      const activeSpecialPeriod = findActivePeriodForToday(
        sSubToday.periods,
        manila.currentMinutes
      );
      if (activeSpecialPeriod) {
        if (!subOpenAccessAuthorized) {
          return makeSubResult({
            calculatedStatus: 'Hours Unverified',
            isOpen: null,
            currentPeriod: activeSpecialPeriod.period,
            activeSpecialSchedule: sSubToday,
            reason: `Special schedule (${sSubToday.label}) is verified, but ${subFacility.name} visitor access policy is unverified.`,
          });
        }
        const isClosingSoon =
          activeSpecialPeriod.remainingMinutes > 0 &&
          activeSpecialPeriod.remainingMinutes <= CLOSING_SOON_THRESHOLD_MINUTES;
        return makeSubResult({
          calculatedStatus: isClosingSoon ? 'Closing Soon' : 'Open Now',
          isOpen: true,
          isClosingSoon,
          currentPeriod: activeSpecialPeriod.period,
          closesAt: activeSpecialPeriod.closesAtFormatted,
          nextTransitionLabel: `Closes at ${activeSpecialPeriod.closesAtFormatted}`,
          activeSpecialSchedule: sSubToday,
          reason: `${subFacility.name} is open for ${sSubToday.label} until ${activeSpecialPeriod.closesAtFormatted}.`,
        });
      }

      if (sSubToday.allowYesterdayOvernightCarryOver === true) {
        const carryOver = evaluateYesterdayOvernightCarryOver({
          todayDateStr: manila.dateStr,
          currentMinutes: manila.currentMinutes,
          targetScope,
          specialCandidates: combinedSpecialCandidates,
          temporaryClosures: combinedClosures,
          regularScheduleVerified: subScheduleVerified,
          verifiedDays: subFacility.verifiedDays || [],
          regularHours: subFacility.regularHours,
        });
        if (carryOver) {
          if (!subOpenAccessAuthorized) {
            return makeSubResult({
              calculatedStatus: 'Hours Unverified',
              isOpen: null,
              currentPeriod: carryOver.period,
              activeSpecialSchedule: sSubToday,
              reason: `Overnight hours are verified, but ${subFacility.name} visitor access policy is unverified.`,
            });
          }
          const isClosingSoon =
            carryOver.remainingMinutes > 0 &&
            carryOver.remainingMinutes <= CLOSING_SOON_THRESHOLD_MINUTES;
          return makeSubResult({
            calculatedStatus: isClosingSoon ? 'Closing Soon' : 'Open Now',
            isOpen: true,
            isClosingSoon,
            currentPeriod: carryOver.period,
            closesAt: carryOver.closesAtFormatted,
            nextTransitionLabel: `Closes at ${carryOver.closesAtFormatted}`,
            activeSpecialSchedule: sSubToday,
            reason: `${subFacility.name} is open via overnight carry-over until ${carryOver.closesAtFormatted}.`,
          });
        }
      }

      const isSubTodayRegularVerified =
        subScheduleVerified &&
        Array.isArray(subFacility.verifiedDays) &&
        subFacility.verifiedDays.includes(manila.dayOfWeek) &&
        subFacility.regularHours?.[manila.dayOfWeek]?.state !== 'not_specified';

      if (isSubTodayRegularVerified) {
        const nextPeriod = findNextOpeningPeriodToday(sSubToday.periods, manila.currentMinutes);
        return makeSubResult({
          calculatedStatus: 'Closed',
          isOpen: false,
          activeSpecialSchedule: sSubToday,
          nextTransitionLabel: nextPeriod
            ? `Opens today at ${format24HourTo12Hour(nextPeriod.open)}`
            : null,
          reason: `${subFacility.name} is currently outside special operating hours (${sSubToday.label}).`,
        });
      }
      // Fall through to Step 6 ('Hours Unverified', isOpen: null)
    }
  }

  // STEP 5: Sub-Facility Yesterday Overnight Carry-Over (Path B of Gate 2: Separately Verified Yesterday Schedule)
  if (!winningSpecial) {
    const carryOver = evaluateYesterdayOvernightCarryOver({
      todayDateStr: manila.dateStr,
      currentMinutes: manila.currentMinutes,
      targetScope,
      specialCandidates: combinedSpecialCandidates,
      temporaryClosures: combinedClosures,
      regularScheduleVerified: subScheduleVerified,
      verifiedDays: subFacility.verifiedDays || [],
      regularHours: subFacility.regularHours,
    });
    if (carryOver) {
      if (!subOpenAccessAuthorized) {
        return makeSubResult({
          calculatedStatus: 'Hours Unverified',
          isOpen: null,
          currentPeriod: carryOver.period,
          reason: `Overnight hours are verified, but ${subFacility.name} visitor access policy is unverified.`,
        });
      }
      const isClosingSoon =
        carryOver.remainingMinutes > 0 &&
        carryOver.remainingMinutes <= CLOSING_SOON_THRESHOLD_MINUTES;
      return makeSubResult({
        calculatedStatus: isClosingSoon ? 'Closing Soon' : 'Open Now',
        isOpen: true,
        isClosingSoon,
        currentPeriod: carryOver.period,
        closesAt: carryOver.closesAtFormatted,
        nextTransitionLabel: `Closes at ${carryOver.closesAtFormatted}`,
        reason: `${subFacility.name} is open via overnight schedule until ${carryOver.closesAtFormatted}.`,
      });
    }
  }

  // STEP 6: Sub-Facility Regular-Schedule Verification Gate (GATE 2 Path C)
  if (!subScheduleVerified) {
    return makeSubResult({
      calculatedStatus: 'Hours Unverified',
      isOpen: null,
      reason: subFacility.notes || `Operating hours for ${subFacility.name} are currently unverified.`,
    });
  }

  if (
    !Array.isArray(subFacility.verifiedDays) ||
    !subFacility.verifiedDays.includes(manila.dayOfWeek)
  ) {
    return makeSubResult({
      calculatedStatus: 'Hours Unverified',
      isOpen: null,
      reason: `${subFacility.name} operating status on ${manila.dayOfWeek} is not specified by the verified source.`,
    });
  }

  const todaySubSchedule = subFacility.regularHours?.[manila.dayOfWeek];
  if (!todaySubSchedule || todaySubSchedule.state === 'not_specified') {
    return makeSubResult({
      calculatedStatus: 'Hours Unverified',
      isOpen: null,
      reason: `${subFacility.name} operating hours on ${manila.dayOfWeek} are not specified.`,
    });
  }

  // STEP 7: Sub-Facility Regular Daily Schedule Evaluation
  if (todaySubSchedule.state === 'closed') {
    return makeSubResult({
      calculatedStatus: 'Closed',
      isOpen: false,
      reason: `${subFacility.name} is regularly closed on ${manila.dayOfWeek}.`,
    });
  }

  if (todaySubSchedule.state === 'by_appointment') {
    return makeSubResult({
      calculatedStatus: 'By Appointment Only',
      isOpen: false,
      reason: `${subFacility.name} is open by appointment only on ${manila.dayOfWeek}.`,
    });
  }

  if (todaySubSchedule.state === 'open_24_hours') {
    if (!subOpenAccessAuthorized) {
      return makeSubResult({
        calculatedStatus: 'Hours Unverified',
        isOpen: null,
        reason: `${subFacility.name} 24-hour schedule is verified, but visitor access policy is unverified.`,
      });
    }
    return makeSubResult({
      calculatedStatus: 'Open 24 Hours',
      isOpen: true,
      reason: `${subFacility.name} is open 24 hours today.`,
    });
  }

  const activePeriod = findActivePeriodForToday(todaySubSchedule.periods, manila.currentMinutes);
  if (activePeriod) {
    if (!subOpenAccessAuthorized) {
      return makeSubResult({
        calculatedStatus: 'Hours Unverified',
        isOpen: null,
        currentPeriod: activePeriod.period,
        reason: `${subFacility.name} operating hours are verified, but visitor access policy is unverified.`,
      });
    }
    const isClosingSoon =
      activePeriod.remainingMinutes > 0 &&
      activePeriod.remainingMinutes <= CLOSING_SOON_THRESHOLD_MINUTES;
    return makeSubResult({
      calculatedStatus: isClosingSoon ? 'Closing Soon' : 'Open Now',
      isOpen: true,
      isClosingSoon,
      currentPeriod: activePeriod.period,
      closesAt: activePeriod.closesAtFormatted,
      nextTransitionLabel: `Closes at ${activePeriod.closesAtFormatted}`,
      reason: isClosingSoon
        ? `${subFacility.name} is closing soon at ${activePeriod.closesAtFormatted}.`
        : `${subFacility.name} is open until ${activePeriod.closesAtFormatted}.`,
    });
  }

  const nextOpeningToday = findNextOpeningPeriodToday(
    todaySubSchedule.periods,
    manila.currentMinutes
  );
  return makeSubResult({
    calculatedStatus: 'Closed',
    isOpen: false,
    nextTransitionLabel: nextOpeningToday
      ? `Opens today at ${format24HourTo12Hour(nextOpeningToday.open)}`
      : null,
    reason: nextOpeningToday
      ? `${subFacility.name} is currently closed; reopens today at ${format24HourTo12Hour(nextOpeningToday.open)}.`
      : `${subFacility.name} is currently closed.`,
  });
}

// ============================================================================
// RULE 6 — OVERALL HERITAGE SITE EVALUATION
// ============================================================================

export function evaluateSiteOperatingStatus(
  site: Partial<HeritageSite> | null | undefined,
  now: Date = new Date()
): SiteOperatingEvaluationResult {
  const manila = getManilaDateParts(now);

  if (!site || site.isActive === false || site.status === 'Inactive') {
    const emptySchedule = normalizeOperatingSchedule(site?.operatingSchedule, site);
    const closedScopeResult = (scope: EvaluatorTargetScope): ScopeOperatingEvaluationResult => ({
      targetScope: scope,
      calculatedStatus: 'Closed',
      isOpen: false,
      isClosingSoon: false,
      policyVerified: false,
      scheduleVerified: false,
      currentPeriod: null,
      closesAt: null,
      nextTransitionLabel: null,
      activeTemporaryClosure: null,
      activeSpecialSchedule: null,
      reason: 'This site is marked inactive in the directory.',
    });
    return {
      timezone: 'Asia/Manila',
      evaluatedAtIso: now.toISOString(),
      manilaDayOfWeek: manila.dayOfWeek,
      manilaDateString: manila.dateStr,
      manilaTimeString: manila.timeStr,
      calculatedStatus: 'Closed',
      isOpen: false,
      isClosingSoon: false,
      interiorEvaluation: closedScopeResult('interior'),
      exteriorGroundsEvaluation: closedScopeResult('exterior_grounds'),
      exteriorStreetVisibility: emptySchedule.exteriorStreetVisibility,
      subFacilityEvaluations: [],
      scheduleVerified: false,
      policyVerified: false,
      verificationStatusLabel: 'Unverified',
      displaySummary: emptySchedule.displaySummary,
      statusDetailMessage: 'This site is marked inactive in the directory.',
    };
  }

  const schedule = normalizeOperatingSchedule(site.operatingSchedule, site);
  const interiorEvaluation = evaluateScopeOperatingStatus(schedule, 'interior', now, site);
  const exteriorGroundsEvaluation = evaluateScopeOperatingStatus(
    schedule,
    'exterior_grounds',
    now,
    site
  );
  const subFacilityEvaluations = (schedule.subFacilities || []).map(sub =>
    evaluateSubFacilityOperatingStatus(site, sub, now)
  );

  const primaryEval =
    schedule.primaryVisitorScope === 'interior'
      ? interiorEvaluation
      : exteriorGroundsEvaluation;

  let calculatedStatus = primaryEval.calculatedStatus;
  if (
    schedule.primaryVisitorScope === 'interior' &&
    interiorEvaluation.isOpen === false &&
    interiorEvaluation.calculatedStatus !== 'Permanently Closed' &&
    interiorEvaluation.calculatedStatus !== 'Temporarily Closed' &&
    (exteriorGroundsEvaluation.isOpen === true ||
      (isStreetVisibilityVerified(schedule) &&
        schedule.exteriorStreetVisibility.status === 'Viewable from Public Street'))
  ) {
    calculatedStatus = 'Exterior Viewable Now';
  }

  return {
    timezone: 'Asia/Manila',
    evaluatedAtIso: now.toISOString(),
    manilaDayOfWeek: manila.dayOfWeek,
    manilaDateString: manila.dateStr,
    manilaTimeString: manila.timeStr,
    calculatedStatus,
    isOpen: primaryEval.isOpen,
    isClosingSoon: primaryEval.isClosingSoon,
    interiorEvaluation,
    exteriorGroundsEvaluation,
    exteriorStreetVisibility: schedule.exteriorStreetVisibility,
    subFacilityEvaluations,
    scheduleVerified: primaryEval.scheduleVerified,
    policyVerified: primaryEval.policyVerified,
    verificationStatusLabel: schedule.verification.verificationStatusLabel,
    displaySummary: schedule.displaySummary,
    statusDetailMessage: primaryEval.reason,
  };
}

// ============================================================================
// RULE 7 — FULL-INTERVAL VISIT WINDOW EVALUATION
// ============================================================================

export function evaluateVisitWindow(
  site: Partial<HeritageSite> | null | undefined,
  visitStart: Date | string | number,
  visitEnd: Date | string | number,
  options?: VisitWindowEvaluationOptions
): VisitWindowEvaluationResult {
  const startMs = visitStart instanceof Date ? visitStart.getTime() : new Date(visitStart).getTime();
  const endMs = visitEnd instanceof Date ? visitEnd.getTime() : new Date(visitEnd).getTime();

  // Step 1: Validate bounds & enforce 24-hour maximum visit duration
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return {
      status: 'invalid_window',
      isOpenForEntireWindow: false,
      triState: false,
      firstBlockingTimestampIso: null,
      firstBlockingStatus: null,
      firstBlockingReason: null,
      firstUnverifiedTimestampIso: null,
      firstUnverifiedStatus: null,
      firstUnverifiedReason: null,
      reason: 'visitEnd must be a valid timestamp strictly after visitStart.',
    };
  }

  if (endMs - startMs > MAX_VISIT_WINDOW_MS) {
    return {
      status: 'invalid_window',
      isOpenForEntireWindow: false,
      triState: false,
      firstBlockingTimestampIso: null,
      firstBlockingStatus: null,
      firstBlockingReason: null,
      firstUnverifiedTimestampIso: null,
      firstUnverifiedStatus: null,
      firstUnverifiedReason: null,
      reason: 'Requested visit window exceeds the maximum supported duration of 24 hours.',
    };
  }

  if (!site || site.isActive === false || site.status === 'Inactive') {
    const startIso = new Date(startMs).toISOString();
    return {
      status: 'closed_during_window',
      isOpenForEntireWindow: false,
      triState: false,
      firstBlockingTimestampIso: startIso,
      firstBlockingStatus: 'Closed',
      firstBlockingReason: 'This site is marked inactive in the directory.',
      firstUnverifiedTimestampIso: null,
      firstUnverifiedStatus: null,
      firstUnverifiedReason: null,
      reason: 'This site is marked inactive in the directory.',
    };
  }

  const schedule = normalizeOperatingSchedule(site.operatingSchedule, site);
  let targetSubFacility: SubFacilitySchedule | null = null;

  if (options?.subFacilityId) {
    targetSubFacility =
      (schedule.subFacilities || []).find(s => s.id === options.subFacilityId) || null;
    if (!targetSubFacility) {
      return {
        status: 'invalid_window',
        isOpenForEntireWindow: false,
        triState: false,
        firstBlockingTimestampIso: null,
        firstBlockingStatus: null,
        firstBlockingReason: null,
        firstUnverifiedTimestampIso: null,
        firstUnverifiedStatus: null,
        firstUnverifiedReason: null,
        reason: `Unknown sub-facility ID: ${options.subFacilityId}`,
      };
    }
  }

  const targetScope: EvaluatorTargetScope =
    options?.targetScope ?? schedule.primaryVisitorScope;

  // Step 3: Compute covered minute slices across [startMs, endMs)
  const firstMinuteEpoch = Math.floor(startMs / 60_000) * 60_000;
  const lastMinuteEpoch = Math.ceil(endMs / 60_000) * 60_000 - 60_000;

  let firstBlockingTimestampIso: string | null = null;
  let firstBlockingStatus: CalculatedRealtimeStatus | null = null;
  let firstBlockingReason: string | null = null;

  let firstUnverifiedTimestampIso: string | null = null;
  let firstUnverifiedStatus: CalculatedRealtimeStatus | null = null;
  let firstUnverifiedReason: string | null = null;

  // Step 4: Evaluate the entire visit window across all covered minute slices (no early return on unverified slices)
  for (
    let sliceMinuteEpoch = firstMinuteEpoch;
    sliceMinuteEpoch <= lastMinuteEpoch;
    sliceMinuteEpoch += 60_000
  ) {
    const effectiveTimestampMs = Math.max(sliceMinuteEpoch, startMs);
    const checkDate = new Date(effectiveTimestampMs);

    const evalResult = targetSubFacility
      ? evaluateSubFacilityOperatingStatus(site, targetSubFacility, checkDate)
      : evaluateScopeOperatingStatus(schedule, targetScope, checkDate, site);

    if (evalResult.isOpen === false) {
      if (firstBlockingTimestampIso === null) {
        firstBlockingTimestampIso = checkDate.toISOString();
        firstBlockingStatus = evalResult.calculatedStatus;
        firstBlockingReason = evalResult.reason;
      }
    } else if (evalResult.isOpen === null) {
      if (firstUnverifiedTimestampIso === null) {
        firstUnverifiedTimestampIso = checkDate.toISOString();
        firstUnverifiedStatus = evalResult.calculatedStatus;
        firstUnverifiedReason = evalResult.reason;
      }
    }
  }

  // Step 5: Post-Scan Priority Resolution (closed_during_window > unverified_during_window > confirmed_open_entire_window)
  if (firstBlockingTimestampIso !== null) {
    return {
      status: 'closed_during_window',
      isOpenForEntireWindow: false,
      triState: false,
      firstBlockingTimestampIso,
      firstBlockingStatus,
      firstBlockingReason,
      firstUnverifiedTimestampIso,
      firstUnverifiedStatus,
      firstUnverifiedReason,
      reason: firstBlockingReason || 'Site is closed during the requested visit window.',
    };
  }

  if (firstUnverifiedTimestampIso !== null) {
    return {
      status: 'unverified_during_window',
      isOpenForEntireWindow: false,
      triState: null,
      firstBlockingTimestampIso: null,
      firstBlockingStatus: null,
      firstBlockingReason: null,
      firstUnverifiedTimestampIso,
      firstUnverifiedStatus,
      firstUnverifiedReason,
      reason:
        firstUnverifiedReason ||
        'Operating hours or visitor access policy are unverified during the requested visit window.',
    };
  }

  return {
    status: 'confirmed_open_entire_window',
    isOpenForEntireWindow: true,
    triState: true,
    firstBlockingTimestampIso: null,
    firstBlockingStatus: null,
    firstBlockingReason: null,
    firstUnverifiedTimestampIso: null,
    firstUnverifiedStatus: null,
    firstUnverifiedReason: null,
    reason:
      'Confirmed open with verified visitor access and operating hours for the entire requested visit window.',
  };
}

export function isSiteOpenForVisitWindow(
  site: Partial<HeritageSite> | null | undefined,
  visitStart: Date | string | number,
  visitEnd: Date | string | number,
  options?: VisitWindowEvaluationOptions
): boolean {
  return evaluateVisitWindow(site, visitStart, visitEnd, options).isOpenForEntireWindow;
}

// ============================================================================
// BACKWARD-COMPATIBLE WRAPPERS (Backed Strictly by evaluateSiteOperatingStatus)
// ============================================================================

export function getSiteAvailability(site: any, date: Date = new Date()): AvailabilityResult {
  const evaluation = evaluateSiteOperatingStatus(site, date);
  return {
    isOpen: evaluation.isOpen === true,
    triState: evaluation.isOpen,
    calculatedStatus: evaluation.calculatedStatus,
    isClosingSoon: evaluation.isClosingSoon,
    reason: evaluation.statusDetailMessage,
    evaluation,
  };
}

/**
 * Returns true ONLY if the site's primary visitor scope has a verified operating schedule
 * (`scheduleVerified === true` backed by claim-validated sources).
 * Legacy `site.visitingHours` is NEVER inspected or treated as evidence of verified operating hours.
 */
export function hasVerifiedVisitingHours(site: any): boolean {
  if (!site) return false;
  const evaluation = evaluateSiteOperatingStatus(site);
  return evaluation.scheduleVerified;
}

export function isSiteOpenForVisit(site: any, date: Date = new Date()): boolean {
  const evaluation = evaluateSiteOperatingStatus(site, date);
  return evaluation.isOpen === true;
}

/**
 * Returns true if the site has at least one verified sub-facility that is confirmed open (`isOpen === true`)
 * at the given timestamp in Asia/Manila.
 */
export function hasAnyVerifiedOpenSubFacility(site: any, date: Date = new Date()): boolean {
  if (!site) return false;
  const evaluation = evaluateSiteOperatingStatus(site, date);
  return evaluation.subFacilityEvaluations.some(sub => sub.isOpen === true);
}

/**
 * Returns true if a site is active, non-demolished, and NOT confirmed closed (`evaluation.isOpen !== false`,
 * or has at least one verified open sub-facility).
 * Used for general directory browsing and general non-"open-now-only" tour candidate pools so unverified
 * sites (`isOpen === null`) are not falsely treated as closed, while confirmed closed sites (`isOpen === false`)
 * are strictly excluded.
 */
export function isSiteEligibleForDirectoryOrTour(site: any, date: Date = new Date()): boolean {
  if (!site || site.isActive === false || site.status === 'Inactive' || site.demolitionStatus === 'Demolished') {
    return false;
  }
  const evaluation = evaluateSiteOperatingStatus(site, date);
  if (evaluation.isOpen === true) return true;
  if (evaluation.subFacilityEvaluations.some(sub => sub.isOpen === true)) return true;
  return evaluation.isOpen !== false;
}

