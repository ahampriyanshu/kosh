'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BetsNav() {
  const pathname = usePathname();
  const isShortTerm = pathname.includes('/bets/short-term');
  const isLongTerm = pathname.includes('/bets/long-term');

  return (
    <div className="border-b border-[var(--color-hairline)] pb-4 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-muted)] mb-1">
            Systematic Alpha · Quant Desk
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-ink)]">
            Quantitative Bets &amp; Formulas
          </h1>
        </div>

        <nav aria-label="Bets Horizon" className="flex items-center gap-1 border border-[var(--color-hairline)] p-1 bg-[var(--color-surface)] font-mono text-xs">
          <Link
            href="/bets/short-term"
            className={`px-3 py-1.5 transition-colors ${
              isShortTerm
                ? 'bg-[var(--color-raised)] text-[var(--color-ink)] font-bold shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            Short-Term (1–4W)
          </Link>
          <Link
            href="/bets/long-term"
            className={`px-3 py-1.5 transition-colors ${
              isLongTerm
                ? 'bg-[var(--color-raised)] text-[var(--color-ink)] font-bold shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            Long-Term (3–12M)
          </Link>
        </nav>
      </div>
    </div>
  );
}
