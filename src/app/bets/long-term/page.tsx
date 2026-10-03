import type { Metadata } from 'next';
import Link from 'next/link';
import { BetsNav } from '../../../components/bets/BetsNav';

export const metadata: Metadata = {
  title: 'Long-Term Strategic Models | Methodology & Formulation | Kosh',
  description:
    'Mathematical formulations and multi-factor selection criteria across three distinct long-term equity compounding categories.',
  alternates: { canonical: '/bets/long-term' },
};

interface StrategicSetup {
  ticker: string;
  name: string;
  category: string;
  sector: string;
  compositeScore: number;
  roe: number;
  debtToEquity: number;
  pegRatio: number;
  salesCagr3Y: number;
  fiiDiiStake: string;
  thesis: string;
}

const SAMPLE_STRATEGIC_SETUPS: StrategicSetup[] = [
  {
    ticker: 'LTIM',
    name: 'LTIMindtree Ltd',
    category: 'Quality Compounder',
    sector: 'Information Technology',
    compositeScore: 94,
    roe: 26.4,
    debtToEquity: 0.04,
    pegRatio: 1.15,
    salesCagr3Y: 18.2,
    fiiDiiStake: '38.6% (+1.2% QoQ)',
    thesis: 'Net-cash balance sheet with superior capital efficiency, multi-quarter deal ramp-ups in BFSI, and PEG below 1.2x.',
  },
  {
    ticker: 'TITAN',
    name: 'Titan Company Ltd',
    category: 'Quality Compounder',
    sector: 'Consumer Discretionary',
    compositeScore: 91,
    roe: 31.8,
    debtToEquity: 0.42,
    pegRatio: 1.45,
    salesCagr3Y: 24.1,
    fiiDiiStake: '32.4% (+0.6% QoQ)',
    thesis: 'Structural market share gains in jewellery and eyewear, sustaining >30% ROE with persistent domestic institutional inflows.',
  },
  {
    ticker: 'BEL',
    name: 'Bharat Electronics Ltd',
    category: 'Capex & De-leveraging',
    sector: 'Defense & Aerospace',
    compositeScore: 89,
    roe: 24.5,
    debtToEquity: 0.00,
    pegRatio: 1.30,
    salesCagr3Y: 19.8,
    fiiDiiStake: '41.2% (+2.1% QoQ)',
    thesis: 'Record order-book visibility exceeding 3.5x annual revenue, expanding operating margins from indigenization, and zero gross debt.',
  },
  {
    ticker: 'ITC',
    name: 'ITC Ltd',
    category: 'Defensive Cash Flow',
    sector: 'FMCG & Conglomerates',
    compositeScore: 87,
    roe: 28.2,
    debtToEquity: 0.01,
    pegRatio: 1.25,
    salesCagr3Y: 14.5,
    fiiDiiStake: '43.5% (+0.4% QoQ)',
    thesis: 'Robust free-cash-flow yield exceeding 5.8%, high dividend payout resilience, and non-cigarette FMCG margin expansion.',
  },
];

