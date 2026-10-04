import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('light theme colors', () => {
  it('uses the reference white light palette', () => {
    const css = readFileSync('src/app/globals.css', 'utf8');
    const layout = readFileSync('src/app/layout.tsx', 'utf8');

    expect(css).toContain('--color-background-primary: #ffffff;');
    expect(css).toContain('--color-surface-primary: #ffffff;');
    expect(css).toContain('--color-surface-secondary: #f6f8fa;');
    expect(layout).toContain("themeColor: '#ffffff'");
  });
});
