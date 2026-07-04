import type { ResearchContent } from '../../lib/schemas';
import { ticker as tickerFn } from './market/Figure';

function confidencePct(c: number): string {
  return `${Math.round(c * 100)}%`;
}

interface ResearchViewProps {
  content: ResearchContent;
}

function bullets(value: string[] | string): string[] {
  return Array.isArray(value) ? value : [value];
}

function BulletSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-3 pb-2 border-b border-[var(--color-hairline)]">
        {title}
      </h2>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-[var(--color-muted)] leading-relaxed">
            <span className="text-[var(--color-brand)] mt-1 text-xs" aria-hidden="true">◆</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ResearchView({ content }: ResearchViewProps) {
  const metrics = content.metrics ?? [];
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
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {metrics.slice(0, 3).map((metric) => (
            <div key={metric.label} className="border border-[var(--color-hairline)] rounded-lg bg-[var(--color-surface)] px-3 py-2">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-wider text-[var(--color-faint)]">
                {metric.label}
              </p>
              <p className="font-mono text-sm font-semibold text-[var(--color-ink)] mt-1">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      <div
        className="p-4 rounded-lg border-l-4"
        style={{ borderColor: actionColor.fg, backgroundColor: actionColor.bg }}
      >
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span
            className="font-sans text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
            style={{ color: actionColor.fg, border: `1px solid ${actionColor.border}`, backgroundColor: actionColor.bg }}
          >
            {content.recommendation.action.toUpperCase()}
          </span>
          <span className="font-mono text-xs text-[var(--color-faint)]">
            Confidence: {confidencePct(content.recommendation.confidence)}
          </span>
        </div>
        <p className="text-sm text-[var(--color-muted)] leading-relaxed">
          {content.recommendation.reasoning}
        </p>
      </div>

      <BulletSection title="Fundamental Analysis" items={bullets(content.fundamental)} />
      <BulletSection title="Technical Analysis" items={bullets(content.technical)} />
      <BulletSection title="Sentiment" items={bullets(content.sentiment)} />
    </div>
  );
}