export default function LongTermBetsPage() {
  return (
    <article className="max-w-4xl mx-auto space-y-12 pb-20 font-serif text-[var(--color-ink)] leading-relaxed">
      <BetsNav />

      {/* Title & Metadata Header */}
      <header className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-ink)] leading-tight">
          Strategic Equity Models: Three High-Conviction Compounding Frameworks
        </h1>
        <p className="font-mono text-xs text-[var(--color-muted)]">
          Horizon: 3 to 12 Months · Selection Universe: NIFTY 100 &amp; NIFTY Midcap 50 · Rebalance: Monthly Post-Earnings
        </p>
      </header>

      {/* Abstract */}
      <section className="border-l-2 border-[var(--color-ink)] pl-4 italic text-sm text-[var(--color-muted)]">
        <p>
          Abstract—Long-term alpha cannot be reliably generated through generalized sentiment analysis or consensus
          recommendations. Sustained economic outperformance across multi-quarter horizons stems from three distinct
          structural drivers: capital reinvestment efficiency in high-ROE franchises, operational de-leveraging following
          multi-year capex cycles, and defensive free-cash-flow yields in dividend-generating market leaders.
          This paper formalizes the quantitative criteria and invalidation rules for these three strategic categories.
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
          </div>
        </div>
      </section>

      {/* Section III */}
      <section className="space-y-4">
        <h2 className="text-base font-mono font-bold uppercase tracking-wider text-[var(--color-ink)] border-b border-[var(--color-hairline)] pb-1">
          III. Multi-Factor Scoring Formulation
        </h2>
        <p className="text-sm text-justify">
          To normalize comparison across the three categories, every qualified company is assigned an aggregate
          Composite Score (Score<sub>LT</sub>) out of 100 based on weighted factor achievement:
        </p>
        <div className="font-mono text-xs text-[var(--color-ink)] py-1 pl-4 border-l border-[var(--color-hairline)]">
          Score<sub>LT</sub> = 0.30 &times; S<sub>CapitalEfficiency</sub> + 0.25 &times; S<sub>BalanceSheet</sub> + 0.25 &times; S<sub>Valuation</sub> + 0.20 &times; S<sub>Institutional</sub>
        </div>
        <p className="text-sm text-justify text-[var(--color-muted)]">
          Hurdle Invariant: Only companies achieving a Score<sub>LT</sub> &ge; 85 are eligible for recommendation on the
          active strategic ledger. Portfolio holdings are audited monthly following quarterly corporate disclosures.
        </p>
      </section>

      {/* Section IV */}
      <section className="space-y-4">
        <h2 className="text-base font-mono font-bold uppercase tracking-wider text-[var(--color-ink)] border-b border-[var(--color-hairline)] pb-1">
          IV. Active Strategic Candidate Ledger
        </h2>
        <p className="text-xs font-mono text-[var(--color-muted)]">
          Table 1: Current strategic equities meeting Score<sub>LT</sub> &ge; 85 across the three strategic categories.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-t border-b border-[var(--color-ink)]">
            <thead>
              <tr className="border-b border-[var(--color-hairline)] text-[10px] uppercase text-[var(--color-muted)]">
                <th className="py-2 pr-3 font-semibold">Ticker</th>
                <th className="py-2 pr-3 font-semibold">Category</th>
                <th className="py-2 pr-3 font-semibold">Sector</th>
                <th className="py-2 pr-3 text-right font-semibold">Score</th>
                <th className="py-2 pr-3 text-right font-semibold">ROE</th>
                <th className="py-2 pr-3 text-right font-semibold">D / E</th>
                <th className="py-2 pr-3 text-right font-semibold">PEG</th>
                <th className="py-2 pr-3 text-right font-semibold">3Y Sales</th>
                <th className="py-2 pr-3 text-right font-semibold">Inst. Stake</th>
                <th className="py-2 font-semibold min-w-[200px]">Strategic Thesis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-hairline)]">
              {SAMPLE_STRATEGIC_SETUPS.map((s) => (
                <tr key={s.ticker}>
                  <td className="py-2.5 pr-3">
                    <span className="font-bold text-[var(--color-ink)]">{s.ticker}</span>
                    <span className="text-[10px] text-[var(--color-muted)] block font-serif">{s.name}</span>
                  </td>
                  <td className="py-2.5 pr-3 text-[11px] text-[var(--color-ink)]">{s.category}</td>
                  <td className="py-2.5 pr-3 text-[10px] text-[var(--color-muted)]">{s.sector}</td>
                  <td className="py-2.5 pr-3 text-right font-semibold tabular-nums text-[var(--color-ink)]">
                    {s.compositeScore}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums font-semibold text-[var(--color-ink)]">
                    {s.roe.toFixed(1)}%
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-[var(--color-ink)]">
                    {s.debtToEquity.toFixed(2)}x
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-[var(--color-ink)]">
                    {s.pegRatio.toFixed(2)}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-[var(--color-ink)]">
                    {s.salesCagr3Y.toFixed(1)}%
                  </td>
                  <td className="py-2.5 pr-3 text-right text-[10px] text-[var(--color-muted)]">
                    {s.fiiDiiStake}
                  </td>
                  <td className="py-2.5 text-[11px] font-serif text-[var(--color-muted)]">
                    {s.thesis}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="flex justify-between items-center text-xs font-mono text-[var(--color-muted)] pt-3">
          <span>Rebalanced monthly upon quarterly corporate filings and shareholding disclosures.</span>
          <Link href="/bets/short-term" className="underline hover:text-[var(--color-ink)]">
            &larr; Return to Short-Term Tactical Models
          </Link>
        </footer>
      </section>
    </article>
  );
}
