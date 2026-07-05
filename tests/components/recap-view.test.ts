import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { RecapView } from '../../src/components/RecapView';
import type { RecapContent } from '../../lib/schemas';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const content: RecapContent = {
  period: '2026-W26',
  sourceReportId: 'weekly-2026-W26',
  hits: 1,
  total: 1,
  summary: '1/1 positional bets hit over 2026-W26.',
  learnings: { worked: [], missed: [] },
  graded: [
    {
      ticker: 'BAJFINANCE.NS',
      name: 'Bajaj Finance',
      thesis: 'Momentum held.',
      action: 'buy',
      entryRef: 942.3,
      exitRef: 961.8,
      changePct: 2.07,
      outcome: 'hit',
      note: 'buy call moved +2.07%',
    },
  ],
};

describe('RecapView', () => {
  it('keeps bet breakdown columns compact and aligned', () => {
    const html = renderToStaticMarkup(createElement(RecapView, { content }));

    expect(html).toContain('table-fixed');
    expect(html).toContain('min-w-[56rem]');
    expect(html).toContain('w-[20rem]');
    expect(html).not.toContain('<table class="w-full');
  });
});
