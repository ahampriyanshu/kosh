'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BetsNav() {
  const pathname = usePathname();
  const isShortTerm = pathname.includes('/bets/short-term');
  const isLongTerm = pathname.includes('/bets/long-term');

  return (
    <header className="border-b border-[var(--color-hairline)] pb-4 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-muted)]">
            Kosh Quantitative Intelligence · Systematic Strategies
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-ink)] mt-1">
            Systematic Equities Research
          </div>
        </div>

        <nav aria-label="Strategy Horizon" className="flex items-center gap-3 text-xs font-mono">
          <Link
            href="/bets/short-term"
            className={`pb-0.5 border-b transition-colors ${
              isShortTerm
                ? 'border-[var(--color-ink)] text-[var(--color-ink)] font-bold'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            Short-Term (1–4W)
          </Link>
          <span className="text-[var(--color-hairline)]">/</span>
          <Link
            href="/bets/long-term"
            className={`pb-0.5 border-b transition-colors ${
              isLongTerm
                ? 'border-[var(--color-ink)] text-[var(--color-ink)] font-bold'
                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            Long-Term (3–12M)
          </Link>
        </nav>
      </div>
    </header>
  );
}
