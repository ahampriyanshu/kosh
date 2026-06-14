/**
 * Pct — a percentage figure colored by sign, always showing +/-
 */
interface PctProps {
  value: number;
  decimals?: number;
  className?: string;
}

export function Pct({ value, decimals = 2, className = '' }: PctProps) {
  const positive = value > 0;
  const negative = value < 0;
  const color = positive
    ? 'text-[var(--color-bullish)]'
    : negative
    ? 'text-[var(--color-bearish)]'
    : 'text-[var(--color-neutral)]';

  const sign = positive ? '+' : '';
  const glyph = positive ? '▲' : negative ? '▼' : '—';

  return (
    <span
      className={`font-mono tabular-nums text-sm font-medium inline-flex items-center gap-0.5 ${color} ${className}`}
    >
      <span aria-hidden="true" className="text-xs">{glyph}</span>
      {sign}{value.toFixed(decimals)}%
    </span>
  );
}
