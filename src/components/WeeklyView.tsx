import type { WeeklyContent } from '../../lib/schemas';
import { MarketDashboard } from './market/MarketDashboard';
import { SignalBadge } from './SignalBadge';

interface WeeklyViewProps {
  content: WeeklyContent;
}

function confidencePct(c: number): string {
  return `${Math.round(c * 100)}%`;
}

export function WeeklyView({ content }: WeeklyViewProps) {
  return (
    <div className="space-y-8">
      {/* Themes */}
      <section>
        <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-3 pb-2 border-b border-[var(--color-hairline)]">
          Themes This Week
        </h2>
        {content.themes.length > 0 ? (
          <ul className="space-y-2">
            {content.themes.map((theme, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[var(--color-brand)] mt-1 text-xs" aria-hidden="true">◆</span>
                <span className="text-sm text-[var(--color-muted)] leading-relaxed">{theme}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--color-faint)]">—</p>
        )}
      </section>

      {/* Positional Bets */}
      <section>
        <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-4 pb-2 border-b border-[var(--color-hairline)]">
          Positional Bets
        </h2>
        {content.positionalBets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-hairline)]">
                  <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-2 pr-4">
                    Ticker
                  </th>
                  <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-2 pr-4">
                    Action
                  </th>
                  <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-2 pr-4">
                    Signal
                  </th>
                  <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-right py-2 pr-4">
                    Confidence
                  </th>
                  <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-2">
                    Thesis
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-hairline)]">
                {content.positionalBets.map((bet) => (
                  <tr key={bet.ticker}>
                    <td className="py-2.5 pr-4">
                      <div>
                        <span className="font-mono text-sm font-semibold text-[var(--color-ink)]">
                          {bet.ticker.replace('.NS', '').replace('.BO', '')}
                        </span>
                        <div className="text-xs text-[var(--color-faint)] font-sans">{bet.name}</div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className="font-sans text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
                        style={{
                          backgroundColor:
                            bet.action === 'buy'
                              ? 'var(--color-bullish-bg)'
                              : bet.action === 'sell'
                              ? 'var(--color-bearish-bg)'
                              : 'var(--color-neutral-bg)',
                          color:
                            bet.action === 'buy'
                              ? 'var(--color-bullish)'
                              : bet.action === 'sell'
                              ? 'var(--color-bearish)'
                              : 'var(--color-neutral)',
                        }}
                      >
                        {bet.action.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <SignalBadge signal={bet.signal} />
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-sm tabular-nums text-[var(--color-ink)]">
                      {confidencePct(bet.confidence)}
                    </td>
                    <td className="py-2.5 text-[var(--color-muted)] text-sm leading-snug max-w-xs">
                      {bet.thesis}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-faint)]">No positional bets this week.</p>
        )}
      </section>

      {/* Market Dashboard */}
      <MarketDashboard snapshot={content.snapshot} />
    </div>
  );
}
