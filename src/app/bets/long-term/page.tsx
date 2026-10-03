import type { Metadata } from 'next';
import Link from 'next/link';
import { BetsNav } from '../../../components/bets/BetsNav';

export const metadata: Metadata = {
  title: 'Long-Term Quantitative Bets | Methodology & Models | Kosh',
  description:
    'Systematic strategic investment framework (3-12 month horizon) using multi-factor quality-growth scoring (GARP), capital efficiency, balance sheet safety, and institutional sponsorship.',
  alternates: { canonical: '/bets/long-term' },
};

interface StrategicSetup {
  ticker: string;
  name: string;
  sector: string;
  compositeScore: number;
  roe: number;
  debtToEquity: number;
  pegRatio: number;
  salesCagr3Y: number;
  fiiDiiStake: string;
  thesis: string;
  status: 'Accumulate' | 'Core Holding' | 'Review';
}

const SAMPLE_STRATEGIC_SETUPS: StrategicSetup[] = [
  {
    ticker: 'LTIM',
    name: 'LTIMindtree Ltd',
    sector: 'Information Technology',
    compositeScore: 92,
    roe: 26.4,
    debtToEquity: 0.04,
    pegRatio: 1.15,
    salesCagr3Y: 18.2,
    fiiDiiStake: '38.6% (+1.2% QoQ)',
    thesis: 'Fortress net-cash balance sheet, industry-leading operating margins, and resilient BFSI client deal ramp-ups with attractive PEG below 1.2x.',
    status: 'Core Holding',
  },
  {
    ticker: 'TITAN',
    name: 'Titan Company Ltd',
    sector: 'Consumer Discretionary',
    compositeScore: 88,
    roe: 31.8,
    debtToEquity: 0.42,
    pegRatio: 1.45,
    salesCagr3Y: 24.1,
    fiiDiiStake: '32.4% (+0.6% QoQ)',
    thesis: 'Superior brand equity and formal market share gains in jewellery and eyewear, sustaining >30% ROE with steady domestic institutional accumulation.',
    status: 'Accumulate',
  },
  {
    ticker: 'CHOLAFIN',
    name: 'Cholamandalam Inv & Fin',
    sector: 'Financial Services',
    compositeScore: 85,
    roe: 20.2,
    debtToEquity: 0.78,
    pegRatio: 1.20,
    salesCagr3Y: 22.5,
    fiiDiiStake: '44.8% (+1.8% QoQ)',
    thesis: 'Best-in-class asset quality in vehicle financing, robust rural/semi-urban credit demand, and accelerating FII accumulation over trailing 3 quarters.',
    status: 'Accumulate',
  },
];

