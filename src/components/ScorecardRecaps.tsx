'use client';

import { MouseEvent, useEffect, useState } from 'react';
import type { GradedBet, RecapContent, ReportEnvelope } from '../../lib/schemas';
import { formatPeriodLabel, formatPeriodText } from '../../lib/time';
import { paginateByCursor } from '../../lib/pagination';
import { dateReportPath } from '../../lib/report-routes';
import { Pct, ticker } from './market/Figure';

const PAGE_SIZE = 8;

function OutcomeBadge({ outcome }: { outcome: GradedBet['outcome'] }) {
  const styles: Record<GradedBet['outcome'], { bg: string; text: string; label: string }> = {
    hit: { bg: 'var(--color-bullish-bg)', text: 'var(--color-bullish)', label: 'Hit' },
    miss: { bg: 'var(--color-bearish-bg)', text: 'var(--color-bearish)', label: 'Miss' },
    partial: { bg: 'var(--color-neutral-bg)', text: 'var(--color-neutral)', label: 'Partial' },
  };
  const s = styles[outcome];
  return (
    <span
      className="font-sans text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

function EntryBetsTable({ bets }: { bets: GradedBet[] }) {
  if (bets.length === 0) return null;
  return (
    <table className="w-full text-sm mt-2">
      <thead>
        <tr className="border-b border-[var(--color-hairline)] text-left">
          <th className="font-sans text-[10px] font-semibold uppercase tracking-widest text-[var(--color-faint)] pb-1 pr-4">Ticker</th>
          <th className="font-sans text-[10px] font-semibold uppercase tracking-widest text-[var(--color-faint)] pb-1 pr-4">Action</th>
          <th className="font-sans text-[10px] font-semibold uppercase tracking-widest text-[var(--color-faint)] pb-1 pr-4">Change</th>
          <th className="font-sans text-[10px] font-semibold uppercase tracking-widest text-[var(--color-faint)] pb-1">Outcome</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--color-hairline)]">
        {bets.map((bet, i) => (
          <tr key={`${bet.ticker}-${i}`}>
            <td className="font-mono text-[var(--color-ink)] py-1.5 pr-4">{ticker(bet.ticker)}</td>
            <td className="font-sans text-xs text-[var(--color-muted)] py-1.5 pr-4 capitalize">{bet.action}</td>
            <td className="py-1.5 pr-4"><Pct value={bet.changePct} /></td>
            <td className="py-1.5"><OutcomeBadge outcome={bet.outcome} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RecapReportRow({ report }: { report: ReportEnvelope }) {
  const content = report.content as RecapContent;

  return (
    <div className="border border-[var(--color-hairline)] rounded-lg bg-[var(--color-surface)] p-4 mb-3">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-3 mb-2">
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-[var(--color-faint)] mb-0.5">Recap</p>
          <a
            href={dateReportPath(report.dateKey)}
            className="font-mono text-sm text-[var(--color-brand)] hover:underline"
          >
            {report.dateKey}
          </a>
        </div>
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-[var(--color-faint)] mb-0.5">Source</p>
          <span className="font-mono text-sm text-[var(--color-ink)]">{formatPeriodLabel(content.period)}</span>
        </div>
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-[var(--color-faint)] mb-0.5">Hits</p>
          <span className="font-mono text-sm text-[var(--color-ink)]">{content.hits}/{content.total}</span>
        </div>
      </div>
      <p className="font-sans text-sm text-[var(--color-muted)] mb-3">{formatPeriodText(content.summary)}</p>
      <EntryBetsTable bets={content.graded} />
    </div>
  );
}

function cursorHref(cursor: string | null): string {
  return cursor ? `/scorecard?cursor=${encodeURIComponent(cursor)}` : '/scorecard';
}

function readCursorFromLocation(): string | null {
  return new URLSearchParams(window.location.search).get('cursor');
}

export function ScorecardRecaps({ reports }: { reports: ReportEnvelope[] }) {
  const [cursor, setCursor] = useState<string | null>(null);
  const page = paginateByCursor(reports, {
    cursor,
    size: PAGE_SIZE,
    getCursor: (report) => report.dateKey,
  });

  useEffect(() => {
    const syncCursor = () => setCursor(readCursorFromLocation());

    syncCursor();
    window.addEventListener('popstate', syncCursor);
    return () => window.removeEventListener('popstate', syncCursor);
  }, []);

  function moveToCursor(nextCursor: string | null, event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    window.history.pushState({}, '', cursorHref(nextCursor));
    setCursor(nextCursor);
  }

  return (
    <div>
      {page.items.map((report) => (
        <RecapReportRow key={report.id} report={report} />
      ))}

      {(page.previousCursor || page.nextCursor) && (
        <div className="mt-6 flex items-center justify-between border-t border-[var(--color-hairline)] pt-4">
          {page.previousCursor || cursor ? (
            <a
              href={cursorHref(page.previousCursor)}
              onClick={(event) => moveToCursor(page.previousCursor, event)}
              className="font-sans text-sm font-semibold text-[var(--color-brand)]"
            >
              Previous
            </a>
          ) : (
            <span />
          )}

          {page.nextCursor ? (
            <a
              href={cursorHref(page.nextCursor)}
              onClick={(event) => moveToCursor(page.nextCursor, event)}
              className="font-sans text-sm font-semibold text-[var(--color-brand)]"
            >
              Next
            </a>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
