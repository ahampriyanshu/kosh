/**
 * Stat — a labeled mono figure (price, value, etc.)
 */
interface StatProps {
  label: string;
  value: string | number;
  suffix?: string;
  className?: string;
}

export function Stat({ label, value, suffix, className = '' }: StatProps) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="text-xs font-sans text-[var(--color-faint)] uppercase tracking-wider">
        {label}
      </span>
      <span className="font-mono text-base font-medium text-[var(--color-ink)] tabular-nums">
        {value}
        {suffix && (
          <span className="text-sm text-[var(--color-muted)] ml-0.5">{suffix}</span>
        )}
      </span>
    </div>
  );
}
