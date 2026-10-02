import type { Metadata } from 'next';
import Link from 'next/link';
import { getHistoricalMoods } from '../../../lib/sentiment';
import { MarketMoodIndex } from '../../components/MarketMoodIndex';
import { PageHeader } from '../../components/ui/PageHeader';
import type { MoodSnapshot } from '../../../lib/schemas';

export const metadata: Metadata = {
  title: 'Market Mood Index | Kosh Daily',
  description: 'Audited 0-100 Composite Market Mood Index and Factor Attribution across Breadth, Institutional Flows, Volatility, and Derivatives.',
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
    <div className="font-serif text-[var(--color-ink)] pb-16">
      {/* Broadsheet Page Masthead / Ear */}
      <div className="pb-2 mb-4 border-b border-[var(--color-hairline)] flex flex-wrap items-center justify-between text-xs font-mono text-[var(--color-muted)]">
        <span>MUMBAI · NATIONAL STOCK EXCHANGE · DERIVATIVES &amp; CASH DESK</span>
        <span>AUDITED 0–100 COMPOSITE SENTIMENT LEDGER</span>
      </div>

      <PageHeader
        title="Market Mood Index (MMI)"
        description="Daily quantitative synthesis of cash market breadth, institutional cash flows, implied volatility, and derivatives options skew for the Indian equity market."
      />

      {/* Hero Master Sentiment Beam */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 my-8 border-t border-b border-[var(--color-hairline)] py-6">
        <div className="md:col-span-5 pr-0 md:pr-6 border-b md:border-b-0 md:border-r border-[var(--color-hairline)]">
          <MarketMoodIndex mood={currentMood} compact />
        </div>

        {/* Executive Attribution Deck */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-1.5 mb-3 border-b border-[var(--color-hairline)] text-xs font-mono text-[var(--color-muted)]">
              <span className="font-bold uppercase tracking-wider text-[var(--color-ink)]">
                Factor Attribution &amp; Driver Analysis
              </span>
              <span>
                As of: {currentMood.asOf.slice(0, 10)}
              </span>
            </div>

            <h3 className="font-serif text-xl font-bold text-[var(--color-ink)] mb-3 leading-snug">
              What Is Driving Today&apos;s Trading Posture?
            </h3>

            <p className="text-sm leading-relaxed text-[var(--color-ink)] mb-4 text-justify">
              {currentMood.summary}
            </p>

            <div className="divide-y divide-[var(--color-hairline)]/70 text-xs">
              <div className="py-2 flex items-start gap-2">
                <span className="font-mono font-bold text-[var(--color-ink)] shrink-0 w-28">Breadth:</span>
                <span className="text-[var(--color-muted)]">{categories.breadth.summary}</span>
              </div>
              <div className="py-2 flex items-start gap-2">
                <span className="font-mono font-bold text-[var(--color-ink)] shrink-0 w-28">Flows:</span>
                <span className="text-[var(--color-muted)]">{categories.flows.summary}</span>
              </div>
              <div className="py-2 flex items-start gap-2">
                <span className="font-mono font-bold text-[var(--color-ink)] shrink-0 w-28">Volatility:</span>
                <span className="text-[var(--color-muted)]">{categories.volatility.summary}</span>
              </div>
              <div className="py-2 flex items-start gap-2">
                <span className="font-mono font-bold text-[var(--color-ink)] shrink-0 w-28">Derivatives:</span>
                <span className="text-[var(--color-muted)]">{categories.derivatives.summary}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--color-hairline)] flex items-center justify-between text-xs font-mono text-[var(--color-muted)]">
            <span>Primary Session: {currentMood.session === 'closing' ? 'Official Close (15:45 IST)' : 'Morning Stance (08:30 IST)'}</span>
            <span>Immutable SHA-256 Digest</span>
          </div>
        </div>
      </div>

      {/* 4 Standalone Category Deep-Dive Grid */}
      <div className="mb-12">
        <div className="pb-1 mb-6 border-b-2 border-[var(--color-ink)] flex items-baseline justify-between">
          <h2 className="font-serif text-lg font-bold text-[var(--color-ink)] uppercase tracking-wider">
            The Four Category Sub-Indexes
          </h2>
          <span className="text-xs font-mono text-[var(--color-muted)]">
            Equal 25% Factor Attribution
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-[var(--color-hairline)]">
          {/* Category 1: Breadth */}
          <div className="space-y-3 pb-6 md:pb-0 pr-0 md:pr-6">
            <div className="flex items-baseline justify-between pb-1.5 border-b border-[var(--color-hairline)]">
              <h3 className="font-serif font-bold text-base text-[var(--color-ink)]">
                1. Breadth &amp; Participation
              </h3>
              <span className="font-mono text-sm font-bold tabular-nums text-[var(--color-ink)]">
                {categories.breadth.score} / 100 <span className="text-xs font-normal text-[var(--color-muted)]">[{categories.breadth.regime}]</span>
              </span>
            </div>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed text-justify">
              {categories.breadth.summary}
            </p>
            <div className="grid grid-cols-3 gap-2 py-2 border-y border-[var(--color-hairline)] text-center text-xs font-mono">
              <div>
                <span className="text-[10px] text-[var(--color-muted)] block">A/D Ratio</span>
                <span className="font-bold text-[var(--color-ink)]">{String(categories.breadth.metrics.adRatio ?? '1.0')}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--color-muted)] block">% Advancing</span>
                <span className="font-bold text-[var(--color-ink)]">{String(categories.breadth.metrics.pctAdvancing ?? '50')}%</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--color-muted)] block">52W Extremes</span>
                <span className="font-bold text-[var(--color-ink)]">
                  {String(categories.breadth.metrics.near52wHighs ?? 0)}H / {String(categories.breadth.metrics.near52wLows ?? 0)}L
                </span>
              </div>
            </div>
            <p className="text-[11px] font-mono text-[var(--color-faint)]">
              Weight: 25% · Data Source: Nifty 500 Equities Universe
            </p>
          </div>

          {/* Category 2: Institutional Flows */}
          <div className="space-y-3 pt-6 md:pt-0 pl-0 md:pl-6">
            <div className="flex items-baseline justify-between pb-1.5 border-b border-[var(--color-hairline)]">
              <h3 className="font-serif font-bold text-base text-[var(--color-ink)]">
                2. Institutional Cash Flows
              </h3>
              <span className="font-mono text-sm font-bold tabular-nums text-[var(--color-ink)]">
                {categories.flows.score} / 100 <span className="text-xs font-normal text-[var(--color-muted)]">[{categories.flows.regime}]</span>
              </span>
            </div>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed text-justify">
              {categories.flows.summary}
            </p>
            <div className="grid grid-cols-3 gap-2 py-2 border-y border-[var(--color-hairline)] text-center text-xs font-mono">
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
            <p className="text-[11px] font-mono text-[var(--color-faint)]">
              Weight: 25% · Data Source: NSE / BSE Institutional Disclosures
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-[var(--color-hairline)] pt-8 mt-8 border-t border-[var(--color-hairline)]">
          {/* Category 3: Volatility & Macro Risk */}
          <div className="space-y-3 pb-6 md:pb-0 pr-0 md:pr-6">
            <div className="flex items-baseline justify-between pb-1.5 border-b border-[var(--color-hairline)]">
              <h3 className="font-serif font-bold text-base text-[var(--color-ink)]">
                3. Volatility &amp; Macro Risk
              </h3>
              <span className="font-mono text-sm font-bold tabular-nums text-[var(--color-ink)]">
                {categories.volatility.score} / 100 <span className="text-xs font-normal text-[var(--color-muted)]">[{categories.volatility.regime}]</span>
              </span>
            </div>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed text-justify">
              {categories.volatility.summary}
            </p>
            <div className="grid grid-cols-3 gap-2 py-2 border-y border-[var(--color-hairline)] text-center text-xs font-mono">
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
            <p className="text-[11px] font-mono text-[var(--color-faint)]">
              Weight: 25% · Inverted Volatility Scale (Low VIX = Greed / Complacency)
            </p>
          </div>

          {/* Category 4: Derivatives & Options Skew */}
          <div className="space-y-3 pt-6 md:pt-0 pl-0 md:pl-6">
            <div className="flex items-baseline justify-between pb-1.5 border-b border-[var(--color-hairline)]">
              <h3 className="font-serif font-bold text-base text-[var(--color-ink)]">
                4. Derivatives &amp; Options Skew
              </h3>
              <span className="font-mono text-sm font-bold tabular-nums text-[var(--color-ink)]">
                {categories.derivatives.score} / 100 <span className="text-xs font-normal text-[var(--color-muted)]">[{categories.derivatives.regime}]</span>
              </span>
            </div>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed text-justify">
              {categories.derivatives.summary}
            </p>
            <div className="grid grid-cols-3 gap-2 py-2 border-y border-[var(--color-hairline)] text-center text-xs font-mono">
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
            <p className="text-[11px] font-mono text-[var(--color-faint)]">
              Weight: 25% · Contrarian Options Skew (High PCR = Oversold Fear)
            </p>
          </div>
        </div>
      </div>

      {/* Historical Sentiment Timeseries Table */}
      <div className="mb-12">
        <div className="pb-1 mb-4 border-b-2 border-[var(--color-ink)] flex items-baseline justify-between">
          <h2 className="font-serif text-lg font-bold text-[var(--color-ink)] uppercase tracking-wider">
            Historical Sentiment Timeseries
          </h2>
          <span className="text-xs font-mono text-[var(--color-muted)]">
            Last {history.length} Audited Sessions
          </span>
        </div>

        <div className="border border-[var(--color-hairline)] overflow-x-auto">
          <table className="w-full text-left text-xs font-serif border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-hairline)] bg-[var(--color-raised)] text-[var(--color-muted)] font-mono text-[11px]">
                <th className="py-2 px-3 font-semibold">Date</th>
                <th className="py-2 px-3 font-semibold">Session</th>
                <th className="py-2 px-3 font-semibold">Mood Score</th>
                <th className="py-2 px-3 font-semibold">Regime</th>
                <th className="py-2 px-3 font-semibold">Breadth</th>
                <th className="py-2 px-3 font-semibold">Flows</th>
                <th className="py-2 px-3 font-semibold">Volatility</th>
                <th className="py-2 px-3 font-semibold">Derivatives</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-hairline)]/70 font-mono text-xs">
              {history.map(({ date, mood }) => (
                <tr key={date} className="hover:bg-[var(--color-raised)]/40 transition-colors">
                  <td className="py-2 px-3 font-semibold text-[var(--color-ink)]">
                    <Link href={`/reports/${date.replace(/-/g, '/')}`} className="underline hover:text-[var(--color-ink)]">
                      {date}
                    </Link>
                  </td>
                  <td className="py-2 px-3 text-[var(--color-muted)]">
                    {mood.session === 'closing' ? 'Close' : 'Morning'}
                  </td>
                  <td className="py-2 px-3 font-bold tabular-nums text-sm text-[var(--color-ink)]">
                    {mood.composite} <span className="text-[10px] font-normal text-[var(--color-muted)]">/ 100</span>
                  </td>
                  <td className="py-2 px-3 uppercase text-[11px] text-[var(--color-ink)] font-semibold">
                    [ {mood.regime} ]
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Notice Box: The 5 Regimes */}
      <div className="p-4 border border-[var(--color-ink)] font-serif text-xs">
        <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[var(--color-hairline)]">
          <span className="font-bold uppercase tracking-wider text-[var(--color-ink)]">
            Audited Framework: The Five Sentiment Regimes &amp; Trading Rules
          </span>
          <span className="font-mono text-[11px] text-[var(--color-muted)]">
            Quantitative Interpretation
          </span>
        </div>
        <p className="text-[var(--color-muted)] mb-3 leading-relaxed text-justify">
          The Kosh Market Mood Index acts as a counter-cyclical and momentum thermometer. Institutional traders use extremes to identify asymmetric contrarian inflection points and mid-range readings to confirm trend continuation:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2 border-t border-[var(--color-hairline)]">
          <div className="space-y-1">
            <span className="font-mono font-bold text-xs uppercase text-[var(--color-bearish)] block">
              0 – 25 Extreme Fear
            </span>
            <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
              Market capitulation and panic hedging. Highest asymmetric risk-reward for long-term contrarian accumulation.
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-mono font-bold text-xs uppercase text-[var(--color-ink)] block">
              26 – 45 Fear
            </span>
            <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
              Institutional distribution or breadth deterioration. Cautious sizing and defensive trailing stops recommended.
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-mono font-bold text-xs uppercase text-[var(--color-muted)] block">
              46 – 55 Neutral
            </span>
            <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
              Equilibrium consolidation. Market awaiting fresh earnings or policy catalysts. Rangebound setups favored.
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-mono font-bold text-xs uppercase text-[var(--color-ink)] block">
              56 – 75 Greed
            </span>
            <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
              Broad-based trend expansion and steady institutional inflows. Trend-following and momentum strategies favored.
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-mono font-bold text-xs uppercase text-[var(--color-bullish)] block">
              76 – 100 Euphoria
            </span>
            <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
              Speculative froth and depleted downside protection. Elevated risk of sharp mean-reversion. Trim into strength.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
