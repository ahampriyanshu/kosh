import type { ReactNode } from 'react';

// Signed percent in mono with bullish/bearish color.
export function Pct({ value, className = '' }: { value: number; className?: string }) {
  const color = value > 0 ? 'var(--color-bullish)' : value < 0 ? 'var(--color-bearish)' : 'var(--color-neutral)';
  return (
    <span className={`font-mono tabular-nums ${className}`} style={{ color }}>
      {value > 0 ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}

// A labelled stat block.
export function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-[var(--color-faint)] mb-0.5">{label}</p>
      <div className="font-mono text-[var(--color-ink)]">{children}</div>
    </div>
  );
}

// Strip a `.NS`/`.BO` suffix for display.
export function ticker(symbol: string): string {
  return symbol.replace(/\.(NS|BO)$/, '');
}

// Section wrapper with a heading.
export function Section({ title, children, count }: { title: string; children: ReactNode; count?: number }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-bold text-[var(--color-ink)] mb-3 pb-2 border-b border-[var(--color-hairline)]">
        {title}
        {count !== undefined && <span className="ml-2 font-mono text-sm font-normal text-[var(--color-faint)]">({count})</span>}
      </h2>
      {children}
    </section>
  );
}
