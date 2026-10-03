import { getReportsByType, readAllLedgers } from '../../lib/reports';
import { ScorecardRecaps } from '../../components/ScorecardRecaps';
import { PageHeader } from '../../components/ui/PageHeader';

interface FlattenedBet {
  month: string;
  gradedOn: string;
  ticker: string;
  name: string;
  action: 'buy' | 'sell' | 'hold';
  entryRef: number;
  exitRef: number;
  changePct: number;
  outcome: 'hit' | 'miss' | 'partial';
  thesis: string;
  note: string;
}

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
  const allBets: FlattenedBet[] = [];

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

        allBets.push({
          month: ledger.month,
          gradedOn: entry.gradedOn,
          ticker: bet.ticker.replace('.NS', ''),
          name: bet.name,
          action: bet.action,
          entryRef: bet.entryRef,
          exitRef: bet.exitRef,
          changePct: bet.changePct,
          outcome: bet.outcome,
          thesis: bet.thesis,
          note: bet.note,
        });
      }
    }
    const mTotal = mHits + mMisses + mPartials;
    if (mTotal > 0) {
      monthlyStats.push({ month: ledger.month, hits: mHits, misses: mMisses, partials: mPartials, total: mTotal });
    }
  }

  // Sort bets chronologically newest first
  allBets.sort((a, b) => b.gradedOn.localeCompare(a.gradedOn));

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

      {/* Audited Positional Calls Ledger */}
      <div className="mb-10 border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-hairline)]">
          <span className="font-serif font-bold text-sm tracking-wide text-[var(--color-ink)] uppercase">
            Audited Positional Calls Ledger
          </span>
          <span className="tabular-nums text-xs text-[var(--color-muted)] font-mono">
            {allBets.length} Evaluated Calls
          </span>
        </div>

        {/* Clean Inline Stats Ribbon */}
        <div className="py-2 border-b border-[var(--color-hairline)] grid grid-cols-2 sm:grid-cols-5 text-center text-xs font-mono divide-x divide-[var(--color-hairline)]">
          <div>
            <span className="text-[10px] text-[var(--color-muted)] uppercase block">Evaluated</span>
            <span className="font-bold text-sm text-[var(--color-ink)] tabular-nums">{totalBets}</span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--color-muted)] uppercase block">Win Rate</span>
            <span className="font-bold text-sm text-[var(--color-bullish)] tabular-nums">{winRate}%</span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--color-muted)] uppercase block">Hits</span>
            <span className="font-bold text-sm text-[var(--color-bullish)] tabular-nums">{hits}</span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--color-muted)] uppercase block">Misses</span>
            <span className="font-bold text-sm text-[var(--color-bearish)] tabular-nums">{misses}</span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--color-muted)] uppercase block">Scratch</span>
            <span className="font-bold text-sm text-[var(--color-muted)] tabular-nums">{partials}</span>
          </div>
        </div>

        {/* Detailed Master Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-serif">
            <thead className="text-[10px] font-mono uppercase text-[var(--color-muted)]">
              <tr>
                <th className="py-2 px-2">Date</th>
                <th className="py-2 px-2">Ticker</th>
                <th className="py-2 px-2">Action</th>
                <th className="py-2 px-2 text-right">Entry</th>
                <th className="py-2 px-2 text-right">Exit</th>
                <th className="py-2 px-2 text-right">Return</th>
                <th className="py-2 px-2 text-center">Outcome</th>
                <th className="py-2 px-2 min-w-[200px]">Thesis &amp; Audit Note</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[11px]">
              {allBets.length > 0 ? (
                allBets.map((bet, idx) => (
                  <tr key={idx} className="hover:bg-[var(--color-hairline)]/20 transition-colors">
                    <td className="py-2 px-2 text-[var(--color-muted)] whitespace-nowrap">
                      {bet.gradedOn}
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <strong className="text-[var(--color-ink)] font-bold">{bet.ticker}</strong>
                      <span className="text-[10px] text-[var(--color-muted)] block font-serif truncate max-w-[140px]">{bet.name}</span>
                    </td>
                    <td className="py-2 px-2 uppercase font-semibold">
                      {bet.action}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      ₹{bet.entryRef.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      ₹{bet.exitRef.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums font-semibold">
                      <span className={bet.changePct > 0 ? 'text-[var(--color-bullish)]' : bet.changePct < 0 ? 'text-[var(--color-bearish)]' : 'text-[var(--color-muted)]'}>
                        {bet.changePct > 0 ? '+' : ''}{bet.changePct.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center whitespace-nowrap font-bold">
                      {bet.outcome === 'hit' && (
                        <span className="text-[var(--color-bullish)]">HIT</span>
                      )}
                      {bet.outcome === 'miss' && (
                        <span className="text-[var(--color-bearish)]">MISS</span>
                      )}
                      {bet.outcome === 'partial' && (
                        <span className="text-[var(--color-muted)]">SCRATCH</span>
                      )}
                    </td>
                    <td className="py-2 px-2 font-serif text-[11px] text-[var(--color-muted)] leading-relaxed">
                      <p className="text-[var(--color-ink)] font-medium mb-0.5">{bet.thesis}</p>
                      <span className="font-mono text-[10px] text-[var(--color-muted)]">{bet.note}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-4 text-center text-xs text-[var(--color-muted)] font-serif">
                    No evaluated ledger entries recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
