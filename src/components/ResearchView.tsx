import type { ResearchContent } from '../../lib/schemas';

function confidencePct(c: number): string {
  return `${Math.round(c * 100)}%`;
}

interface ResearchViewProps {
  content: ResearchContent;
}

export function ResearchView({ content }: ResearchViewProps) {
  const actionColor =
    content.recommendation.action === 'buy'
      ? { bg: 'var(--color-bullish-bg)', fg: 'var(--color-bullish)', border: '#C8E6D8' }
      : content.recommendation.action === 'sell'
      ? { bg: 'var(--color-bearish-bg)', fg: 'var(--color-bearish)', border: '#F2D5CF' }
      : { bg: 'var(--color-neutral-bg)', fg: 'var(--color-neutral)', border: '#E2DFDC' };

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex items-start gap-4 flex-wrap">
        <div>
          <p className="font-mono text-3xl font-bold text-[var(--color-ink)]">
            {content.ticker}
          </p>
          <p className="text-[var(--color-muted)] text-sm">{content.name}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-mono text-2xl font-semibold text-[var(--color-ink)]">
            ₹{content.price.toLocaleString('en-IN')}
          </p>
          <p className="font-mono text-xs text-[var(--color-faint)]">as of {content.asOf}</p>
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

      {/* Fundamental */}
      <section>
        <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-3 pb-2 border-b border-[var(--color-hairline)]">
          Fundamental Analysis
        </h2>
        <p className="text-[var(--color-muted)] leading-relaxed text-sm">{content.fundamental}</p>
      </section>

      {/* Technical */}
      <section>
        <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-3 pb-2 border-b border-[var(--color-hairline)]">
          Technical Analysis
        </h2>
        <p className="text-[var(--color-muted)] leading-relaxed text-sm">{content.technical}</p>
      </section>

      {/* Sentiment */}
      <section>
        <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-3 pb-2 border-b border-[var(--color-hairline)]">
          Sentiment
        </h2>
        <p className="text-[var(--color-muted)] leading-relaxed text-sm">{content.sentiment}</p>
      </section>
    </div>
  );
}
