import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { OutlookMonthArchive } from '../../src/components/OutlookMonthArchive';
import type { ManifestEntry } from '../../lib/schemas';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function entry(id: string, type: ManifestEntry['type'], dateKey: string, date: string): ManifestEntry {
  return {
    id,
    type,
    dateKey,
    date,
    path: `reports/${date.slice(0, 4)}/${date.slice(5, 7)}/${type}/${id}.json`,
    checksum: `sha256:${id}`,
  };
}

describe('OutlookMonthArchive', () => {
  it('renders the latest month with weekly and monthly outlook links only', () => {
    const html = renderToStaticMarkup(createElement(OutlookMonthArchive, {
      entries: [
        entry('daily-2026-06-30', 'daily', '2026-06-30', '2026-06-30'),
        entry('weekly-2026-W26', 'weekly', '2026-W26', '2026-06-28'),
        entry('monthly-2026-06', 'monthly', '2026-06', '2026-06-30'),
        entry('weekly-2026-W25', 'weekly', '2026-W25', '2026-06-21'),
        entry('weekly-2026-W24', 'weekly', '2026-W24', '2026-06-14'),
      ],
    }));

    expect(html).toContain('Jun 2026');
    expect(html).toContain('Jun 2026, Week 4');
    expect(html).toContain('/outlook/2026/06/week-4');
    expect(html).toContain('/outlook/2026/06/month');
    expect(html).toContain('Weekly Outlook');
    expect(html).toContain('Monthly Outlook');
    expect(html).not.toContain('Daily Brief');
    expect(html).not.toContain('divide-y');
  });

  it('pins month pagination to the bottom center', () => {
    const html = renderToStaticMarkup(createElement(OutlookMonthArchive, {
      entries: [
        entry('monthly-2026-06', 'monthly', '2026-06', '2026-06-30'),
        entry('monthly-2026-05', 'monthly', '2026-05', '2026-05-31'),
      ],
    }));

    expect(html).toContain('/outlook?month=2026-05');
    expect(html).toContain('May 2026');
    expect(html).toContain('min-h-[52vh]');
    expect(html).toContain('mt-auto');
    expect(html).toContain('justify-center');
  });
});
