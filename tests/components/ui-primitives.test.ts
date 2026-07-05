import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { IndexList } from '../../src/components/ui/IndexList';
import { PageHeader } from '../../src/components/ui/PageHeader';
import { ReportSection } from '../../src/components/ui/ReportSection';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe('reference UI primitives', () => {
  it('renders page headers without a divider', () => {
    const html = renderToStaticMarkup(createElement(PageHeader, { title: 'Reports', description: 'Archive' }));

    expect(html).toContain('Reports');
    expect(html).toContain('Archive');
    expect(html).not.toContain('h-px');
    expect(html).not.toContain('border-b');
  });

  it('renders index rows as open text links instead of cards', () => {
    const html = renderToStaticMarkup(
      createElement(IndexList, null,
        createElement(IndexList.Row, {
          href: '/reports/2026/07/04',
          meta: '2026-07-04',
          title: 'Daily Brief',
          description: 'Market Digest',
        }),
      ),
    );

    expect(html).toContain('2026-07-04');
    expect(html).toContain('Daily Brief');
    expect(html).toContain('Market Digest');
    expect(html).not.toContain('rounded-lg');
    expect(html).not.toContain('border ');
  });

  it('renders report section headings without ruled dividers', () => {
    const html = renderToStaticMarkup(
      createElement(ReportSection, { title: 'Fundamentals', children: createElement('p', null, 'Growth') }),
    );

    expect(html).toContain('Fundamentals');
    expect(html).not.toContain('border-b');
  });
});
