const WEEKLY_DAYS = [
  ['Su', 'Sunday'],
  ['Mo', 'Monday'],
  ['Tu', 'Tuesday'],
  ['We', 'Wednesday'],
  ['Th', 'Thursday'],
  ['Fr', 'Friday'],
  ['Sa', 'Saturday'],
] as const;

export const WEEKLY_VISITING_DAYS = WEEKLY_DAYS.map(([abbr, day]) => ({ abbr, day }));

export function getDailyVisitingTime(visitingHours?: string | null) {
  const rawHours = String(visitingHours || '').trim();

  if (!rawHours || /requires verification/i.test(rawHours)) {
    return '9:00 AM - 5:00 PM';
  }

  const dayRangeMatch = rawHours.match(/^(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*(?:to|-)\s*(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*,\s*(.+)$/i);
  if (dayRangeMatch?.[1]) {
    return dayRangeMatch[1].trim();
  }

  const commaParts = rawHours.split(',');
  if (commaParts.length > 1) {
    return commaParts.slice(1).join(',').trim();
  }

  return rawHours;
}

export function formatWeeklyVisitingHours(visitingHours?: string | null) {
  const dailyTime = getDailyVisitingTime(visitingHours);
  return WEEKLY_DAYS
    .map(([abbr, day]) => `${abbr}\n${day}: ${dailyTime}`)
    .join('\n');
}
