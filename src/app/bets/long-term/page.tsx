import type { Metadata } from 'next';
import Link from 'next/link';
import { BetsNav } from '../../../components/bets/BetsNav';
import { getActiveBets, getClosedBets } from '../../../../lib/bets-store';

export const metadata: Metadata = {
  title: 'Long-Term Strategic Models | Methodology & Formulation | Kosh',
  description:
    'Mathematical formulations and multi-factor selection criteria across three distinct long-term equity compounding categories.',
  alternates: { canonical: '/bets/long-term' },
};

export default async function LongTermBetsPage() {
  const activeBets = await getActiveBets('long_term');
  const closedBets = await getClosedBets('long_term');

  return (
    <article className="max-w-4xl mx-auto space-y-12 pb-20 font-serif text-[var(--color-ink)] leading-relaxed">
      <BetsNav />

      {/* Title & Metadata Header */}
      <header className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-ink)] leading-tight">
          Strategic Equity Models: Three High-Conviction Compounding Frameworks
        </h1>
        <p className="font-mono text-xs text-[var(--color-muted)]">
          Issuance: Once Monthly · Settlement: Daily Late-Night Expiry Cron · Universe: NIFTY 100 &amp; NIFTY Midcap 50
        </p>
      </header>

      {/* Abstract */}
      <section className="border-l-2 border-[var(--color-ink)] pl-4 italic text-sm text-[var(--color-muted)]">
        <p>
          Abstract—Long-term alpha cannot be reliably generated through generalized sentiment analysis or consensus
          recommendations. Sustained economic outperformance across multi-quarter horizons stems from three distinct
          structural drivers: capital reinvestment efficiency in high-ROE franchises, operational de-leveraging following
          multi-year capex cycles, and defensive free-cash-flow yields in dividend-generating market leaders.
          Every strategic call carries an explicit Call Date and Expiry Date. A dedicated daily late-night settlement cron
          evaluates all positions upon maturity, settling outcomes strictly as Hit or Miss, accompanied by automated causal
          post-mortems for every missed objective.
        </p>
      </section>

      {/* Section I */}
      <section className="space-y-4">
        <h2 className="text-base font-mono font-bold uppercase tracking-wider text-[var(--color-ink)] border-b border-[var(--color-hairline)] pb-1">
          I. The Three Strategic Categories
        </h2>
        <p className="text-base text-justify">
          To achieve rigorous institutional confidence, long-term positions are strictly partitioned into three specialized
          economic engines. Each category addresses a specific fundamental mechanism:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs font-mono text-[var(--color-ink)] pt-2">
          <div>
            <strong className="block text-[var(--color-ink)] font-bold mb-0.5">1. Quality Compounders</strong>
            <span className="text-[var(--color-muted)] font-serif block">
              Asset-light franchises with wide economic moats and pricing power capable of reinvesting capital at sustained high return on equity (&gt;22%).
            </span>
          </div>
          <div>
            <strong className="block text-[var(--color-ink)] font-bold mb-0.5">2. Capex &amp; De-leveraging</strong>
            <span className="text-[var(--color-muted)] font-serif block">
              Industrial and capital goods leaders concluding multi-year investment cycles, experiencing fixed asset turnover acceleration and debt reduction.
            </span>
          </div>
          <div>
            <strong className="block text-[var(--color-ink)] font-bold mb-0.5">3. Defensive Cash Flow</strong>
            <span className="text-[var(--color-muted)] font-serif block">
              High free-cash-flow yield (&gt;5.5%) market leaders offering downside protection, low systemic beta, and steady dividend compounding.
            </span>
          </div>
        </div>
      </section>

      {/* Section II */}
      <section className="space-y-8">
        <h2 className="text-base font-mono font-bold uppercase tracking-wider text-[var(--color-ink)] border-b border-[var(--color-hairline)] pb-1">
          II. Mathematical Specifications &amp; Category Rules
        </h2>

        {/* Category 1 */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--color-ink)]">
            1. Quality Compounders (High-ROE Reinvestment Engines)
          </h3>
          <p className="text-sm text-justify text-[var(--color-muted)]">
            Designed to hold market-dominant businesses compounding intrinsic value through internal cash flows
            without equity dilution. Focuses on franchise moats, superior return on capital, and reasonable entry valuations.
          </p>

          <div className="font-mono text-xs text-[var(--color-ink)] py-2 pl-4 border-l border-[var(--color-hairline)] space-y-1.5">
            <div>1. Capital Efficiency: &nbsp;3-Year Average ROE &ge; 22.0% and ROCE &ge; 25.0%</div>
            <div>2. Solvency Invariant: &nbsp;&nbsp;Debt-to-Equity &le; 0.30x (or Net Cash Positive)</div>
            <div>3. Cash Flow Quality: &nbsp;&nbsp;Cash Flow from Operations / Reported PAT &ge; 0.90</div>
            <div>4. Growth Consistency: &nbsp;5-Year Sales and Operating Profit CAGR &ge; 15.0%</div>
            <div>5. Institutional Base: &nbsp;Combined FII + DII Shareholding &ge; 30.0%</div>
            <div>6. Valuation Hurdle: &nbsp;&nbsp;&nbsp;PEG Ratio &le; 1.50 (or P/E within 1.1x of 5-Year Historical Median)</div>
          </div>

          <div className="font-mono text-xs text-[var(--color-ink)] py-1 pl-4 border-l border-[var(--color-hairline)] space-y-1">
            <div>Fundamental Stop = Annualized ROE &lt; 15.0% for two consecutive quarters</div>
            <div>Technical Stop &nbsp;&nbsp;= Weekly close &gt; 4.0% below the 200-day Simple Moving Average</div>
            <div>Cadence &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= Issued once monthly; Expiry set to 6–12 months</div>
          </div>
        </div>

        {/* Category 2 */}
        <div className="space-y-3 pt-2">
          <h3 className="text-lg font-bold text-[var(--color-ink)]">
            2. Capex &amp; De-leveraging Turnarounds (Operating Leverage Expansion)
          </h3>
          <p className="text-sm text-justify text-[var(--color-muted)]">
            Captures premier manufacturing, defense, and infrastructure enterprises transitioning from capital-intensive
            gestation to revenue realization, unlocking operating leverage and debt reduction.
          </p>

          <div className="font-mono text-xs text-[var(--color-ink)] py-2 pl-4 border-l border-[var(--color-hairline)] space-y-1.5">
            <div>1. Balance Sheet Cleanse: Debt Reduction &ge; 15.0% YoY or Interest Coverage Ratio &gt; 4.5x</div>
            <div>2. Asset Productivity: &nbsp;&nbsp;&nbsp;Fixed Asset Turnover rising for &ge; 2 consecutive quarters</div>
            <div>3. Margin Acceleration: &nbsp;EBITDA Margin expansion &ge; 150 basis points YoY</div>
            <div>4. Revenue Visibility: &nbsp;&nbsp;&nbsp;Order-Book-to-Bill Ratio &ge; 2.5x (or projected EPS CAGR &ge; 20%)</div>
            <div>5. Institutional Flow: &nbsp;&nbsp;&nbsp;&nbsp;Domestic Mutual Funds accumulating stake for &ge; 2 quarters</div>
            <div>6. Valuation Hurdle: &nbsp;&nbsp;&nbsp;&nbsp;EV / EBITDA below the 5-year historical peer average</div>
          </div>

          <div className="font-mono text-xs text-[var(--color-ink)] py-1 pl-4 border-l border-[var(--color-hairline)] space-y-1">
            <div>Fundamental Stop = Gross debt expansion or EBITDA margin contraction &gt; 200 bps YoY</div>
            <div>Technical Stop &nbsp;&nbsp;= Weekly close &gt; 4.0% below the 200-day Simple Moving Average</div>
            <div>Cadence &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= Issued once monthly; Expiry set to 6–12 months</div>
          </div>
        </div>

        {/* Category 3 */}
        <div className="space-y-3 pt-2">
          <h3 className="text-lg font-bold text-[var(--color-ink)]">
            3. Defensive Cash Generators (Free-Cash-Flow Yield &amp; Dividend Aristocrats)
          </h3>
          <p className="text-sm text-justify text-[var(--color-muted)]">
            Identifies deeply discounted, cash-generative monopolies that provide capital preservation, steady
            dividend income, and high margin of safety during macroeconomic turbulence.
          </p>

          <div className="font-mono text-xs text-[var(--color-ink)] py-2 pl-4 border-l border-[var(--color-hairline)] space-y-1.5">
            <div>1. Cash Flow Yield: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Free Cash Flow / Market Capitalization &ge; 5.5%</div>
            <div>2. Dividend Track Record: Dividend Yield &ge; 3.5% with &ge; 5 years uninterrupted payout</div>
            <div>3. Solvency Cushion: &nbsp;&nbsp;&nbsp;&nbsp;Net Debt / EBITDA &le; 0.50x (or Net Cash Balance Sheet)</div>
            <div>4. Low Market Beta: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Beta vs NIFTY 50 &lt; 0.85</div>
            <div>5. Valuation Hurdle: &nbsp;&nbsp;&nbsp;&nbsp;Price-to-Earnings Ratio &le; 16.0x or Price-to-Book &le; 2.2x</div>
          </div>

          <div className="font-mono text-xs text-[var(--color-ink)] py-1 pl-4 border-l border-[var(--color-hairline)] space-y-1">
            <div>Fundamental Stop = Free Cash Flow turning negative for two quarters, or dividend cut</div>
            <div>Technical Stop &nbsp;&nbsp;= Weekly close &gt; 4.0% below the 200-day Simple Moving Average</div>
            <div>Cadence &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= Issued once monthly; Expiry set to 6–12 months</div>
          </div>
        </div>
      </section>

      {/* Section III */}
      <section className="space-y-4">
        <h2 className="text-base font-mono font-bold uppercase tracking-wider text-[var(--color-ink)] border-b border-[var(--color-hairline)] pb-1">
          III. Multi-Factor Scoring &amp; Settlement Architecture
        </h2>
        <p className="text-sm text-justify">
          To normalize comparison across the three categories, every qualified company is assigned an aggregate
          Composite Score (Score<sub>LT</sub>) out of 100 based on weighted factor achievement:
        </p>
        <div className="font-mono text-xs text-[var(--color-ink)] py-1 pl-4 border-l border-[var(--color-hairline)]">
          Score<sub>LT</sub> = 0.30 &times; S<sub>CapitalEfficiency</sub> + 0.25 &times; S<sub>BalanceSheet</sub> + 0.25 &times; S<sub>Valuation</sub> + 0.20 &times; S<sub>Institutional</sub>
        </div>
        <p className="text-sm text-justify text-[var(--color-muted)]">
          The daily 23:00 IST cron inspects strategic calls on their specified maturity dates. Positions are settled
          strictly as <code>HIT</code> or <code>MISS</code> based on target realization, with Gemini generating causal
          post-mortems detailing thesis breakdowns and future prevention filters for any missed target.
        </p>
      </section>

      {/* Section IV: Active Strategic Ledger */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-[var(--color-hairline)] pb-1">
          <h2 className="text-base font-mono font-bold uppercase tracking-wider text-[var(--color-ink)]">
            IV. Active Strategic Calls
          </h2>
          <span className="font-mono text-xs text-[var(--color-muted)]">
            Frequency: Monthly · Active Count: {activeBets.length}
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
                  <th className="py-2 font-semibold min-w-[200px]">Strategic Thesis</th>
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
          <p className="text-xs font-mono text-[var(--color-muted)] py-4">No active strategic calls currently open.</p>
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
          <Link href="/bets/short-term" className="underline hover:text-[var(--color-ink)]">
            &larr; Return to Short-Term Tactical Models
          </Link>
        </footer>
      </section>
    </article>
  );
}
