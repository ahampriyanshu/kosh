import type { ManifestEntry } from './schemas';

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(\d{2})$/;
const WEEK_RE = /^(\d{4})-W(\d{2})$/;

function isoWeekStart(weekId: string): Date | null {
  const match = WEEK_RE.exec(weekId);
  if (!match) return null;

  const isoYear = Number(match[1]);
  const week = Number(match[2]);
  if (!Number.isInteger(isoYear) || week < 1 || week > 53) return null;

  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4DayNum = (jan4.getUTCDay() + 6) % 7;
  const weekOneMonday = new Date(jan4);
  weekOneMonday.setUTCDate(jan4.getUTCDate() - jan4DayNum);

  const weekStart = new Date(weekOneMonday);
  weekStart.setUTCDate(weekOneMonday.getUTCDate() + (week - 1) * 7);
  return weekStart;
}

export function dateReportPath(date: string): string {
  const match = DATE_RE.exec(date);
  if (!match) return '/reports';
  return `/reports/${match[1]}/${match[2]}/${match[3]}`;
}

export function outlookPath(entry: ManifestEntry): string {
  if (entry.type === 'monthly') {
    const match = MONTH_RE.exec(entry.dateKey);
    if (!match) return '/outlook';
    return `/outlook/${match[1]}/${match[2]}/month`;
  }

  if (entry.type === 'weekly') {
    const weekStart = isoWeekStart(entry.dateKey);
    if (!weekStart) return '/outlook';

    const year = String(weekStart.getUTCFullYear());
    const month = String(weekStart.getUTCMonth() + 1).padStart(2, '0');
    const monthStart = new Date(Date.UTC(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), 1));
    const firstMonthDayNum = (monthStart.getUTCDay() + 6) % 7;
    const weekOfMonth = Math.floor((weekStart.getUTCDate() + firstMonthDayNum - 1) / 7) + 1;
    return `/outlook/${year}/${month}/week-${weekOfMonth}`;
  }

  return '/outlook';
}

export function entryPath(entry: ManifestEntry): string {
  if (entry.type === 'weekly' || entry.type === 'monthly') return outlookPath(entry);
  if (entry.type === 'research') return `/research/${entry.id}`;
  return dateReportPath(entry.date);
}

export function parseDateReportSlug(slug: string[]): string | null {
  if (slug.length !== 3) return null;
  const [year, month, day] = slug;
  if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month) || !/^\d{2}$/.test(day)) return null;
  return `${year}-${month}-${day}`;
}

export function parseOutlookSlug(slug: string[]): { year: string; month: string; period: string } | null {
  if (slug.length !== 3) return null;
  const [year, month, period] = slug;
  if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month)) return null;
  if (period !== 'month' && !/^week-[1-5]$/.test(period)) return null;
  return { year, month, period };
}
