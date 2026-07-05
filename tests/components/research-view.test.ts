import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ResearchView } from '../../src/components/ResearchView';
import type { ResearchContent } from '../../lib/schemas';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const content: ResearchContent = {
  ticker: 'ITC.NS',
  name: 'ITC',
  asOf: '2026-07-04T19:21:52.885Z',
  price: 432,
  metrics: [
    { label: 'LTP', value: 'Rs 432' },
    { label: '52W Range', value: 'Rs 390 - Rs 520' },
  ],
  fundamentals: {
    growth: 'Growth is improving.',
    valuation: 'Valuation is reasonable.',
  },
  technicals: {
    trend: 'Trend is mixed.',
    momentum: 'Momentum is neutral.',
    levels: 'Support is nearby.',
  },
  sentiment: {
    news: 'News flow is balanced.',
    brokerage: 'No major target change found.',
  },
  entryExit: {
    fundamental: 'Entry needs valuation comfort.',
    technicalSentiment: 'Wait for momentum confirmation.',
  },
  targets: [{ source: 'Consensus', target: 'Rs 470', duration: '12 months', view: '+9%' }],
  recommendation: {
    action: 'hold',
    reasoning: 'Wait for a cleaner setup.',
  },
};

describe('ResearchView', () => {
  it('renders recommendation as the final section without a heading', () => {
    const html = renderToStaticMarkup(createElement(ResearchView, { content }));

    expect(html).not.toContain('>Recommendation</h2>');
    expect(html.indexOf('Target')).toBeLessThan(html.indexOf('HOLD'));
    expect(html.indexOf('Rs 470')).toBeLessThan(html.indexOf('Wait for a cleaner setup.'));
    expect(html).toContain('rounded-lg border border-[var(--color-hairline)]');
    expect(html.match(/rounded-lg border border-\[var\(--color-hairline\)\]/g)).toHaveLength(1);
  });
});
