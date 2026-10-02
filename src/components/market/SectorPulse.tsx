import type { MarketSnapshot } from '../../../lib/schemas';

interface SectorPulseProps {
  sectors: MarketSnapshot['sectorRanking'];
}

export function SectorPulse({ sectors }: SectorPulseProps) {
  if (!sectors || sectors.length === 0) return null;

  const sorted = [...sectors].sort((a, b) => b.changePct - a.changePct);
  const leader = sorted[0];
  const laggard = sorted[sorted.length - 1];

  // Find max absolute change to scale visual momentum bars
  const maxAbs = Math.max(...sorted.map((s) => Math.abs(s.changePct)), 1);

  return (
    <div className="border border-[var(--color-hairline)] bg-[var(--color-surface)] p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--color-hairline)]">
        <span className="font-serif font-bold text-xs uppercase tracking-wider text-[var(--color-ink)]">
          Sector Rotation Pulse
        </span>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-[var(--color-muted)]">Leader:</span>
          <span className="font-bold text-[var(--color-bullish)]">
            {leader.sector} {leader.changePct >= 0 ? '+' : ''}{leader.changePct.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Sector Rows */}
      <div className="space-y-2">
        {sorted.map((s) => {
          const isPositive = s.changePct >= 0;
          const barWidth = Math.min(100, Math.round((Math.abs(s.changePct) / maxAbs) * 100));

          return (
            <div
              key={s.sector}
              className="flex items-center justify-between text-xs py-1 px-1.5 hover:bg-[var(--color-raised)] transition-colors"
            >
              <span className="font-sans font-medium text-[var(--color-ink)] w-28 truncate">
                {s.sector}
              </span>

              {/* Center Momentum Divergence Bar */}
              <div className="flex-1 mx-3 flex items-center h-1.5 bg-[var(--color-surface-hover)]/60 overflow-hidden relative">
                {isPositive ? (
                  <div
                    style={{ width: `${barWidth}%` }}
                    className="h-full bg-[var(--color-bullish)] transition-all duration-300"
                  />
                ) : (
                  <div
                    style={{ width: `${barWidth}%` }}
                    className="h-full bg-[var(--color-bearish)] transition-all duration-300"
                  />
                )}
              </div>

              {/* Numerical Delta */}
              <span
                className={`text-xs font-semibold tabular-nums w-14 text-right ${
                  isPositive ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'
                }`}
              >
                {isPositive ? '+' : ''}
                {s.changePct.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer Laggard Note */}
      {laggard && laggard.changePct < 0 && (
        <div className="pt-2.5 mt-2 border-t border-[var(--color-hairline)]/70 flex items-center justify-between text-[11px] text-[var(--color-muted)]">
          <span>Heaviest Drag</span>
          <span className="text-[var(--color-bearish)] font-semibold">
            {laggard.sector} ({laggard.changePct.toFixed(2)}%)
          </span>
        </div>
      )}
    </div>
  );
}
