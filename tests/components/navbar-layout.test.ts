import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/app/globals.css', 'utf8');

describe('mobile navbar layout', () => {
  it('moves nav links to their own row on small screens', () => {
    expect(css).toContain('grid-template-areas:');
    expect(css).toMatch(/['"]brand actions['"]/);
    expect(css).toMatch(/['"]nav nav['"]/);
    expect(css).toContain('grid-area: nav');
  });
});
