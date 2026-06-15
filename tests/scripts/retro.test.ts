import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  getWatchlist: vi.fn(),
  getQuoteDetail: vi.fn(),
  getHistorical: vi.fn(),
  sma: vi.fn(),
  generateGroundedObject: vi.fn(),
  writeReport: vi.fn(),
  sendReportEmail: vi.fn(),
}));

vi.mock('../../lib/watchlist', () => ({ getWatchlist: h.getWatchlist }));
vi.mock('../../lib/market-data', () => ({
  getQuoteDetail: h.getQuoteDetail,
  getHistorical: h.getHistorical,
}));
vi.mock('../../lib/indicators', () => ({ sma: h.sma }));
vi.mock('../../lib/llm', () => ({ generateGroundedObject: h.generateGroundedObject }));
vi.mock('../../lib/storage', () => ({
  writeReport: h.writeReport,
  computeChecksum: () => 'sha256:test',
}));
vi.mock('../../lib/email', () => ({ sendReportEmail: h.sendReportEmail }));

import { runRetro } from '../../scripts/retro';

const NOW = new Date('2026-06-15T08:30:00.000Z');

// Helper: 20 candles with given close/volume
function makeCandles(close: number, volume: number, count = 25) {
  return Array.from({ length: count }, (_, i) => ({
    date: new Date(NOW.getTime() - (count - i) * 24 * 60 * 60 * 1000),
    open: close,
    high: close,
    low: close,
    close,
    volume,
  }));
}

beforeEach(() => {
  Object.values(h).forEach((m) => m.mockReset());
  h.getWatchlist.mockResolvedValue({ stocks: [{ ticker: 'X.NS', name: 'X' }] });
  h.writeReport.mockResolvedValue(undefined);
  h.sendReportEmail.mockResolvedValue(undefined);
});

describe('runRetro', () => {
  it('no flags → no LLM call, writes twice, emails once', async () => {
    // 0% change, normal volume (1000), price == sma → no rules triggered
    h.getQuoteDetail.mockResolvedValue({
      price: 100,
      previousClose: 100,
      volume: 1000,
      currency: 'INR',
      name: 'X',
    });
    h.getHistorical.mockResolvedValue(makeCandles(100, 1000));
    h.sma.mockReturnValue([100]); // sma50 = 100, price 100 is not below 100 * 0.98

    await runRetro(NOW);

    expect(h.generateGroundedObject).not.toHaveBeenCalled();

    expect(h.writeReport).toHaveBeenCalledTimes(2);
    const first = h.writeReport.mock.calls[0][0];
    const second = h.writeReport.mock.calls[1][0];

    expect(first.content.alerts).toEqual([]);
    expect(first.emailSent).toBe(false);
    expect(first.id).toMatch(/^retro-/);
    expect(first.dateKey).toBeTruthy();
    expect(first.type).toBe('retro');

    expect(h.sendReportEmail).toHaveBeenCalledTimes(1);
    expect(h.sendReportEmail).toHaveBeenCalledWith('Kosh Daily Retro', expect.any(String));
    expect(second.emailSent).toBe(true);
  });

  it('drawdown flag → LLM called, alert written, email sent', async () => {
    // −10% change, volume 5x avg → triggers drawdown>3% and volume>2x avg
    h.getQuoteDetail.mockResolvedValue({
      price: 90,
      previousClose: 100,
      volume: 5000,
      currency: 'INR',
      name: 'X',
    });
    h.getHistorical.mockResolvedValue(makeCandles(100, 1000));
    h.sma.mockReturnValue([100]); // price 90 < 100 * 0.98 = 98 → below 50DMA support

    h.generateGroundedObject.mockResolvedValue({
      object: {
        alerts: [
          {
            ticker: 'X.NS',
            name: 'X',
            reason: 'sharp drop on heavy volume',
            severity: 'high',
            triggeredRules: ['drawdown>3%'],
          },
        ],
        summary: 'X selling off',
      },
      sources: [],
    });

    await runRetro(NOW);

    expect(h.generateGroundedObject).toHaveBeenCalledTimes(1);

    expect(h.writeReport).toHaveBeenCalledTimes(2);
    const first = h.writeReport.mock.calls[0][0];
    expect(first.content.alerts).toHaveLength(1);
    expect(first.content.alerts[0].ticker).toBe('X.NS');

    expect(h.sendReportEmail).toHaveBeenCalledTimes(1);
  });

  it('filters LLM alerts to only flagged tickers', async () => {
    // Same setup as drawdown test
    h.getQuoteDetail.mockResolvedValue({
      price: 90,
      previousClose: 100,
      volume: 5000,
      currency: 'INR',
      name: 'X',
    });
    h.getHistorical.mockResolvedValue(makeCandles(100, 1000));
    h.sma.mockReturnValue([100]);

    // LLM returns alerts for both X.NS (flagged) and Y.NS (not in watchlist / not flagged)
    h.generateGroundedObject.mockResolvedValue({
      object: {
        alerts: [
          {
            ticker: 'Y.NS',
            name: 'Y',
            reason: 'noise',
            severity: 'low',
            triggeredRules: [],
          },
          {
            ticker: 'X.NS',
            name: 'X',
            reason: 'sharp drop on heavy volume',
            severity: 'high',
            triggeredRules: ['drawdown>3%'],
          },
        ],
        summary: 'X selling off, Y noise',
      },
      sources: [],
    });

    await runRetro(NOW);

    const first = h.writeReport.mock.calls[0][0];
    // Only X.NS should remain — Y.NS was not in the flagged set
    expect(first.content.alerts).toHaveLength(1);
    expect(first.content.alerts[0].ticker).toBe('X.NS');
  });
});
