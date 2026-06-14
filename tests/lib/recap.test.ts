import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  readManifest: vi.fn(),
  readReport: vi.fn(),
  getHistorical: vi.fn(),
  generateGroundedObject: vi.fn(),
}));

vi.mock('../../lib/storage', () => ({
  readManifest: h.readManifest,
  readReport: h.readReport,
}));

vi.mock('../../lib/market-data', () => ({
  getHistorical: h.getHistorical,
}));

vi.mock('../../lib/llm', () => ({
  generateGroundedObject: h.generateGroundedObject,
}));

import { buildRecap, type RecapInput } from '../../lib/recap';

// A schema-valid RecapContent fixture (retrospective non-null, valid signal, valid action)
const recapFixture = {
  period: '2026-W24',
  retrospective: {
    calls: [
      {
        ticker: 'TCS.NS',
        predicted: 'bullish move',
        actual: 'rose 10%',
        hit: true,
        why: 'strong earnings',
      },
    ],
    hits: 1,
    total: 1,
    summary: 'One for one this week.',
  },
  outlook: {
    themes: ['IT sector strength', 'FII inflows'],
    stocksToWatch: [
      {
        ticker: 'INFY.NS',
        name: 'Infosys',
        reason: 'guidance upgrade expected',
        signal: 'bullish' as const,
      },
    ],
    recommendation: {
      ticker: 'INFY.NS',
      action: 'buy' as const,
      reasoning: 'Strong fundamentals and bullish technicals',
      confidence: 0.6,
    },
  },
};

const baseInput: RecapInput = {
  type: 'weekly',
  period: '2026-W24',
  periodLabel: 'week ending 2026-06-14',
  lookbackPeriod1: '2026-06-07',
  now: new Date('2026-06-14T08:00:00.000Z'),
};

beforeEach(() => {
  Object.values(h).forEach((m) => m.mockReset());
});

describe('buildRecap', () => {
  it('first run (no prior): forces retrospective null, does not call getHistorical', async () => {
    h.readManifest.mockResolvedValue({ reports: [], latest: {} });
    // LLM returns a fixture with non-null retrospective — recap.ts must force it null
    h.generateGroundedObject.mockResolvedValue({ object: recapFixture, sources: [] });

    const result = await buildRecap(baseInput);

    // retrospective must be null (no prior report)
    expect(result.retrospective).toBeNull();
    // period must match input
    expect(result.period).toBe(baseInput.period);
    // getHistorical must not have been called (no prior tickers to fetch)
    expect(h.getHistorical).not.toHaveBeenCalled();
    // readReport must not have been called either
    expect(h.readReport).not.toHaveBeenCalled();
  });

  it('with prior: calls getHistorical for each prior ticker, preserves retrospective', async () => {
    h.readManifest.mockResolvedValue({
      reports: [{ id: 'prev', type: 'weekly', date: '2026-06-07', path: 'briefings/prev.json', checksum: 'sha256:abc' }],
      latest: { weekly: 'prev' },
    });

    // Prior report has TCS.NS in stocksToWatch and INFY.NS as recommendation ticker
    h.readReport.mockResolvedValue({
      schemaVersion: 1,
      id: 'prev',
      type: 'weekly',
      generatedAt: '2026-06-07T08:00:00.000Z',
      sourceData: { tickers: [], priceSnapshot: {}, searchTimestamp: '2026-06-07T08:00:00.000Z' },
      content: {
        period: '2026-W23',
        retrospective: null,
        outlook: {
          themes: ['IT'],
          stocksToWatch: [{ ticker: 'TCS.NS', name: 'TCS', reason: 'momentum', signal: 'bullish' }],
          recommendation: { ticker: 'INFY.NS', action: 'buy', reasoning: 'strong', confidence: 0.7 },
        },
      },
      emailSent: true,
      checksum: 'sha256:abc',
    });

    // getHistorical returns two candles: close 100 → 110 (+10%)
    h.getHistorical.mockResolvedValue([
      { date: new Date('2026-06-07'), open: 100, high: 105, low: 98, close: 100, volume: 1000 },
      { date: new Date('2026-06-14'), open: 108, high: 112, low: 107, close: 110, volume: 1200 },
    ]);

    // LLM returns fixture with populated retrospective
    h.generateGroundedObject.mockResolvedValue({ object: recapFixture, sources: [] });

    const result = await buildRecap(baseInput);

    // getHistorical should be called for both prior tickers (TCS.NS and INFY.NS)
    expect(h.getHistorical).toHaveBeenCalledTimes(2);
    const calledTickers = h.getHistorical.mock.calls.map((call) => call[0]);
    expect(calledTickers).toContain('TCS.NS');
    expect(calledTickers).toContain('INFY.NS');

    // retrospective should be preserved (non-null) from the LLM object
    expect(result.retrospective).not.toBeNull();
    expect(result.retrospective?.calls).toHaveLength(1);

    // period must match input
    expect(result.period).toBe(baseInput.period);
  });
});
