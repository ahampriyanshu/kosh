import type { DailyContent } from '../../lib/schemas';
import { SignalBadge } from './SignalBadge';

function formatIST(isoStr: string): string {
  try {
    return new Date(isoStr).toLocaleString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return isoStr;
  }
}

function confidencePct(c: number): string {
  return `${Math.round(c * 100)}%`;
}

interface DailyViewProps {
  content: DailyContent;
  generatedAt?: string;
}

export function DailyView({ content, generatedAt }: DailyViewProps) {
  return (
    <div className="space-y-8">
      {/* Date line */}
      {(generatedAt || content.date) && (
        <p className="font-mono text-xs text-[var(--color-faint)]">
          {generatedAt ? formatIST(generatedAt) : content.date}
        </p>
      )}

      {/* Market Outlook */}
      <section>
        <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-3 pb-2 border-b border-[var(--color-hairline)]">
          Market Outlook
        </h2>
        <p className="text-[var(--color-ink)] leading-relaxed">{content.marketOutlook}</p>
      </section>

      {/* FII / DII Sentiment */}
      {content.fiiDiiSentiment && (
        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-3 pb-2 border-b border-[var(--color-hairline)]">
            FII / DII Flow
          </h2>
          <p className="text-[var(--color-muted)] leading-relaxed text-sm">{content.fiiDiiSentiment}</p>
        </section>
      )}

      {/* Stocks to Watch */}
      {content.stocksToWatch.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-4 pb-2 border-b border-[var(--color-hairline)]">
            Stocks to Watch
          </h2>
          <div className="space-y-3">
            {content.stocksToWatch.map((stock) => (
              <article
                key={stock.ticker}
                className="flex gap-4 p-4 rounded-lg bg-[var(--color-raised)] border border-[var(--color-hairline)]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-[var(--color-ink)]">
                      {stock.ticker.replace('.NS', '')}
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

      {/* Top Recommendation */}
      <section>
        <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-3 pb-2 border-b border-[var(--color-hairline)]">
          Top Recommendation
        </h2>
        <div className="p-4 rounded-lg border-l-4 border-[var(--color-brand)] bg-[var(--color-raised)]">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="font-mono text-lg font-bold text-[var(--color-ink)]">
              {content.topRecommendation.ticker.replace('.NS', '')}
            </span>
            <span className="font-sans text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded bg-[var(--color-bullish-bg)] text-[var(--color-bullish)] border border-[#C8E6D8]">
              {content.topRecommendation.action.toUpperCase()}
            </span>
            <span className="font-mono text-xs text-[var(--color-faint)]">
              Confidence: {confidencePct(content.topRecommendation.confidence)}
            </span>
          </div>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">
            {content.topRecommendation.reasoning}
          </p>
        </div>
      </section>

      {/* Sector Movers */}
      {content.sectorMovers.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-4 pb-2 border-b border-[var(--color-hairline)]">
            Sector Movers
          </h2>
          <div className="space-y-2">
            {content.sectorMovers.map((s) => (
              <div key={s.sector} className="flex flex-col gap-1 py-2 sm:flex-row sm:gap-3">
                <span className="font-sans text-xs font-semibold uppercase tracking-wide text-[var(--color-brand)] shrink-0 pt-0.5 sm:w-36">
                  {s.sector}
                </span>
                <p className="text-sm text-[var(--color-muted)] leading-relaxed">{s.note}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Exit Signals */}
      {content.exitSignals.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-3 pb-2 border-b border-[var(--color-hairline)]">
            Exit Signals
          </h2>
          <div className="space-y-2">
            {content.exitSignals.map((es) => (
              <div key={es.ticker} className="flex flex-col gap-1 py-2 sm:flex-row sm:gap-3">
                <span className="font-mono text-sm font-semibold text-[var(--color-bearish)] shrink-0 sm:w-32">
                  {es.ticker.replace('.NS', '')}
                </span>
                <p className="text-sm text-[var(--color-muted)]">{es.reason}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
