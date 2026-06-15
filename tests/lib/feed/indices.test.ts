import { describe, it, expect, vi } from 'vitest';
vi.mock('../../../lib/market-data', () => ({
  getMarketQuote: vi.fn(async (s: string) => ({ name: s, ltp: 100, changePct: 1 })),
}));
import { fetchIndices } from '../../../lib/feed/indices';
import { IndicesSliceSchema } from '../../../lib/schemas';

describe('fetchIndices', () => {
  it('returns a valid indices slice with the NSE indices and VIX', async () => {
    const slice = await fetchIndices();
    expect(() => IndicesSliceSchema.parse(slice)).not.toThrow();
    expect(slice.indianIndices.some((i) => i.symbol === '^NSEI')).toBe(true);
    expect(slice.vix).not.toBeNull();
  });
  it('omits an index whose quote throws (consistency over availability)', async () => {
    const md = await import('../../../lib/market-data');
    (md.getMarketQuote as ReturnType<typeof vi.fn>).mockImplementation(async (s: string) => {
      if (s === '^CNXIT') throw new Error('blocked');
      return { name: s, ltp: 100, changePct: 1 };
    });
    const slice = await fetchIndices();
    expect(slice.indianIndices.some((i) => i.symbol === '^CNXIT')).toBe(false);
    expect(slice.indianIndices.length).toBeGreaterThan(0);
  });
});
