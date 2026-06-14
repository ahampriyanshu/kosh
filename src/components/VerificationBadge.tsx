interface VerificationBadgeProps {
  hits: number;
  total: number;
}

export function VerificationBadge({ hits, total }: VerificationBadgeProps) {
  if (total === 0) return null;
  const ratio = hits / total;
  const color =
    ratio >= 0.6
      ? { fg: 'var(--color-bullish)', bg: 'var(--color-bullish-bg)', border: '#C8E6D8' }
      : ratio >= 0.3
      ? { fg: 'var(--color-medium)', bg: 'var(--color-medium-bg)', border: '#F0DFB8' }
      : { fg: 'var(--color-bearish)', bg: 'var(--color-bearish-bg)', border: '#F2D5CF' };

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono"
      style={{
        backgroundColor: color.bg,
        color: color.fg,
        border: `1px solid ${color.border}`,
      }}
    >
      <span aria-hidden="true">&#10003;</span>
      <span>
        {hits}/{total} calls hit
      </span>
    </span>
  );
}
