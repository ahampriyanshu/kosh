import { describe, it, expect, vi } from 'vitest';
vi.mock('../../lib/llm', () => ({
  structure: vi.fn(async () => ({ outlook: 'steady', keyTakeaways: ['a'] })),
}));
import { buildDailyNarrative } from '../../lib/reports-narrative';
import { MarketSnapshotSchema } from '../../lib/schemas';

const snap = MarketSnapshotSchema.parse({
  asOf: '2026-06-15T02:30:00.000Z', window: '1d',
  indianIndices: [{ name: 'NIFTY 50', symbol: '^NSEI', ltp: 23622, changePct: 1.9 }],
  globalIndices: [], commodities: [], currencies: [], topGainers: [], topLosers: [],
  mostActive: [], near52wHigh: [], near52wLow: [], volumeShockers: [], sectorRanking: [],
  news: [], streetRecommendations: [], corporateActions: [],
  giftNifty: null, bondYield: null, vix: null, breadth: null, fiiDii: null,
});

describe('buildDailyNarrative', () => {
  it('returns outlook + keyTakeaways from the model', async () => {
    const r = await buildDailyNarrative(snap);
    expect(r.outlook).toBe('steady');
    expect(r.keyTakeaways).toEqual(['a']);
  });
});
