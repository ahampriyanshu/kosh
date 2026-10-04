import type { Metadata } from 'next';
import Link from 'next/link';
import { getActiveBets, getClosedBets } from '../../../../lib/bets-store';

export const metadata: Metadata = {
  title: 'Short-Term Tactical Models | Methodology & Formulation | Kosh',
  description:
    'Mathematical formulations and execution protocols for four distinct short-term tactical equity models across Indian equities.',
  alternates: { canonical: '/bets/short-term' },
};

export default async function ShortTermBetsPage() {
  const activeBets = await getActiveBets('short_term');
  const closedBets = await getClosedBets('short_term');

  return (
    <article className="max-w-4xl mx-auto space-y-12 pb-20 font-serif text-[var(--color-ink)] leading-relaxed">
      {/* Title & Metadata Header */}
      <header className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-ink)] leading-tight">
          Tactical Equity Models: Four Distinct Short-Term Quantitative Setups
        </h1>
        <p className="font-mono text-xs text-[var(--color-muted)]">
          Issuance: Once Weekly · Settlement: Daily Late-Night Expiry Cron · Universe: NSE NIFTY 100 &amp; F&amp;O Equities
        </p>
      </header>

      {/* Abstract */}
      <section className="border-l-2 border-[var(--color-ink)] pl-4 italic text-sm text-[var(--color-muted)]">
        <p>
          Abstract—High statistical confidence in short-term equities trading requires moving past generalized
          indicators into sharply defined structural regimes. Rather than deploying a monolithic screening rule,
          Kosh classifies tactical setups into four specialized quantitative categories: Dual Momentum Breakouts,
          Contrarian Mean-Reversions, Derivatives Open Interest Build-Ups, and Post-Earnings Announcement Drift (PEAD).
          Every call carries an explicit Call Date and Expiry Date. A daily late-night settlement cron evaluates all calls
          reaching their maturity date, settling them strictly as Hit or Miss, with automated causal post-mortems for
          every missed objective.
        </p>
      </section>

      {/* Section I */}
      <section className="space-y-4">
        <h2 className="text-base font-mono font-bold uppercase tracking-wider text-[var(--color-ink)] border-b border-[var(--color-hairline)] pb-1">
          I. The Four Tactical Categories
        </h2>
        <p className="text-base text-justify">
          To achieve institutional confidence, every short-term bet must satisfy the precise invariants of one of four
          distinct market anomalies. A generic setup that partially matches multiple patterns without fulfilling all
          gates of a specific category is rejected by the screener.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-xs font-mono text-[var(--color-ink)] pt-2">
          <div>
            <strong className="block text-[var(--color-ink)] font-bold mb-0.5">1. Dual Momentum Breakout</strong>
            <span className="text-[var(--color-muted)] font-serif block">
              Trend-following model capturing strong relative strength alpha over the benchmark accompanied by institutional volume expansion.
            </span>
          </div>
          <div>
            <strong className="block text-[var(--color-ink)] font-bold mb-0.5">2. Contrarian Mean-Reversion</strong>
            <span className="text-[var(--color-muted)] font-serif block">
              Oversold bounce model identifying high-quality large caps experiencing temporary panic liquidation with heavy delivery absorption.
            </span>
          </div>
          <div>
            <strong className="block text-[var(--color-ink)] font-bold mb-0.5">3. Derivatives Long Build-Up</strong>
            <span className="text-[var(--color-muted)] font-serif block">
              Futures and options flow model detecting aggressive institutional buyer accumulation through rising open interest and positive basis.
            </span>
          </div>
          <div>
            <strong className="block text-[var(--color-ink)] font-bold mb-0.5">4. Post-Earnings Momentum (PEAD)</strong>
            <span className="text-[var(--color-muted)] font-serif block">
              Fundamental catalyst model exploiting the post-earnings announcement drift following a significant consensus EPS surprise.
            </span>
          </div>
        </div>
      </section>

      {/* Section II */}
      <section className="space-y-8">
        <h2 className="text-base font-mono font-bold uppercase tracking-wider text-[var(--color-ink)] border-b border-[var(--color-hairline)] pb-1">
          II. Mathematical Specifications &amp; Formulas
        </h2>

        {/* Model 1 */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--color-ink)]">
            1. Dual Momentum &amp; Volume Surge (Trend Continuation)
          </h3>
          <p className="text-sm text-justify text-[var(--color-muted)]">
            Captures equities demonstrating sustained institutional accumulation and alpha generation over the Nifty 50.
            Requires structural trend confirmation, relative momentum outperformance, and expanding volume velocity.
          </p>

          <div className="font-mono text-xs text-[var(--color-ink)] py-2 pl-4 border-l border-[var(--color-hairline)] space-y-1.5">
            <div>1. Trend Invariant: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Price(t) &gt; EMA(20, t) &gt; SMA(50, t)</div>
            <div>2. Relative Strength: &nbsp;&nbsp;&nbsp;[Return(Stock, 20d) / Return(NIFTY 50, 20d)] &ge; 1.25</div>
            <div>3. Volume Velocity: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Volume(t) &ge; 1.80 &times; SMA(Volume, 20)</div>
            <div>4. Momentum Sweet Spot: 55.0 &le; RSI(14, t) &le; 68.0</div>
          </div>

          <div className="font-mono text-xs text-[var(--color-ink)] py-1 pl-4 border-l border-[var(--color-hairline)] space-y-1">
            <div>Stop-Loss = Entry Price &minus; [ 1.50 &times; ATR(14) ]</div>
            <div>Target &nbsp;&nbsp;&nbsp;= Entry Price + [ 3.00 &times; ATR(14) ] &nbsp;(1 : 2.0 R:R)</div>
            <div>Cadence &nbsp;&nbsp;= Called once weekly; Expiry set to 10–20 sessions</div>
          </div>
        </div>

        {/* Model 2 */}
        <div className="space-y-3 pt-2">
          <h3 className="text-lg font-bold text-[var(--color-ink)]">
            2. Contrarian Mean-Reversion (Oversold Quality Bounce)
          </h3>
          <p className="text-sm text-justify text-[var(--color-muted)]">
            Captures high-probability counter-trend reversals in premier large-cap businesses experiencing transitory
            liquidation into major structural support, confirmed by elevated delivery absorption.
          </p>

          <div className="font-mono text-xs text-[var(--color-ink)] py-2 pl-4 border-l border-[var(--color-hairline)] space-y-1.5">
            <div>1. Volatility Band: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Price(t) &le; LowerBand(Bollinger, 20, 2&sigma;)</div>
            <div>2. Oscillator State: &nbsp;&nbsp;&nbsp;&nbsp;RSI(14, t) &le; 30.0</div>
            <div>3. Delivery Inflow: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Delivery Percentage &ge; 55.0% on NSE</div>
            <div>4. Quality Baseline: &nbsp;&nbsp;&nbsp;&nbsp;Market Cap &ge; ₹25,000 cr &amp; TTM Operating Profit &gt; 0</div>
          </div>

          <div className="font-mono text-xs text-[var(--color-ink)] py-1 pl-4 border-l border-[var(--color-hairline)] space-y-1">
            <div>Stop-Loss = Min(Low, 5 sessions) &minus; 0.50%</div>
            <div>Target &nbsp;&nbsp;&nbsp;= EMA(20) Mean-Reversion Bound</div>
            <div>Cadence &nbsp;&nbsp;= Called once weekly; Expiry set to 10–15 sessions</div>
          </div>
        </div>

        {/* Model 3 */}
        <div className="space-y-3 pt-2">
          <h3 className="text-lg font-bold text-[var(--color-ink)]">
            3. Derivatives Institutional Long Build-Up (F&amp;O Flow Breakout)
          </h3>
          <p className="text-sm text-justify text-[var(--color-muted)]">
            Identifies aggressive institutional positioning in F&amp;O constituents where significant cash accumulation
            is paired with accelerating futures open interest and a positive basis.
          </p>

          <div className="font-mono text-xs text-[var(--color-ink)] py-2 pl-4 border-l border-[var(--color-hairline)] space-y-1.5">
            <div>1. Open Interest Surge: &Delta;OI(Today) &ge; +8.0% with Price Change &ge; +1.50%</div>
            <div>2. Futures Basis: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Futures Price &gt; Cash Spot Price (Positive Basis)</div>
            <div>3. Put-Call Ratio: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PCR(OI) &ge; 0.90 and rising from support</div>
            <div>4. Cash Volume Support: Cash Delivery Volume &ge; 1.50 &times; SMA(Delivery, 10)</div>
          </div>

          <div className="font-mono text-xs text-[var(--color-ink)] py-1 pl-4 border-l border-[var(--color-hairline)] space-y-1">
            <div>Stop-Loss = VWAP(Breakout Day) &minus; 0.75%</div>
            <div>Target &nbsp;&nbsp;&nbsp;= Highest Call Strike OI Resistance Wall (or +2.50 &times; ATR(14))</div>
            <div>Cadence &nbsp;&nbsp;= Called once weekly; Expiry set to expiry week or 15 sessions</div>
          </div>
        </div>

        {/* Model 4 */}
        <div className="space-y-3 pt-2">
          <h3 className="text-lg font-bold text-[var(--color-ink)]">
            4. Post-Earnings Announcement Drift (PEAD Momentum)
          </h3>
          <p className="text-sm text-justify text-[var(--color-muted)]">
            Exploits the empirically proven market underreaction anomaly following substantial quarterly earnings beats.
            Institutions often take 2 to 4 weeks to adjust model price targets and accumulate full positions.
          </p>

          <div className="font-mono text-xs text-[var(--color-ink)] py-2 pl-4 border-l border-[var(--color-hairline)] space-y-1.5">
            <div>1. Consensus Beat: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Reported Net Profit &ge; Street Consensus + 10.0%</div>
            <div>2. Volume Gap-Up: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Opening Gap &ge; +2.50% with Volume &ge; 2.50 &times; SMA(Volume, 20)</div>
            <div>3. Day 1 Close Guard: &nbsp;&nbsp;Close(Earnings Day) &gt; Open(Earnings Day)</div>
            <div>4. Quality Baseline: &nbsp;&nbsp;&nbsp;&nbsp;TTM Operating Profit Margin expansion YoY</div>
          </div>

          <div className="font-mono text-xs text-[var(--color-ink)] py-1 pl-4 border-l border-[var(--color-hairline)] space-y-1">
            <div>Stop-Loss = Low(Earnings Day) &minus; 0.50%</div>
            <div>Target &nbsp;&nbsp;&nbsp;= Entry Price + [ 2.50 &times; ATR(14) ]</div>
            <div>Cadence &nbsp;&nbsp;= Called once weekly; Expiry set to 15–20 sessions</div>
          </div>
        </div>
      </section>

      {/* Section III */}
      <section className="space-y-4">
        <h2 className="text-base font-mono font-bold uppercase tracking-wider text-[var(--color-ink)] border-b border-[var(--color-hairline)] pb-1">
          III. The Daily Settlement Cron &amp; Post-Mortem Architecture
        </h2>
        <p className="text-sm text-justify">
          Every tactical call carries a deterministic lifecycle. A dedicated automated cron job executes daily at 23:00 IST:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--color-ink)] pl-2">
          <li>
            <strong>Expiry Identification:</strong> The engine queries all active bets where <code>expiryDate &le; today</code>.
          </li>
          <li>
            <strong>Price Settlement:</strong> Official closing prices and intermediate candle extremes (high/low) are evaluated.
            If the price achieved or exceeded the target, the call is settled strictly as <code>HIT</code>. Otherwise, it is settled strictly as <code>MISS</code>.
          </li>
          <li>
            <strong>Causal Post-Mortem:</strong> For every call graded as a Miss, Gemini is invoked to audit the trade against
            intraday tape records, sector rotation, and corporate filings. It logs two mandatory plain-text analyses:
            <em> What went wrong</em> and <em> How could we have avoided it</em>.
          </li>
        </ol>
      </section>

      {/* Section IV: Active Ledger */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-[var(--color-hairline)] pb-1">
          <h2 className="text-base font-mono font-bold uppercase tracking-wider text-[var(--color-ink)]">
            IV. Active Tactical Calls
          </h2>
          <span className="font-mono text-xs text-[var(--color-muted)]">
            Frequency: Weekly · Active Count: {activeBets.length}
          </span>
        </div>

        {activeBets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-t border-b border-[var(--color-ink)]">
              <thead>
                <tr className="border-b border-[var(--color-hairline)] text-[10px] uppercase text-[var(--color-muted)]">
                  <th className="py-2 pr-3 font-semibold">Ticker</th>
                  <th className="py-2 pr-3 font-semibold">Category</th>
                  <th className="py-2 pr-3 font-semibold">Call Date</th>
                  <th className="py-2 pr-3 font-semibold">Expiry Date</th>
                  <th className="py-2 pr-3 text-right font-semibold">Entry</th>
                  <th className="py-2 pr-3 text-right font-semibold">Target</th>
                  <th className="py-2 pr-3 text-right font-semibold">Stop</th>
                  <th className="py-2 pr-3 text-right font-semibold">Score</th>
                  <th className="py-2 font-semibold min-w-[200px]">Triggers &amp; Thesis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-hairline)]">
                {activeBets.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5 pr-3 align-top">
                      <span className="font-bold text-[var(--color-ink)]">{s.ticker}</span>
                      <span className="text-[10px] text-[var(--color-muted)] block font-serif">{s.name}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-[11px] align-top text-[var(--color-ink)]">{s.category}</td>
                    <td className="py-2.5 pr-3 align-top text-[var(--color-muted)]">{s.callDate}</td>
                    <td className="py-2.5 pr-3 align-top font-semibold text-[var(--color-ink)]">{s.expiryDate}</td>
                    <td className="py-2.5 pr-3 text-right align-top tabular-nums font-semibold text-[var(--color-ink)]">
                      ₹{s.entryPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 pr-3 text-right align-top tabular-nums font-semibold text-[var(--color-ink)]">
                      ₹{s.targetPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 pr-3 text-right align-top tabular-nums text-[var(--color-muted)]">
                      ₹{s.stopLossPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 pr-3 text-right align-top font-semibold tabular-nums text-[var(--color-ink)]">
                      {s.quantScore}
                    </td>
                    <td className="py-2.5 align-top text-[11px] text-[var(--color-muted)]">
                      <div className="font-mono text-[10px] text-[var(--color-ink)]">{s.triggers}</div>
                      <div className="font-serif mt-0.5 leading-snug">{s.thesis}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs font-mono text-[var(--color-muted)] py-4">No active tactical calls currently open.</p>
        )}
      </section>

      {/* Section V: Closed Settlement & Post-Mortem Ledger */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-[var(--color-hairline)] pb-1">
          <h2 className="text-base font-mono font-bold uppercase tracking-wider text-[var(--color-ink)]">
            V. Expiry Settlement &amp; Causal Audit Ledger
          </h2>
          <span className="font-mono text-xs text-[var(--color-muted)]">
            Closed Record: {closedBets.length}
          </span>
        </div>

        {closedBets.length > 0 ? (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-t border-b border-[var(--color-ink)]">
                <thead>
                  <tr className="border-b border-[var(--color-hairline)] text-[10px] uppercase text-[var(--color-muted)]">
                    <th className="py-2 pr-3 font-semibold">Ticker</th>
                    <th className="py-2 pr-3 font-semibold">Category</th>
                    <th className="py-2 pr-3 font-semibold">Call Date</th>
                    <th className="py-2 pr-3 font-semibold">Closed On</th>
                    <th className="py-2 pr-3 text-right font-semibold">Entry</th>
                    <th className="py-2 pr-3 text-right font-semibold">Exit Price</th>
                    <th className="py-2 pr-3 text-right font-semibold">Return</th>
                    <th className="py-2 text-center font-semibold">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-hairline)]">
                  {closedBets.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2.5 pr-3">
                        <span className="font-bold text-[var(--color-ink)]">{c.ticker}</span>
                        <span className="text-[10px] text-[var(--color-muted)] block font-serif">{c.name}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-[11px] text-[var(--color-ink)]">{c.category}</td>
                      <td className="py-2.5 pr-3 text-[var(--color-muted)]">{c.callDate}</td>
                      <td className="py-2.5 pr-3 text-[var(--color-muted)]">{c.closedOn || c.expiryDate}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-[var(--color-muted)]">
                        ₹{c.entryPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums font-semibold text-[var(--color-ink)]">
                        ₹{c.closePrice?.toLocaleString('en-IN') ?? '—'}
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums font-semibold text-[var(--color-ink)]">
                        {c.returnPct !== undefined ? `${c.returnPct >= 0 ? '+' : ''}${c.returnPct}%` : '—'}
                      </td>
                      <td className="py-2.5 text-center font-bold text-xs uppercase tracking-wider">
                        {c.outcome === 'hit' ? '[HIT]' : '[MISSED]'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Detailed Post-Mortem Notes for Misses */}
            {closedBets.some((c) => c.outcome === 'miss' && c.postMortem) && (
              <div className="space-y-4 pt-2">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
                  Post-Mortem Analysis on Missed Calls
                </h3>
                <div className="space-y-4">
                  {closedBets
                    .filter((c) => c.outcome === 'miss' && c.postMortem)
                    .map((c) => (
                      <div key={c.id} className="text-xs font-serif pl-4 border-l-2 border-[var(--color-hairline)] space-y-1">
                        <div className="font-mono font-bold text-[var(--color-ink)]">
                          {c.ticker} · {c.category} (Called: {c.callDate} &rarr; Closed: {c.closedOn})
                        </div>
                        <p className="text-[var(--color-ink)]">
                          <strong>What went wrong:</strong> {c.postMortem?.whatWentWrong}
                        </p>
                        <p className="text-[var(--color-muted)]">
                          <strong>How could we have avoided it:</strong> {c.postMortem?.howToAvoid}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs font-mono text-[var(--color-muted)] py-4">No settled calls in the audit ledger yet.</p>
        )}

        <footer className="flex justify-between items-center text-xs font-mono text-[var(--color-muted)] pt-6 border-t border-[var(--color-hairline)]">
          <span>Evaluated daily at 23:00 IST upon market data reconciliation.</span>
          <Link href="/bets/long-term" className="underline hover:text-[var(--color-ink)]">
            Review Strategic Long-Term Models &rarr;
          </Link>
        </footer>
      </section>
    </article>
  );
}
