import { describe, it, expect, vi } from 'vitest';
vi.mock('../../../lib/market-data', () => ({
  getMarketQuote: vi.fn(async (s: string) => ({ name: s, ltp: 100, changePct: 1 })),
}));
import { fetchGlobal } from '../../../lib/feed/global';
import { GlobalSliceSchema } from '../../../lib/schemas';

describe('fetchGlobal', () => {
  it('returns a valid global slice with indices, commodities, and USD/INR', async () => {
    const slice = await fetchGlobal();
    expect(() => GlobalSliceSchema.parse(slice)).not.toThrow();
    expect(slice.globalIndices.some((i) => i.symbol === '^DJI')).toBe(true);
    expect(slice.commodities.length).toBe(3);
    expect(slice.currencies[0].pair).toBe('USD/INR');
  });
});
