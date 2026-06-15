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

import { getQuote, getHistorical, searchTicker, getQuoteDetail, getMarketQuote, getUniverseQuotes } from '../../lib/market-data';

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

  it('maps a quote to {price, currency, name, previousClose, volume}', async () => {
    h.quoteMock.mockResolvedValue({
      regularMarketPrice: 100,
      currency: 'INR',
      shortName: 'X',
      regularMarketPreviousClose: 110,
      regularMarketVolume: 5000,
    });
    expect(await getQuoteDetail('X.NS')).toEqual({
      price: 100,
      currency: 'INR',
      name: 'X',
      previousClose: 110,
      volume: 5000,
    });
  });

  it('getMarketQuote returns price, name, and change percent', async () => {
    h.quoteMock.mockImplementationOnce((arg: unknown) => {
      if (!Array.isArray(arg)) {
        return Promise.resolve({ regularMarketPrice: 23622.9, regularMarketChangePercent: 1.99, shortName: 'NIFTY 50' });
      }
      return Promise.resolve([]);
    });
    const q = await getMarketQuote('^NSEI');
    expect(q).toEqual({ name: 'NIFTY 50', ltp: 23622.9, changePct: 1.99 });
  });

  it('getUniverseQuotes maps entries to enriched quotes and skips symbols with no price', async () => {
    const entries = [
      { ticker: 'TCS.NS', name: 'TCS', sector: 'IT' },
      { ticker: 'BAD.NS', name: 'Bad', sector: 'X' },
    ];
    h.quoteMock.mockImplementationOnce((arg: unknown) => {
      if (Array.isArray(arg)) {
        return Promise.resolve([
          { symbol: 'TCS.NS', regularMarketPrice: 3900, regularMarketChangePercent: 2, regularMarketVolume: 1e6, averageDailyVolume3Month: 8e5, fiftyTwoWeekHigh: 4000, fiftyTwoWeekLow: 3000 },
          { symbol: 'BAD.NS' },
        ]);
      }
      return Promise.resolve({});
    });
    const out = await getUniverseQuotes(entries);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ ticker: 'TCS.NS', name: 'TCS', sector: 'IT', ltp: 3900, changePct: 2, volume: 1e6, avgVolume: 8e5, high52w: 4000, low52w: 3000 });
  });
});
