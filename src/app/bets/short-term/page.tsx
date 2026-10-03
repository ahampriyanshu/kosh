import type { Metadata } from 'next';
import Link from 'next/link';
import { BetsNav } from '../../../components/bets/BetsNav';

export const metadata: Metadata = {
  title: 'Short-Term Tactical Models | Methodology & Formulation | Kosh',
  description:
    'Mathematical formulations and execution protocols for four distinct short-term tactical equity models across Indian equities.',
  alternates: { canonical: '/bets/short-term' },
};

interface TacticalSetup {
  ticker: string;
  name: string;
  category: string;
  quantScore: number;
  entryPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  riskReward: string;
  triggers: string;
}

const SAMPLE_TACTICAL_SETUPS: TacticalSetup[] = [
  {
    ticker: 'TRENT',
    name: 'Trent Ltd',
    category: 'Dual Momentum Breakout',
    quantScore: 92,
    entryPrice: 7120,
    targetPrice: 7650,
    stopLossPrice: 6855,
    riskReward: '1:2.0',
    triggers: '20 EMA > 50 SMA; RS vs Nifty 1.42; Vol 2.1x SMA20; RSI 62.4',
  },
  {
    ticker: 'BHARATFORG',
    name: 'Bharat Forge Ltd',
    category: 'Dual Momentum Breakout',
    quantScore: 88,
    entryPrice: 1485,
    targetPrice: 1610,
    stopLossPrice: 1422,
    riskReward: '1:2.0',
    triggers: '20-day high breakout; Delivery 58.4%; Vol 1.9x SMA20; RSI 59.8',
  },
  {
    ticker: 'HDFCBANK',
    name: 'HDFC Bank Ltd',
    category: 'Contrarian Mean-Reversion',
    quantScore: 84,
    entryPrice: 1640,
    targetPrice: 1725,
    stopLossPrice: 1598,
    riskReward: '1:2.0',
    triggers: 'Lower Bollinger Band touch (20, 2); RSI 30.5; Delivery 62.1%',
  },
  {
    ticker: 'HAL',
    name: 'Hindustan Aeronautics Ltd',
    category: 'Derivatives Long Build-Up',
    quantScore: 89,
    entryPrice: 4720,
    targetPrice: 5120,
    stopLossPrice: 4520,
    riskReward: '1:2.0',
    triggers: 'OI surge +11.4%; Positive basis +0.85%; Cash delivery 1.7x; PCR 1.15',
  },
  {
    ticker: 'DIXON',
    name: 'Dixon Technologies Ltd',
    category: 'Post-Earnings Momentum (PEAD)',
    quantScore: 91,
    entryPrice: 13450,
    targetPrice: 14650,
    stopLossPrice: 12850,
    riskReward: '1:2.0',
    triggers: 'PAT beat +16.2%; Gap-up +4.1% on 3.1x volume; Closed above opening range',
  },
];

