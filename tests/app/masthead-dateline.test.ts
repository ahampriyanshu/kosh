import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/font/google', () => ({
  Lato: () => ({ variable: '--font-lato' }),
  Newsreader: () => ({ variable: '--font-newsreader' }),
}));

import RootLayout from '../../src/app/layout';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe('RootLayout Masthead Dateline', () => {
  it('renders volume number and last action/publish datetime without "Issue on"', async () => {
    const layoutComponent = await RootLayout({
      children: React.createElement('main', null, 'Content'),
    });
    const html = renderToStaticMarkup(layoutComponent);

    // Expect volume number
    expect(html).toMatch(/Volume \d+/);
    expect(html).toContain('Volume 112');

    // Expect last action/publish datetime in exact requested format (DD Month, YYYY, hh:mm A IST)
    expect(html).toMatch(/\d{2} [A-Z][a-z]+, \d{4}, \d{2}:\d{2} (AM|PM) IST/);

    // Ensure the old "Issue on" phrasing is completely removed
    expect(html).not.toContain('Issue on');
  });
});
