import type { Metadata } from 'next';
import Link from 'next/link';
import { getHistoricalMoods } from '../../../lib/sentiment';
import type { MoodSnapshot } from '../../../lib/schemas';
import { SentimentGauge, getSentimentBand } from '../../components/SentimentGauge';

export const metadata: Metadata = {
  title: 'Sentiment Index | Kosh Daily',
  description: 'A daily view of Indian equity market sentiment, positioning, and historical readings.',
  alternates: { canonical: '/sentiment-index' },
};

function formatMetric(value: unknown, digits = 1): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toLocaleString('en-IN') : value.toFixed(digits);
  }
  return String(value);
}

function formatFlow(value: unknown): string {
  if (typeof value !== 'number') return '—';
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}₹${Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })} cr`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

interface FactorCardProps {
  title: string;
  score: number;
  regime: string;
  summary: string;
  metrics: Array<{ label: string; value: string }>;
}

function FactorCard({ title, score, regime, summary, metrics }: FactorCardProps) {
  const band = getSentimentBand(score);

  return (
    <article className="bg-[var(--color-surface)] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl font-semibold leading-tight text-[var(--color-ink)]">{title}</h3>
          <p className="mt-1 text-xs text-[var(--color-muted)]">25% of the composite reading</p>
        </div>
        <div className="text-right">
          <div className="font-serif text-3xl leading-none tabular-nums text-[var(--color-ink)]">{score}</div>
          <div className="mt-1 text-[11px] text-[var(--color-muted)]">{regime}</div>
        </div>
      </div>

      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--color-hairline)]"
        role="meter"
        aria-label={`${title} score`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
      >
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, score))}%`, backgroundColor: band.color }} />
      </div>

      <p className="mt-4 min-h-10 text-sm leading-relaxed text-[var(--color-muted)]">{summary}</p>

      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-[var(--color-hairline)] pt-4">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <dt className="text-[10px] leading-tight text-[var(--color-faint)]">{metric.label}</dt>
            <dd className="mt-1 text-xs font-semibold tabular-nums text-[var(--color-ink)]">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function getDefaultMood(): MoodSnapshot {
  return {
    composite: 50,
    regime: 'Neutral',
    session: 'closing',
    asOf: new Date().toISOString(),
    summary: 'Market signals are balanced across breadth, institutional activity, volatility, and options positioning.',
    categories: {
      breadth: { score: 50, regime: 'Neutral', label: 'Breadth & Price Action', weight: 0.25, summary: 'Balanced market breadth', metrics: { adRatio: 1, advances: 250, declines: 250 } },
      flows: { score: 50, regime: 'Neutral', label: 'Institutional Flows', weight: 0.25, summary: 'Neutral capital flow', metrics: { fiiNet: 0, diiNet: 0, totalNet: 0 } },
      volatility: { score: 50, regime: 'Neutral', label: 'Volatility & Risk Appetite', weight: 0.25, summary: 'Baseline India VIX', metrics: { vix: 14.5, vixChangePct: 0 } },
      derivatives: { score: 50, regime: 'Neutral', label: 'Derivatives & Options Skew', weight: 0.25, summary: 'Balanced options PCR', metrics: { pcrOi: 1, pcrVolume: 1 } },
    },
  };
}

