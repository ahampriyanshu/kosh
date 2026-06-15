import { readAllLedgers } from '../../lib/reports';
import type { Ledger, LedgerEntry, GradedBet } from '../../../lib/schemas';
import { Pct, Section, ticker } from '../../components/market/Figure';

// Outcome badge colors via CSS vars
function OutcomeBadge({ outcome }: { outcome: GradedBet['outcome'] }) {
  const styles: Record<GradedBet['outcome'], { bg: string; text: string; label: string }> = {
    hit:     { bg: 'var(--color-bullish-bg)', text: 'var(--color-bullish)', label: 'Hit' },
    miss:    { bg: 'var(--color-bearish-bg)', text: 'var(--color-bearish)', label: 'Miss' },
    partial: { bg: 'var(--color-neutral-bg)', text: 'var(--color-neutral)',  label: 'Partial' },
  };
  const s = styles[outcome];
  return (
    <span
      className="font-sans text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

function EntryBetsTable({ bets }: { bets: GradedBet[] }) {
  if (bets.length === 0) return null;
  return (
    <table className="w-full text-sm mt-2">
      <thead>
        <tr className="border-b border-[var(--color-hairline)] text-left">
          <th className="font-sans text-[10px] font-semibold uppercase tracking-widest text-[var(--color-faint)] pb-1 pr-4">Ticker</th>
          <th className="font-sans text-[10px] font-semibold uppercase tracking-widest text-[var(--color-faint)] pb-1 pr-4">Action</th>
          <th className="font-sans text-[10px] font-semibold uppercase tracking-widest text-[var(--color-faint)] pb-1 pr-4">Change</th>
          <th className="font-sans text-[10px] font-semibold uppercase tracking-widest text-[var(--color-faint)] pb-1">Outcome</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--color-hairline)]">
        {bets.map((bet, i) => (
          <tr key={i}>
            <td className="font-mono text-[var(--color-ink)] py-1.5 pr-4">{ticker(bet.ticker)}</td>
            <td className="font-sans text-xs text-[var(--color-muted)] py-1.5 pr-4 capitalize">{bet.action}</td>
            <td className="py-1.5 pr-4"><Pct value={bet.changePct} /></td>
            <td className="py-1.5"><OutcomeBadge outcome={bet.outcome} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LedgerEntryRow({ entry }: { entry: LedgerEntry }) {
  return (
    <div className="border border-[var(--color-hairline)] rounded-lg bg-[var(--color-surface)] p-4 mb-3">
      <div className="flex items-baseline gap-6 mb-2">
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-[var(--color-faint)] mb-0.5">Graded On</p>
          <span className="font-mono text-sm text-[var(--color-ink)]">{entry.gradedOn}</span>
        </div>
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-[var(--color-faint)] mb-0.5">Source</p>
          <a
            href={`/reports/recap/${entry.gradedOn}`}
            className="font-mono text-sm text-[var(--color-brand)] hover:underline"
          >
            {entry.sourceReportId}
          </a>
        </div>
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-[var(--color-faint)] mb-0.5">Hits</p>
          <span className="font-mono text-sm text-[var(--color-ink)]">{entry.hits}/{entry.total}</span>
        </div>
      </div>
      <EntryBetsTable bets={entry.bets} />
    </div>
  );
}

function MonthHitRate({ entries }: { entries: LedgerEntry[] }) {
  const hits = entries.reduce((s, e) => s + e.hits, 0);
  const total = entries.reduce((s, e) => s + e.total, 0);
  const pct = total ? Math.round((hits / total) * 100) : 0;
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <span className="font-mono text-2xl font-bold text-[var(--color-ink)]">{pct}%</span>
      <span className="font-sans text-xs text-[var(--color-muted)]">{hits}/{total} bets graded this month</span>
    </div>
  );
}

export default async function ScorecardPage() {
  const ledgers: Ledger[] = await readAllLedgers();

  // Compute overall hit-rate
  const allEntries = ledgers.flatMap((l) => l.entries);
  const totalHits = allEntries.reduce((s, e) => s + e.hits, 0);
  const totalBets = allEntries.reduce((s, e) => s + e.total, 0);
  const overallPct = totalBets ? Math.round((totalHits / totalBets) * 100) : 0;

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)] mb-1">
          Track record
        </p>
        <h1 className="font-display text-3xl font-black text-[var(--color-ink)] leading-tight">
          Scorecard
        </h1>
        <div className="mt-3 h-px bg-[var(--color-hairline)]" />
      </div>

      {/* Overall hit-rate */}
      <div className="border border-[var(--color-hairline)] rounded-lg bg-[var(--color-surface)] p-6 mb-8 text-center">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-faint)] mb-2">
          Overall Hit Rate
        </p>
        <p className="font-mono text-5xl font-bold text-[var(--color-ink)] mb-1">
          {overallPct}%
        </p>
        <p className="font-sans text-sm text-[var(--color-muted)]">
          {totalHits}/{totalBets} bets graded
        </p>
      </div>

      {/* Empty state */}
      {ledgers.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[var(--color-hairline)] rounded-xl">
          <p className="font-display text-xl text-[var(--color-faint)]">
            No graded calls yet — the first Saturday recap will populate this.
          </p>
        </div>
      ) : (
        <div>
          {ledgers.map((ledger) => (
            <Section key={ledger.month} title={ledger.month}>
              <MonthHitRate entries={ledger.entries} />
              {ledger.entries.length === 0 ? (
                <p className="font-sans text-sm text-[var(--color-faint)]">No entries this month.</p>
              ) : (
                ledger.entries.map((entry, i) => (
                  <LedgerEntryRow key={i} entry={entry} />
                ))
              )}
            </Section>
          ))}
        </div>
      )}
    </div>
  );
}
