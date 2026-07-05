import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ReportDetail } from '../../src/components/ReportDetail';
import type { ReportEnvelope, ResearchReportContent } from '../../lib/schemas';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const content: ResearchReportContent = {
  items: [
    {
      ticker: 'ITC.NS',
      name: 'ITC',
      asOf: '2026-07-04T19:21:52.885Z',
      price: 432,
      metrics: [],
      fundamentals: { growth: 'Growth.', valuation: 'Valuation.' },
      technicals: { trend: 'Trend.', momentum: 'Momentum.', levels: 'Levels.' },
      sentiment: { news: 'News.', brokerage: 'Brokerage.' },
      entryExit: { fundamental: 'Fundamental.', technicalSentiment: 'Technical.' },
      targets: [],
      recommendation: { action: 'hold', reasoning: 'Reasoning.' },
    },
  ],
};

const report: ReportEnvelope = {
  schemaVersion: 1,
  id: '1',
  type: 'research',
  dateKey: '1',
  generatedAt: '2026-07-04T19:52:00.000Z',
  sourceData: { tickers: [], priceSnapshot: {}, searchTimestamp: '2026-07-04T19:52:00.000Z' },
  content,
  emailSent: false,
  checksum: 'checksum',
};

describe('ReportDetail', () => {
  it('does not repeat the research type in the research subtitle', () => {
    const html = renderToStaticMarkup(createElement(ReportDetail, { envelope: report }));

    expect(html).toContain('Research #1');
    expect(html).not.toContain('Research -');
    expect(html).toContain('5 Jul 2026, 01:22 IST');
    expect(html).not.toContain('Sun, 5 Jul, 2026, 01:22 IST');
  });
});
