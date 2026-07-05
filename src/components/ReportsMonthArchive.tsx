'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import type { ManifestEntry } from '../../lib/schemas';
import { dateReportPath } from '../../lib/report-routes';
import { ArchiveArrow } from './ui/ArchiveArrow';

type ReportKind = 'daily' | 'retro';
type ReportArchiveEntry = ManifestEntry & { type: ReportKind };

interface DayGroup {
  date: string;
  entries: Partial<Record<ReportKind, ManifestEntry>>;
}

interface WeekGroup {
  key: string;
  label: string;
  days: DayGroup[];
}

const REPORT_LABELS: Record<ReportKind, string> = {
  daily: 'Daily Brief',
  retro: 'Mid-Session Report',
};

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthId(date: string): string {
  return date.slice(0, 7);
}

function monthLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  if (!year || !monthNumber) return month;
  return `${SHORT_MONTHS[monthNumber - 1]} ${year}`;
}

function weekOfMonth(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const firstMonthDayNum = (monthStart.getUTCDay() + 6) % 7;
  return Math.floor((day + firstMonthDayNum - 1) / 7) + 1;
}

function weekLabel(date: string): string {
  return `${monthLabel(monthId(date))}, Week ${weekOfMonth(date)}`;
}

function archiveEntries(entries: ManifestEntry[]): ReportArchiveEntry[] {
  return entries.filter((entry): entry is ReportArchiveEntry => (
    entry.type === 'daily' || entry.type === 'retro'
  ));
}

function availableMonths(entries: ManifestEntry[]): string[] {
  return Array.from(new Set(archiveEntries(entries).map((entry) => monthId(entry.date))))
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
  return month ? `/reports?month=${encodeURIComponent(month)}` : '/reports';
}

function groupByWeek(entries: ManifestEntry[], month: string): WeekGroup[] {
  const days = new Map<string, DayGroup>();

  for (const entry of archiveEntries(entries)) {
    if (monthId(entry.date) !== month) continue;
    const existing = days.get(entry.date) ?? { date: entry.date, entries: {} };
    existing.entries[entry.type] = entry;
    days.set(entry.date, existing);
  }

  const weeks = new Map<string, WeekGroup>();
  for (const day of Array.from(days.values()).sort((a, b) => b.date.localeCompare(a.date))) {
    const key = `${month}-W${weekOfMonth(day.date)}`;
    const existing = weeks.get(key) ?? { key, label: weekLabel(day.date), days: [] };
    existing.days.push(day);
    weeks.set(key, existing);
  }

  return Array.from(weeks.values()).sort((a, b) => b.key.localeCompare(a.key));
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

export function ReportsMonthArchive({ entries }: { entries: ManifestEntry[] }) {
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

  const weeks = selectedMonth ? groupByWeek(entries, selectedMonth) : [];
  const currentMonthIndex = selectedMonth ? months.indexOf(selectedMonth) : -1;
  const previousMonth = currentMonthIndex >= 0 ? months[currentMonthIndex + 1] ?? null : null;
  const nextMonth = currentMonthIndex > 0 ? months[currentMonthIndex - 1] ?? null : null;

  function moveToMonth(month: string | null, event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    window.history.pushState({}, '', monthHref(month));
    setSelectedMonth(month);
  }

  if (!selectedMonth || weeks.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-[var(--color-hairline)] rounded-xl">
        <p className="font-display text-xl text-[var(--color-faint)]">No daily reports yet.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[52vh] flex-col">
      <div className="space-y-8">
        {weeks.map((week) => (
          <section key={week.key}>
            <h2 className="mb-3 font-display text-xl font-bold text-[var(--color-heading)]">{week.label}</h2>
            <ul className="m-0 list-none p-0">
              {week.days.map((day) => (
                <li key={day.date} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="font-mono text-sm text-[var(--color-muted)]">{day.date}</span>
                  <ArchiveArrow />
                  <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {(['daily', 'retro'] as const)
                      .filter((type) => day.entries[type])
                      .map((type, index) => (
                        <span key={type} className="inline-flex items-center gap-4">
                          {index > 0 && (
                            <span aria-hidden="true" className="h-4 w-px bg-[var(--color-hairline)]" />
                          )}
                          <Link
                            href={dateReportPath(day.date)}
                            className="text-sm font-semibold text-[var(--color-brand)] hover:text-[var(--color-link-hover)]"
                          >
                            {REPORT_LABELS[type]}
                          </Link>
                        </span>
                      ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <MonthNav previousMonth={previousMonth} nextMonth={nextMonth} onMove={moveToMonth} />
    </div>
  );
}
