import { describe, it, expect } from 'vitest';
import { aggregateSnapshots } from '../../../lib/feed/aggregate';
import { MarketSnapshotSchema, type MarketSnapshot } from '../../../lib/schemas';

const snap = (over: Partial<MarketSnapshot>): MarketSnapshot => MarketSnapshotSchema.parse({
  asOf: '2026-06-15T00:00:00.000Z', window: '1d',
  indianIndices: [], globalIndices: [], commodities: [], currencies: [],
  topGainers: [], topLosers: [], mostActive: [], near52wHigh: [], near52wLow: [],
  volumeShockers: [], sectorRanking: [], news: [], streetRecommendations: [], corporateActions: [],
  giftNifty: null, bondYield: null, vix: null, breadth: null, fiiDii: null, ...over,
});

describe('aggregateSnapshots', () => {
  it('returns an empty window snapshot for no inputs', () => {
    const r = aggregateSnapshots([], '7d');
    expect(r.window).toBe('7d');
    expect(r.indianIndices).toEqual([]);
  });
  it('compounds index change across the window and keeps latest LTP', () => {
    const a = snap({ asOf: '2026-06-14T00:00:00.000Z', indianIndices: [{ name: 'NIFTY 50', symbol: '^NSEI', ltp: 100, changePct: 2 }] });
    const b = snap({ asOf: '2026-06-15T00:00:00.000Z', indianIndices: [{ name: 'NIFTY 50', symbol: '^NSEI', ltp: 103, changePct: 1 }] });
    const r = aggregateSnapshots([a, b], '7d');
    expect(r.indianIndices[0].ltp).toBe(103);            // latest
    expect(r.indianIndices[0].changePct).toBeCloseTo(3.02, 1); // (1.02*1.01-1)*100
    expect(r.asOf).toBe('2026-06-15T00:00:00.000Z');     // latest
  });
  it('sums FII/DII across the window', () => {
    const a = snap({ fiiDii: { fiiNet: -100, diiNet: 50, unit: 'crore', asOf: '2026-06-14' } });
    const b = snap({ fiiDii: { fiiNet: -200, diiNet: 80, unit: 'crore', asOf: '2026-06-15' } });
    const r = aggregateSnapshots([a, b], '7d');
    expect(r.fiiDii).toEqual({ fiiNet: -300, diiNet: 130, unit: 'crore', asOf: '2026-06-15' });
  });
  it('takes movers/breadth/news from the latest snapshot', () => {
    const a = snap({ topGainers: [{ ticker: 'OLD.NS', name: 'Old', ltp: 1, changePct: 1 }] });
    const b = snap({ topGainers: [{ ticker: 'NEW.NS', name: 'New', ltp: 2, changePct: 2 }], breadth: { advances: 30, declines: 10, unchanged: 0, adRatio: 3 } });
    const r = aggregateSnapshots([a, b], '7d');
    expect(r.topGainers[0].ticker).toBe('NEW.NS');
    expect(r.breadth?.advances).toBe(30);
  });
});
