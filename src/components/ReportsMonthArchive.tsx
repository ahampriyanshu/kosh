'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type MouseEvent } from 'react';

export interface ReportArchiveCard {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  publishedAt: string;
  href: string;
  title: string;
  description: string;
}

interface WeekGroup {
  key: string;
  weekNumber: number;
  entries: ReportArchiveCard[];
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  if (!year || !monthNumber) return month;
  return `${SHORT_MONTHS[monthNumber - 1]} ${year}`;
}

function monthOf(date: string): string {
  return date.slice(0, 7);
}

function weekOfMonth(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const firstMonthDayNum = (monthStart.getUTCDay() + 6) % 7;
  return Math.floor((day + firstMonthDayNum - 1) / 7) + 1;
}

function publishedDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return date;
  return new Date(Date.UTC(year, month - 1, day, 12)).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function availableMonths(entries: ReportArchiveCard[]): string[] {
  return Array.from(new Set(entries.map((entry) => monthOf(entry.publishedAt))))
    .sort((a, b) => b.localeCompare(a));
}

function initialMonth(entries: ReportArchiveCard[]): string | null {
  return availableMonths(entries)[0] ?? null;
}

function monthFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  const month = new URLSearchParams(window.location.search).get('month');
  return month && /^\d{4}-\d{2}$/.test(month) ? month : null;
}

function monthHref(month: string): string {
  return `/reports?month=${encodeURIComponent(month)}`;
}

function groupsForMonth(entries: ReportArchiveCard[], month: string): WeekGroup[] {
  const grouped = new Map<number, ReportArchiveCard[]>();
  for (const entry of entries) {
    if (monthOf(entry.publishedAt) !== month || entry.type === 'monthly') continue;
    const weekNumber = weekOfMonth(entry.publishedAt);
    const weekEntries = grouped.get(weekNumber) ?? [];
    weekEntries.push(entry);
    grouped.set(weekNumber, weekEntries);
  }

  return Array.from(grouped.entries())
    .map(([weekNumber, weekEntries]) => ({
      key: `${month}-W${weekNumber}`,
      weekNumber,
      entries: weekEntries.sort((a, b) => (
        b.publishedAt.localeCompare(a.publishedAt) || reportTypeOrder(a.type) - reportTypeOrder(b.type)
      )),
    }))
    .sort((a, b) => b.weekNumber - a.weekNumber);
}

function reportTypeOrder(type: ReportArchiveCard['type']): number {
  return type === 'weekly' ? 0 : type === 'daily' ? 1 : 2;
}

function ReportArticle({ entry }: { entry: ReportArchiveCard }) {
  const typeLabel = entry.type === 'daily' ? 'Daily Report' : entry.type === 'weekly' ? 'Weekly Report' : 'Monthly Report';
  return (
    <article>
      <Link href={entry.href} className="group block max-w-3xl text-[var(--color-ink)] no-underline">
        <div className="mb-1.5 flex flex-wrap items-center gap-x-2 text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted)]">
          <span>{typeLabel}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={entry.publishedAt}>Published {publishedDate(entry.publishedAt)}</time>
        </div>
        <h3 className="font-serif text-lg font-semibold leading-snug text-[var(--color-heading)] group-hover:underline decoration-[var(--color-hairline)] underline-offset-4 md:text-xl">
          {entry.title}
        </h3>
        {entry.description ? (
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-[var(--color-muted)]">
            {entry.description}
          </p>
        ) : null}
      </Link>
    </article>
  );
}

export function ReportsMonthArchive({ entries }: { entries: ReportArchiveCard[] }) {
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

  const weeks = selectedMonth ? groupsForMonth(entries, selectedMonth) : [];
  const monthlyReport = selectedMonth
    ? entries.find((entry) => entry.type === 'monthly' && monthOf(entry.publishedAt) === selectedMonth)
    : undefined;

  function selectMonth(month: string, event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    window.history.pushState({}, '', monthHref(month));
    setSelectedMonth(month);
  }

  if (!selectedMonth) {
    return (
      <div className="py-16 text-center">
        <p className="font-serif text-xl text-[var(--color-faint)]">No reports yet.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[52vh] flex-col">
      <nav aria-label="Report months" className="mb-8 flex gap-5 overflow-x-auto border-b border-[var(--color-hairline)] pb-2">
        {months.map((month) => (
          <Link
            key={month}
            href={monthHref(month)}
            onClick={(event) => selectMonth(month, event)}
            aria-current={selectedMonth === month ? 'page' : undefined}
            className={`shrink-0 font-mono text-xs ${selectedMonth === month ? 'font-bold text-[var(--color-ink)]' : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}
          >
            {monthLabel(month)}
          </Link>
        ))}
      </nav>

      <h1 className="mb-6 font-serif text-2xl font-semibold text-[var(--color-heading)]">{monthLabel(selectedMonth)}</h1>

      <div className="space-y-8">
        {monthlyReport ? (
          <section aria-label="Monthly report" className="border-b border-[var(--color-hairline)] pb-6">
            <ReportArticle entry={monthlyReport} />
          </section>
        ) : null}

        {weeks.map((week) => (
          <section key={week.key} aria-label={`Week ${week.weekNumber}`}>
            <h2 className="mb-4 border-b border-[var(--color-hairline)] pb-2 font-serif text-lg font-semibold text-[var(--color-heading)]">
              Week {week.weekNumber}
            </h2>
            <div className="space-y-5 pl-4 md:pl-6">
              {week.entries.map((entry) => <ReportArticle key={entry.id} entry={entry} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
