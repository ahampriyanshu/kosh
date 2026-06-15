import type { MarketSnapshot } from '../../../lib/schemas';
import { Pct } from './Figure';

interface GlobalCuesProps {
  globalIndices: MarketSnapshot['globalIndices'];
  commodities: MarketSnapshot['commodities'];
  currencies: MarketSnapshot['currencies'];
}

export function GlobalCues({ globalIndices, commodities, currencies }: GlobalCuesProps) {
  const hasGlobal = globalIndices && globalIndices.length > 0;
  const hasCommodities = commodities && commodities.length > 0;
  const hasCurrencies = currencies && currencies.length > 0;

  if (!hasGlobal && !hasCommodities && !hasCurrencies) return null;

  return (
    <div className="space-y-6">
      {hasGlobal && (
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-faint)] mb-2">
            Global indices
          </p>
          <div className="space-y-1">
            {globalIndices.map((idx) => (
              <div key={idx.symbol} className="flex items-center justify-between py-1 border-b border-[var(--color-hairline)] last:border-0">
                <span className="text-sm text-[var(--color-muted)] truncate flex-1 mr-4">{idx.name}</span>
                <span className="font-mono tabular-nums text-sm text-[var(--color-ink)] mr-3">
                  {idx.ltp.toLocaleString()}
                </span>
                <Pct value={idx.changePct} className="text-sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {hasCommodities && (
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-faint)] mb-2">
            Commodities
          </p>
          <div className="space-y-1">
            {commodities.map((c) => (
              <div key={c.name} className="flex items-center justify-between py-1 border-b border-[var(--color-hairline)] last:border-0">
                <span className="text-sm text-[var(--color-muted)] truncate flex-1 mr-4">{c.name}</span>
                <span className="font-mono tabular-nums text-sm text-[var(--color-ink)] mr-3">
                  {c.value.toLocaleString()}
                </span>
                <Pct value={c.changePct} className="text-sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {hasCurrencies && (
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-faint)] mb-2">
            Currency
          </p>
          <div className="space-y-1">
            {currencies.map((cur) => (
              <div key={cur.pair} className="flex items-center justify-between py-1 border-b border-[var(--color-hairline)] last:border-0">
                <span className="font-mono tabular-nums text-sm text-[var(--color-muted)] truncate flex-1 mr-4">{cur.pair}</span>
                <span className="font-mono tabular-nums text-sm text-[var(--color-ink)] mr-3">
                  {cur.value.toLocaleString()}
                </span>
                <Pct value={cur.changePct} className="text-sm" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
