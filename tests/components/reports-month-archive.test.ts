import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ReportsMonthArchive } from '../../src/components/ReportsMonthArchive';
import type { ManifestEntry } from '../../lib/schemas';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function entry(id: string, type: ManifestEntry['type'], date: string): ManifestEntry {
  return {
    id,
    type,
    dateKey: date,
    date,
    path: `reports/${date.slice(0, 4)}/${date.slice(5, 7)}/${type}/${id}.json`,
    checksum: `sha256:${id}`,
  };
}

describe('ReportsMonthArchive', () => {
  it('groups the latest month into week sections with daily and mid-session links', () => {
    const html = renderToStaticMarkup(createElement(ReportsMonthArchive, {
      entries: [
        entry('recap-2026-07-04', 'recap', '2026-07-04'),
        entry('research-1', 'research', '2026-07-04'),
        entry('retro-2026-07-03', 'retro', '2026-07-03'),
        entry('daily-2026-07-03', 'daily', '2026-07-03'),
        entry('daily-2026-06-30', 'daily', '2026-06-30'),
      ],
    }));

    expect(html).toContain('Jul 2026, Week 1');
    expect(html).toContain('2026-07-03');
    expect(html).toContain('/reports/2026/07/03');
    expect(html).toContain('Daily Brief');
    expect(html).toContain('Mid-Session Report');
    expect(html).toContain('h-4 w-px bg-[var(--color-hairline)]');
    expect(html).not.toContain('Weekly Recap');
    expect(html).not.toContain('Research');
    expect(html).not.toContain('2026-06-30');
    expect(html).not.toContain('divide-y');
  });

  it('links to the previous available month at the bottom', () => {
    const html = renderToStaticMarkup(createElement(ReportsMonthArchive, {
      entries: [
        entry('daily-2026-07-03', 'daily', '2026-07-03'),
        entry('daily-2026-06-30', 'daily', '2026-06-30'),
      ],
    }));

    expect(html).toContain('/reports?month=2026-06');
    expect(html).toContain('Jun 2026');
    expect(html).toContain('min-h-[52vh]');
    expect(html).toContain('mt-auto');
  });
});
