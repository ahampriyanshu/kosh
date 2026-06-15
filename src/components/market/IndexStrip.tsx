import type { MarketSnapshot } from '../../../lib/schemas';
import { Pct } from './Figure';

interface IndexStripProps {
  indices: MarketSnapshot['indianIndices'];
}

export function IndexStrip({ indices }: IndexStripProps) {
  if (!indices || indices.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {indices.map((idx) => (
        <div
          key={idx.symbol}
          className="border border-[var(--color-hairline)] rounded-lg bg-[var(--color-surface)] p-3"
        >
          <p className="font-sans text-xs text-[var(--color-muted)] mb-1 truncate">{idx.name}</p>
          <p className="font-mono text-lg tabular-nums text-[var(--color-ink)] leading-tight">
            {idx.ltp.toLocaleString('en-IN')}
          </p>
          <Pct value={idx.changePct} className="text-sm" />
        </div>
      ))}
    </div>
  );
}
