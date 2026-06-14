import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  quoteMock: vi.fn(),
  chartMock: vi.fn(),
  searchMock: vi.fn(),
}));

vi.mock('yahoo-finance2', () => ({
  default: vi.fn(() => ({
    quote: h.quoteMock,
    chart: h.chartMock,
    search: h.searchMock,
  })),
}));

import { getQuote, getHistorical, searchTicker } from '../../lib/market-data';

beforeEach(() => {
  h.quoteMock.mockReset();
  h.chartMock.mockReset();
  h.searchMock.mockReset();
});

describe('market-data', () => {
  it('maps a quote to {price, currency, name}', async () => {
    h.quoteMock.mockResolvedValue({ regularMarketPrice: 3900, currency: 'INR', shortName: 'TCS' });
    expect(await getQuote('TCS.NS')).toEqual({ price: 3900, currency: 'INR', name: 'TCS' });
  });

  it('maps chart quotes to candles, dropping null closes', async () => {
    h.chartMock.mockResolvedValue({
      meta: {},
      quotes: [
        { date: new Date('2026-06-10'), open: 1, high: 2, low: 0.5, close: 1.5, volume: 100 },
        { date: new Date('2026-06-11'), open: 1.5, high: 2, low: 1, close: null, volume: 0 },
      ],
    });
    const candles = await getHistorical('TCS.NS', '2026-01-01');
    expect(candles).toHaveLength(1);
    expect(candles[0].close).toBe(1.5);
  });

  it('returns symbols from search', async () => {
    h.searchMock.mockResolvedValue({ quotes: [{ symbol: 'TCS.NS' }, { symbol: 'TCS.BO' }, {}] });
    expect(await searchTicker('TCS')).toEqual(['TCS.NS', 'TCS.BO']);
  });
});
