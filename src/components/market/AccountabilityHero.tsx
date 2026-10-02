import Link from 'next/link';
import { readAllLedgers } from '../../lib/reports';

export async function AccountabilityHero() {
  const ledgers = await readAllLedgers();

  let totalBets = 0;
  let hits = 0;
  let misses = 0;
  let partials = 0;
  const recentMissNotes: string[] = [];

  for (const ledger of ledgers) {
    for (const entry of ledger.entries || []) {
      for (const bet of entry.bets || []) {
        totalBets++;
        if (bet.outcome === 'hit') hits++;
        else if (bet.outcome === 'miss') {
          misses++;
          if (bet.thesis && recentMissNotes.length < 2) {
            recentMissNotes.push(`${bet.ticker.replace('.NS', '')}: ${bet.note || 'Thesis invalidated'}`);
          }
        } else if (bet.outcome === 'partial') {
          partials++;
        }
      }
    }
  }

  const winRate = hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(1) : '0';
  const hitPct = totalBets > 0 ? (hits / totalBets) * 100 : 0;
  const partialPct = totalBets > 0 ? (partials / totalBets) * 100 : 0;
  const missPct = totalBets > 0 ? (misses / totalBets) * 100 : 0;

  if (totalBets === 0) return null;

  return (
    <div className="broadsheet-card mb-8 border border-[var(--color-hairline)] bg-[var(--color-surface)] shadow-xs">
      {/* Top Banner Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-hairline)]/80">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-bullish)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-bullish)]" />
          </span>
          <span className="kicker-tag text-[var(--color-ink)]">
            THE UNFORGIVING LEDGER · AUDITED TRACK RECORD
          </span>
        </div>

        <Link
          href="/scorecard"
          className="font-mono text-xs font-semibold text-[var(--color-brand)] hover:underline inline-flex items-center gap-1"
        >
          View Graded Calls Archive →
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-b border-[var(--color-hairline)]/80">
        <div>
          <span className="font-sans text-xs text-[var(--color-muted)] block mb-0.5">
            Graded Positional Calls
          </span>
          <span className="font-mono text-2xl font-bold text-[var(--color-ink)] tabular-nums">
            {totalBets}
          </span>
          <span className="font-mono text-[11px] text-[var(--color-faint)] block mt-0.5">
            Since June 2026
          </span>
        </div>

        <div>
          <span className="font-sans text-xs text-[var(--color-muted)] block mb-0.5">
            Strict Win Rate (Hit vs Miss)
          </span>
          <span className="font-mono text-2xl font-bold text-[var(--color-bullish)] tabular-nums">
            {winRate}%
          </span>
          <span className="font-mono text-[11px] text-[var(--color-faint)] block mt-0.5">
            Directional accuracy
          </span>
        </div>

        <div>
          <span className="font-sans text-xs text-[var(--color-muted)] block mb-0.5">
            Outcome Distribution
          </span>
          <span className="font-mono text-base font-semibold text-[var(--color-ink)] tabular-nums block">
            <span className="text-[var(--color-bullish)]">{hits} Hits</span> ·{' '}
            <span className="text-[var(--color-muted)]">{partials} Partials</span> ·{' '}
            <span className="text-[var(--color-bearish)]">{misses} Misses</span>
          </span>
          {/* Proportion bar */}
          <div className="w-full h-1.5 bg-[var(--color-surface-hover)] rounded-full mt-2 overflow-hidden flex">
            <div style={{ width: `${hitPct}%` }} className="bg-[var(--color-bullish)] h-full" title={`Hits: ${hits}`} />
            <div style={{ width: `${partialPct}%` }} className="bg-amber-400 h-full" title={`Partials: ${partials}`} />
            <div style={{ width: `${missPct}%` }} className="bg-[var(--color-bearish)] h-full" title={`Misses: ${misses}`} />
          </div>
        </div>

        <div>
          <span className="font-sans text-xs text-[var(--color-muted)] block mb-0.5">
            Verification Protocol
          </span>
          <span className="font-mono text-sm font-semibold text-[var(--color-ink)] block">
            GitHub Actions Auto-Grade
          </span>
          <span className="font-mono text-[11px] text-[var(--color-muted)] block mt-0.5">
            Zero hindsight editing · Commit audit
          </span>
        </div>
      </div>

      {/* Radical Honesty: Documented Blindspots / What We Missed */}
      {recentMissNotes.length > 0 && (
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold uppercase text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bearish-bg)] text-[var(--color-bearish)]">
              Audited Blindspot
            </span>
            <span className="font-sans text-[var(--color-muted)] truncate max-w-md">
              {recentMissNotes[0]}
            </span>
          </div>
          <span className="font-mono text-[11px] text-[var(--color-faint)] shrink-0">
            Open retro grading every Sunday 21:00 IST
          </span>
        </div>
      )}
    </div>
  );
}
