import { getReportsByType, readAllLedgers } from '../../lib/reports';
import { ScorecardRecaps } from '../../components/ScorecardRecaps';
import { PageHeader } from '../../components/ui/PageHeader';

export default async function ScorecardPage() {
  const [recaps, ledgers] = await Promise.all([
    getReportsByType('recap'),
    readAllLedgers(),
  ]);

  const sortedRecaps = [...recaps].sort((a, b) => b.dateKey.localeCompare(a.dateKey));

  // Compute all-time statistics across all ledger entries
  let totalBets = 0;
  let hits = 0;
  let misses = 0;
  let partials = 0;
  const monthlyStats: Array<{ month: string; hits: number; misses: number; partials: number; total: number }> = [];

  for (const ledger of ledgers) {
    let mHits = 0;
    let mMisses = 0;
    let mPartials = 0;
    for (const entry of ledger.entries || []) {
      for (const bet of entry.bets || []) {
        totalBets++;
        if (bet.outcome === 'hit') { hits++; mHits++; }
        else if (bet.outcome === 'miss') { misses++; mMisses++; }
        else if (bet.outcome === 'partial') { partials++; mPartials++; }
      }
    }
    const mTotal = mHits + mMisses + mPartials;
    if (mTotal > 0) {
      monthlyStats.push({ month: ledger.month, hits: mHits, misses: mMisses, partials: mPartials, total: mTotal });
    }
  }

  const winRate = hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(1) : '0';

  return (
    <div className="pb-12">
      <PageHeader
        title="Audited Scorecard"
        description="Backward-looking verification ledger of all weekly positional calls graded against actual NSE market closes."
      />

      {/* Aggregate Calibration Barometer */}
      {totalBets > 0 && (
        <div className="mb-8 border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--color-hairline)]">
            <span className="font-serif font-bold text-sm tracking-wide text-[var(--color-ink)] uppercase">
              All-Time Performance Record
            </span>
            <span className="tabular-nums text-xs text-[var(--color-muted)]">
              Audited June 2026 – Present
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 border-b border-[var(--color-hairline)]">
            <div>
              <span className="font-sans text-xs text-[var(--color-muted)] block mb-0.5">
                Total Positional Bets
              </span>
              <span className="font-serif text-2xl font-bold text-[var(--color-ink)] tabular-nums">
                {totalBets}
              </span>
            </div>
            <div>
              <span className="font-sans text-xs text-[var(--color-muted)] block mb-0.5">
                Directional Win Rate
              </span>
              <span className="font-serif text-2xl font-bold text-[var(--color-bullish)] tabular-nums">
                {winRate}%
              </span>
            </div>
            <div>
              <span className="font-sans text-xs text-[var(--color-muted)] block mb-0.5">
                Hit vs. Miss
              </span>
              <span className="text-base font-semibold text-[var(--color-ink)] tabular-nums">
                <span className="text-[var(--color-bullish)]">{hits} Hits</span> /{' '}
                <span className="text-[var(--color-bearish)]">{misses} Misses</span>
              </span>
            </div>
            <div>
              <span className="font-sans text-xs text-[var(--color-muted)] block mb-0.5">
                Partials / Scratch
              </span>
              <span className="text-base font-semibold text-[var(--color-muted)] tabular-nums">
                {partials} Calls
              </span>
            </div>
          </div>

          {/* Monthly Breakdown Ribbon */}
          {monthlyStats.length > 0 && (
            <div className="pt-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] block mb-2">
                Monthly Breakdown
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs tabular-nums">
                {monthlyStats.map((m) => {
                  const mWin = m.hits + m.misses > 0 ? ((m.hits / (m.hits + m.misses)) * 100).toFixed(0) : '0';
                  return (
                    <div
                      key={m.month}
                      className="p-2 border border-[var(--color-hairline)] flex items-center justify-between"
                    >
                      <span className="font-bold text-[var(--color-ink)]">{m.month}</span>
                      <span className="text-[var(--color-bullish)] font-semibold">
                        {mWin}% ({m.hits}/{m.total})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recaps Archive List */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-[var(--color-ink)]">
          Weekly Recap Archive
        </h2>
        {sortedRecaps.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-[var(--color-hairline)]">
            <p className="font-serif text-xl text-[var(--color-faint)]">
              No graded calls yet — the first Saturday recap will populate this.
            </p>
          </div>
        ) : (
          <ScorecardRecaps reports={sortedRecaps} />
        )}
      </div>
    </div>
  );
}
