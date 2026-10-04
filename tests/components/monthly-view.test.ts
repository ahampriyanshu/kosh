import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { MonthlyView } from '../../src/components/MonthlyView';
import type { MonthlyContent } from '../../lib/schemas';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const sampleMonthlyContent: MonthlyContent = {
  period: '2026-09',
  snapshot: {
    asOf: '2026-10-01T08:15:00.000Z',
    window: '1mo',
    indianIndices: [
      { name: 'NIFTY 50', symbol: '^NSEI', ltp: 23800, changePct: 2.15 },
    ],
    globalIndices: [],
    commodities: [],
    currencies: [],
    topGainers: [],
    topLosers: [],
    mostActive: [],
    near52wHigh: [],
    near52wLow: [],
    volumeShockers: [],
    sectorRanking: [],
    news: [],
    streetRecommendations: [],
    corporateActions: [],
    giftNifty: null,
    bondYield: null,
    vix: null,
    breadth: null,
    fiiDii: null,
    derivatives: null,
  },
  sectorInsights: ['IT sector led returns on solid BFSI revival.'],
  macroThemes: ['Fiscal deficit consolidation boosting foreign portfolio flows.'],
  multiAssetScorecard: [
    { asset: 'Nifty 50', symbol: '^NSEI', close: 23800, returnPct: 2.15, context: 'Benchmark' },
  ],
  sectorLeadership: [
    { sector: 'IT', weeklyReturnPct: 4.8, rank: 1, stance: 'leading' },
  ],
  fiiDiiMonthly: {
    fiiNetCrore: 4500,
    diiNetCrore: 6200,
    netInstitutionalCrore: 10700,
    summary: 'Strong combined institutional buying through September.',
  },
  portfolioReview: {
    monthlyReturnPct: 3.4,
    benchmarkReturnPct: 2.15,
    topContributors: ['Trent (+12.4%)', 'BEL (+8.1%)'],
    drags: ['Tata Motors (-3.2%)'],
    keyLearnings: ['Disciplined risk allocation protected capital during mid-month volatility.'],
  },
};

describe('MonthlyView', () => {
  it('renders all monthly sections including portfolio performance review', () => {
    const html = renderToStaticMarkup(createElement(MonthlyView, { content: sampleMonthlyContent }));

    expect(html).toContain('Sector Insights');
    expect(html).toContain('IT sector led returns');
    expect(html).toContain('Macro Themes');
    expect(html).toContain('Multi-Asset Performance Scorecard');
    expect(html).toContain('Sector Leadership');
    expect(html).toContain('Institutional Cash Flow Dynamics');
    expect(html).toContain('Portfolio Performance Review');
    expect(html).toContain('Monthly Portfolio Return');
    expect(html).toContain('+3.40%');
    expect(html).toContain('Trent (+12.4%)');
    expect(html).toContain('Tata Motors (-3.2%)');
    expect(html).toContain('Disciplined risk allocation');
  });
});
