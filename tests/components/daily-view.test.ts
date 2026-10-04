import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { DailyView } from '../../src/components/DailyView';
import type { DailyContent } from '../../lib/schemas';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const sampleDailyContent: DailyContent = {
  outlook: 'Bullish market bias driven by strong domestic liquidity.',
  keyTakeaways: ['Nifty targets 24,000', 'IT sector showing relative strength'],
  snapshot: {
    asOf: '2026-10-01T08:15:00.000Z',
    window: '1d',
    indianIndices: [
      { name: 'NIFTY 50', symbol: '^NSEI', ltp: 23800, changePct: 0.75 },
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
    news: [
      {
        category: 'macro_policy',
        items: [
          {
            headline: 'RBI Maintains Accommodative Stance',
            summary: 'Policy rates kept steady to support growth.',
            source: 'Economic Times',
            sentiment: 'bullish',
          },
        ],
      },
    ],
    streetRecommendations: [
      {
        ticker: 'BEL.NS',
        name: 'Bharat Electronics',
        brokerage: 'Jefferies',
        action: 'buy',
        target: 350,
        rationale: 'Defence order book expansion',
      },
    ],
    corporateActions: [
      {
        ticker: 'TCS.NS',
        name: 'Tata Consultancy Services',
        type: 'dividend',
        date: '2026-10-15',
      },
    ],
    giftNifty: null,
    bondYield: null,
    vix: null,
    breadth: null,
    fiiDii: null,
    derivatives: null,
  },
};

describe('DailyView', () => {
  it('renders all key sections including news, street recommendations, and corporate actions', () => {
    const html = renderToStaticMarkup(createElement(DailyView, { content: sampleDailyContent }));

    expect(html).toContain('Market Outlook');
    expect(html).toContain('Bullish market bias');
    expect(html).toContain('Key Takeaways');
    expect(html).toContain('Nifty targets 24,000');
    expect(html).toContain('Top Stories &amp; Market Intelligence');
    expect(html).toContain('RBI Maintains Accommodative Stance');
    expect(html).toContain('Street Consensus &amp; Brokerage Radar');
    expect(html).toContain('BEL');
    expect(html).toContain('Jefferies');
    expect(html).toContain('Corporate Actions &amp; Calendar');
    expect(html).toContain('TCS');
  });
});
