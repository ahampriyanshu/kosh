import type { MonthlyContent } from '../../lib/schemas';
import { MarketDashboard } from './market/MarketDashboard';
import { SignalBadge } from './SignalBadge';
import { ReportSection } from './ui/ReportSection';

interface MonthlyViewProps {
  content: MonthlyContent;
}

function LearningColumn({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] mb-2">
        {title}
      </h3>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="text-sm text-[var(--color-muted)] leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--color-faint)] italic">{empty}</p>
      )}
    </div>
  );
}

function confidencePct(c: number): string {
  return `${Math.round(c * 100)}%`;
}

export function MonthlyView({ content }: MonthlyViewProps) {
  const ledgerLearnings = content.ledgerRollup?.learnings ?? { worked: [], missed: [] };

  return (
    <div className="space-y-8">
      {/* Sector Insights */}
      <ReportSection title="Sector Insights">
        {content.sectorInsights.length > 0 ? (
          <ul className="space-y-2">
            {content.sectorInsights.map((insight, i) => (
              <li key={i} className="text-sm text-[var(--color-muted)] leading-relaxed">
                {insight}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--color-faint)]">—</p>
        )}
      </ReportSection>

      {/* Macro Themes */}
      <ReportSection title="Macro Themes">
        {content.macroThemes.length > 0 ? (
          <ul className="space-y-2">
            {content.macroThemes.map((theme, i) => (
              <li key={i} className="text-sm text-[var(--color-muted)] leading-relaxed">
                {theme}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--color-faint)]">—</p>
        )}
      </ReportSection>

      {/* Mid-Term Bets */}
      <ReportSection title="Mid-Term Bets">
        {content.midTermBets.length > 0 ? (
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
                {content.midTermBets.map((bet) => (
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
          <p className="text-sm text-[var(--color-faint)]">No mid-term bets this month.</p>
        )}
      </ReportSection>

      {/* Ledger rollup (Phase 3b) */}
      {content.ledgerRollup && (
        <ReportSection title="Ledger Rollup">
          <p className="font-mono text-sm text-[var(--color-ink)] mb-2">
            {content.ledgerRollup.hits} / {content.ledgerRollup.total} hits
          </p>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">{content.ledgerRollup.summary}</p>
          {(ledgerLearnings.worked.length > 0 || ledgerLearnings.missed.length > 0) && (
            <div className="grid gap-6 md:grid-cols-2 mt-5">
              <LearningColumn
                title="What worked"
                items={ledgerLearnings.worked}
                empty="No confirmed drivers yet."
              />
              <LearningColumn
                title="What missed"
                items={ledgerLearnings.missed}
                empty="No failed drivers yet."
              />
            </div>
          )}
        </ReportSection>
      )}

      {/* Market Dashboard */}
      <MarketDashboard snapshot={content.snapshot} />
    </div>
  );
}
