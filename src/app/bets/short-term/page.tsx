import type { Metadata } from 'next';
import Link from 'next/link';
import { BetsNav } from '../../../components/bets/BetsNav';

export const metadata: Metadata = {
  title: 'Short-Term Quantitative Bets | Methodology & Models | Kosh',
  description:
    'Systematic tactical swing and momentum models (1-4 week horizon) driven by dual momentum, volume velocity, ATR volatility bands, and hybrid LLM synthesis.',
  alternates: { canonical: '/bets/short-term' },
};

interface TacticalSetup {
  ticker: string;
  name: string;
  model: 'Momentum Breakout' | 'Mean Reversion';
  quantScore: number;
  entryPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  riskReward: string;
  triggers: string[];
  status: 'Active' | 'Target Hit' | 'Monitoring';
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
    triggers: ['20 EMA > 50 SMA alignment', 'RS vs Nifty 50: 1.42x', 'Volume 2.1x 20-day SMA', 'RSI 62.4'],
    status: 'Active',
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
    triggers: ['20-day high breakout', 'Delivery % at 58.4%', 'Volume surge 1.9x', 'RSI 59.8'],
    status: 'Active',
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
    triggers: ['Lower Bollinger touch (20, 2)', 'RSI oversold at 31.2', 'Delivery 62.1%', 'Pierced key support with hammer wick'],
    status: 'Monitoring',
  },
];

