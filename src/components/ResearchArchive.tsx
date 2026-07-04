'use client';

import Link from 'next/link';
import { useEffect, useState, type MouseEvent } from 'react';
import type { ReportEnvelope } from '../../lib/schemas';
import { paginateByCursor } from '../../lib/pagination';
import { ticker as tickerFn } from './market/Figure';

const PAGE_SIZE = 8;

function formatGeneratedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
      hour12: false,
    }) + ' IST';
  } catch {
    return iso;
  }
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
      <div className="space-y-3">
        {page.items.map((report) => {
          const content = report.content as {
            ticker: string;
            name: string;
            recommendation: { action: string; confidence: number; reasoning: string };
          };
          return (
            <Link key={report.id} href={`/research/${report.id}`} className="block group">
              <article className="border border-[var(--color-hairline)] rounded-lg bg-[var(--color-surface)] p-4 hover:border-[var(--color-brand)] hover:shadow-sm transition-all duration-150">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold text-[var(--color-ink)]">{tickerFn(content.ticker)}</p>
                    <h2 className="font-display text-lg font-semibold text-[var(--color-brand)] leading-snug mt-1">
                      {content.name}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--color-muted)] leading-relaxed line-clamp-2">
                      {content.recommendation.reasoning}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <time className="font-mono text-xs text-[var(--color-faint)]">
                      {formatGeneratedAt(report.generatedAt)}
                    </time>
                    <p className="mt-2 font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-brand)]">
                      {content.recommendation.action} · {Math.round(content.recommendation.confidence * 100)}%
                    </p>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>

      {(page.previousCursor || page.nextCursor || cursor) && (
        <nav className="flex items-center justify-between gap-3 pt-2">
          {page.previousCursor || cursor ? (
            <Link
              href={cursorHref(page.previousCursor)}
              onClick={(event) => moveToCursor(page.previousCursor, event)}
              className="text-sm font-semibold text-[var(--color-brand)] underline underline-offset-4"
            >
              Previous
            </Link>
          ) : (
            <span />
          )}
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
