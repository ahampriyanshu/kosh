import type { RecapContent } from '../../lib/schemas';
import { formatPeriodLabel, formatPeriodText } from '../../lib/time';
import { VerificationBadge } from './VerificationBadge';
import { Pct, ticker as tickerFn } from './market/Figure';
import { ReportSection } from './ui/ReportSection';

interface RecapViewProps {
  content: RecapContent;
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
              {formatPeriodText(item)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--color-faint)] italic">{empty}</p>
      )}
    </div>
  );
}

export function RecapView({ content }: RecapViewProps) {
  const learnings = content.learnings ?? { worked: [], missed: [] };

  return (
    <div className="space-y-8">
      {/* Period eyebrow */}
      <p className="font-mono text-xs text-[var(--color-faint)]">{formatPeriodLabel(content.period)}</p>

      {/* Hit-rate badge + summary */}
      <ReportSection title="Grading Results">
        <div className="mb-3">
          <VerificationBadge hits={content.hits} total={content.total} />
        </div>
        <p className="text-[var(--color-muted)] leading-relaxed">{formatPeriodText(content.summary)}</p>
      </ReportSection>

      {(learnings.worked.length > 0 || learnings.missed.length > 0) && (
        <ReportSection title="Learning Loop">
          <div className="grid gap-6 md:grid-cols-2">
            <LearningColumn title="What worked" items={learnings.worked} empty="No confirmed drivers yet." />
            <LearningColumn title="What missed" items={learnings.missed} empty="No failed drivers yet." />
          </div>
        </ReportSection>
      )}

      {/* Graded bets table */}
      {content.graded.length > 0 && (
        <ReportSection title="Bet-by-Bet Breakdown">
          <div className="overflow-x-auto">
            <table className="w-auto min-w-[56rem] table-fixed text-sm">
              <colgroup>
                <col className="w-[20rem]" />
                <col className="w-[8rem]" />
                <col className="w-[12rem]" />
                <col className="w-[8rem]" />
                <col className="w-[8rem]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[var(--color-hairline)]">
                  <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-2 pr-4">
                    Ticker
                  </th>
                  <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-2 pr-4">
                    Action
                  </th>
                  <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-right py-2 pr-4">
                    Entry → Exit
                  </th>
                  <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-right py-2 pr-4">
                    Change
                  </th>
                  <th className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)] text-left py-2">
                    Outcome
                  </th>
                </tr>
              </thead>
              <tbody>
                {content.graded.map((bet, i) => {
                  const outcomeColor =
                    bet.outcome === 'hit'
                      ? 'var(--color-bullish)'
                      : bet.outcome === 'miss'
                      ? 'var(--color-bearish)'
                      : 'var(--color-muted)';

                  return (
                    <tr key={`${bet.ticker}-${i}`} className="border-b border-[var(--color-hairline)] last:border-0">
                      <td className="py-3 pr-4">
                        <span className="font-mono text-sm font-bold text-[var(--color-ink)]">
                          {tickerFn(bet.ticker)}
                        </span>
                        {bet.name && bet.name !== tickerFn(bet.ticker) && (
                          <span className="ml-1.5 text-xs text-[var(--color-muted)]">{bet.name}</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
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
                            border: '1px solid var(--color-hairline)',
                          }}
                        >
                          {bet.action.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-xs text-[var(--color-muted)] whitespace-nowrap">
                        {bet.entryRef.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        {' → '}
                        {bet.exitRef.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 pr-4 text-right whitespace-nowrap">
                        <Pct value={bet.changePct} />
                      </td>
                      <td className="py-3 align-top">
                        <span className="font-sans text-xs font-semibold uppercase tracking-wider" style={{ color: outcomeColor }}>
                          {bet.outcome}
                        </span>
                        {bet.note && (
                          <p className="text-xs text-[var(--color-faint)] mt-0.5 leading-relaxed">{bet.note}</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ReportSection>
      )}

      {content.graded.length === 0 && (
        <ReportSection title="Bet-by-Bet Breakdown">
          <p className="text-sm text-[var(--color-faint)] italic">No bets to grade for this period.</p>
        </ReportSection>
      )}
    </div>
  );
}
