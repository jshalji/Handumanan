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
  mon: 'monday',
  tue: 'tuesday',
  tues: 'tuesday',
  wed: 'wednesday',
  thu: 'thursday',
  thur: 'thursday',
  thurs: 'thursday',
  fri: 'friday',
  sat: 'saturday',
};

type AvailabilityResult = {
  isOpen: boolean;
  reason: string;
};

function getManilaDayAndMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MANILA_TIME_ZONE,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const weekday = (parts.find(part => part.type === 'weekday')?.value || 'Sunday').toLowerCase();
  const hour = Number(parts.find(part => part.type === 'hour')?.value || 0);
  const minute = Number(parts.find(part => part.type === 'minute')?.value || 0);

  return {
    dayIndex: DAY_INDEX[weekday] ?? 0,
    minutes: hour * 60 + minute,
  };
}

function normalizeDayName(value: string) {
  const normalized = value.trim().toLowerCase().replace(/\.$/, '');
  return DAY_ALIASES[normalized] || normalized;
}

function parseTimeToMinutes(value: string) {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'AM' && hour === 12) hour = 0;
  if (meridiem === 'PM' && hour !== 12) hour += 12;

  return hour * 60 + minute;
}

function parseDayRange(hours: string) {
  const dayRangeMatch = hours.match(/\b(mon(?:day)?|tue(?:s|sday|day)?|wed(?:nesday)?|thu(?:r|rs|rsday|rday|day)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\s*(?:-|to)\s*(mon(?:day)?|tue(?:s|sday|day)?|wed(?:nesday)?|thu(?:r|rs|rsday|rday|day)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)/i);
  if (!dayRangeMatch) return null;

  const startDay = DAY_INDEX[normalizeDayName(dayRangeMatch[1])];
  const endDay = DAY_INDEX[normalizeDayName(dayRangeMatch[2])];
  if (startDay === undefined || endDay === undefined) return null;

  return { startDay, endDay };
}

function isDayInRange(currentDay: number, startDay: number, endDay: number) {
  if (startDay <= endDay) {
    return currentDay >= startDay && currentDay <= endDay;
  }

  return currentDay >= startDay || currentDay <= endDay;
}

function parseHoursRange(hours: string) {
  const timeMatch = hours.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*(?:-|to)\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i);
  if (!timeMatch) return null;

  const startMinutes = parseTimeToMinutes(timeMatch[1]);
  const endMinutes = parseTimeToMinutes(timeMatch[2]);
  if (startMinutes === null || endMinutes === null) return null;

  return { startMinutes, endMinutes };
}

function isWithinTimeRange(currentMinutes: number, startMinutes: number, endMinutes: number) {
  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
}

export function getSiteAvailability(site: any, date = new Date()): AvailabilityResult {
  if (!site || site.isActive === false || site.status === 'Inactive') {
    return { isOpen: false, reason: 'This site is marked inactive in the directory.' };
  }

  if (site.demolitionStatus === 'Demolished') {
    return { isOpen: false, reason: 'This site is marked demolished.' };
  }

  const hours = String(site.visitingHours || '').trim();
  const normalizedHours = hours.toLowerCase();

  if (!hours || normalizedHours.includes('requires verification')) {
    return { isOpen: true, reason: 'Hours require verification.' };
  }

  if (
    normalizedHours.includes('closed') ||
    normalizedHours.includes('temporarily unavailable') ||
    normalizedHours.includes('not open')
  ) {
    return { isOpen: false, reason: `This site is currently listed as closed (${hours}).` };
  }

  if (normalizedHours.includes('24 hours') || normalizedHours.includes('open access')) {
    return { isOpen: true, reason: hours };
  }

  if (normalizedHours.includes('daylight')) {
    const { minutes } = getManilaDayAndMinutes(date);
    return {
      isOpen: isWithinTimeRange(minutes, 6 * 60, 18 * 60),
      reason: hours,
    };
  }

  const dayRange = parseDayRange(hours);
  const timeRange = parseHoursRange(hours);
  const { dayIndex, minutes } = getManilaDayAndMinutes(date);

  if (dayRange && !isDayInRange(dayIndex, dayRange.startDay, dayRange.endDay)) {
    return { isOpen: false, reason: `Closed today based on listed hours: ${hours}.` };
  }

  if (timeRange) {
    return {
      isOpen: isWithinTimeRange(minutes, timeRange.startMinutes, timeRange.endMinutes),
      reason: hours,
    };
  }

  return { isOpen: true, reason: hours };
}

export function isSiteOpenForVisit(site: any, date = new Date()) {
  return getSiteAvailability(site, date).isOpen;
}
