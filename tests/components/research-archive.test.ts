import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ResearchArchive } from '../../src/components/ResearchArchive';
import type { ReportEnvelope, ResearchReportContent } from '../../lib/schemas';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const content: ResearchReportContent = {
  items: [
    {
      ticker: 'ITC.NS',
      name: 'ITC LTD',
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
    {
      ticker: 'PSB.NS',
      name: 'PUNJAB & SIND BANK',
      asOf: '2026-07-04T19:21:52.885Z',
      price: 49,
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

describe('ResearchArchive', () => {
  it('renders rows in the blog-style date to stocks format', () => {
    const html = renderToStaticMarkup(createElement(ResearchArchive, { reports: [report] }));

    expect(html).toContain('2026-07-04');
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('ITC, PSB');
    expect(html).not.toContain('Research #1');
    expect(html).not.toContain('>1</span>');
    expect(html).not.toContain('5 Jul 2026');
    expect(html).not.toContain('2 stocks · hold');
  });
});