export default function ShortTermBetsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16 font-serif text-[var(--color-ink)]">
      <BetsNav />

      {/* 1. Executive Summary & Objective */}
      <section className="space-y-4">
        <div className="border-b border-[var(--color-hairline)] pb-2 flex items-center justify-between text-xs font-mono">
          <span className="font-bold uppercase tracking-wider text-[var(--color-ink)]">
            Section 01 · Objective &amp; Philosophy
          </span>
          <span className="text-[var(--color-muted)]">Horizon: 5 to 20 Sessions</span>
        </div>

        <p className="text-base sm:text-lg leading-relaxed text-[var(--color-ink)]">
          Short-term bets at Kosh eliminate reliance on unconstrained large language model predictions.
          Instead of prompting an LLM to recommend stocks out of thin air—which leads to hallucinated
          support levels, unexecutable entry targets, and zero backtestability—we employ a{' '}
          <strong>Quant-First Deterministic Engine</strong>. Every candidate is evaluated through hard mathematical
          gates across 75+ liquid Indian equities, with Gemini restricted strictly to translating verified
          quantitative metrics into institutional-grade narrative context.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 font-mono text-xs">
          <div className="border border-[var(--color-hairline)] p-4 bg-[var(--color-surface)]">
            <div className="text-[10px] uppercase text-[var(--color-muted)] mb-1">Target Horizon</div>
            <div className="text-lg font-bold text-[var(--color-ink)]">1 to 4 Weeks</div>
            <p className="text-[11px] text-[var(--color-muted)] mt-1 font-serif">
              Designed to capture tactical swings, institutional volume shocks, and momentum continuations.
            </p>
          </div>
          <div className="border border-[var(--color-hairline)] p-4 bg-[var(--color-surface)]">
            <div className="text-[10px] uppercase text-[var(--color-muted)] mb-1">Risk Asymmetry</div>
            <div className="text-lg font-bold text-[var(--color-bullish)]">Min 1 : 2.0 R:R</div>
            <p className="text-[11px] text-[var(--color-muted)] mt-1 font-serif">
              Calculated using 14-period Average True Range (ATR) so targets adapt to asset volatility.
            </p>
          </div>
          <div className="border border-[var(--color-hairline)] p-4 bg-[var(--color-surface)]">
            <div className="text-[10px] uppercase text-[var(--color-muted)] mb-1">Exit Discipline</div>
            <div className="text-lg font-bold text-[var(--color-ink)]">Hard Time-Stop</div>
            <p className="text-[11px] text-[var(--color-muted)] mt-1 font-serif">
              20 trading sessions maximum holding duration. Unmet setups are closed to redeploy capital.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Core Quantitative Formulas */}
      <section className="space-y-6">
        <div className="border-b border-[var(--color-hairline)] pb-2 flex items-center justify-between text-xs font-mono">
          <span className="font-bold uppercase tracking-wider text-[var(--color-ink)]">
            Section 02 · Quantitative Screening Formulas
          </span>
          <span className="text-[var(--color-muted)]">Algorithmic Filters</span>
        </div>

        {/* Model A: Dual Momentum */}
        <div className="border border-[var(--color-hairline)] bg-[var(--color-surface)] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-hairline)] pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-muted)] block">Model A</span>
              <h3 className="font-serif text-xl font-bold text-[var(--color-ink)]">
                Dual Momentum &amp; Volume Surge (Trend Continuation)
              </h3>
            </div>
            <span className="font-mono text-xs font-bold px-2 py-0.5 border border-[var(--color-bullish)] text-[var(--color-bullish)] self-start sm:self-auto">
              BULLISH BREAKOUT
            </span>
          </div>

          <p className="text-sm leading-relaxed text-[var(--color-muted)]">
            Captures large-cap and high-liquidity stocks exhibiting sustained institutional accumulation,
            positive relative alpha over the Nifty 50, and volatility expansion above key moving averages.
          </p>

          <div className="bg-[var(--color-bg)] border border-[var(--color-hairline)] p-4 font-mono text-xs space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink)]">
              Formal Entry Criteria:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-[var(--color-muted)]">
              <div className="space-y-1">
                <span className="text-[var(--color-ink)] font-semibold">1. Trend Alignment Gate:</span>
                <code className="block bg-[var(--color-surface)] p-1.5 border border-[var(--color-hairline)] text-[var(--color-ink)]">
                  Close &gt; EMA(20) &gt; SMA(50)
                </code>
              </div>
              <div className="space-y-1">
                <span className="text-[var(--color-ink)] font-semibold">2. Relative Strength (RS):</span>
                <code className="block bg-[var(--color-surface)] p-1.5 border border-[var(--color-hairline)] text-[var(--color-ink)]">
                  Return(Stock, 20d) / Return(NIFTY, 20d) &ge; 1.20
                </code>
              </div>
              <div className="space-y-1">
                <span className="text-[var(--color-ink)] font-semibold">3. Volume Expansion Gate:</span>
                <code className="block bg-[var(--color-surface)] p-1.5 border border-[var(--color-hairline)] text-[var(--color-ink)]">
                  Volume(Today) &ge; 1.80 &times; SMA(Volume, 20)
                </code>
              </div>
              <div className="space-y-1">
                <span className="text-[var(--color-ink)] font-semibold">4. Momentum Sweet Spot:</span>
                <code className="block bg-[var(--color-surface)] p-1.5 border border-[var(--color-hairline)] text-[var(--color-ink)]">
                  55.0 &le; RSI(14) &le; 68.0
                </code>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs pt-2">
            <div className="border border-[var(--color-hairline)] p-3 bg-[var(--color-raised)]/20">
              <span className="text-[10px] text-[var(--color-muted)] uppercase block">Dynamic Stop-Loss Formula</span>
              <div className="font-bold text-sm text-[var(--color-bearish)] mt-0.5">
                Stop-Loss = Entry &minus; (1.50 &times; ATR<sub>14</sub>)
              </div>
              <p className="text-[10px] text-[var(--color-muted)] mt-1 font-serif">
                Positions the invalidation level beyond normal daily intraday noise.
              </p>
            </div>
            <div className="border border-[var(--color-hairline)] p-3 bg-[var(--color-raised)]/20">
              <span className="text-[10px] text-[var(--color-muted)] uppercase block">Profit Target Formula</span>
              <div className="font-bold text-sm text-[var(--color-bullish)] mt-0.5">
                Target = Entry + (3.00 &times; ATR<sub>14</sub>)
              </div>
              <p className="text-[10px] text-[var(--color-muted)] mt-1 font-serif">
                Guarantees an asymmetric 1:2.0 risk-to-reward ratio prior to trade confirmation.
              </p>
            </div>
          </div>
        </div>

        {/* Model B: Mean Reversion */}
        <div className="border border-[var(--color-hairline)] bg-[var(--color-surface)] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-hairline)] pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-muted)] block">Model B</span>
              <h3 className="font-serif text-xl font-bold text-[var(--color-ink)]">
                Contrarian Mean-Reversion (Oversold Quality Bounce)
              </h3>
            </div>
            <span className="font-mono text-xs font-bold px-2 py-0.5 border border-[var(--color-neutral)] text-[var(--color-ink)] self-start sm:self-auto">
              TACTICAL DIP
            </span>
          </div>

          <p className="text-sm leading-relaxed text-[var(--color-muted)]">
            Identifies high-quality large-cap equities experiencing extreme panic selling or localized liquidation
            into major structural support where institutional delivery accumulation is surging.
          </p>

          <div className="bg-[var(--color-bg)] border border-[var(--color-hairline)] p-4 font-mono text-xs space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink)]">
              Formal Entry Criteria:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-[var(--color-muted)]">
              <div className="space-y-1">
                <span className="text-[var(--color-ink)] font-semibold">1. Volatility Band Penetration:</span>
                <code className="block bg-[var(--color-surface)] p-1.5 border border-[var(--color-hairline)] text-[var(--color-ink)]">
                  Close &le; LowerBand(Bollinger, 20, 2&sigma;)
                </code>
              </div>
              <div className="space-y-1">
                <span className="text-[var(--color-ink)] font-semibold">2. Exhaustion Momentum:</span>
                <code className="block bg-[var(--color-surface)] p-1.5 border border-[var(--color-hairline)] text-[var(--color-ink)]">
                  RSI(14) &le; 32.0 (Oversold extreme)
                </code>
              </div>
              <div className="space-y-1">
                <span className="text-[var(--color-ink)] font-semibold">3. Institutional Absorption:</span>
                <code className="block bg-[var(--color-surface)] p-1.5 border border-[var(--color-hairline)] text-[var(--color-ink)]">
                  Delivery Percentage &ge; 55.0% on NSE
                </code>
              </div>
              <div className="space-y-1">
                <span className="text-[var(--color-ink)] font-semibold">4. Fundamental Quality Baseline:</span>
                <code className="block bg-[var(--color-surface)] p-1.5 border border-[var(--color-hairline)] text-[var(--color-ink)]">
                  Market Cap &gt; ₹25,000 cr &amp; TTM OCF &gt; 0
                </code>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs pt-2">
            <div className="border border-[var(--color-hairline)] p-3 bg-[var(--color-raised)]/20">
              <span className="text-[10px] text-[var(--color-muted)] uppercase block">Dynamic Stop-Loss Formula</span>
              <div className="font-bold text-sm text-[var(--color-bearish)] mt-0.5">
                Stop-Loss = Min(Low, 5d) &minus; 0.50%
              </div>
              <p className="text-[10px] text-[var(--color-muted)] mt-1 font-serif">
                Structural invalidation if the multi-day liquidation low fails to hold.
              </p>
            </div>
            <div className="border border-[var(--color-hairline)] p-3 bg-[var(--color-raised)]/20">
              <span className="text-[10px] text-[var(--color-muted)] uppercase block">Profit Target Formula</span>
              <div className="font-bold text-sm text-[var(--color-bullish)] mt-0.5">
                Target = EMA(20) Mean-Reversion Bound
              </div>
              <p className="text-[10px] text-[var(--color-muted)] mt-1 font-serif">
                Statistical mean price return as the oversold anomaly corrects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Hybrid Quant-LLM Protocol */}
      <section className="space-y-4">
        <div className="border-b border-[var(--color-hairline)] pb-2 flex items-center justify-between text-xs font-mono">
          <span className="font-bold uppercase tracking-wider text-[var(--color-ink)]">
            Section 03 · Execution Protocol &amp; LLM Synthesis
          </span>
          <span className="text-[var(--color-muted)]">Quant-First Architecture</span>
        </div>

        <div className="border border-[var(--color-hairline)] bg-[var(--color-surface)] p-6 space-y-4">
          <h3 className="font-serif text-lg font-bold text-[var(--color-ink)]">
            How Quantitative Logic and Gemini 2.5 Interact
          </h3>
          <p className="text-sm leading-relaxed text-[var(--color-muted)]">
            In Kosh, the quantitative screener runs strictly in deterministic TypeScript using verified market
            data from Yahoo Finance and the National Stock Exchange. The LLM is prohibited from selecting stocks,
            choosing trade directions, or altering stop-loss and target price levels.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs pt-2">
            <div className="border border-[var(--color-hairline)] p-3 bg-[var(--color-bg)]">
              <div className="text-[10px] font-bold text-[var(--color-muted)] uppercase">Step 1</div>
              <div className="font-bold text-[var(--color-ink)] mt-1">Data Ingestion</div>
              <p className="text-[10px] font-serif text-[var(--color-muted)] mt-1">
                EOD OHLCV candle histories loaded for Nifty 50 and Next 50 universe.
              </p>
            </div>
            <div className="border border-[var(--color-hairline)] p-3 bg-[var(--color-bg)]">
              <div className="text-[10px] font-bold text-[var(--color-muted)] uppercase">Step 2</div>
              <div className="font-bold text-[var(--color-ink)] mt-1">Quant Screener</div>
              <p className="text-[10px] font-serif text-[var(--color-muted)] mt-1">
                Calculates RSI, EMAs, ATR, and volume ratios. Computes composite score (0-100).
              </p>
            </div>
            <div className="border border-[var(--color-hairline)] p-3 bg-[var(--color-bg)]">
              <div className="text-[10px] font-bold text-[var(--color-muted)] uppercase">Step 3</div>
              <div className="font-bold text-[var(--color-ink)] mt-1">Risk Bounds</div>
              <p className="text-[10px] font-serif text-[var(--color-muted)] mt-1">
                Computes mathematical Stop-Loss and Target with minimum 1:2.0 R:R requirement.
              </p>
            </div>
            <div className="border border-[var(--color-hairline)] p-3 bg-[var(--color-bg)]">
              <div className="text-[10px] font-bold text-[var(--color-muted)] uppercase">Step 4</div>
              <div className="font-bold text-[var(--color-ink)] mt-1">LLM Rationale</div>
              <p className="text-[10px] font-serif text-[var(--color-muted)] mt-1">
                Gemini translates verified factors into a 2-sentence institutional thesis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Active Screen & Monitored Setups */}
      <section className="space-y-4">
        <div className="border-b border-[var(--color-hairline)] pb-2 flex items-center justify-between text-xs font-mono">
          <span className="font-bold uppercase tracking-wider text-[var(--color-ink)]">
            Section 04 · Active Model Setups (Quantitative Screen)
          </span>
          <span className="text-[var(--color-muted)]">Live Demonstration Ledger</span>
        </div>

        <div className="overflow-x-auto border border-[var(--color-hairline)] bg-[var(--color-surface)]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[10px] uppercase text-[var(--color-muted)] bg-[var(--color-raised)]/30 border-b border-[var(--color-hairline)]">
              <tr>
                <th className="py-2.5 px-3 font-bold">Ticker</th>
                <th className="py-2.5 px-3 font-bold">Model Setup</th>
                <th className="py-2.5 px-3 text-right font-bold">Quant Score</th>
                <th className="py-2.5 px-3 text-right font-bold">Entry Ref</th>
                <th className="py-2.5 px-3 text-right font-bold">Stop-Loss</th>
                <th className="py-2.5 px-3 text-right font-bold">Target</th>
                <th className="py-2.5 px-3 text-center font-bold">R : R</th>
                <th className="py-2.5 px-3 min-w-[220px] font-bold">Technical Triggers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-hairline)]/60">
              {SAMPLE_TACTICAL_SETUPS.map((s) => (
                <tr key={s.ticker} className="hover:bg-[var(--color-hairline)]/20 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-[var(--color-ink)] text-sm">{s.ticker}</span>
                    <div className="text-[10px] text-[var(--color-muted)] font-serif">{s.name}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink)]">
                      {s.model}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold tabular-nums text-[var(--color-ink)]">
                    {s.quantScore}/100
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-[var(--color-ink)]">
                    ₹{s.entryPrice.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-[var(--color-bearish)] font-semibold">
                    ₹{s.stopLossPrice.toLocaleString('en-IN')}
                    <div className="text-[9px] text-[var(--color-muted)]">
                      (-{(((s.entryPrice - s.stopLossPrice) / s.entryPrice) * 100).toFixed(1)}%)
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-[var(--color-bullish)] font-semibold">
                    ₹{s.targetPrice.toLocaleString('en-IN')}
                    <div className="text-[9px] text-[var(--color-muted)]">
                      (+{(((s.targetPrice - s.entryPrice) / s.entryPrice) * 100).toFixed(1)}%)
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-[var(--color-ink)]">
                    {s.riskReward}
                  </td>
                  <td className="py-2.5 px-3 text-[11px] font-serif text-[var(--color-muted)]">
                    {s.triggers.join(' · ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center text-xs font-mono text-[var(--color-muted)] pt-2 border-t border-[var(--color-hairline)]">
          <span>Evaluated daily at 18:30 IST following official NSE Bhavcopy reconciliation.</span>
          <Link href="/bets/long-term" className="underline hover:text-[var(--color-ink)]">
            Explore Long-Term Strategic Bets &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}
