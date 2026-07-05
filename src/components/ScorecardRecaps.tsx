'use client';

import { MouseEvent, useEffect, useState } from 'react';
import type { RecapContent, ReportEnvelope } from '../../lib/schemas';
import { paginateByCursor } from '../../lib/pagination';
import { dateReportPath } from '../../lib/report-routes';
import { ArchiveArrow } from './ui/ArchiveArrow';

const PAGE_SIZE = 8;

function RecapReportRow({ report }: { report: ReportEnvelope }) {
  const content = report.content as RecapContent;
  const hitLabel = `${content.hits}/${content.total} positional hit`;

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <a
        href={dateReportPath(report.dateKey)}
        className="font-mono text-sm text-[var(--color-brand)] hover:text-[var(--color-link-hover)]"
      >
        {report.dateKey}
      </a>
      <ArchiveArrow />
      <span className="font-sans text-base text-[var(--color-ink)]">{hitLabel}</span>
    </li>
  );
}

function ScorecardRows({ reports }: { reports: ReportEnvelope[] }) {
  return (
    <ul className="m-0 list-none p-0">
      {reports.map((report) => (
        <RecapReportRow key={report.id} report={report} />
      ))}
    </ul>
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
    <div className="flex min-h-[52vh] flex-col">
      <ScorecardRows reports={page.items} />

      {(page.previousCursor || page.nextCursor) && (
        <div className="mt-auto flex flex-wrap items-center justify-center gap-6 pt-10">
          {page.previousCursor || cursor ? (
            <a
              href={cursorHref(page.previousCursor)}
              onClick={(event) => moveToCursor(page.previousCursor, event)}
              className="border-b border-current pb-0.5 font-sans text-sm font-semibold text-[var(--color-brand)] hover:text-[var(--color-link-hover)]"
            >
              Previous
            </a>
          ) : null}

          {page.nextCursor ? (
            <a
              href={cursorHref(page.nextCursor)}
              onClick={(event) => moveToCursor(page.nextCursor, event)}
              className="border-b border-current pb-0.5 font-sans text-sm font-semibold text-[var(--color-brand)] hover:text-[var(--color-link-hover)]"
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
