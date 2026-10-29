'use client';

import Link from 'next/link';
import { useEffect, useState, type MouseEvent } from 'react';
import type { ReportEnvelope, ResearchReportContent } from '../../lib/schemas';
import { paginateByCursor } from '../../lib/pagination';
import { ticker as tickerFn } from './market/Figure';
import { ArchiveArrow } from './ui/ArchiveArrow';

const PAGE_SIZE = 8;

function reportDate(report: ReportEnvelope): string {
  return report.generatedAt.slice(0, 10);
}

function cursorHref(cursor: string | null): string {
  return cursor
    ? `/research?cursor=${encodeURIComponent(cursor)}`
    : '/research';
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

  function moveToCursor(
    nextCursor: string | null,
    event: MouseEvent<HTMLAnchorElement>,
  ) {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    )
      return;
    event.preventDefault();
    window.history.pushState({}, '', cursorHref(nextCursor));
    setCursor(nextCursor);
  }

  return (
    <div className="space-y-4">
      <ul className="m-0 list-none p-0">
        {page.items.map((report) => {
          const content = report.content as ResearchReportContent;
          const tickers = content.items
            .map((item) => tickerFn(item.ticker))
            .join(', ');
          return (
            <li key={report.id} className="research-archive-row">
              <Link
                href={`/research/${report.id}`}
                className="research-archive-link group"
              >
                <span className="tabular-nums text-sm text-[var(--color-muted)]">
                  {reportDate(report)}
                </span>
                <ArchiveArrow />
                <span className="font-sans font-medium text-[var(--color-brand)] group-hover:text-[var(--color-link-hover)]">
                  {tickers}
                  <span className="research-company-names">
                    {content.items.map((item) => item.name).join(' / ')}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {(page.previousCursor || page.nextCursor || cursor) && (
        <nav
          aria-label="Research pages"
          className="flex flex-wrap items-center justify-center gap-6 pt-2"
        >
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
