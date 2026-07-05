import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import MoversTable from '../../src/components/market/MoversTable';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe('MoversTable', () => {
  it('uses subtle table borders for header and rows', () => {
    const html = renderToStaticMarkup(createElement(MoversTable, {
      title: 'Top Gainers',
      rows: [
        { ticker: 'HCLTECH.NS', name: 'HCL Technologies', ltp: 1143.5, changePct: 6.07 },
      ],
    }));

    expect(html).toContain('border-b border-[var(--color-hairline)]');
    expect(html).toContain('last:border-0');
  });
});
