import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarketMoodIndex } from '../../src/components/MarketMoodIndex';
import type { MoodSnapshot } from '../../lib/schemas';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const mockMood: MoodSnapshot = {
  composite: 42,
  regime: 'Fear',
  session: 'closing',
  asOf: '2026-10-02T10:15:00.000Z',
  summary: 'Defensive positioning dominates amid heavy institutional selling.',
  categories: {
    breadth: {
      score: 52,
      regime: 'Neutral',
      label: 'Breadth & Price Action',
      weight: 0.25,
      summary: 'Balanced cash market breadth (240 Adv / 255 Dec)',
      metrics: { adRatio: 0.94, pctAdvancing: 48.5 },
    },
    flows: {
      score: 28,
      regime: 'Fear',
      label: 'Institutional Flows',
      weight: 0.25,
      summary: 'Heavy institutional offloading (FII: -₹4,200 Cr)',
      metrics: { fiiNet: -4200, diiNet: 1800 },
    },
    volatility: {
      score: 64,
      regime: 'Greed',
      label: 'Volatility & Risk Appetite',
      weight: 0.25,
      summary: 'Subdued India VIX at 13.20',
      metrics: { vix: 13.2 },
    },
    derivatives: {
      score: 36,
      regime: 'Fear',
      label: 'Derivatives & Options Skew',
      weight: 0.25,
      summary: 'Protective put buying elevated (Nifty PCR at 1.18)',
      metrics: { pcrOi: 1.18, pcrVolume: 1.25 },
    },
  },
};

describe('MarketMoodIndex Component', () => {
  it('renders the composite score, regime badge, and session indicator', () => {
    const html = renderToStaticMarkup(createElement(MarketMoodIndex, { mood: mockMood }));

    expect(html).toContain('42');
    expect(html).toContain('/ 100');
    expect(html).toContain('Fear');
    expect(html).toContain('Official Close (15:45 IST)');
  });

  it('renders all 4 category sub-indexes with their scores and labels', () => {
    const html = renderToStaticMarkup(createElement(MarketMoodIndex, { mood: mockMood }));

    expect(html).toContain('1. Breadth &amp; Participation');
    expect(html).toContain('52');
    expect(html).toContain('2. Institutional Flows');
    expect(html).toContain('28');
    expect(html).toContain('3. Volatility &amp; Risk (VIX)');
    expect(html).toContain('64');
    expect(html).toContain('4. Derivatives &amp; Options PCR');
    expect(html).toContain('36');
  });

  it('contains link to the full /sentiment-index breakdown page', () => {
    const html = renderToStaticMarkup(createElement(MarketMoodIndex, { mood: mockMood }));

    expect(html).toContain('href="/sentiment-index"');
    expect(html).toContain('View sentiment history');
  });

  it('renders morning stance label when session is morning', () => {
    const morningMood: MoodSnapshot = { ...mockMood, session: 'morning' };
    const html = renderToStaticMarkup(createElement(MarketMoodIndex, { mood: morningMood }));

    expect(html).toContain('Morning Stance (08:30 IST)');
  });

  it('omits factor attribution and renders direct link to index section when showFactors is false', () => {
    const html = renderToStaticMarkup(createElement(MarketMoodIndex, { mood: mockMood, showFactors: false }));

    expect(html).not.toContain('Factor Attribution');
    expect(html).not.toContain('1. Breadth &amp; Participation');
    expect(html).toContain('href="/sentiment-index"');
    expect(html).toContain('Open Sentiment Index');
  });
});
