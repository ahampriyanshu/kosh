import type { RetroContent } from '../../lib/schemas';
import { SeverityBadge } from './SeverityBadge';
import { Pct } from './Pct';

interface RetroViewProps {
  content: RetroContent;
}

export function RetroView({ content }: RetroViewProps) {
  return (
    <div className="space-y-8">
      {/* Summary */}
      {content.summary && (
        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-3 pb-2 border-b border-[var(--color-hairline)]">
            Session Summary
          </h2>
          <p className="text-[var(--color-ink)] leading-relaxed">{content.summary}</p>
        </section>
      )}

      {/* Alerts */}
      {content.alerts.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-4 pb-2 border-b border-[var(--color-hairline)]">
            Alerts
            <span className="ml-2 font-mono text-sm font-normal text-[var(--color-bearish)] bg-[var(--color-bearish-bg)] px-2 py-0.5 rounded">
              {content.alerts.length}
            </span>
          </h2>
          <div className="space-y-3">
            {content.alerts.map((alert, i) => (
              <article
                key={`${alert.ticker}-${i}`}
                className="p-4 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-raised)]"
              >
                <div className="flex items-start gap-3 flex-wrap">
                  <SeverityBadge severity={alert.severity} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-sm font-bold text-[var(--color-ink)]">
                        {alert.ticker.replace('.NS', '')}
                      </span>
                      <span className="text-sm text-[var(--color-muted)]">{alert.name}</span>
                    </div>
                    <p className="text-sm text-[var(--color-muted)] mb-2">{alert.reason}</p>
                    {alert.triggeredRules.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {alert.triggeredRules.map((rule) => (
                          <span
                            key={rule}
                            className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--color-bg)] border border-[var(--color-hairline)] text-[var(--color-faint)]"
                          >
                            {rule}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Evaluated stocks */}
      {content.evaluated.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-4 pb-2 border-b border-[var(--color-hairline)]">
            Portfolio Scan
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-hairline)]">
                  <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-2 pr-4">
                    Ticker
                  </th>
                  <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-right py-2 pr-4">
                    Price
                  </th>
                  <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-right py-2 pr-4">
                    Change
                  </th>
                  <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-2">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-hairline)]">
                {content.evaluated.map((ev) => (
                  <tr key={ev.ticker}>
                    <td className="py-2.5 pr-4">
                      <div>
                        <span className="font-mono text-sm font-semibold text-[var(--color-ink)]">
                          {ev.ticker.replace('.NS', '')}
                        </span>
                        <div className="text-xs text-[var(--color-faint)] font-sans">{ev.name}</div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-sm tabular-nums text-[var(--color-ink)]">
                      ₹{ev.price.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <Pct value={ev.changePct} />
                    </td>
                    <td className="py-2.5 text-[var(--color-muted)] text-sm leading-snug max-w-xs">
                      {ev.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Empty alerts state */}
      {content.alerts.length === 0 && (
        <div className="py-6 text-center text-sm text-[var(--color-faint)] border border-dashed border-[var(--color-hairline)] rounded-lg">
          No alerts triggered this session.
        </div>
      )}
    </div>
  );
}
