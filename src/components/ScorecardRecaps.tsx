'use client';

import { MouseEvent, useEffect, useState } from 'react';
import type { RecapContent, ReportEnvelope } from '../../lib/schemas';
import { paginateByCursor } from '../../lib/pagination';
import { dateReportPath } from '../../lib/report-routes';

const PAGE_SIZE = 8;

function RecapReportRow({ report }: { report: ReportEnvelope }) {
  const content = report.content as RecapContent;
  const hitLabel = `${content.hits}/${content.total} positional hit`;

  return (
    <article className="max-w-3xl py-6">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <a
          href={dateReportPath(report.dateKey)}
          className="font-mono text-sm text-[var(--color-brand)] hover:text-[var(--color-link-hover)]"
        >
          {report.dateKey}
        </a>
        <span className="font-mono text-[var(--color-muted)]">-&gt;</span>
        <span className="font-sans text-base text-[var(--color-ink)]">{hitLabel}</span>
      </div>
    </article>
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
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 pt-4">
          {page.previousCursor || cursor ? (
            <a
              href={cursorHref(page.previousCursor)}
              onClick={(event) => moveToCursor(page.previousCursor, event)}
              className="font-sans text-sm font-semibold text-[var(--color-brand)]"
            >
              Previous
            </a>
          ) : null}

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
