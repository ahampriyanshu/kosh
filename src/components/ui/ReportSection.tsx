import type { ReactNode } from 'react';

interface ReportSectionProps {
  title: string;
  children: ReactNode;
  count?: number;
  className?: string;
}

export function ReportSection({ title, children, count, className = 'mt-8' }: ReportSectionProps) {
  return (
    <section className={className}>
      <h2 className="mb-3 font-display text-xl font-bold text-[var(--color-heading)]">
        {title}
        {count !== undefined && (
          <span className="ml-2 font-sans text-sm font-normal text-[var(--color-muted)]">
            ({count})
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}
