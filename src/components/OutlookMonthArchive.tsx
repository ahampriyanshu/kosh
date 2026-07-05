'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import type { ManifestEntry } from '../../lib/schemas';
import { outlookPath } from '../../lib/report-routes';

type OutlookKind = 'weekly' | 'monthly';
type OutlookEntry = ManifestEntry & { type: OutlookKind };

interface OutlookRow {
  key: string;
  meta: string;
  entry: OutlookEntry;
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthId(date: string): string {
  return date.slice(0, 7);
}

function monthLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  if (!year || !monthNumber) return month;
  return `${SHORT_MONTHS[monthNumber - 1]} ${year}`;
}

function isoWeekStart(weekId: string): Date | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekId);
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

function weekOfMonth(date: Date): number {
  const monthStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const firstMonthDayNum = (monthStart.getUTCDay() + 6) % 7;
  return Math.floor((date.getUTCDate() + firstMonthDayNum - 1) / 7) + 1;
}

function archiveEntries(entries: ManifestEntry[]): OutlookEntry[] {
  return entries.filter((entry): entry is OutlookEntry => (
    entry.type === 'weekly' || entry.type === 'monthly'
  ));
}

function entryMonth(entry: OutlookEntry): string {
  if (entry.type === 'monthly' && /^\d{4}-\d{2}$/.test(entry.dateKey)) return entry.dateKey;
  const weekStart = isoWeekStart(entry.dateKey);
  if (weekStart) {
    return `${weekStart.getUTCFullYear()}-${String(weekStart.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  return monthId(entry.date);
}

function entryMeta(entry: OutlookEntry): string {
  if (entry.type === 'monthly') return monthLabel(entryMonth(entry));

  const weekStart = isoWeekStart(entry.dateKey);
  if (!weekStart) return entry.dateKey;
  return `${monthLabel(entryMonth(entry))}, Week ${weekOfMonth(weekStart)}`;
}

function availableMonths(entries: ManifestEntry[]): string[] {
  return Array.from(new Set(archiveEntries(entries).map(entryMonth)))
    .sort((a, b) => b.localeCompare(a));
}

function initialMonth(entries: ManifestEntry[]): string | null {
  return availableMonths(entries)[0] ?? null;
}

function monthFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  const month = new URLSearchParams(window.location.search).get('month');
  return month && /^\d{4}-\d{2}$/.test(month) ? month : null;
}

function monthHref(month: string | null): string {
  return month ? `/outlook?month=${encodeURIComponent(month)}` : '/outlook';
}

function rowsForMonth(entries: ManifestEntry[], month: string): OutlookRow[] {
  return archiveEntries(entries)
    .filter((entry) => entryMonth(entry) === month)
    .map((entry) => ({
      key: entry.id,
      meta: entryMeta(entry),
      entry,
    }))
    .sort((a, b) => {
      const typeOrder = a.entry.type === b.entry.type ? 0 : a.entry.type === 'weekly' ? -1 : 1;
      return b.entry.date.localeCompare(a.entry.date) || typeOrder;
    });
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 text-[var(--color-muted)]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function MonthNav({
  previousMonth,
  nextMonth,
  onMove,
}: {
  previousMonth: string | null;
  nextMonth: string | null;
  onMove: (month: string | null, event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <nav className="mt-auto flex flex-wrap items-center justify-center gap-6 pt-10">
      {previousMonth ? (
        <Link
          href={monthHref(previousMonth)}
          onClick={(event) => onMove(previousMonth, event)}
          className="border-b border-current pb-0.5 text-sm font-semibold text-[var(--color-brand)] hover:text-[var(--color-link-hover)]"
        >
          {monthLabel(previousMonth)}
        </Link>
      ) : null}
      {nextMonth ? (
        <Link
          href={monthHref(nextMonth)}
          onClick={(event) => onMove(nextMonth, event)}
          className="border-b border-current pb-0.5 text-sm font-semibold text-[var(--color-brand)] hover:text-[var(--color-link-hover)]"
        >
          {monthLabel(nextMonth)}
        </Link>
      ) : (
        <span className="text-xs text-[var(--color-faint)]">Latest month</span>
      )}
    </nav>
  );
}

export function OutlookMonthArchive({ entries }: { entries: ManifestEntry[] }) {
  const months = useMemo(() => availableMonths(entries), [entries]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(() => initialMonth(entries));

  useEffect(() => {
    const syncMonth = () => {
      const requested = monthFromLocation();
      setSelectedMonth(requested && months.includes(requested) ? requested : months[0] ?? null);
    };

    syncMonth();
    window.addEventListener('popstate', syncMonth);
    return () => window.removeEventListener('popstate', syncMonth);
  }, [months]);

  const rows = selectedMonth ? rowsForMonth(entries, selectedMonth) : [];
  const currentMonthIndex = selectedMonth ? months.indexOf(selectedMonth) : -1;
  const previousMonth = currentMonthIndex >= 0 ? months[currentMonthIndex + 1] ?? null : null;
  const nextMonth = currentMonthIndex > 0 ? months[currentMonthIndex - 1] ?? null : null;

  function moveToMonth(month: string | null, event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    window.history.pushState({}, '', monthHref(month));
    setSelectedMonth(month);
  }

  if (!selectedMonth || rows.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-[var(--color-hairline)] rounded-xl">
        <p className="font-display text-xl text-[var(--color-faint)]">No outlooks yet.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[52vh] flex-col">
      <section>
        <h2 className="mb-3 font-display text-xl font-bold text-[var(--color-heading)]">{monthLabel(selectedMonth)}</h2>
        <ul className="m-0 list-none p-0">
          {rows.map((row) => (
            <li key={row.key} className="flex flex-wrap items-center gap-3 py-3">
              <span className="font-mono text-sm text-[var(--color-muted)]">{row.meta}</span>
              <ArrowIcon />
              <Link
                href={outlookPath(row.entry)}
                className="text-sm font-semibold text-[var(--color-brand)] hover:text-[var(--color-link-hover)]"
              >
                {row.entry.type === 'weekly' ? 'Weekly Outlook' : 'Monthly Outlook'}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <MonthNav previousMonth={previousMonth} nextMonth={nextMonth} onMove={moveToMonth} />
    </div>
  );
}
