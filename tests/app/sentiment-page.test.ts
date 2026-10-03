import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import SentimentPage from '../../src/app/sentiment/page';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe('SentimentPage (/sentiment)', () => {
  it('renders the page header, master mood index, and 4 category deep dives', async () => {
    const pageComponent = await SentimentPage();
    const html = renderToStaticMarkup(pageComponent);

    expect(html).toContain('Market Mood Index (MMI)');
    expect(html).toContain('The Four Category Sub-Indexes');
    expect(html).toContain('1. Breadth &amp; Participation');
    expect(html).toContain('2. Institutional Cash Flows');
    expect(html).toContain('3. Volatility &amp; Macro Risk');
    expect(html).toContain('4. Derivatives &amp; Options Skew');
    expect(html).toContain('Historical Sentiment Timeseries');
    expect(html).toContain('The Five Sentiment Regimes &amp; Trading Rules');
  });
});
