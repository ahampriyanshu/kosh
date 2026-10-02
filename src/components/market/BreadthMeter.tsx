import type { MarketSnapshot } from '../../../lib/schemas';

interface BreadthMeterProps {
  breadth: MarketSnapshot['breadth'];
  fiiDii: MarketSnapshot['fiiDii'];
  vix: MarketSnapshot['vix'];
}

function formatCrore(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}₹${Math.abs(value).toLocaleString('en-IN')} cr`;
}

export function BreadthMeter({ breadth, fiiDii, vix }: BreadthMeterProps) {
  if (!breadth && !fiiDii && !vix) return null;

  const total = breadth ? breadth.advances + breadth.declines : 0;
  const advancePct = total > 0 && breadth ? (breadth.advances / total) * 100 : 50;
  const declinePct = total > 0 && breadth ? (breadth.declines / total) * 100 : 50;

  return (
    <div className="broadsheet-card border border-[var(--color-hairline)] bg-[var(--color-surface)]">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--color-hairline)]">
        <span className="kicker-tag text-[var(--color-ink)]">
          MARKET BREADTH & INSTITUTIONAL FLOWS
        </span>
        {vix && (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-[var(--color-muted)]">INDIA VIX:</span>
            <span className="font-bold text-[var(--color-ink)] tabular-nums">
              {vix.value.toFixed(2)}
            </span>
            <span
              className={`text-[11px] ${
                vix.changePct <= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'
              }`}
            >
              ({vix.changePct >= 0 ? '+' : ''}{vix.changePct.toFixed(2)}%)
            </span>
          </div>
        )}
      </div>

      {/* 1. Advance / Decline Balance Beam */}
      {breadth && total > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-[var(--color-bullish)] font-semibold flex items-center gap-1">
              ▲ {breadth.advances.toLocaleString('en-IN')} Advances ({advancePct.toFixed(0)}%)
            </span>
            <span className="text-[var(--color-muted)]">
              A/D Ratio: <strong className="text-[var(--color-ink)]">{breadth.adRatio.toFixed(2)}</strong>
            </span>
            <span className="text-[var(--color-bearish)] font-semibold flex items-center gap-1">
              ▼ {breadth.declines.toLocaleString('en-IN')} Declines ({declinePct.toFixed(0)}%)
            </span>
          </div>

          {/* Visual Dual Balance Bar */}
          <div className="h-2 rounded-full overflow-hidden flex bg-[var(--color-surface-hover)]">
            <div
              style={{ width: `${advancePct}%` }}
              className="bg-[var(--color-bullish)] h-full transition-all duration-300"
            />
            <div
              style={{ width: `${declinePct}%` }}
              className="bg-[var(--color-bearish)] h-full transition-all duration-300"
            />
          </div>
        </div>
      )}

      {/* 2. Institutional Net Flows (FII vs DII) */}
      {fiiDii && (
        <div className="pt-3 border-t border-[var(--color-hairline)]/70 grid grid-cols-2 gap-4 text-xs">
          <div className="p-2 rounded bg-[var(--color-raised)] border border-[var(--color-hairline)]">
            <span className="text-[var(--color-muted)] block mb-0.5">FII Net Institutional</span>
            <span
              className={`font-mono text-sm font-bold tabular-nums ${
                fiiDii.fiiNet >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'
              }`}
            >
              {formatCrore(fiiDii.fiiNet)}
            </span>
          </div>

          <div className="p-2 rounded bg-[var(--color-raised)] border border-[var(--color-hairline)]">
            <span className="text-[var(--color-muted)] block mb-0.5">DII Net Domestic</span>
            <span
              className={`font-mono text-sm font-bold tabular-nums ${
                fiiDii.diiNet >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'
              }`}
            >
              {formatCrore(fiiDii.diiNet)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
