import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  readAllBets,
  getActiveBets,
  getClosedBets,
  getExpiringActiveBets,
  settleBet,
  upsertBet,
} from '../../lib/bets-store';
import { evaluateExpiringBets, generatePostMortem } from '../../scripts/evaluate-bets';
import type { SystematicBet } from '../../lib/schemas';

vi.mock('../../lib/market-data', () => ({
  getQuote: vi.fn(async (ticker: string) => ({
    price: ticker.includes('TRENT') ? 7800 : 1300,
    currency: 'INR',
    name: ticker,
  })),
  getHistorical: vi.fn(async (ticker: string) => [
    {
      date: new Date('2026-10-02'),
      open: 1400,
      high: ticker.includes('TRENT') ? 7850 : 1420,
      low: 1350,
      close: ticker.includes('TRENT') ? 7800 : 1380,
      volume: 1000000,
    },
  ]),
}));

vi.mock('../../lib/llm', () => ({
  structure: vi.fn(async () => ({
    whatWentWrong: 'Price broke below support due to sector-wide liquidation.',
    howToAvoid: 'Enforce stricter delivery absorption thresholds prior to trade entry.',
  })),
}));

describe('Systematic Bets Store & Evaluation Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads active bets partitioned by horizon', async () => {
    const shortTermActive = await getActiveBets('short_term');
    expect(shortTermActive.length).toBeGreaterThan(0);
    for (const b of shortTermActive) {
      expect(b.horizon).toBe('short_term');
      expect(b.status).toBe('active');
      expect(b.callDate).toBeDefined();
      expect(b.expiryDate).toBeDefined();
    }

    const longTermActive = await getActiveBets('long_term');
    expect(longTermActive.length).toBeGreaterThan(0);
    for (const b of longTermActive) {
      expect(b.horizon).toBe('long_term');
      expect(b.status).toBe('active');
    }
  });

  it('filters active bets due on or before a given expiry date', async () => {
    const due = await getExpiringActiveBets('2026-10-21');
    expect(Array.isArray(due)).toBe(true);
    for (const b of due) {
      expect(b.status).toBe('active');
      expect(b.expiryDate <= '2026-10-21').toBe(true);
    }
  });

  it('settles a bet as HIT without post-mortem notes', async () => {
    const testBet: SystematicBet = {
      id: 'test-st-hit-1',
      ticker: 'TESTHIT',
      name: 'Test Hit Ltd',
      horizon: 'short_term',
      category: 'Dual Momentum Breakout',
      action: 'buy',
      callDate: '2026-10-01',
      expiryDate: '2026-10-08',
      entryPrice: 100,
      targetPrice: 110,
      stopLossPrice: 95,
      quantScore: 85,
      triggers: 'Momentum breakout',
      thesis: 'Test thesis',
      status: 'active',
    };

    await upsertBet(testBet);

    const settled = await settleBet(testBet.id, {
      closePrice: 112,
      closedOn: '2026-10-08',
      outcome: 'hit',
    });

    expect(settled.status).toBe('closed');
    expect(settled.outcome).toBe('hit');
    expect(settled.closePrice).toBe(112);
    expect(settled.returnPct).toBe(12);
    expect(settled.postMortem).toBeUndefined();
  });

  it('settles a bet as MISS with required whatWentWrong and howToAvoid post-mortem notes', async () => {
    const testBet: SystematicBet = {
      id: 'test-st-miss-1',
      ticker: 'TESTMISS',
      name: 'Test Miss Ltd',
      horizon: 'short_term',
      category: 'Contrarian Mean-Reversion',
      action: 'buy',
      callDate: '2026-10-01',
      expiryDate: '2026-10-08',
      entryPrice: 100,
      targetPrice: 110,
      stopLossPrice: 95,
      quantScore: 82,
      triggers: 'Oversold bounce',
      thesis: 'Test miss thesis',
      status: 'active',
    };

    await upsertBet(testBet);

    const postMortem = await generatePostMortem(testBet, 92, -8, 102, 91);
    expect(postMortem.whatWentWrong).toContain('support');
    expect(postMortem.howToAvoid).toContain('delivery');

    const settled = await settleBet(testBet.id, {
      closePrice: 92,
      closedOn: '2026-10-08',
      outcome: 'miss',
      postMortem,
    });

    expect(settled.status).toBe('closed');
    expect(settled.outcome).toBe('miss');
    expect(settled.closePrice).toBe(92);
    expect(settled.returnPct).toBe(-8);
    expect(settled.postMortem).toBeDefined();
    expect(settled.postMortem?.whatWentWrong).toBeDefined();
    expect(settled.postMortem?.howToAvoid).toBeDefined();
  });

  it('evaluates expiring bets and returns a settlement summary', async () => {
    // Calling evaluateExpiringBets with a future date
    const testExpiringBet: SystematicBet = {
      id: 'test-expiring-trent',
      ticker: 'TRENT',
      name: 'Trent Ltd',
      horizon: 'short_term',
      category: 'Dual Momentum Breakout',
      action: 'buy',
      callDate: '2026-10-01',
      expiryDate: '2026-10-05',
      entryPrice: 7120,
      targetPrice: 7650,
      stopLossPrice: 6855,
      quantScore: 90,
      triggers: 'Breakout',
      thesis: 'Test Trent',
      status: 'active',
    };

    await upsertBet(testExpiringBet);

    const result = await evaluateExpiringBets(new Date('2026-10-05T17:30:00.000Z'));
    expect(result.evaluated).toBeGreaterThan(0);
    expect(result.settled.some((b) => b.id === 'test-expiring-trent')).toBe(true);

    const trentSettled = result.settled.find((b) => b.id === 'test-expiring-trent');
    expect(trentSettled?.status).toBe('closed');
    expect(['hit', 'miss']).toContain(trentSettled?.outcome);
  });
});
