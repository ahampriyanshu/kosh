import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import SentimentIndexPage from '../../src/app/sentiment-index/page';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe('SentimentIndexPage (/sentiment-index)', () => {
  it('renders the page header, master mood index, and 4 category deep dives', async () => {
    const pageComponent = await SentimentIndexPage();
    const html = renderToStaticMarkup(pageComponent);

    expect(html).toContain("Today&#x27;s reading");
    expect(html).toContain('What shapes the reading');
    expect(html).toContain('Breadth &amp; participation');
    expect(html).toContain('Institutional flows');
    expect(html).toContain('Volatility &amp; risk appetite');
    expect(html).toContain('Options positioning');
    expect(html).toContain('Recent readings');
  });
});
