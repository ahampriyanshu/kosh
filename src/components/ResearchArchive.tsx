'use client';

import Link from 'next/link';
import { useEffect, useState, type MouseEvent } from 'react';
import type { ReportEnvelope, ResearchReportContent } from '../../lib/schemas';
import { paginateByCursor } from '../../lib/pagination';
import { ticker as tickerFn } from './market/Figure';

const PAGE_SIZE = 8;

function reportDate(report: ReportEnvelope): string {
  return report.generatedAt.slice(0, 10);
}

function cursorHref(cursor: string | null): string {
  return cursor ? `/research?cursor=${encodeURIComponent(cursor)}` : '/research';
}

function initialCursor(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('cursor');
}

export function ResearchArchive({ reports }: { reports: ReportEnvelope[] }) {
  const [cursor, setCursor] = useState<string | null>(null);
  const page = paginateByCursor(reports, {
    cursor,
    size: PAGE_SIZE,
    getCursor: (report) => report.id,
  });

  useEffect(() => {
    setCursor(initialCursor());
  }, []);

  function moveToCursor(nextCursor: string | null, event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    window.history.pushState({}, '', cursorHref(nextCursor));
    setCursor(nextCursor);
  }

  return (
    <div className="space-y-4">
      <ul className="m-0 list-none p-0">
        {page.items.map((report) => {
          const content = report.content as ResearchReportContent;
          const tickers = content.items.map((item) => tickerFn(item.ticker)).join(', ');
          return (
            <li key={report.id} className="py-2">
              <Link href={`/research/${report.id}`} className="group inline-flex flex-wrap items-baseline gap-3 text-lg">
                <span className="font-mono text-sm text-[var(--color-muted)]">{reportDate(report)}</span>
                <span className="font-mono text-[var(--color-muted)]">-&gt;</span>
                <span className="font-sans font-medium text-[var(--color-brand)] group-hover:text-[var(--color-link-hover)]">
                  {tickers}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {(page.previousCursor || page.nextCursor || cursor) && (
        <nav className="flex flex-wrap items-center justify-center gap-6 pt-2">
          {page.previousCursor || cursor ? (
            <Link
              href={cursorHref(page.previousCursor)}
              onClick={(event) => moveToCursor(page.previousCursor, event)}
              className="text-sm font-semibold text-[var(--color-brand)] underline underline-offset-4"
            >
              Previous
            </Link>
          ) : null}
          {page.nextCursor ? (
            <Link
              href={cursorHref(page.nextCursor)}
              onClick={(event) => moveToCursor(page.nextCursor, event)}
              className="text-sm font-semibold text-[var(--color-brand)] underline underline-offset-4"
            >
              Next
            </Link>
          ) : (
            <span className="text-xs text-[var(--color-faint)]">End</span>
          )}
        </nav>
      )}
    </div>
  );
}
