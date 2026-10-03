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
});
