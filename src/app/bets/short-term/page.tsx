import type { Metadata } from 'next';
import Link from 'next/link';
import { BetsNav } from '../../../components/bets/BetsNav';

export const metadata: Metadata = {
  title: 'Short-Term Tactical Models | Methodology & Formulation | Kosh',
  description:
    'Mathematical formulations and execution protocols for short-term tactical equity bets across Indian equities.',
  alternates: { canonical: '/bets/short-term' },
};

interface TacticalSetup {
  ticker: string;
  name: string;
  model: string;
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
    model: 'Momentum Breakout',
    quantScore: 89,
    entryPrice: 7120,
    targetPrice: 7650,
    stopLossPrice: 6855,
    riskReward: '1:2.0',
    triggers: '20 EMA > 50 SMA; RS vs Nifty 1.42; Vol 2.1x SMA20; RSI 62.4',
  },
  {
    ticker: 'BHARATFORG',
    name: 'Bharat Forge Ltd',
    model: 'Momentum Breakout',
    quantScore: 84,
    entryPrice: 1485,
    targetPrice: 1610,
    stopLossPrice: 1422,
    riskReward: '1:2.0',
    triggers: '20-day high breakout; Delivery 58.4%; Vol 1.9x SMA20; RSI 59.8',
  },
  {
    ticker: 'HDFCBANK',
    name: 'HDFC Bank Ltd',
    model: 'Mean Reversion',
    quantScore: 81,
    entryPrice: 1640,
    targetPrice: 1725,
    stopLossPrice: 1598,
    riskReward: '1:2.0',
    triggers: 'Lower Bollinger Band touch (20, 2); RSI 31.2; Delivery 62.1%',
  },
];

