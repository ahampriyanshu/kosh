import { describe, expect, it } from 'vitest';
import type { PortfolioHolding } from '../../lib/schemas';
import { sortPortfolioHoldings } from '../../lib/portfolio-sort';

function holding(overrides: Partial<PortfolioHolding>): PortfolioHolding {
  return {
    ticker: 'AAA.NS',
    name: 'AAA',
    exchange: 'NSE',
    quantity: 1,
    averagePrice: 100,
    lastPrice: 100,
    investedValue: 100,
    currentValue: 100,
    pnl: 0,
    pnlPct: 0,
    dayChange: 0,
    dayChangePct: 0,
    allocationPct: 1,
    ...overrides,
  };
}

describe('sortPortfolioHoldings', () => {
  const holdings = [
    holding({ ticker: 'TCS.NS', name: 'TCS', currentValue: 200, pnl: 20, dayChange: 2, quantity: 10 }),
    holding({ ticker: 'INFY.NS', name: 'Infosys', currentValue: 300, pnl: -10, dayChange: -1, quantity: 5 }),
    holding({ ticker: 'RELIANCE.NS', name: 'Reliance', currentValue: 100, pnl: 40, dayChange: 3, quantity: 2 }),
  ];

  it('sorts tickers alphabetically', () => {
    expect(sortPortfolioHoldings(holdings, { key: 'ticker', direction: 'asc' }).map((item) => item.ticker)).toEqual([
      'INFY.NS',
      'RELIANCE.NS',
      'TCS.NS',
    ]);
  });

  it('sorts numeric fields descending', () => {
    expect(sortPortfolioHoldings(holdings, { key: 'currentValue', direction: 'desc' }).map((item) => item.ticker)).toEqual([
      'INFY.NS',
      'TCS.NS',
      'RELIANCE.NS',
    ]);
  });

  it('sorts day value using day change multiplied by quantity', () => {
    expect(sortPortfolioHoldings(holdings, { key: 'dayValue', direction: 'desc' }).map((item) => item.ticker)).toEqual([
      'TCS.NS',
      'RELIANCE.NS',
      'INFY.NS',
    ]);
  });

  it('does not mutate the input holdings', () => {
    const original = holdings.map((item) => item.ticker);

    sortPortfolioHoldings(holdings, { key: 'pnl', direction: 'asc' });

    expect(holdings.map((item) => item.ticker)).toEqual(original);
  });
});
