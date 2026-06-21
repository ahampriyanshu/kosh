import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('ThemeToggle icon paths', () => {
  it('uses the portfolio SVG paths for light and dark mode icons', () => {
    const source = readFileSync('src/components/ThemeToggle.tsx', 'utf8');

    expect(source).toContain('M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
    expect(source).toContain(
      'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    );
    expect(source).not.toContain("'☀'");
    expect(source).not.toContain("'☾'");
  });
});
