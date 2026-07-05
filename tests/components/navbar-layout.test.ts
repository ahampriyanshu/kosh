import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/app/globals.css', 'utf8');

describe('mobile navbar layout', () => {
  it('moves nav links to their own row on small screens', () => {
    expect(css).toContain('grid-template-areas:');
    expect(css).toContain('"brand actions"');
    expect(css).toContain('"nav nav"');
    expect(css).toContain('grid-area: nav');
  });
});
