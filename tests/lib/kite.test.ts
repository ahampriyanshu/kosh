import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createKiteLoginUrl, exchangeKiteRequestToken, fetchKiteHoldingsSnapshot } from '../../lib/kite';

const NOW = new Date('2026-07-04T11:30:00.000Z');

beforeEach(() => {
  process.env.KITE_API_KEY = 'kite-key';
  process.env.KITE_ACCESS_TOKEN = 'kite-token';
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  delete process.env.KITE_API_KEY;
  delete process.env.KITE_ACCESS_TOKEN;
  vi.unstubAllGlobals();
});

describe('fetchKiteHoldingsSnapshot', () => {
  it('fetches Kite holdings and normalizes portfolio values', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: [{
          tradingsymbol: 'TCS',
          exchange: 'NSE',
          instrument_token: 2953217,
          isin: 'INE467B01029',
          quantity: 10,
          average_price: 3500,
          last_price: 3900,
          pnl: 4000,
          day_change: 12.5,
          day_change_percentage: 0.32,
        }],
      }),
    } as Response);

    const snapshot = await fetchKiteHoldingsSnapshot(NOW);

    expect(fetch).toHaveBeenCalledWith('https://api.kite.trade/portfolio/holdings', {
      headers: {
        'Authorization': 'token kite-key:kite-token',
        'X-Kite-Version': '3',
      },
    });
    expect(snapshot.asOf).toBe(NOW.toISOString());
    expect(snapshot.source).toBe('kite');
    expect(snapshot.holdings[0]).toMatchObject({
      ticker: 'TCS.NS',
      name: 'TCS',
      exchange: 'NSE',
      quantity: 10,
      averagePrice: 3500,
      lastPrice: 3900,
      investedValue: 35000,
      currentValue: 39000,
      pnl: 4000,
      pnlPct: 11.43,
      dayChange: 12.5,
      dayChangePct: 0.32,
      allocationPct: 100,
    });
    expect(snapshot.summary).toMatchObject({
      investedValue: 35000,
      currentValue: 39000,
      pnl: 4000,
      pnlPct: 11.43,
      dayChange: 125,
      dayChangePct: 0.32,
    });
  });

  it('throws a clear error when Kite credentials are missing', async () => {
    delete process.env.KITE_ACCESS_TOKEN;
    await expect(fetchKiteHoldingsSnapshot(NOW)).rejects.toThrow(/KITE_ACCESS_TOKEN/);
  });
});

describe('Kite session helpers', () => {
  it('builds the interactive login URL from the API key', () => {
    expect(createKiteLoginUrl()).toBe('https://kite.zerodha.com/connect/login?v=3&api_key=kite-key');
  });

  it('exchanges a request token using Kite checksum authentication', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: {
          access_token: 'new-access-token',
          public_token: 'public-token',
          user_id: 'AB1234',
        },
      }),
    } as Response);

    const session = await exchangeKiteRequestToken('request-token', 'kite-secret', 'kite-key');

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('https://api.kite.trade/session/token');
    expect(init).toMatchObject({
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Kite-Version': '3',
      },
    });
    const body = init?.body as URLSearchParams;
    expect(body.get('api_key')).toBe('kite-key');
    expect(body.get('request_token')).toBe('request-token');
    expect(body.get('checksum')).toBe('3869d1ebb0dec250cc9a55673ca6061cfdbf53a082cda327a12dcf3626ee6bc4');
    expect(session.accessToken).toBe('new-access-token');
  });
});
