import { describe, it, expect } from 'vitest';
import { getUniverse } from '../../lib/universe';
import { UniverseSchema } from '../../lib/schemas';

describe('getUniverse', () => {
  it('returns a validated, non-empty universe with unique NSE/BSE tickers', () => {
    const u = getUniverse();
    expect(() => UniverseSchema.parse(u)).not.toThrow();
    expect(u.length).toBeGreaterThan(0);
    const tickers = u.map((e) => e.ticker);
    expect(new Set(tickers).size).toBe(tickers.length);
  });
});
