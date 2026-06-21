import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('light theme colors', () => {
  it('uses a softened light palette instead of pure white backgrounds', () => {
    const css = readFileSync('src/app/globals.css', 'utf8');
    const layout = readFileSync('src/app/layout.tsx', 'utf8');

    expect(css).toContain('--color-background-primary: #f3f5f7;');
    expect(css).toContain('--color-surface-primary: #fafbfc;');
    expect(css).not.toContain('--color-background-primary: #ffffff;');
    expect(css).not.toContain('--color-surface-primary: #ffffff;');
    expect(layout).toContain("themeColor: '#f3f5f7'");
  });
});
