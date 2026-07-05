import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ScorecardRecaps } from '../../src/components/ScorecardRecaps';
import type { ReportEnvelope, RecapContent } from '../../lib/schemas';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const content: RecapContent = {
  period: '2026-W26',
  sourceReportId: 'weekly-2026-W26',
  hits: 1,
  total: 2,
  summary: '1/2 positional bets hit over 2026-W26.',
  learnings: { worked: [], missed: [] },
  graded: [
    {
      ticker: 'M&M.NS',
      name: 'M&M',
      thesis: 'Momentum held.',
      action: 'buy',
      entryRef: 3000,
      exitRef: 3042,
      changePct: 1.42,
      outcome: 'hit',
      note: 'Follow-through worked.',
    },
    {
      ticker: 'DLF.NS',
      name: 'DLF',
      thesis: 'Breakout failed.',
      action: 'buy',
      entryRef: 820,
      exitRef: 812,
      changePct: -1,
      outcome: 'miss',
      note: 'Rejected resistance.',
    },
  ],
};

const report: ReportEnvelope = {
  schemaVersion: 1,
  id: 'recap-2026-W26',
  type: 'recap',
  dateKey: '2026-07-04',
  generatedAt: '2026-07-04T04:00:00.000Z',
  sourceData: { tickers: [], priceSnapshot: {}, searchTimestamp: '2026-07-04T04:00:00.000Z' },
  content,
  emailSent: false,
  checksum: 'checksum',
};

describe('ScorecardRecaps', () => {
  it('renders scorecard rows as compact links without inline bet tables', () => {
    const html = renderToStaticMarkup(createElement(ScorecardRecaps, { reports: [report] }));

    expect(html).toContain('max-w-3xl');
    expect(html).toContain('2026-07-04');
    expect(html).toContain('-&gt;');
    expect(html).toContain('1/2 positional hit');
    expect(html).not.toContain('Jun 2026, Week');
    expect(html).not.toContain('1/2 positional bets hit over');
    expect(html).not.toContain('Ticker');
    expect(html).not.toContain('Action');
    expect(html).not.toContain('M&amp;M');
    expect(html).not.toContain('<table');
    expect(html).not.toContain('sm:grid-cols-[8rem_1fr_auto]');
    expect(html).not.toContain('sm:ml-[9.25rem]');
  });
});