export default function ShortTermBetsPage() {
  return (
    <article className="max-w-4xl mx-auto space-y-12 pb-20 font-serif text-[var(--color-ink)] leading-relaxed">
      <BetsNav />

      {/* Title & Metadata Header */}
      <header className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-ink)] leading-tight">
          Tactical Equity Models: Four Distinct Short-Term Quantitative Setups
        </h1>
        <p className="font-mono text-xs text-[var(--color-muted)]">
          Horizon: 5 to 20 Trading Sessions · Screening Universe: NSE NIFTY 100 &amp; F&amp;O Equities · Engine: TypeScript &amp; TechnicalIndicators
        </p>
      </header>

      {/* Abstract */}
      <section className="border-l-2 border-[var(--color-ink)] pl-4 italic text-sm text-[var(--color-muted)]">
        <p>
          Abstract—High statistical confidence in short-term equities trading requires moving past generalized
          indicators into sharply defined structural regimes. Rather than deploying a monolithic screening rule,
          Kosh classifies tactical setups into four specialized quantitative categories: Dual Momentum Breakouts,
          Contrarian Mean-Reversions, Derivatives Open Interest Build-Ups, and Post-Earnings Announcement Drift (PEAD).
          Each model is governed by independent entry criteria, volatility-adjusted ATR risk bounds, and strict
          time-based invalidation rules.
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
            <div>Time-Stop = 20 trading sessions</div>
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
            <div>Time-Stop = 15 trading sessions</div>
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
            <div>Time-Stop = Expiry week or 15 trading sessions</div>
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
            <div>Time-Stop = 20 trading sessions</div>
          </div>
        </div>
      </section>

      {/* Section III */}
      <section className="space-y-4">
        <h2 className="text-base font-mono font-bold uppercase tracking-wider text-[var(--color-ink)] border-b border-[var(--color-hairline)] pb-1">
          III. The Hybrid Quant-LLM Execution Protocol
        </h2>
        <p className="text-sm text-justify">
          The interaction between quantitative screening and generative language models is strictly unidirectional.
          The TypeScript screening pipeline evaluates Bhavcopy data, derivative sheets, and earnings filings,
          validates every mathematical condition, and outputs an immutable data payload:
        </p>
        <div className="font-mono text-xs text-[var(--color-muted)] pl-4 border-l border-[var(--color-hairline)]">
          <code>&#123; ticker, category, entry, stopLoss, target, quantScore, triggers &#125;</code>
        </div>
        <p className="text-sm text-justify">
          Gemini 2.5 is invoked with this immutable payload and a constrained system prompt. It is tasked solely with
          synthesizing exchange corporate filings, regulatory updates, and management commentary into a concise
          two-sentence institutional investment thesis. The model possesses no tool or authority to alter price numbers,
          adjust risk multiples, or insert tickers outside the quantitatively qualified set.
        </p>
      </section>

      {/* Section IV */}
      <section className="space-y-4">
        <h2 className="text-base font-mono font-bold uppercase tracking-wider text-[var(--color-ink)] border-b border-[var(--color-hairline)] pb-1">
          IV. Active Tactical Candidate Ledger
        </h2>
        <p className="text-xs font-mono text-[var(--color-muted)]">
          Table 1: Current setups meeting algorithmic threshold criteria across the four tactical categories.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-t border-b border-[var(--color-ink)]">
            <thead>
              <tr className="border-b border-[var(--color-hairline)] text-[10px] uppercase text-[var(--color-muted)]">
                <th className="py-2 pr-3 font-semibold">Ticker</th>
                <th className="py-2 pr-3 font-semibold">Category</th>
                <th className="py-2 pr-3 text-right font-semibold">Score</th>
                <th className="py-2 pr-3 text-right font-semibold">Entry Ref</th>
                <th className="py-2 pr-3 text-right font-semibold">Stop-Loss</th>
                <th className="py-2 pr-3 text-right font-semibold">Target</th>
                <th className="py-2 pr-3 text-center font-semibold">R : R</th>
                <th className="py-2 font-semibold">Algorithmic Triggers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-hairline)]">
              {SAMPLE_TACTICAL_SETUPS.map((s) => (
                <tr key={s.ticker}>
                  <td className="py-2.5 pr-3">
                    <span className="font-bold text-[var(--color-ink)]">{s.ticker}</span>
                    <span className="text-[10px] text-[var(--color-muted)] block font-serif">{s.name}</span>
                  </td>
                  <td className="py-2.5 pr-3 text-[11px] text-[var(--color-ink)]">{s.category}</td>
                  <td className="py-2.5 pr-3 text-right font-semibold tabular-nums text-[var(--color-ink)]">
                    {s.quantScore}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-[var(--color-ink)] font-semibold">
                    ₹{s.entryPrice.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-[var(--color-ink)]">
                    ₹{s.stopLossPrice.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums font-semibold text-[var(--color-ink)]">
                    ₹{s.targetPrice.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 pr-3 text-center text-[var(--color-muted)]">{s.riskReward}</td>
                  <td className="py-2.5 text-[11px] font-serif text-[var(--color-muted)]">{s.triggers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="flex justify-between items-center text-xs font-mono text-[var(--color-muted)] pt-3">
          <span>Evaluated daily at 18:30 IST upon official NSE Bhavcopy and F&amp;O data reconciliation.</span>
          <Link href="/bets/long-term" className="underline hover:text-[var(--color-ink)]">
            Review Strategic Long-Term Models &rarr;
          </Link>
        </footer>
      </section>
    </article>
  );
}
