import type { MarketSnapshot } from '../../../lib/schemas';

interface BreadthBarProps {
  breadth: MarketSnapshot['breadth'];
}

export default function BreadthBar({ breadth }: BreadthBarProps) {
  if (!breadth) return null;

  const { advances, declines, adRatio } = breadth;
  const total = advances + declines;

  // Avoid division by zero
  if (total === 0) return null;

  return (
    <div>
      {/* Horizontal bar */}
      <div className="flex h-2 rounded overflow-hidden">
        <div
          className="bg-[var(--color-bullish)]"
          style={{ flex: advances }}
        />
        <div
          className="bg-[var(--color-bearish)]"
          style={{ flex: declines }}
        />
      </div>

      {/* Caption */}
      <p className="mt-2 font-mono text-xs tabular-nums">
        <span style={{ color: 'var(--color-bullish)' }}>▲ {advances.toLocaleString()}</span>
        {' '}
        <span style={{ color: 'var(--color-bearish)' }}>▼ {declines.toLocaleString()}</span>
        {' '}
        <span className="text-[var(--color-faint)]">A/D {adRatio.toFixed(2)}</span>
      </p>
    </div>
  );
}
