import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/app/globals.css', 'utf8');

describe('reference theme alignment', () => {
  it('uses the reference warm broadsheet palette', () => {
    expect(css).toContain('--color-background-primary: #f7f4ec;');
    expect(css).toContain('--color-surface-primary: #f7f4ec;');
    expect(css).toContain('--color-surface-secondary: #f1ede2;');
    expect(css).toContain('--color-border-primary: #e2dbcd;');
  });
});
