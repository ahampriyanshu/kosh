import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/app/globals.css', 'utf8');

describe('reference theme alignment', () => {
  it('uses the reference light palette from ahampriyanshu.github.io', () => {
    expect(css).toContain('--color-background-primary: #ffffff;');
    expect(css).toContain('--color-surface-primary: #ffffff;');
    expect(css).toContain('--color-surface-secondary: #f6f8fa;');
    expect(css).toContain('--color-border-primary: #e5e7eb;');
  });
});