export default function SentimentIndexPage() {
  const history = getHistoricalMoods(30);
  const currentMood = history[0]?.mood ?? getDefaultMood();
  const { categories } = currentMood;
  const band = getSentimentBand(currentMood.composite);
  const flows = categories.flows.metrics;
  const breadth = categories.breadth.metrics;
  const volatility = categories.volatility.metrics;
  const derivatives = categories.derivatives.metrics;

  const factors: FactorCardProps[] = [
    {
      title: 'Breadth & participation',
      score: categories.breadth.score,
      regime: categories.breadth.regime,
      summary: categories.breadth.summary,
      metrics: [
        { label: 'Advance / decline', value: formatMetric(breadth.adRatio, 2) },
        { label: 'Advancing stocks', value: `${formatMetric(breadth.pctAdvancing)}%` },
        { label: '52-week H / L', value: `${formatMetric(breadth.near52wHighs, 0)} / ${formatMetric(breadth.near52wLows, 0)}` },
      ],
    },
    {
      title: 'Institutional flows',
      score: categories.flows.score,
      regime: categories.flows.regime,
      summary: categories.flows.summary,
      metrics: [
        { label: 'FII net cash', value: formatFlow(flows.fiiNet) },
        { label: 'DII net cash', value: formatFlow(flows.diiNet) },
        { label: 'Combined', value: formatFlow(flows.totalNet) },
      ],
    },
    {
      title: 'Volatility & risk appetite',
      score: categories.volatility.score,
      regime: categories.volatility.regime,
      summary: categories.volatility.summary,
      metrics: [
        { label: 'India VIX', value: formatMetric(volatility.vix, 2) },
        { label: 'VIX daily move', value: `${formatMetric(volatility.vixChangePct)}%` },
        { label: 'Gold daily move', value: `${formatMetric(volatility.goldChangePct)}%` },
      ],
    },
    {
      title: 'Options positioning',
      score: categories.derivatives.score,
      regime: categories.derivatives.regime,
      summary: categories.derivatives.summary,
      metrics: [
        { label: 'Open-interest PCR', value: formatMetric(derivatives.pcrOi, 2) },
        { label: 'Volume PCR', value: formatMetric(derivatives.pcrVolume, 2) },
        { label: 'Positioning', value: Number(derivatives.pcrOi ?? 1) > 1.25 ? 'Hedged' : Number(derivatives.pcrOi ?? 1) < 0.75 ? 'Call-heavy' : 'Balanced' },
      ],
    },
  ];

  return (
    <div className="space-y-10 pb-16 text-[var(--color-ink)]">
      <section className="grid overflow-hidden border-y border-[var(--color-hairline)] bg-[var(--color-surface)] lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]" aria-labelledby="current-reading-title">
        <div className="flex flex-col justify-center border-b border-[var(--color-hairline)] p-5 sm:p-8 lg:border-b-0 lg:border-r">
          <SentimentGauge score={currentMood.composite} regime={currentMood.regime} />
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          <p className="text-xs font-semibold tracking-wide text-[var(--color-muted)]">Today&apos;s reading</p>
          <h2 id="current-reading-title" className="mt-2 font-serif text-3xl font-semibold leading-tight sm:text-4xl" style={{ color: band.color }}>
            {band.label}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-muted)]">{currentMood.summary}</p>

          <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[var(--color-hairline)] pt-5 text-sm">
            <div>
              <dt className="text-xs text-[var(--color-faint)]">Index score</dt>
              <dd className="mt-1 font-semibold tabular-nums">{currentMood.composite} <span className="font-normal text-[var(--color-muted)]">/ 100</span></dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--color-faint)]">Market regime</dt>
              <dd className="mt-1 font-semibold">{currentMood.regime}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-[var(--color-faint)]">How to read it</dt>
              <dd className="mt-1 leading-relaxed text-[var(--color-muted)]">
                Low readings mark oversold conditions and potentially better entry levels. High readings signal crowded, overbought conditions where chasing carries more risk.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="drivers-title">
        <div className="mb-4">
          <h2 id="drivers-title" className="font-serif text-2xl font-semibold">What shapes the reading</h2>
        </div>

        <div className="grid gap-px overflow-hidden border border-[var(--color-hairline)] bg-[var(--color-hairline)] sm:grid-cols-2">
          {factors.map((factor) => <FactorCard key={factor.title} {...factor} />)}
        </div>
      </section>

      <section aria-labelledby="history-title">
        <div className="mb-4">
          <h2 id="history-title" className="font-serif text-2xl font-semibold">Recent readings</h2>
        </div>

        <div className="overflow-x-auto border-y border-[var(--color-hairline)]">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-hairline)] text-xs text-[var(--color-muted)]">
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Session</th>
                <th className="px-3 py-3 font-medium">Score</th>
                <th className="px-3 py-3 font-medium">Reading</th>
                <th className="px-3 py-3 font-medium">Breadth</th>
                <th className="px-3 py-3 font-medium">Flows</th>
                <th className="px-3 py-3 font-medium">Volatility</th>
                <th className="px-3 py-3 font-medium">Options</th>
              </tr>
            </thead>
            <tbody>
              {history.map(({ date, mood }) => {
                const historyBand = getSentimentBand(mood.composite);
                return (
                  <tr key={date} className="transition-colors hover:bg-[var(--color-raised)]/50">
                    <td className="whitespace-nowrap px-3 py-3 font-medium">
                      <Link href={`/reports/${date.replace(/-/g, '/')}`} className="text-[var(--color-ink)] hover:underline">{formatDate(`${date}T00:00:00+05:30`)}</Link>
                    </td>
                    <td className="px-3 py-3 text-[var(--color-muted)]">{mood.session === 'closing' ? 'Close' : 'Morning'}</td>
                    <td className="px-3 py-3 font-semibold tabular-nums">{mood.composite}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-2 whitespace-nowrap" style={{ color: historyBand.color }}>
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: historyBand.color }} />
                        {historyBand.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 tabular-nums text-[var(--color-muted)]">{mood.categories.breadth.score}</td>
                    <td className="px-3 py-3 tabular-nums text-[var(--color-muted)]">{mood.categories.flows.score}</td>
                    <td className="px-3 py-3 tabular-nums text-[var(--color-muted)]">{mood.categories.volatility.score}</td>
                    <td className="px-3 py-3 tabular-nums text-[var(--color-muted)]">{mood.categories.derivatives.score}</td>
                  </tr>
                );
              })}
              {history.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-[var(--color-muted)]">No historical readings yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
