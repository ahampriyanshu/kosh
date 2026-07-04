import { describe, it, expect } from 'vitest';
import { decryptPortfolioEnvelope, encryptPortfolioEnvelope } from '../../lib/portfolio-crypto';
import type { Portfolio } from '../../lib/schemas';

const portfolio: Portfolio = {
  asOf: '2026-07-04T11:30:00.000Z',
  source: 'kite',
  holdings: [{
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
  }],
  summary: {
    investedValue: 35000,
    currentValue: 39000,
    pnl: 4000,
    pnlPct: 11.43,
    dayChange: 125,
    dayChangePct: 0.32,
  },
};

describe('portfolio encryption', () => {
  it('round-trips a portfolio with a passphrase and does not expose plaintext tickers', async () => {
    const encrypted = await encryptPortfolioEnvelope(portfolio, 'secret-key');

    expect(JSON.stringify(encrypted)).not.toContain('TCS.NS');
    await expect(decryptPortfolioEnvelope(encrypted, 'wrong-key')).rejects.toThrow();
    await expect(decryptPortfolioEnvelope(encrypted, 'secret-key')).resolves.toEqual(portfolio);
  });
});
