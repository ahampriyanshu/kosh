import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-10 flex items-start justify-between gap-6">
      <div className="max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-[var(--color-heading)] leading-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-base text-[var(--color-muted)] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 pt-1">{action}</div>}
    </div>
  );
}
