import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import PortfolioPage from '../../src/app/portfolio/page';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe('PortfolioPage (/portfolio)', () => {
  it('renders portfolio unlock setup and risk surveillance section', async () => {
    const pageComponent = await PortfolioPage();
    const html = renderToStaticMarkup(pageComponent);

    // Verifies portfolio unlock initial mount state
    expect(html).toContain('Preparing portfolio.');

    // Verifies dedicated Portfolio Risk Surveillance section
    expect(html).toContain('Portfolio Surveillance &amp; Audit');
    expect(html).toContain('Market Close Risk Screening &amp; Technical Exceptions');
    expect(html).toContain('Audit As Of');
    expect(html).toContain('Full Retrospective');
  });
});
