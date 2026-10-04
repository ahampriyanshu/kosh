import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import TodayPage from '../../src/app/page';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe('TodayPage (/)', () => {
  it('renders Corporate Actions calendar with dates and event types', async () => {
    const pageComponent = await TodayPage();
    const html = renderToStaticMarkup(pageComponent);

    expect(html).toContain('Corporate Actions');
    expect(html).toContain('Calendar');
    // Ensure no old natural language corporate disclosures header
    expect(html).not.toContain('Corporate Disclosures');
    // Ensure portfolio link and positional ledger table were removed
    expect(html).not.toContain('Turn to Page 5 · Audited Model Portfolio');
    expect(html).not.toContain('Audited Positional Calls Ledger');
  });

  it('renders minimal Institutional Flows with neutral ink typography and no date in heading', async () => {
    const pageComponent = await TodayPage();
    const html = renderToStaticMarkup(pageComponent);

    expect(html).toContain('Institutional Flows');
    expect(html).toContain('FII Net Cash');
    expect(html).toContain('DII Net Cash');
    // Ensure "Open Sentiment Index" link is removed
    expect(html).not.toContain('Open Sentiment Index');
  });

  it('renders 8 major headlines per edition on the homepage', async () => {
    const pageComponent = await TodayPage();
    const html = renderToStaticMarkup(pageComponent);

    // Extract headlines from middle column
    const headlineCount = (html.match(/<article class="homepage-story">/g) || []).length;
    expect(headlineCount).toBe(8);
  });

  it('renders Sector Rotation without ranking index numbers', async () => {
    const pageComponent = await TodayPage();
    const html = renderToStaticMarkup(pageComponent);

    expect(html).toContain('Sector Rotation');
    // Ensure no ranking index numbers like "1." in sector list
    expect(html).not.toMatch(/text-\[10px\][^>]*w-3\.5[^>]*>1\.</);
  });
});

