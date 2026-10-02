import type { MarketSnapshot } from '../../../lib/schemas';
import { ticker } from './Figure';

interface TacticalRadarProps {
  volumeShockers: MarketSnapshot['volumeShockers'];
  near52wHigh: MarketSnapshot['near52wHigh'];
  near52wLow: MarketSnapshot['near52wLow'];
}

export function TacticalRadar({
  volumeShockers,
  near52wHigh,
  near52wLow,
}: TacticalRadarProps) {
  const hasVolume = volumeShockers && volumeShockers.length > 0;
  const hasExtremes =
    (near52wHigh && near52wHigh.length > 0) || (near52wLow && near52wLow.length > 0);

  if (!hasVolume && !hasExtremes) return null;

  return (
    <div className="border border-[var(--color-hairline)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--color-hairline)]">
        <span className="font-serif font-bold text-xs uppercase tracking-wider text-[var(--color-ink)]">
          Tactical Radar · Extremes & Anomalies
        </span>
        <span className="text-[10px] text-[var(--color-muted)] uppercase">
          Scanner
        </span>
      </div>

      <div className="space-y-4">
        {/* 1. Volume Shockers */}
        {hasVolume && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-sans text-xs font-semibold text-[var(--color-ink)]">
                Volume Multipliers (&gt;2.0x 30D Average)
              </span>
              <span className="text-[10px] text-[var(--color-muted)]">
                Institutional Footprint
              </span>
            </div>

            <div className="space-y-2">
              {volumeShockers.map((v) => (
                <div
                  key={v.ticker}
                  className="flex items-center justify-between p-2 border border-[var(--color-hairline)]"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-serif text-xs font-bold text-[var(--color-ink)] mr-2">
                      {ticker(v.ticker)}
                    </span>
                    <span className="font-sans text-xs text-[var(--color-muted)] truncate inline-block max-w-[140px] align-bottom">
                      {v.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-[var(--color-muted)] tabular-nums hidden sm:inline">
                      {Math.round(v.volume).toLocaleString('en-IN')} shares
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 bg-[var(--color-bullish-bg)] text-[var(--color-bullish)] tabular-nums">
                      {v.ratio.toFixed(2)}x Vol
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. 52-Week High & Low Extremes (within 2%) */}
        {hasExtremes && (
          <div className="pt-2 border-t border-[var(--color-hairline)]/70">
            <span className="font-sans text-xs font-semibold text-[var(--color-ink)] block mb-2">
              52-Week Range Proximity (±2% of Extremes)
            </span>

            <div className="space-y-1.5">
              {near52wHigh.map((item) => (
                <div
                  key={item.ticker}
                  className="flex items-center justify-between text-xs py-1 px-1.5 hover:bg-[var(--color-raised)] transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-serif font-bold text-[var(--color-ink)]">
                      {ticker(item.ticker)}
                    </span>
                    <span className="text-[var(--color-muted)] truncate max-w-[120px]">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="tabular-nums text-[var(--color-ink)]">
                      ₹{item.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="font-semibold text-[var(--color-bearish)] tabular-nums">
                      −{item.pctFromHigh.toFixed(2)}% off 52W High
                    </span>
                  </div>
                </div>
              ))}

              {near52wLow.map((item) => (
                <div
                  key={item.ticker}
                  className="flex items-center justify-between text-xs py-1 px-1.5 hover:bg-[var(--color-raised)] transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-serif font-bold text-[var(--color-ink)]">
                      {ticker(item.ticker)}
                    </span>
                    <span className="text-[var(--color-muted)] truncate max-w-[120px]">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="tabular-nums text-[var(--color-ink)]">
                      ₹{item.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="font-semibold text-[var(--color-bullish)] tabular-nums">
                      +{item.pctFromLow.toFixed(2)}% off 52W Low
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
