import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('light theme colors', () => {
  it('uses the reference warm broadsheet palette', () => {
    const css = readFileSync('src/app/globals.css', 'utf8');
    const layout = readFileSync('src/app/layout.tsx', 'utf8');

    expect(css).toContain('--color-background-primary: #f7f4ec;');
    expect(css).toContain('--color-surface-primary: #f7f4ec;');
    expect(css).toContain('--color-surface-secondary: #f1ede2;');
    expect(layout).toContain("themeColor: '#f7f4ec'");
  });
});
