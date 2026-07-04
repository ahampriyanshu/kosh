// en-CA formats as YYYY-MM-DD. Asia/Kolkata applies the IST (+5:30) offset.
export function istDateString(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function istParts(now: Date = new Date()): { year: number; month: number; day: number } {
  const [year, month, day] = istDateString(now).split('-').map(Number);
  return { year, month, day };
}

export function isFirstOfMonthIST(now: Date = new Date()): boolean {
  return istParts(now).day === 1;
}

export function istMonthId(now: Date = new Date()): string {
  const { year, month } = istParts(now);
  return `${year}-${String(month).padStart(2, '0')}`;
}

// ISO-8601 week id (e.g. "2026-W24"), computed on the IST calendar date.
export function istWeekId(now: Date = new Date()): string {
  const { year, month, day } = istParts(now);
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // Thursday of this ISO week
  const isoYear = date.getUTCFullYear();
  const jan1 = new Date(Date.UTC(isoYear, 0, 1));
  const week = 1 + Math.round((date.getTime() - jan1.getTime()) / 86400000 / 7);
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function isoWeekStart(weekId: string): Date | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekId);
  if (!match) return null;

  const isoYear = Number(match[1]);
  const week = Number(match[2]);
  if (!Number.isInteger(isoYear) || week < 1 || week > 53) return null;

  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4DayNum = (jan4.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  const weekOneMonday = new Date(jan4);
  weekOneMonday.setUTCDate(jan4.getUTCDate() - jan4DayNum);

  const weekStart = new Date(weekOneMonday);
  weekStart.setUTCDate(weekOneMonday.getUTCDate() + (week - 1) * 7);
  return weekStart;
}

export function formatWeekId(weekId: string): string {
  const weekStart = isoWeekStart(weekId);
  if (!weekStart) return weekId;

  const monthIndex = weekStart.getUTCMonth();
  const monthStart = new Date(Date.UTC(weekStart.getUTCFullYear(), monthIndex, 1));
  const firstMonthDayNum = (monthStart.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  const weekOfMonth = Math.floor((weekStart.getUTCDate() + firstMonthDayNum - 1) / 7) + 1;

  return `${SHORT_MONTHS[monthIndex]} ${weekStart.getUTCFullYear()}, Week ${weekOfMonth}`;
}

export function formatPeriodLabel(value: string): string {
  if (/^\d{4}-W\d{2}$/.test(value)) return formatWeekId(value);
  return value;
}

export function formatPeriodText(value: string): string {
  return value.replace(/\b\d{4}-W\d{2}\b/g, (weekId) => formatWeekId(weekId));
}