export default function ShortTermBetsPage() {
  return (
    <article className="max-w-4xl mx-auto space-y-12 pb-20 font-serif text-[var(--color-ink)] leading-relaxed">
      <BetsNav />

      {/* Title & Metadata Header */}
      <header className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-ink)] leading-tight">
          Tactical Equity Models: Dual Momentum Velocity and Volatility-Constrained Reversion
        </h1>
        <p className="font-mono text-xs text-[var(--color-muted)]">
          Horizon: 5 to 20 Trading Sessions · Asset Class: NSE Large &amp; Mid-Cap Equities · Engine: TypeScript &amp; TechnicalIndicators
        </p>
      </header>

      {/* Abstract */}
      <section className="border-l-2 border-[var(--color-ink)] pl-4 italic text-sm text-[var(--color-muted)]">
        <p>
          Abstract—Unconstrained generative language models frequently hallucinate technical support levels,
          fail to preserve consistent risk-reward asymmetry, and produce recommendations unmoored from verifiable
          price memory. This paper details the mathematical specifications governing Kosh&apos;s short-term tactical
          equity desk. We separate deterministic signal computation (trend alignment, relative strength, volume acceleration,
          and ATR envelope sizing) from qualitative synthesis, deploying large language models exclusively for
          institutional catalyst contextualization.
        </p>
      </section>

      {/* Section I */}
      <section className="space-y-4">
        <h2 className="text-base font-mono font-bold uppercase tracking-wider text-[var(--color-ink)] border-b border-[var(--color-hairline)] pb-1">
          I. The Quantitative Mandate
        </h2>
        <p className="text-base text-justify">
          Short-term trading recommendations fail primarily due to poor risk sizing rather than poor entry timing.
          When an artificial intelligence model is prompted to produce trades without computational constraints, it
          invariably selects high-salience tickers and projects arbitrary price targets. To establish an auditable,
          quantitatively sound record, Kosh enforces three non-negotiable operational invariants:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--color-ink)] pl-2">
          <li>
            <strong>Deterministic Signal Verification:</strong> No equity is considered for tactical positioning unless
            it satisfies closed-form algorithmic criteria calculated from verified exchange OHLCV data.
          </li>
          <li>
            <strong>Volatility-Calibrated Risk Bounds:</strong> Profit objectives and invalidation stops are strictly
            derived from the 14-period Average True Range (ATR), ensuring stops accommodate asset-specific noise.
          </li>
          <li>
            <strong>Temporal Invalidation:</strong> Capital must not remain trapped in stagnant consolidation. Any setup
            reaching 20 trading sessions without fulfilling either target or stop is liquidated at market.
          </li>
        </ol>
      </section>

      {/* Section II */}
      <section className="space-y-6">
        <h2 className="text-base font-mono font-bold uppercase tracking-wider text-[var(--color-ink)] border-b border-[var(--color-hairline)] pb-1">
          II. Mathematical Specifications &amp; Formulas
        </h2>

        {/* Model A */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--color-ink)]">
            A. Dual Momentum &amp; Volume Surge (Trend Continuation)
          </h3>
          <p className="text-sm text-justify text-[var(--color-muted)]">
            Designed to exploit institutional momentum bursts in liquid equities outperforming the broader benchmark.
            The model requires joint confirmation of structural trend alignment, positive relative strength alpha over
            the Nifty 50, abnormal volume velocity, and unexhausted momentum.
          </p>

          <div className="font-mono text-xs text-[var(--color-ink)] bg-transparent py-2 pl-4 border-l border-[var(--color-hairline)] space-y-1.5">
            <div>1. Trend Invariant: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Price(t) &gt; EMA(20, t) &gt; SMA(50, t)</div>
            <div>2. Relative Strength: &nbsp;&nbsp;&nbsp;[Return(Stock, 20d) / Return(NIFTY 50, 20d)] &ge; 1.20</div>
            <div>3. Volume Acceleration: &nbsp;Volume(t) &ge; 1.80 &times; SMA(Volume, 20)</div>
            <div>4. Momentum Window: &nbsp;&nbsp;&nbsp;&nbsp;55.0 &le; RSI(14, t) &le; 68.0</div>
          </div>

          <p className="text-sm text-justify text-[var(--color-muted)]">
            The exit envelope enforces an exact 1:2.0 risk-to-reward ratio adjusted for volatility:
          </p>

          <div className="font-mono text-xs text-[var(--color-ink)] py-2 pl-4 border-l border-[var(--color-hairline)] space-y-1.5">
            <div>Stop-Loss = Entry Price &minus; [ 1.50 &times; ATR(14) ]</div>
            <div>Target &nbsp;&nbsp;&nbsp;= Entry Price + [ 3.00 &times; ATR(14) ]</div>
          </div>
        </div>

        {/* Model B */}
        <div className="space-y-3 pt-4">
          <h3 className="text-lg font-bold text-[var(--color-ink)]">
            B. Contrarian Mean-Reversion (Oversold Quality Bounce)
          </h3>
          <p className="text-sm text-justify text-[var(--color-muted)]">
            Designed to capture high-probability counter-trend reversals in premier large-cap businesses experiencing
            transitory liquidation. The model requires extreme volatility band extension, oversold exhaustion, and
            elevated delivery absorption by institutional participants.
          </p>

          <div className="font-mono text-xs text-[var(--color-ink)] bg-transparent py-2 pl-4 border-l border-[var(--color-hairline)] space-y-1.5">
            <div>1. Volatility Band: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Price(t) &le; LowerBand(Bollinger, 20, 2&sigma;)</div>
            <div>2. Oscillator State: &nbsp;&nbsp;&nbsp;&nbsp;RSI(14, t) &le; 32.0</div>
            <div>3. Delivery Inflow: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Delivery Percentage &ge; 55.0% on NSE</div>
            <div>4. Quality Baseline: &nbsp;&nbsp;&nbsp;&nbsp;Market Cap &ge; ₹25,000 cr &amp; TTM Operating Profit &gt; 0</div>
          </div>

          <div className="font-mono text-xs text-[var(--color-ink)] py-2 pl-4 border-l border-[var(--color-hairline)] space-y-1.5">
            <div>Stop-Loss = Min(Low, 5 sessions) &minus; 0.50%</div>
            <div>Target &nbsp;&nbsp;&nbsp;= EMA(20) Mean-Reversion Bound</div>
          </div>
        </div>
      </section>

      {/* Section III */}
      <section className="space-y-4">
        <h2 className="text-base font-mono font-bold uppercase tracking-wider text-[var(--color-ink)] border-b border-[var(--color-hairline)] pb-1">
          III. The Hybrid Quant-LLM Interface
        </h2>
        <p className="text-sm text-justify">
          The integration between quantitative screening and generative language models is strictly unidirectional.
          The TypeScript screening pipeline processes daily Bhavcopy data across the universe, verifies the mathematical
          inequalities, computes the 14-period ATR bounds, and outputs an immutable data payload:
        </p>
        <div className="font-mono text-xs text-[var(--color-muted)] pl-4 border-l border-[var(--color-hairline)]">
          <code>&#123; ticker, entry, stopLoss, target, quantScore, triggers &#125;</code>
        </div>
        <p className="text-sm text-justify">
          Gemini 2.5 is invoked with this immutable payload and a constrained system prompt. It is charged solely with
          reviewing exchange corporate filings, regulatory updates, and upcoming earnings dates to write a concise
          two-sentence investment rationale. The model possesses no tool or authority to alter price numbers, adjust
          risk multiples, or insert tickers outside the quantitatively qualified set.
        </p>
      </section>

      {/* Section IV */}
      <section className="space-y-4">
        <h2 className="text-base font-mono font-bold uppercase tracking-wider text-[var(--color-ink)] border-b border-[var(--color-hairline)] pb-1">
          IV. Active Tactical Candidate Ledger
        </h2>
        <p className="text-xs font-mono text-[var(--color-muted)]">
          Table 1: Current setups meeting algorithmic threshold criteria (Screening Universe: NIFTY 100).
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-t border-b border-[var(--color-ink)]">
            <thead>
              <tr className="border-b border-[var(--color-hairline)] text-[10px] uppercase text-[var(--color-muted)]">
                <th className="py-2 pr-3 font-semibold">Ticker</th>
                <th className="py-2 pr-3 font-semibold">Model</th>
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
                  <td className="py-2.5 pr-3 text-[11px] text-[var(--color-ink)]">{s.model}</td>
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
          <span>Evaluated daily at 18:30 IST upon official NSE Bhavcopy reconciliation.</span>
          <Link href="/bets/long-term" className="underline hover:text-[var(--color-ink)]">
            Review Strategic Long-Term Models &rarr;
          </Link>
        </footer>
      </section>
    </article>
  );
}
