import Link from 'next/link';
import type { ReactNode } from 'react';

function IndexListRoot({ children }: { children: ReactNode }) {
  return <ul className="m-0 list-none p-0">{children}</ul>;
}

interface IndexRowProps {
  href: string;
  meta: string;
  title: string;
  description?: string;
  aside?: ReactNode;
}

function IndexRow({ href, meta, title, description, aside }: IndexRowProps) {
  return (
    <li className="py-2">
      <Link href={href} className="group grid gap-1 sm:grid-cols-[8rem_1fr_auto] sm:items-baseline sm:gap-3">
        <time className="font-sans text-sm text-[var(--color-muted)] sm:pt-0.5">
          {meta}
        </time>
        <span className="min-w-0">
          <span className="font-sans text-base text-[var(--color-link)] transition-colors group-hover:text-[var(--color-link-hover)]">
            {title}
          </span>
          {description && (
            <span className="mt-1 block text-sm text-[var(--color-muted)] leading-relaxed">
              {description}
            </span>
          )}
        </span>
        {aside && <span className="text-sm text-[var(--color-muted)]">{aside}</span>}
      </Link>
    </li>
  );
}

export const IndexList = Object.assign(IndexListRoot, { Row: IndexRow });