export default function LongTermBetsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16 font-serif text-[var(--color-ink)]">
      <BetsNav />

      {/* 1. Executive Summary & Objective */}
      <section className="space-y-4">
        <div className="border-b border-[var(--color-hairline)] pb-2 flex items-center justify-between text-xs font-mono">
          <span className="font-bold uppercase tracking-wider text-[var(--color-ink)]">
            Section 01 · Strategic Framework &amp; Philosophy
          </span>
          <span className="text-[var(--color-muted)]">Horizon: 3 to 12 Months</span>
        </div>

        <p className="text-base sm:text-lg leading-relaxed text-[var(--color-ink)]">
          Long-term quantitative bets at Kosh identify high-conviction compounders across Indian equities.
          Rather than relying on ungrounded generative commentary, our model applies a rigorous{' '}
          <strong>Multi-Factor Quality-Growth (GARP) Engine</strong>. We screen for businesses with exceptional
          reinvestment economics, fortress balance sheets, non-dilutive compounding, and verifiable
          institutional sponsorship from Foreign and Domestic Institutional Investors.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 font-mono text-xs">
          <div className="border border-[var(--color-hairline)] p-4 bg-[var(--color-surface)]">
            <div className="text-[10px] uppercase text-[var(--color-muted)] mb-1">Target Horizon</div>
            <div className="text-lg font-bold text-[var(--color-ink)]">3 to 12 Months</div>
            <p className="text-[11px] text-[var(--color-muted)] mt-1 font-serif">
              Multi-quarter fundamental holding period aligned with corporate earnings cycles and capex realization.
            </p>
          </div>
          <div className="border border-[var(--color-hairline)] p-4 bg-[var(--color-surface)]">
            <div className="text-[10px] uppercase text-[var(--color-muted)] mb-1">Capital Efficiency</div>
            <div className="text-lg font-bold text-[var(--color-bullish)]">ROE &gt; 18.0%</div>
            <p className="text-[11px] text-[var(--color-muted)] mt-1 font-serif">
              Strict hurdle rate ensuring shareholder capital is compounded at a high double-digit return.
            </p>
          </div>
          <div className="border border-[var(--color-hairline)] p-4 bg-[var(--color-surface)]">
            <div className="text-[10px] uppercase text-[var(--color-muted)] mb-1">Balance Sheet Safety</div>
            <div className="text-lg font-bold text-[var(--color-ink)]">D/E &le; 0.50x</div>
            <p className="text-[11px] text-[var(--color-muted)] mt-1 font-serif">
              Low leverage or net-cash balance sheets providing shock resilience through macroeconomic cycles.
            </p>
          </div>
        </div>
      </section>

      {/* 2. The 4-Pillar Scoring Model */}
      <section className="space-y-6">
        <div className="border-b border-[var(--color-hairline)] pb-2 flex items-center justify-between text-xs font-mono">
          <span className="font-bold uppercase tracking-wider text-[var(--color-ink)]">
            Section 02 · The Multi-Factor Scoring Model (0–100 Scale)
          </span>
          <span className="text-[var(--color-muted)]">Mathematical Weighting</span>
        </div>

        <div className="border border-[var(--color-hairline)] bg-[var(--color-surface)] p-6 space-y-5">
          <div>
            <h3 className="font-serif text-xl font-bold text-[var(--color-ink)]">
              Composite Strategic Score (Score<sub>LT</sub>)
            </h3>
            <p className="text-xs font-mono text-[var(--color-muted)] mt-1">
              Every eligible equity in the universe is evaluated against a normalized 100-point multi-factor rubric:
            </p>
          </div>

          <div className="bg-[var(--color-bg)] border border-[var(--color-hairline)] p-4 font-mono text-xs">
            <div className="text-[11px] font-bold text-[var(--color-ink)] mb-2 uppercase tracking-wider">
              Mathematical Formulation:
            </div>
            <code className="text-sm block text-[var(--color-ink)] font-semibold pb-1">
              Score<sub>LT</sub> = 0.30 &times; S<sub>ROE</sub> + 0.25 &times; S<sub>D/E</sub> + 0.25 &times; S<sub>Valuation</sub> + 0.20 &times; S<sub>Institutional</sub>
            </code>
            <span className="text-[11px] text-[var(--color-muted)] font-serif block mt-1">
              Activation Hurdle: Only companies with Score<sub>LT</sub> &ge; 80/100 qualify for portfolio recommendation.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs pt-1">
            {/* Pillar 1 */}
            <div className="border border-[var(--color-hairline)] p-4 bg-[var(--color-surface)] space-y-2">
              <div className="flex justify-between items-center border-b border-[var(--color-hairline)] pb-2">
                <span className="font-bold text-[var(--color-ink)]">Pillar 1: Capital Efficiency</span>
                <span className="text-[10px] text-[var(--color-muted)]">Weight: 30%</span>
              </div>
              <p className="text-[11px] text-[var(--color-muted)] font-serif">
                Evaluates management efficiency in generating returns on equity and employed capital.
              </p>
              <ul className="space-y-1.5 text-[11px] text-[var(--color-ink)]">
                <li className="flex justify-between">
                  <span>ROE &ge; 18.0% and ROCE &ge; 20.0%</span>
                  <strong className="text-[var(--color-bullish)]">100 pts</strong>
                </li>
                <li className="flex justify-between">
                  <span>12.0% &le; ROE &lt; 18.0%</span>
                  <span className="text-[var(--color-muted)]">60 pts</span>
                </li>
                <li className="flex justify-between">
                  <span>ROE &lt; 12.0%</span>
                  <span className="text-[var(--color-bearish)]">0 pts</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div className="border border-[var(--color-hairline)] p-4 bg-[var(--color-surface)] space-y-2">
              <div className="flex justify-between items-center border-b border-[var(--color-hairline)] pb-2">
                <span className="font-bold text-[var(--color-ink)]">Pillar 2: Balance Sheet Resilience</span>
                <span className="text-[10px] text-[var(--color-muted)]">Weight: 25%</span>
              </div>
              <p className="text-[11px] text-[var(--color-muted)] font-serif">
                Protects downside against interest rate spikes, credit crunches, and capital dilution.
              </p>
              <ul className="space-y-1.5 text-[11px] text-[var(--color-ink)]">
                <li className="flex justify-between">
                  <span>Debt-to-Equity &le; 0.50x &amp; OCF/PAT &ge; 0.85</span>
                  <strong className="text-[var(--color-bullish)]">100 pts</strong>
                </li>
                <li className="flex justify-between">
                  <span>0.50x &lt; Debt-to-Equity &le; 1.00x</span>
                  <span className="text-[var(--color-muted)]">60 pts</span>
                </li>
                <li className="flex justify-between">
                  <span>Debt-to-Equity &gt; 1.00x</span>
                  <span className="text-[var(--color-bearish)]">0 pts</span>
                </li>
              </ul>
            </div>

            {/* Pillar 3 */}
            <div className="border border-[var(--color-hairline)] p-4 bg-[var(--color-surface)] space-y-2">
              <div className="flex justify-between items-center border-b border-[var(--color-hairline)] pb-2">
                <span className="font-bold text-[var(--color-ink)]">Pillar 3: Valuation Margin of Safety</span>
                <span className="text-[10px] text-[var(--color-muted)]">Weight: 25%</span>
              </div>
              <p className="text-[11px] text-[var(--color-muted)] font-serif">
                Ensures growth is acquired at a reasonable price, avoiding multiple-compression traps.
              </p>
              <ul className="space-y-1.5 text-[11px] text-[var(--color-ink)]">
                <li className="flex justify-between">
                  <span>PEG Ratio &le; 1.25 or P/E &le; 3Y Median P/E</span>
                  <strong className="text-[var(--color-bullish)]">100 pts</strong>
                </li>
                <li className="flex justify-between">
                  <span>1.25 &lt; PEG Ratio &le; 1.75</span>
                  <span className="text-[var(--color-muted)]">50 pts</span>
                </li>
                <li className="flex justify-between">
                  <span>PEG Ratio &gt; 1.75</span>
                  <span className="text-[var(--color-bearish)]">0 pts</span>
                </li>
              </ul>
            </div>

            {/* Pillar 4 */}
            <div className="border border-[var(--color-hairline)] p-4 bg-[var(--color-surface)] space-y-2">
              <div className="flex justify-between items-center border-b border-[var(--color-hairline)] pb-2">
                <span className="font-bold text-[var(--color-ink)]">Pillar 4: Institutional Sponsorship</span>
                <span className="text-[10px] text-[var(--color-muted)]">Weight: 20%</span>
              </div>
              <p className="text-[11px] text-[var(--color-muted)] font-serif">
                Tracks persistent stake accumulation by FIIs and domestic mutual funds over trailing quarters.
              </p>
              <ul className="space-y-1.5 text-[11px] text-[var(--color-ink)]">
                <li className="flex justify-between">
                  <span>FII + DII holding up for &ge; 2 consecutive quarters</span>
                  <strong className="text-[var(--color-bullish)]">100 pts</strong>
                </li>
                <li className="flex justify-between">
                  <span>Stable holding (&plusmn;0.25% variance)</span>
                  <span className="text-[var(--color-muted)]">50 pts</span>
                </li>
                <li className="flex justify-between">
                  <span>Net institutional liquidation (&gt;0.5% reduction)</span>
                  <span className="text-[var(--color-bearish)]">0 pts</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Structural Risk & Exit Protocols */}
      <section className="space-y-4">
        <div className="border-b border-[var(--color-hairline)] pb-2 flex items-center justify-between text-xs font-mono">
          <span className="font-bold uppercase tracking-wider text-[var(--color-ink)]">
            Section 03 · Exit Protocols &amp; Structural Stops
          </span>
          <span className="text-[var(--color-muted)]">Capital Preservation</span>
        </div>

        <div className="border border-[var(--color-hairline)] bg-[var(--color-surface)] p-6 space-y-4">
          <h3 className="font-serif text-lg font-bold text-[var(--color-ink)]">
            Systematic Rules for Holding, Review, and Invalidation
          </h3>
          <p className="text-sm leading-relaxed text-[var(--color-muted)]">
            Long-term compounders should not be prematurely exited due to routine market oscillations.
            However, strict quantitative boundaries govern position invalidation:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs pt-1">
            <div className="border border-[var(--color-hairline)] p-4 bg-[var(--color-bg)]">
              <span className="text-[10px] uppercase text-[var(--color-bearish)] font-bold block mb-1">
                Fundamental Stop
              </span>
              <div className="font-bold text-sm text-[var(--color-ink)]">ROE Invalidation</div>
              <p className="text-[11px] font-serif text-[var(--color-muted)] mt-1.5 leading-relaxed">
                If quarterly annualized ROE falls below 12.0% for two consecutive quarters, the structural thesis is invalidated and the position is exited.
              </p>
            </div>
            <div className="border border-[var(--color-hairline)] p-4 bg-[var(--color-bg)]">
              <span className="text-[10px] uppercase text-[var(--color-bearish)] font-bold block mb-1">
                Technical Stop
              </span>
              <div className="font-bold text-sm text-[var(--color-ink)]">200 SMA Breakdown</div>
              <p className="text-[11px] font-serif text-[var(--color-muted)] mt-1.5 leading-relaxed">
                A weekly candle close &gt;4.0% below the 200-day Simple Moving Average triggers an automatic risk review to guard against severe structural regime shifts.
              </p>
            </div>
            <div className="border border-[var(--color-hairline)] p-4 bg-[var(--color-bg)]">
              <span className="text-[10px] uppercase text-[var(--color-bullish)] font-bold block mb-1">
                Target Realization
              </span>
              <div className="font-bold text-sm text-[var(--color-ink)]">Valuation Re-Rating</div>
              <p className="text-[11px] font-serif text-[var(--color-muted)] mt-1.5 leading-relaxed">
                Positions are systematically trimmed when trailing multiples exceed 1.5x the historical 5-year average P/E or when discounted cash flow fair value is reached.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Active Strategic Pipeline */}
      <section className="space-y-4">
        <div className="border-b border-[var(--color-hairline)] pb-2 flex items-center justify-between text-xs font-mono">
          <span className="font-bold uppercase tracking-wider text-[var(--color-ink)]">
            Section 04 · Strategic Long-Term Pipeline (Active Screen)
          </span>
          <span className="text-[var(--color-muted)]">Live Demonstration Ledger</span>
        </div>

        <div className="overflow-x-auto border border-[var(--color-hairline)] bg-[var(--color-surface)]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[10px] uppercase text-[var(--color-muted)] bg-[var(--color-raised)]/30 border-b border-[var(--color-hairline)]">
              <tr>
                <th className="py-2.5 px-3 font-bold">Ticker</th>
                <th className="py-2.5 px-3 font-bold">Sector</th>
                <th className="py-2.5 px-3 text-right font-bold">Quant Score</th>
                <th className="py-2.5 px-3 text-right font-bold">ROE</th>
                <th className="py-2.5 px-3 text-right font-bold">D / E</th>
                <th className="py-2.5 px-3 text-right font-bold">PEG</th>
                <th className="py-2.5 px-3 text-right font-bold">3Y Sales CAGR</th>
                <th className="py-2.5 px-3 text-right font-bold">FII/DII Stake</th>
                <th className="py-2.5 px-3 min-w-[240px] font-bold">Quantitative Thesis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-hairline)]/60">
              {SAMPLE_STRATEGIC_SETUPS.map((s) => (
                <tr key={s.ticker} className="hover:bg-[var(--color-hairline)]/20 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-[var(--color-ink)] text-sm">{s.ticker}</span>
                    <div className="text-[10px] text-[var(--color-muted)] font-serif">{s.name}</div>
                  </td>
                  <td className="py-2.5 px-3 text-[10px] text-[var(--color-muted)] font-mono">
                    {s.sector}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold tabular-nums text-[var(--color-ink)]">
                    {s.compositeScore}/100
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-[var(--color-bullish)]">
                    {s.roe.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-[var(--color-ink)]">
                    {s.debtToEquity.toFixed(2)}x
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-[var(--color-ink)]">
                    {s.pegRatio.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-[var(--color-ink)]">
                    {s.salesCagr3Y.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-[var(--color-muted)] text-[11px]">
                    {s.fiiDiiStake}
                  </td>
                  <td className="py-2.5 px-3 text-[11px] font-serif text-[var(--color-muted)] leading-relaxed">
                    {s.thesis}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center text-xs font-mono text-[var(--color-muted)] pt-2 border-t border-[var(--color-hairline)]">
          <span>Rebalanced monthly upon quarterly corporate filings and shareholding disclosures.</span>
          <Link href="/bets/short-term" className="underline hover:text-[var(--color-ink)]">
            &larr; Return to Short-Term Tactical Bets
          </Link>
        </div>
      </section>
    </div>
  );
}
