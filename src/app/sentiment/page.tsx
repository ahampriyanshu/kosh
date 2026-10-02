import type { Metadata } from 'next';
import Link from 'next/link';
import { getHistoricalMoods, computeMoodSnapshot } from '../../../lib/sentiment';
import { MarketMoodIndex } from '../../components/MarketMoodIndex';
import { PageHeader } from '../../components/ui/PageHeader';
import type { MoodSnapshot, SentimentRegime } from '../../../lib/schemas';

export const metadata: Metadata = {
  title: 'Market Mood Index | Kosh',
  description: 'Audited 0-100 Composite Market Mood Index and Factor Attribution across Breadth, Institutional Flows, Volatility, and Derivatives.',
};

const REGIME_BADGES: Record<SentimentRegime, { text: string; bg: string; border: string }> = {
  'Extreme Fear': { text: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-300 dark:border-red-800' },
  'Fear': { text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-300 dark:border-amber-800' },
  'Neutral': { text: 'text-zinc-600 dark:text-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800/40', border: 'border-zinc-300 dark:border-zinc-700' },
  'Greed': { text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-300 dark:border-emerald-800' },
  'Extreme Greed': { text: 'text-teal-700 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/40', border: 'border-teal-300 dark:border-teal-800' },
};

export default function SentimentPage() {
  const history = getHistoricalMoods(30);

  // Use the latest historical mood, or construct a neutral fallback
  const currentItem = history[0];
  const currentMood: MoodSnapshot = currentItem?.mood ?? {
    composite: 50,
    regime: 'Neutral',
    session: 'closing',
    asOf: new Date().toISOString(),
    summary: 'Market sentiment is in equilibrium regime awaiting macro catalysts.',
    categories: {
      breadth: { score: 50, regime: 'Neutral', label: 'Breadth & Price Action', weight: 0.25, summary: 'Balanced market breadth', metrics: { adRatio: 1.0, advances: 250, declines: 250 } },
      flows: { score: 50, regime: 'Neutral', label: 'Institutional Flows', weight: 0.25, summary: 'Neutral capital flow', metrics: { fiiNet: 0, diiNet: 0 } },
      volatility: { score: 50, regime: 'Neutral', label: 'Volatility & Risk Appetite', weight: 0.25, summary: 'Baseline India VIX', metrics: { vix: 14.5 } },
      derivatives: { score: 50, regime: 'Neutral', label: 'Derivatives & Options Skew', weight: 0.25, summary: 'Balanced options PCR', metrics: { pcrOi: 1.0 } },
    },
  };

  const { categories } = currentMood;

  return (
    <div className="pb-16 font-serif">
      <PageHeader
        title="Market Mood Index (MMI)"
        description="Audited 0–100 composite risk-on / risk-off sentiment barometer synthesizing cash market breadth, institutional cash flows, volatility, and derivatives options skew."
      />

      {/* Hero Master Sentiment Beam */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        <div className="lg:col-span-6">
          <MarketMoodIndex mood={currentMood} />
        </div>

        {/* Executive Attribution Deck */}
        <div className="lg:col-span-6 flex flex-col justify-between border border-[var(--color-hairline)] bg-[var(--color-surface)] p-6">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--color-hairline)] text-xs font-mono text-[var(--color-muted)]">
              <span className="font-bold uppercase tracking-wider text-[var(--color-ink)]">
                Quantitative Factor Attribution
              </span>
              <span>
                As of: {currentMood.asOf.slice(0, 10)}
              </span>
            </div>

            <h3 className="font-serif text-xl font-bold text-[var(--color-ink)] mb-3 leading-snug">
              What Is Driving Today&apos;s Market Regime?
            </h3>

            <p className="text-sm text-[var(--color-muted)] leading-relaxed mb-4">
              {currentMood.summary}
            </p>

            <ul className="space-y-2 text-xs font-mono text-[var(--color-muted)] mb-4">
              <li className="flex items-start gap-2">
                <span className="font-bold text-[var(--color-ink)]">• Breadth:</span>
                <span>{categories.breadth.summary}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[var(--color-ink)]">• Flows:</span>
                <span>{categories.flows.summary}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[var(--color-ink)]">• Volatility:</span>
                <span>{categories.volatility.summary}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[var(--color-ink)]">• Derivatives:</span>
                <span>{categories.derivatives.summary}</span>
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t border-[var(--color-hairline)] flex items-center justify-between text-xs font-mono text-[var(--color-faint)]">
            <span>Primary Session: {currentMood.session === 'closing' ? 'Official Close (15:45 IST)' : 'Morning Stance (08:30 IST)'}</span>
            <span>Immutable Git Record</span>
          </div>
        </div>
      </div>

      {/* 4 Standalone Category Deep-Dive Grid */}
      <div className="mb-12">
        <div className="pb-2 mb-6 border-b-2 border-[var(--color-ink)] flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-bold text-[var(--color-ink)]">
            The Four Category Sub-Indexes
          </h2>
          <span className="text-xs font-mono text-[var(--color-muted)]">
            Equal 25% Factor Weighting
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category 1: Breadth */}
          <div className="border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-lg font-bold text-[var(--color-ink)]">
                  1. Breadth &amp; Participation
                </h3>
                <span className="font-mono text-sm font-bold tabular-nums text-[var(--color-ink)]">
                  {categories.breadth.score} / 100
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed mb-4">
                {categories.breadth.summary}
              </p>
              <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--color-raised)] text-center text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[var(--color-muted)] block">A/D Ratio</span>
                  <span className="font-bold text-[var(--color-ink)]">{String(categories.breadth.metrics.adRatio ?? '1.0')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--color-muted)] block">% Advancing</span>
                  <span className="font-bold text-[var(--color-ink)]">{String(categories.breadth.metrics.pctAdvancing ?? '50')}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--color-muted)] block">52W Highs/Lows</span>
                  <span className="font-bold text-[var(--color-ink)]">
                    {String(categories.breadth.metrics.near52wHighs ?? 0)} / {String(categories.breadth.metrics.near52wLows ?? 0)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-[var(--color-hairline)] text-[11px] font-mono text-[var(--color-faint)]">
              Weight: 25% · Data: Nifty 500 Equities
            </div>
          </div>

          {/* Category 2: Institutional Flows */}
          <div className="border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-lg font-bold text-[var(--color-ink)]">
                  2. Institutional Cash Flows
                </h3>
                <span className="font-mono text-sm font-bold tabular-nums text-[var(--color-ink)]">
                  {categories.flows.score} / 100
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed mb-4">
                {categories.flows.summary}
              </p>
              <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--color-raised)] text-center text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[var(--color-muted)] block">FII Net Cash</span>
                  <span className={`font-bold ${(Number(categories.flows.metrics.fiiNet ?? 0) >= 0) ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}`}>
                    {Number(categories.flows.metrics.fiiNet ?? 0) >= 0 ? '+' : ''}
                    {Number(categories.flows.metrics.fiiNet ?? 0).toLocaleString()} Cr
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--color-muted)] block">DII Net Cash</span>
                  <span className={`font-bold ${(Number(categories.flows.metrics.diiNet ?? 0) >= 0) ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}`}>
                    {Number(categories.flows.metrics.diiNet ?? 0) >= 0 ? '+' : ''}
                    {Number(categories.flows.metrics.diiNet ?? 0).toLocaleString()} Cr
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--color-muted)] block">Net Imbalance</span>
                  <span className="font-bold text-[var(--color-ink)]">
                    {Number(categories.flows.metrics.totalNet ?? 0) >= 0 ? '+' : ''}
                    {Number(categories.flows.metrics.totalNet ?? 0).toLocaleString()} Cr
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-[var(--color-hairline)] text-[11px] font-mono text-[var(--color-faint)]">
              Weight: 25% · Data: NSE / BSE Institutional Disclosures
            </div>
          </div>

          {/* Category 3: Volatility & Macro Risk */}
          <div className="border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-lg font-bold text-[var(--color-ink)]">
                  3. Volatility &amp; Macro Risk
                </h3>
                <span className="font-mono text-sm font-bold tabular-nums text-[var(--color-ink)]">
                  {categories.volatility.score} / 100
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed mb-4">
                {categories.volatility.summary}
              </p>
              <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--color-raised)] text-center text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[var(--color-muted)] block">India VIX</span>
                  <span className="font-bold text-[var(--color-ink)]">{Number(categories.volatility.metrics.vix ?? 14).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--color-muted)] block">VIX 1D Delta</span>
                  <span className={`font-bold ${(Number(categories.volatility.metrics.vixChangePct ?? 0) > 0) ? 'text-[var(--color-bearish)]' : 'text-[var(--color-bullish)]'}`}>
                    {Number(categories.volatility.metrics.vixChangePct ?? 0) >= 0 ? '+' : ''}
                    {Number(categories.volatility.metrics.vixChangePct ?? 0).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--color-muted)] block">Gold Delta</span>
                  <span className="font-bold text-[var(--color-ink)]">
                    {Number(categories.volatility.metrics.goldChangePct ?? 0) >= 0 ? '+' : ''}
                    {Number(categories.volatility.metrics.goldChangePct ?? 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-[var(--color-hairline)] text-[11px] font-mono text-[var(--color-faint)]">
              Weight: 25% · Inverted Volatility Scale (Low VIX = Greed)
            </div>
          </div>

          {/* Category 4: Derivatives & Options Skew */}
          <div className="border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-lg font-bold text-[var(--color-ink)]">
                  4. Derivatives &amp; Options Skew
                </h3>
                <span className="font-mono text-sm font-bold tabular-nums text-[var(--color-ink)]">
                  {categories.derivatives.score} / 100
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed mb-4">
                {categories.derivatives.summary}
              </p>
              <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--color-raised)] text-center text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[var(--color-muted)] block">Nifty OI PCR</span>
                  <span className="font-bold text-[var(--color-ink)]">
                    {categories.derivatives.metrics.pcrOi !== null ? Number(categories.derivatives.metrics.pcrOi).toFixed(2) : '1.00'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--color-muted)] block">Volume PCR</span>
                  <span className="font-bold text-[var(--color-ink)]">
                    {categories.derivatives.metrics.pcrVolume !== null ? Number(categories.derivatives.metrics.pcrVolume).toFixed(2) : '1.00'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--color-muted)] block">Hedging Tone</span>
                  <span className="font-bold text-[var(--color-ink)]">
                    {Number(categories.derivatives.metrics.pcrOi ?? 1) > 1.25 ? 'High Protection' : Number(categories.derivatives.metrics.pcrOi ?? 1) < 0.75 ? 'Low Hedging' : 'Balanced'}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-[var(--color-hairline)] text-[11px] font-mono text-[var(--color-faint)]">
              Weight: 25% · Contrarian Options Positioning
            </div>
          </div>
        </div>
      </div>

      {/* Historical Sentiment Timeseries Table */}
      <div className="mb-12">
        <div className="pb-2 mb-4 border-b-2 border-[var(--color-ink)] flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-bold text-[var(--color-ink)]">
            Historical Sentiment Timeseries
          </h2>
          <span className="text-xs font-mono text-[var(--color-muted)]">
            Last {history.length} Audited Sessions
          </span>
        </div>

        <div className="border border-[var(--color-hairline)] bg-[var(--color-surface)] overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-hairline)] bg-[var(--color-raised)] text-[var(--color-muted)]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Session</th>
                <th className="py-2.5 px-3">Mood Score</th>
                <th className="py-2.5 px-3">Regime</th>
                <th className="py-2.5 px-3">Breadth</th>
                <th className="py-2.5 px-3">Flows</th>
                <th className="py-2.5 px-3">Volatility</th>
                <th className="py-2.5 px-3">Derivatives</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-hairline)]">
              {history.map(({ date, mood }) => {
                const badge = REGIME_BADGES[mood.regime] ?? REGIME_BADGES.Neutral;
                return (
                  <tr key={date} className="hover:bg-[var(--color-raised)]/50 transition-colors">
                    <td className="py-2 px-3 font-bold text-[var(--color-ink)]">
                      <Link href={`/reports/${date.replace(/-/g, '/')}`} className="hover:underline">
                        {date}
                      </Link>
                    </td>
                    <td className="py-2 px-3 text-[var(--color-muted)]">
                      {mood.session === 'closing' ? 'Close' : 'Morning'}
                    </td>
                    <td className="py-2 px-3 font-bold tabular-nums text-sm text-[var(--color-ink)]">
                      {mood.composite} / 100
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {mood.regime}
                      </span>
                    </td>
                    <td className="py-2 px-3 tabular-nums text-[var(--color-muted)]">
                      {mood.categories.breadth.score}
                    </td>
                    <td className="py-2 px-3 tabular-nums text-[var(--color-muted)]">
                      {mood.categories.flows.score}
                    </td>
                    <td className="py-2 px-3 tabular-nums text-[var(--color-muted)]">
                      {mood.categories.volatility.score}
                    </td>
                    <td className="py-2 px-3 tabular-nums text-[var(--color-muted)]">
                      {mood.categories.derivatives.score}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Educational Framework: The 5 Regimes */}
      <div className="border border-[var(--color-hairline)] bg-[var(--color-surface)] p-6">
        <h3 className="font-serif text-lg font-bold text-[var(--color-ink)] mb-2">
          The Five Sentiment Regimes &amp; Trading Rules
        </h3>
        <p className="text-xs text-[var(--color-muted)] mb-4">
          How quantitative desks use the Kosh Market Mood Index for contrarian and trend positioning:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs font-mono">
          <div className="p-3 border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
            <span className="font-bold text-red-700 dark:text-red-400 block mb-1">0 – 25 Extreme Fear</span>
            <p className="text-[11px] text-[var(--color-muted)]">
              Capitulation &amp; panic hedging. Highest asymmetric risk-reward for long-term contrarian accumulation.
            </p>
          </div>

          <div className="p-3 border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
            <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">26 – 45 Fear</span>
            <p className="text-[11px] text-[var(--color-muted)]">
              Institutional distribution or breadth erosion. Cautious sizing and defensive trailing stops recommended.
            </p>
          </div>

          <div className="p-3 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/20">
            <span className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">46 – 55 Neutral</span>
            <p className="text-[11px] text-[var(--color-muted)]">
              Equilibrium consolidation. Market awaiting fresh earnings or macro policy triggers. Rangebound setups favored.
            </p>
          </div>

          <div className="p-3 border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
            <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">56 – 75 Greed</span>
            <p className="text-[11px] text-[var(--color-muted)]">
              Broad-based trend expansion and steady institutional inflows. Trend-following and momentum strategies work best.
            </p>
          </div>

          <div className="p-3 border border-teal-200 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/20">
            <span className="font-bold text-teal-700 dark:text-teal-400 block mb-1">76 – 100 Extreme Greed</span>
            <p className="text-[11px] text-[var(--color-muted)]">
              Speculative froth and depleted downside hedging. Elevated risk of sharp mean-reversion pullbacks. Trim into strength.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
