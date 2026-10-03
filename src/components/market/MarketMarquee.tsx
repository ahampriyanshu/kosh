import type { MarketSnapshot } from '../../../lib/schemas';

interface QuoteItem {
  key: string;
  name: string;
  value: string;
  changePct?: number;
}

interface MarketMarqueeProps {
  snapshot: MarketSnapshot;
}

export function MarketMarquee({ snapshot }: MarketMarqueeProps) {
  const items: QuoteItem[] = [];

  // Indian Indices
  snapshot.indianIndices.forEach((idx) => {
    items.push({
      key: `in-${idx.symbol}`,
      name: idx.name,
      value: idx.ltp.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
      changePct: idx.changePct,
    });
  });

  // Gift Nifty
  if (snapshot.giftNifty) {
    items.push({
      key: 'gift-nifty',
      name: 'Gift Nifty',
      value: snapshot.giftNifty.value.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
      changePct: snapshot.giftNifty.changePct,
    });
  }

  // India VIX
  if (snapshot.vix) {
    items.push({
      key: 'india-vix',
      name: 'India VIX',
      value: snapshot.vix.value.toFixed(2),
      changePct: snapshot.vix.changePct,
    });
  }

  // Global Indices
  snapshot.globalIndices?.forEach((idx) => {
    items.push({
      key: `gl-${idx.symbol || idx.name}`,
      name: idx.name,
      value: idx.ltp.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
      changePct: idx.changePct,
    });
  });

  // Commodities
  snapshot.commodities?.forEach((comm) => {
    items.push({
      key: `comm-${comm.name}`,
      name: comm.name,
      value: comm.value.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
      changePct: comm.changePct,
    });
  });

  // Currencies
  snapshot.currencies?.forEach((curr) => {
    items.push({
      key: `curr-${curr.pair}`,
      name: curr.pair,
      value: curr.value.toFixed(2),
      changePct: curr.changePct,
    });
  });

  if (items.length === 0) return null;

  // Duplicate items for a continuous seamless loop
  const marqueeItems = [...items, ...items];

  return (
    <div
      className="relative overflow-hidden py-2 border-b border-[var(--color-hairline)] font-serif select-none"
      aria-label="Market Marquee Ticker"
    >
      {/* Marquee Track Container with Edge Gradient Fades */}
      <div className="overflow-hidden w-full [mask-image:linear-gradient(to_right,transparent,black_1.5rem,black_calc(100%-1.5rem),transparent)]">
        <div className="animate-marquee flex items-center">
          {marqueeItems.map((item, idx) => (
            <div
              key={`${item.key}-${idx}`}
              className="flex items-center gap-1.5 px-4 shrink-0 text-xs border-r border-[var(--color-hairline)] last:border-r-0"
            >
              <span className="text-[var(--color-muted)] font-medium">{item.name}:</span>
              <span className="tabular-nums font-semibold text-[var(--color-ink)]">
                {item.value}
              </span>
              {item.changePct !== undefined && (
                <span
                  className={`tabular-nums font-medium ${
                    item.changePct >= 0
                      ? 'text-[var(--color-bullish)]'
                      : 'text-[var(--color-bearish)]'
                  }`}
                >
                  {item.changePct >= 0 ? '▲ +' : '▼ '}
                  {Math.abs(item.changePct).toFixed(2)}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
