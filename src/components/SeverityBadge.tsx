import type { AlertSeverity } from '../../lib/schemas';

const CONFIG: Record<
  AlertSeverity,
  { label: string; bg: string; fg: string; border: string }
> = {
  high: {
    label: 'High',
    bg: 'var(--color-bearish-bg)',
    fg: 'var(--color-bearish)',
    border: '#F2D5CF',
  },
  medium: {
    label: 'Medium',
    bg: 'var(--color-medium-bg)',
    fg: 'var(--color-medium)',
    border: '#F0DFB8',
  },
  low: {
    label: 'Low',
    bg: 'var(--color-neutral-bg)',
    fg: 'var(--color-neutral)',
    border: '#E2DFDC',
  },
};

interface SeverityBadgeProps {
  severity: AlertSeverity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const c = CONFIG[severity];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-sans"
      style={{
        backgroundColor: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
      }}
    >
      {c.label}
    </span>
  );
}
