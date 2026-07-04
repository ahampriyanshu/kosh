import type { PortfolioHolding } from './schemas';

export type PortfolioSortKey =
  | 'ticker'
  | 'quantity'
  | 'averagePrice'
  | 'lastPrice'
  | 'currentValue'
  | 'pnl'
  | 'dayValue'
  | 'allocationPct';

export type SortDirection = 'asc' | 'desc';

export type PortfolioSort = {
  key: PortfolioSortKey;
  direction: SortDirection;
};

function sortValue(holding: PortfolioHolding, key: PortfolioSortKey): number | string {
  switch (key) {
    case 'ticker':
      return holding.ticker;
    case 'quantity':
      return holding.quantity;
    case 'averagePrice':
      return holding.averagePrice;
    case 'lastPrice':
      return holding.lastPrice;
    case 'currentValue':
      return holding.currentValue;
    case 'pnl':
      return holding.pnl;
    case 'dayValue':
      return holding.dayChange * holding.quantity;
    case 'allocationPct':
      return holding.allocationPct;
  }
}

export function sortPortfolioHoldings(holdings: PortfolioHolding[], sort: PortfolioSort): PortfolioHolding[] {
  const direction = sort.direction === 'asc' ? 1 : -1;

  return [...holdings].sort((a, b) => {
    const aValue = sortValue(a, sort.key);
    const bValue = sortValue(b, sort.key);
    const result =
      typeof aValue === 'string' && typeof bValue === 'string'
        ? aValue.localeCompare(bValue)
        : Number(aValue) - Number(bValue);

    return result === 0 ? a.ticker.localeCompare(b.ticker) : result * direction;
  });
}
