import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DailyContent, ReportEnvelope } from '../../lib/schemas';
import TodayPage from '../../src/app/page';

const reports = vi.hoisted(() => ({ daily: null as ReportEnvelope | null }));
vi.mock('../../src/lib/reports', () => ({
  getLatest: async () => reports.daily,
  getManifest: async () => ({ reports: [], latest: {} }),
}));
vi.mock('../../lib/bets-store', () => ({ getActiveBets: async () => [] }));
(globalThis as typeof globalThis & { React: typeof React }).React = React;

const content: DailyContent = {
  outlook: 'Domestic buying supports the close.',
  keyTakeaways: ['Banks led the session.'],
  snapshot: {
    asOf: '2026-10-09T16:00:00+05:30',
    window: '1d',
    indianIndices: [],
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
    streetRecommendations: [],
    giftNifty: null,
    bondYield: null,
    vix: null,
    breadth: null,
    derivatives: null,
    fiiDii: { fiiNet: 0, diiNet: 1234, unit: 'crore', asOf: '2026-10-09' },
    corporateActions: [
      {
        ticker: 'TCS.NS',
        name: 'Tata Consultancy Services',
        type: 'results',
        date: '2026-10-12',
      },
    ],
    news: [
      {
        category: 'macro_policy',
        items: [
          {
            headline: 'An actual headline from the feed',
            summary: 'The source summary.',
            source: 'Exchange',
            sentiment: 'neutral',
            url: 'https://example.com/news',
          },
        ],
      },
    ],
  },
};

beforeEach(() => {
  reports.daily = {
    id: 'daily-2026-10-09',
    type: 'daily',
    dateKey: '2026-10-09',
    schemaVersion: 1,
    generatedAt: content.snapshot.asOf,
    content,
    sourceData: {
      tickers: [],
      priceSnapshot: {},
      searchTimestamp: content.snapshot.asOf,
    },
    emailSent: false,
    checksum: 'test',
  };
});

async function renderPage() {
  return renderToStaticMarkup(await TodayPage());
}

describe('front page', () => {
  it('renders real headlines without padding the edition with fabricated news', async () => {
    const html = await renderPage();
    expect(html).toContain('An actual headline from the feed');
    expect(html).toContain('href="https://example.com/news"');
    expect(html).not.toContain('RBI Maintains Calibrated');
    expect(html).not.toContain('Wall Street Consolidates Gains');
  });

  it('shows corporate actions, reported flows and the report date', async () => {
    const html = await renderPage();
    expect(html).toContain('Corporate Actions');
    expect(html).toContain('TCS');
    expect(html).toContain('12 Oct');
    expect(html).toContain('Institutional Flows');
    expect(html).toContain('FII Net Cash');
    expect(html).toContain('DII Net Cash');
    expect(html).toContain('/reports/2026/10/09');
  });

  it('does not substitute unverified prices, IPOs, calls or recommendations', async () => {
    const html = await renderPage();
    expect(html).not.toContain('Hyundai Motor India');
    expect(html).not.toContain('Waaree Energies');
    expect(html).not.toContain('5.49');
    expect(html).not.toContain('₹8,140');
    expect(html).not.toContain('24,285');
    expect(html).not.toContain('Festive retail footfall');
    expect(html).not.toContain('TRENT');
  });

  it('gives a clear empty state when there is no published edition', async () => {
    reports.daily = null;
    const html = await renderPage();
    expect(html).toContain('The next edition is on its way.');
    expect(html).not.toContain('An actual headline');
    expect(html).not.toContain('Hyundai Motor India');
  });
});
