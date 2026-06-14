import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  getWatchlist: vi.fn(),
  getQuote: vi.fn(),
  getHistorical: vi.fn(),
  rsi: vi.fn(),
  trend: vi.fn(),
  generateGroundedObject: vi.fn(),
  writeReport: vi.fn(),
  sendReportEmail: vi.fn(),
}));

vi.mock('../../lib/watchlist', () => ({ getWatchlist: h.getWatchlist }));
vi.mock('../../lib/market-data', () => ({ getQuote: h.getQuote, getHistorical: h.getHistorical }));
vi.mock('../../lib/indicators', () => ({ rsi: h.rsi, trend: h.trend }));
vi.mock('../../lib/llm', () => ({ generateGroundedObject: h.generateGroundedObject }));
vi.mock('../../lib/storage', () => ({
  writeReport: h.writeReport,
  computeChecksum: () => 'sha256:test',
}));
vi.mock('../../lib/email', () => ({ sendReportEmail: h.sendReportEmail }));

import { runDaily } from '../../scripts/daily';

const dailyContent = {
  date: '2026-06-14',
  marketOutlook: 'flat',
  stocksToWatch: [{ ticker: 'TCS.NS', name: 'TCS', reason: 'r', signal: 'bullish' }],
  exitSignals: [],
  topRecommendation: { ticker: 'RELIANCE.NS', action: 'buy', reasoning: 'r', confidence: 0.6 },
  sectorMovers: [],
  fiiDiiSentiment: 'neutral',
};

beforeEach(() => {
  Object.values(h).forEach((m) => m.mockReset());
  h.getWatchlist.mockResolvedValue({ stocks: [{ ticker: 'TCS.NS', name: 'TCS' }] });
  h.getQuote.mockResolvedValue({ price: 3900, currency: 'INR', name: 'TCS' });
  h.getHistorical.mockResolvedValue([{ date: new Date(), open: 1, high: 1, low: 1, close: 3900, volume: 1 }]);
  h.rsi.mockReturnValue([55]);
  h.trend.mockReturnValue('bullish');
  h.generateGroundedObject.mockResolvedValue({ object: dailyContent, sources: [] });
  h.writeReport.mockResolvedValue(undefined);
  h.sendReportEmail.mockResolvedValue(undefined);
});

describe('runDaily', () => {
  it('writes the report, emails it, then re-writes with emailSent=true', async () => {
    await runDaily(new Date('2026-06-14T02:30:00.000Z'));

    expect(h.writeReport).toHaveBeenCalledTimes(2);
    const first = h.writeReport.mock.calls[0][0];
    const second = h.writeReport.mock.calls[1][0];

    expect(first.id).toBe('daily-2026-06-14');
    expect(first.dateKey).toBe('2026-06-14');
    expect(first.type).toBe('daily');
    expect(first.emailSent).toBe(false);

    expect(h.sendReportEmail).toHaveBeenCalledTimes(1);
    expect(h.sendReportEmail).toHaveBeenCalledWith('Kosh Digest', expect.any(String));
    expect(second.emailSent).toBe(true);

    expect(h.sendReportEmail.mock.invocationCallOrder[0]).toBeGreaterThan(
      h.writeReport.mock.invocationCallOrder[0],
    );
    expect(h.sendReportEmail.mock.invocationCallOrder[0]).toBeLessThan(
      h.writeReport.mock.invocationCallOrder[1],
    );
  });

  it('validates LLM content against the schema (rejects bad confidence)', async () => {
    h.generateGroundedObject.mockResolvedValue({
      object: { ...dailyContent, topRecommendation: { ...dailyContent.topRecommendation, confidence: 9 } },
      sources: [],
    });
    await expect(runDaily(new Date('2026-06-14T02:30:00.000Z'))).rejects.toThrow();
    expect(h.sendReportEmail).not.toHaveBeenCalled();
  });
});
