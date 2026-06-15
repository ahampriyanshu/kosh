import { describe, it, expect, vi } from 'vitest';
vi.mock('../../../lib/market-data', () => ({
  getUniverseQuotes: vi.fn(async () => ([
    { ticker: 'TCS.NS', name: 'TCS', sector: 'IT', ltp: 3900, changePct: 2, volume: 1e6, avgVolume: 8e5, high52w: 4000, low52w: 3000 },
  ])),
}));
vi.mock('../../../lib/universe', () => ({
  getUniverse: () => ([{ ticker: 'TCS.NS', name: 'TCS', sector: 'IT' }]),
}));
import { fetchUniverse } from '../../../lib/feed/universe';
import { UniverseSliceSchema } from '../../../lib/schemas';

describe('fetchUniverse', () => {
  it('returns a valid universe slice from quoted constituents', async () => {
    const slice = await fetchUniverse();
    expect(() => UniverseSliceSchema.parse(slice)).not.toThrow();
    expect(slice.quotes[0].ticker).toBe('TCS.NS');
  });
});
