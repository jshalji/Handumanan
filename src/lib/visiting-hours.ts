import {
  ALL_DAYS_OF_WEEK,
  normalizeOperatingSchedule,
  type DailyOperatingSchedule,
  type DailyScheduleState,
  type DayOfWeek,
  type EvaluatorTargetScope,
  type HeritageSite,
  type OperatingSchedule,
  type OperatingTimePeriod,
} from '@/lib/heritage-data';
import {
  format24HourTo12Hour,
  isExteriorGroundsScheduleVerified,
  isInteriorScheduleVerified,
} from '@/lib/site-availability';

const WEEKLY_DAYS: Array<[DayOfWeek, string, string]> = [
  ['sunday', 'Su', 'Sunday'],
  ['monday', 'Mo', 'Monday'],
  ['tuesday', 'Tu', 'Tuesday'],
  ['wednesday', 'We', 'Wednesday'],
  ['thursday', 'Th', 'Thursday'],
  ['friday', 'Fr', 'Friday'],
  ['saturday', 'Sa', 'Saturday'],
];

export const WEEKLY_VISITING_DAYS = WEEKLY_DAYS.map(([key, abbr, day]) => ({
  key,
  abbr,
  day,
}));

export function formatOperatingPeriod(period: OperatingTimePeriod): string {
  const openFormatted = format24HourTo12Hour(period.open);
  const closeFormatted = format24HourTo12Hour(period.close);
  const rangeText = `${openFormatted} – ${closeFormatted}`;
  return period.label ? `${rangeText} (${period.label})` : rangeText;
}

export function formatDailyOperatingSchedule(
  daily?: DailyOperatingSchedule | null,
  isDayVerified = false
): string {
  if (!daily || daily.state === 'not_specified') {
    return 'Not specified (Unverified)';
  }
  if (!isDayVerified) {
    return 'Not specified (Unverified)';
  }
  if (daily.state === 'open_24_hours') {
    return 'Open 24 Hours';
  }
  if (daily.state === 'closed') {
    return 'Closed';
  }
  if (daily.state === 'by_appointment') {
    return 'By Appointment Only';
  }
  if (daily.state === 'open') {
    if (!Array.isArray(daily.periods) || daily.periods.length === 0) {
      return 'Not specified (Unverified)';
    }
    return daily.periods.map(formatOperatingPeriod).join(', ');
  }
  return 'Not specified (Unverified)';
}

export interface WeeklyScheduleRow {
  key: DayOfWeek;
  abbr: string;
  day: string;
  formattedHours: string;
  state: DailyScheduleState;
  isVerified: boolean;
  notes?: string;
}

export function getWeeklyScheduleRows(
  siteOrSchedule?: Partial<HeritageSite> | OperatingSchedule | null,
  targetScope?: EvaluatorTargetScope
): WeeklyScheduleRow[] {
  const isScheduleObj =
    siteOrSchedule &&
    typeof siteOrSchedule === 'object' &&
    'timezone' in siteOrSchedule &&
    'primaryVisitorScope' in siteOrSchedule;

  const schedule: OperatingSchedule = isScheduleObj
    ? (siteOrSchedule as OperatingSchedule)
    : normalizeOperatingSchedule(
        (siteOrSchedule as Partial<HeritageSite> | null | undefined)?.operatingSchedule,
        siteOrSchedule as Partial<HeritageSite> | null | undefined
      );

  const scope: EvaluatorTargetScope = targetScope ?? schedule.primaryVisitorScope;
  const scopeInfo =
    scope === 'interior' ? schedule.interiorAccess : schedule.exteriorGroundsAccess;
  const scopeScheduleVerified =
    scope === 'interior'
      ? isInteriorScheduleVerified(schedule)
      : isExteriorGroundsScheduleVerified(schedule);
  const verifiedDaysSet = new Set<DayOfWeek>(
    scopeScheduleVerified && Array.isArray(scopeInfo.verifiedDays)
      ? scopeInfo.verifiedDays
      : []
  );

  return WEEKLY_DAYS.map(([key, abbr, day]) => {
    const daily = scopeInfo.regularHours?.[key];
    const isDayVerified =
      scopeScheduleVerified &&
      verifiedDaysSet.has(key) &&
      Boolean(daily && daily.state !== 'not_specified');

    return {
      key,
      abbr,
      day,
      formattedHours: formatDailyOperatingSchedule(daily, isDayVerified),
      state: daily?.state ?? 'not_specified',
      isVerified: isDayVerified,
      ...(daily?.notes ? { notes: daily.notes } : {}),
    };
  });
}

/**
 * Formats a single day's visiting time without ever fabricating a default '9:00 AM - 5:00 PM' fallback.
 */
export function getDailyVisitingTime(
  siteOrVisitingHours?: Partial<HeritageSite> | OperatingSchedule | string | null,
  dayOfWeek?: DayOfWeek
): string {
  if (!siteOrVisitingHours) {
    return 'Not specified (Unverified)';
  }

  if (typeof siteOrVisitingHours === 'object') {
    const rows = getWeeklyScheduleRows(siteOrVisitingHours);
    if (dayOfWeek) {
      const match = rows.find(r => r.key === dayOfWeek);
      return match ? match.formattedHours : 'Not specified (Unverified)';
    }
    const verifiedRows = rows.filter(r => r.isVerified);
    if (verifiedRows.length === 0) {
      return 'Not specified (Unverified)';
    }
    return verifiedRows[0].formattedHours;
  }

  const rawHours = String(siteOrVisitingHours || '').trim();
  if (!rawHours || /requires verification|unverified|not specified/i.test(rawHours)) {
    return 'Not specified (Unverified)';
  }

  return rawHours;
}

export function formatWeeklyVisitingHours(
  siteOrVisitingHours?: Partial<HeritageSite> | OperatingSchedule | string | null
): string {
  if (siteOrVisitingHours && typeof siteOrVisitingHours === 'object') {
    const rows = getWeeklyScheduleRows(siteOrVisitingHours);
    return rows.map(r => `${r.abbr}\n${r.day}: ${r.formattedHours}`).join('\n');
  }

  const dailyTime = getDailyVisitingTime(siteOrVisitingHours);
  return WEEKLY_DAYS.map(([, abbr, day]) => `${abbr}\n${day}: ${dailyTime}`).join('\n');
}
