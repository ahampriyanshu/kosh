import type { ResearchContent } from '../../lib/schemas';
import { ticker as tickerFn } from './market/Figure';

interface ResearchViewProps {
  content: ResearchContent;
}

function FixedSection({ title, rows }: { title: string; rows: Array<{ label: string; value: string }> }) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-3 pb-2 border-b border-[var(--color-hairline)]">
        {title}
      </h2>
      <dl className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 sm:grid-cols-[9rem_1fr]">
            <dt className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)]">
              {row.label}
            </dt>
            <dd className="text-sm text-[var(--color-muted)] leading-relaxed">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ResearchView({ content }: ResearchViewProps) {
  const metrics = content.metrics ?? [];
  const targets = content.targets ?? [];
  const actionColor =
    content.recommendation.action === 'buy'
      ? { bg: 'var(--color-bullish-bg)', fg: 'var(--color-bullish)', border: 'var(--color-hairline)' }
      : content.recommendation.action === 'sell'
      ? { bg: 'var(--color-bearish-bg)', fg: 'var(--color-bearish)', border: 'var(--color-hairline)' }
      : { bg: 'var(--color-neutral-bg)', fg: 'var(--color-neutral)', border: 'var(--color-hairline)' };

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div>
        <div>
          <p className="font-mono text-3xl font-bold text-[var(--color-ink)]">
            {tickerFn(content.ticker)}
          </p>
          <p className="text-[var(--color-muted)] text-sm">{content.name}</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {metrics.map((metric) => (
            <div key={metric.label} className="border border-[var(--color-hairline)] rounded-lg bg-[var(--color-surface)] px-3 py-2">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-wider text-[var(--color-faint)]">
                {metric.label}
              </p>
              <p className="font-mono text-sm font-semibold text-[var(--color-ink)] mt-1">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>

      <FixedSection
        title="Fundamentals"
        rows={[
          { label: 'Growth', value: content.fundamentals.growth },
          { label: 'Valuation', value: content.fundamentals.valuation },
        ]}
      />
      <FixedSection
        title="Technicals"
        rows={[
          { label: 'Trend', value: content.technicals.trend },
          { label: 'Momentum', value: content.technicals.momentum },
          { label: 'Key levels', value: content.technicals.levels },
        ]}
      />
      <FixedSection
        title="Sentiment"
        rows={[
          { label: 'News', value: content.sentiment.news },
          { label: 'Brokerage', value: content.sentiment.brokerage },
        ]}
      />
      <div
        className="p-4 rounded-lg border-l-4"
        style={{ borderColor: actionColor.fg, backgroundColor: actionColor.bg }}
      >
        <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-3">
          Recommendation
        </h2>
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span
            className="font-sans text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
            style={{ color: actionColor.fg, border: `1px solid ${actionColor.border}`, backgroundColor: actionColor.bg }}
          >
            {content.recommendation.action.toUpperCase()}
          </span>
        </div>
        <p className="text-sm text-[var(--color-muted)] leading-relaxed">
          {content.recommendation.reasoning}
        </p>
      </div>
      <FixedSection
        title="Entry & Exit"
        rows={[
          { label: 'Fundamental', value: content.entryExit.fundamental },
          { label: 'Technical / Sentiment', value: content.entryExit.technicalSentiment },
        ]}
      />
      <section>
        <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-3 pb-2 border-b border-[var(--color-hairline)]">
          Target
        </h2>
        {targets.length > 0 ? (
          <dl className="space-y-3">
            {targets.map((target, index) => (
              <div key={`${target.source}-${index}`} className="grid gap-1 sm:grid-cols-[9rem_1fr]">
                <dt className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)]">
                  {target.source}
                </dt>
                <dd className="text-sm text-[var(--color-muted)] leading-relaxed">
                  <span className="font-mono text-[var(--color-ink)]">{target.target}</span>
                  {' · '}
                  {target.duration}
                  {' · '}
                  {target.view}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-[var(--color-faint)] italic">No sourced targets found.</p>
        )}
      </section>
    </div>
  );
}
