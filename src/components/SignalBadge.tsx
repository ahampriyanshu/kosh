import type { Signal } from '../../lib/schemas';

const CONFIG: Record<
  Signal,
  { glyph: string; label: string; bg: string; fg: string; border: string }
> = {
  bullish: {
    glyph: '▲',
    label: 'Bullish',
    bg: 'var(--color-bullish-bg)',
    fg: 'var(--color-bullish)',
    border: '#C8E6D8',
  },
  bearish: {
    glyph: '▼',
    label: 'Bearish',
    bg: 'var(--color-bearish-bg)',
    fg: 'var(--color-bearish)',
    border: '#F2D5CF',
  },
  neutral: {
    glyph: '—',
    label: 'Neutral',
    bg: 'var(--color-neutral-bg)',
    fg: 'var(--color-neutral)',
    border: '#E2DFDC',
  },
};

interface SignalBadgeProps {
  signal: Signal;
  showLabel?: boolean;
}

export function SignalBadge({ signal, showLabel = true }: SignalBadgeProps) {
  const c = CONFIG[signal];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium font-sans"
      style={{
        backgroundColor: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
      }}
    >
      <span aria-hidden="true">{c.glyph}</span>
      {showLabel && <span>{c.label}</span>}
    </span>
  );
}
