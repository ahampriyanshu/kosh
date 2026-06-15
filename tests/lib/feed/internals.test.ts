import { describe, it, expect } from 'vitest';
import { computeInternals } from '../../../lib/feed/internals';
import { InternalsSliceSchema, type UniverseQuote } from '../../../lib/schemas';

const q = (over: Partial<UniverseQuote>): UniverseQuote => ({
  ticker: 'X.NS', name: 'X', sector: 'IT', ltp: 100, changePct: 0, volume: 1000, avgVolume: 1000, high52w: 200, low52w: 50, ...over,
});

describe('computeInternals', () => {
  const quotes: UniverseQuote[] = [
    q({ ticker: 'UP1.NS', sector: 'IT', changePct: 5, ltp: 100, high52w: 101, volume: 11, avgVolume: 5 }),
    q({ ticker: 'UP2.NS', sector: 'IT', changePct: 3 }),
    q({ ticker: 'DN1.NS', sector: 'Auto', changePct: -4, ltp: 51, low52w: 50 }),
    q({ ticker: 'FLAT.NS', sector: 'Auto', changePct: 0 }),
  ];
  it('produces a schema-valid internals slice', () => {
    expect(() => InternalsSliceSchema.parse(computeInternals(quotes))).not.toThrow();
  });
  it('ranks gainers desc and losers asc', () => {
    const r = computeInternals(quotes);
    expect(r.topGainers[0].ticker).toBe('UP1.NS');
    expect(r.topLosers[0].ticker).toBe('DN1.NS');
  });
  it('computes breadth (advances/declines/unchanged, adRatio)', () => {
    const r = computeInternals(quotes);
    expect(r.breadth).toEqual({ advances: 2, declines: 1, unchanged: 1, adRatio: 2 });
  });
  it('flags near-52w-high within 2% and near-52w-low within 2%', () => {
    const r = computeInternals(quotes);
    expect(r.near52wHigh.some((x) => x.ticker === 'UP1.NS')).toBe(true); // 100 vs 101 => ~1%
    expect(r.near52wLow.some((x) => x.ticker === 'DN1.NS')).toBe(true);  // 51 vs 50 => 2%
  });
  it('flags volume shockers with ratio > 2', () => {
    const r = computeInternals(quotes);
    expect(r.volumeShockers.some((x) => x.ticker === 'UP1.NS')).toBe(true); // 11/5 = 2.2 > 2
  });
  it('ranks sectors by average change', () => {
    const r = computeInternals(quotes);
    expect(r.sectorRanking[0].sector).toBe('IT'); // IT avg (5+3)/2=4 > Auto (-4+0)/2=-2
  });
  it('returns null breadth for an empty universe', () => {
    expect(computeInternals([]).breadth).toBeNull();
  });
});
