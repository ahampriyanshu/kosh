import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ReportsMonthArchive, type ReportArchiveCard } from '../../src/components/ReportsMonthArchive';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function entry(id: string, type: ReportArchiveCard['type'], publishedAt: string): ReportArchiveCard {
  return {
    id,
    type,
    publishedAt,
    href: `/reports/${publishedAt.replaceAll('-', '/')}`,
    title: `${type} headline`,
    description: `${type} report summary with context and a brief market takeaway.`,
  };
}

describe('ReportsMonthArchive', () => {
  it('lists monthly, weekly, and daily reports as dated story cards', () => {
    const html = renderToStaticMarkup(createElement(ReportsMonthArchive, {
      entries: [
        entry('monthly-2026-06', 'monthly', '2026-06-30'),
        entry('weekly-2026-W26', 'weekly', '2026-06-28'),
        entry('daily-2026-06-30', 'daily', '2026-06-30'),
        entry('daily-2026-06-21', 'daily', '2026-06-21'),
      ],
    }));

    expect(html).toContain('Jun 2026');
    expect(html).toContain('Week 5');
    expect(html).toContain('Week 4');
    expect(html).toContain('Monthly Report');
    expect(html).toContain('Weekly Report');
    expect(html).toContain('Daily Report');
    expect(html).toContain('monthly headline');
    expect(html).toContain('weekly headline');
    expect(html).toContain('daily headline');
    expect(html).toContain('Published 30 Jun 2026');
  });

  it('offers month navigation across published months', () => {
    const html = renderToStaticMarkup(createElement(ReportsMonthArchive, {
      entries: [
        entry('daily-2026-07-03', 'daily', '2026-07-03'),
        entry('daily-2026-06-30', 'daily', '2026-06-30'),
      ],
    }));

    expect(html).toContain('/reports?month=2026-06');
    expect(html).toContain('Jun 2026');
    expect(html).toContain('aria-label="Report months"');
  });
});
