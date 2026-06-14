import type { RecapContent } from '../../lib/schemas';
import { SignalBadge } from './SignalBadge';
import { VerificationBadge } from './VerificationBadge';

function confidencePct(c: number): string {
  return `${Math.round(c * 100)}%`;
}

interface RecapViewProps {
  content: RecapContent;
}

export function RecapView({ content }: RecapViewProps) {
  const { retrospective, outlook } = content;

  return (
    <div className="space-y-8">
      {/* Period */}
      <p className="font-mono text-xs text-[var(--color-faint)]">{content.period}</p>

      {/* Retrospective */}
      {retrospective ? (
        <section>
          <div className="flex items-center gap-3 mb-4 pb-2 border-b border-[var(--color-hairline)]">
            <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
              Retrospective
            </h2>
            <VerificationBadge hits={retrospective.hits} total={retrospective.total} />
          </div>
          <p className="text-[var(--color-muted)] leading-relaxed mb-4">{retrospective.summary}</p>
          {retrospective.calls.length > 0 && (
            <div className="space-y-2">
              {retrospective.calls.map((call, i) => (
                <div
                  key={`${call.ticker}-${i}`}
                  className="flex gap-4 p-3 rounded-lg bg-[var(--color-raised)] border border-[var(--color-hairline)]"
                >
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      backgroundColor: call.hit ? 'var(--color-bullish-bg)' : 'var(--color-bearish-bg)',
                      border: `1px solid ${call.hit ? '#C8E6D8' : '#F2D5CF'}`,
                    }}
                  >
                    <span
                      className="text-xs"
                      style={{ color: call.hit ? 'var(--color-bullish)' : 'var(--color-bearish)' }}
                    >
                      {call.hit ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-mono text-sm font-bold text-[var(--color-ink)]">
                        {call.ticker}
                      </span>
                      <span className="font-sans text-xs text-[var(--color-muted)]">
                        predicted: {call.predicted} → actual: {call.actual}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-muted)]">{call.why}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-3 pb-2 border-b border-[var(--color-hairline)]">
            Retrospective
          </h2>
          <p className="text-sm text-[var(--color-faint)] italic">
            No prior-week calls to evaluate — this is the first recap.
          </p>
        </section>
      )}

      {/* Outlook: Themes */}
      {outlook.themes.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-3 pb-2 border-b border-[var(--color-hairline)]">
            Themes to Watch
          </h2>
          <ul className="space-y-1.5">
            {outlook.themes.map((theme) => (
              <li key={theme} className="flex items-start gap-2">
                <span className="text-[var(--color-brand)] mt-1 text-xs" aria-hidden="true">◆</span>
                <span className="text-sm text-[var(--color-muted)] leading-relaxed">{theme}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Outlook: Stocks to Watch */}
      {outlook.stocksToWatch.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-4 pb-2 border-b border-[var(--color-hairline)]">
            Stocks to Watch
          </h2>
          <div className="space-y-3">
            {outlook.stocksToWatch.map((stock) => (
              <article
                key={stock.ticker}
                className="flex gap-4 p-4 rounded-lg bg-[var(--color-raised)] border border-[var(--color-hairline)]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-[var(--color-ink)]">
                      {stock.ticker}
                    </span>
                    <span className="text-sm text-[var(--color-muted)]">{stock.name}</span>
                    <SignalBadge signal={stock.signal} />
                  </div>
                  <p className="text-sm text-[var(--color-muted)] leading-relaxed">{stock.reason}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Outlook: Recommendation */}
      <section>
        <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-3 pb-2 border-b border-[var(--color-hairline)]">
          Recommendation
        </h2>
        <div className="p-4 rounded-lg border-l-4 border-[var(--color-brand)] bg-[var(--color-raised)]">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="font-mono text-lg font-bold text-[var(--color-ink)]">
              {outlook.recommendation.ticker}
            </span>
            <span
              className="font-sans text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
              style={{
                backgroundColor:
                  outlook.recommendation.action === 'buy'
                    ? 'var(--color-bullish-bg)'
                    : outlook.recommendation.action === 'sell'
                    ? 'var(--color-bearish-bg)'
                    : 'var(--color-neutral-bg)',
                color:
                  outlook.recommendation.action === 'buy'
                    ? 'var(--color-bullish)'
                    : outlook.recommendation.action === 'sell'
                    ? 'var(--color-bearish)'
                    : 'var(--color-neutral)',
                border: `1px solid ${
                  outlook.recommendation.action === 'buy'
                    ? '#C8E6D8'
                    : outlook.recommendation.action === 'sell'
                    ? '#F2D5CF'
                    : '#E2DFDC'
                }`,
              }}
            >
              {outlook.recommendation.action.toUpperCase()}
            </span>
            <span className="font-mono text-xs text-[var(--color-faint)]">
              Confidence: {confidencePct(outlook.recommendation.confidence)}
            </span>
          </div>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            {outlook.recommendation.reasoning}
          </p>
        </div>
      </section>
    </div>
  );
}
