import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { WeeklyView } from '../../src/components/WeeklyView';
import type { WeeklyContent } from '../../lib/schemas';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const sampleWeeklyContent: WeeklyContent = {
  period: '2026-W46',
  snapshot: {
    asOf: '2026-11-15T21:00:00.000Z',
    window: '7d',
    indianIndices: [
      { name: 'NIFTY 50', symbol: '^NSEI', ltp: 23800, changePct: 1.25 },
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
  themes: ['IT sector led returns on solid BFSI revival.'],
  macroThemes: ['Fiscal consolidation driving domestic liquidity.'],
  multiAssetScorecard: [
    {
      asset: 'NIFTY 50',
      symbol: '^NSEI',
      close: 23800,
      returnPct: 1.25,
      context: 'Benchmark consolidation',
    },
  ],
  sectorGrowth: [
    { sector: 'NIFTY IT', weeklyReturnPct: 3.4, rank: 1 },
    { sector: 'NIFTY AUTO', weeklyReturnPct: -1.2, rank: 2 },
  ],
  fiiDiiWeekly: {
    fiiNetCrore: -2400,
    diiNetCrore: 4100,
    netInstitutionalCrore: 1700,
    summary: 'Domestic funds absorb foreign selling.',
  },
  portfolioFocus: [
    {
      ticker: 'RELIANCE.NS',
      name: 'Reliance Industries',
      recentEvents: 'Q2 earnings steady.',
      upcomingCatalysts: 'AGM announcements.',
      riskNote: 'Capex escalation.',
    },
  ],
  iposInFocus: [
    {
      company: 'MedPlus Health Services Ltd.',
      priceBand: '₹850-900',
      issueSize: '₹1,500 Cr',
      gmp: '₹120',
      gmpPct: '13.33%',
      subscription: '4.2x (Day 3)',
      status: 'Open',
      listingDate: 'N/A',
    },
    {
      company: 'Tech Innovations Ltd.',
      priceBand: '₹210-220',
      issueSize: '₹650 Cr',
      gmp: '₹60',
      gmpPct: '27.27%',
      subscription: '0.8x (Day 1)',
      status: 'Upcoming',
      listingDate: '2026-11-20',
    },
  ],
};

describe('WeeklyView', () => {
  it('renders all weekly sections including IPOs in Focus calendar', () => {
    const html = renderToStaticMarkup(
      createElement(WeeklyView, { content: sampleWeeklyContent }),
    );

    expect(html).toContain('Multi-Asset Performance Scorecard');
    expect(html).toContain('Sector Growth &amp; Relative Rotation');
    expect(html).toContain('Institutional Cash Flow Dynamics');
    expect(html).toContain('Portfolio Holdings &amp; Company Catalyst Radar');
    expect(html).toContain('IPOs in Focus · Primary Market Calendar');
    expect(html).toContain('MedPlus Health Services Ltd.');
    expect(html).toContain('₹850-900');
    expect(html).toContain('₹1,500 Cr');
    expect(html).toContain('₹120 (13.33%)');
    expect(html).toContain('4.2x (Day 3)');
    expect(html).toContain('Open');

    // Listing date should be shown when valid, and suppressed when 'N/A'
    expect(html).toContain('Tech Innovations Ltd.');
    expect(html).toContain('Listing: 2026-11-20');
    expect(html).not.toContain('Listing: N/A');
  });

  it('omits IPO section when iposInFocus is empty', () => {
    const contentWithoutIpos: WeeklyContent = {
      ...sampleWeeklyContent,
      iposInFocus: [],
    };
    const html = renderToStaticMarkup(
      createElement(WeeklyView, { content: contentWithoutIpos }),
    );

    expect(html).not.toContain('IPOs in Focus');
  });
});
