import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ScorecardPage from '../../src/app/scorecard/page';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe('ScorecardPage (/scorecard)', () => {
  it('renders Audited Positional Calls Ledger table with stats ribbon and call details', async () => {
    const pageComponent = await ScorecardPage();
    const html = renderToStaticMarkup(pageComponent);

    // Verify Master Ledger heading and stats ribbon
    expect(html).toContain('Audited Positional Calls Ledger');
    expect(html).toContain('Evaluated');
    expect(html).toContain('Win Rate');
    expect(html).toContain('Hits');
    expect(html).toContain('Misses');
    expect(html).toContain('Scratch');

    // Verify table column headers
    expect(html).toContain('Date');
    expect(html).toContain('Ticker');
    expect(html).toContain('Action');
    expect(html).toContain('Entry');
    expect(html).toContain('Exit');
    expect(html).toContain('Return');
    expect(html).toContain('Outcome');
    expect(html).toContain('Thesis &amp; Audit Note');

    // Verify outcome badges
    expect(html).toContain('HIT');
    expect(html).toContain('MISS');
    expect(html).toContain('SCRATCH');
  });
});
