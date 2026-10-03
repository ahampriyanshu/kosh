import type { MarketSnapshot } from '../../../lib/schemas';
import { ticker } from './Figure';

interface StreetRadarProps {
  recs: MarketSnapshot['streetRecommendations'];
  priceLookup?: Record<string, number>;
}

export function StreetRadar({ recs, priceLookup = {} }: StreetRadarProps) {
  if (!recs || recs.length === 0) return null;

  return (
    <div className="border border-[var(--color-hairline)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--color-hairline)]">
        <span className="font-serif font-bold text-xs uppercase tracking-wider text-[var(--color-ink)]">
          Street Consensus & Brokerage Radar
        </span>
        <span className="text-[10px] text-[var(--color-muted)]">
          {recs.length} Institutional Targets
        </span>
      </div>

      <div className="divide-y divide-[var(--color-hairline)]/60">
        {recs.map((rec, idx) => {
          const ltp = priceLookup[rec.ticker];
          let upsidePct: number | null = null;
          if (ltp && rec.target) {
            upsidePct = ((rec.target - ltp) / ltp) * 100;
          }

          const action = rec.action.toLowerCase();
          const isBullish = action === 'buy' || action === 'accumulate' || action === 'outperform';
          const isBearish = action === 'sell' || action === 'reduce' || action === 'underperform';

          return (
            <div key={`${rec.ticker}-${idx}`} className="py-2.5 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-serif text-xs font-bold text-[var(--color-ink)]">
                    {ticker(rec.ticker)}
                  </span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 border border-[var(--color-hairline)] text-[var(--color-muted)]">
                    {rec.brokerage}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 ${
                      isBullish
                        ? 'bg-[var(--color-bullish-bg)] text-[var(--color-bullish)]'
                        : isBearish
                        ? 'bg-[var(--color-bearish-bg)] text-[var(--color-bearish)]'
                        : 'border border-[var(--color-hairline)] text-[var(--color-muted)]'
                    }`}
                  >
                    {rec.action}
                  </span>

                  {rec.target && (
                    <span className="text-xs font-bold text-[var(--color-ink)] tabular-nums">
                      Target ₹{rec.target.toLocaleString('en-IN')}
                    </span>
                  )}

                  {upsidePct !== null && (
                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        upsidePct >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'
                      }`}
                    >
                      ({upsidePct >= 0 ? '+' : ''}{upsidePct.toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>

              {rec.rationale && (
                <p className="font-sans text-xs text-[var(--color-muted)] leading-relaxed line-clamp-2">
                  {rec.rationale}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
