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

      {/* Multi-Asset Performance Scorecard */}
      {content.multiAssetScorecard && content.multiAssetScorecard.length > 0 && (
        <ReportSection title="Multi-Asset Performance Scorecard">
          <div className="overflow-x-auto border border-[var(--color-hairline)] bg-[var(--color-surface)]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[10px] uppercase text-[var(--color-muted)] bg-[var(--color-raised)]/30 border-b border-[var(--color-hairline)]">
                <tr>
                  <th className="py-2.5 px-3 font-bold">Asset Class</th>
                  <th className="py-2.5 px-3 font-bold">Benchmark</th>
                  <th className="py-2.5 px-3 text-right font-bold">Close Price</th>
                  <th className="py-2.5 px-3 text-right font-bold">Monthly Return</th>
                  <th className="py-2.5 px-3 min-w-[200px] font-bold">Macro Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-hairline)]/60">
                {content.multiAssetScorecard.map((item) => {
                  const isPos = item.returnPct >= 0;
                  return (
                    <tr key={item.symbol} className="hover:bg-[var(--color-hairline)]/20 transition-colors">
                      <td className="py-2 px-3 font-bold text-[var(--color-ink)]">{item.asset}</td>
                      <td className="py-2 px-3 text-[10px] text-[var(--color-muted)]">{item.symbol}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-[var(--color-ink)] font-semibold">
                        {item.close.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td
                        className={`py-2 px-3 text-right tabular-nums font-bold ${
                          isPos ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'
                        }`}
                      >
                        {isPos ? '+' : ''}{item.returnPct.toFixed(2)}%
                      </td>
                      <td className="py-2 px-3 text-[11px] font-serif text-[var(--color-muted)] leading-relaxed">
                        {item.context || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ReportSection>
      )}

      {/* Sector Leadership */}
      {content.sectorLeadership && content.sectorLeadership.length > 0 && (
        <ReportSection title="Sector Leadership">
          <div className="border border-[var(--color-hairline)] bg-[var(--color-surface)] p-3 divide-y divide-[var(--color-hairline)]/60 text-xs font-mono">
            {content.sectorLeadership.map((s) => (
              <div key={s.sector} className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--color-muted)] w-4 text-right">{s.rank}.</span>
                  <span className="font-bold text-[var(--color-ink)]">{s.sector}</span>
                </div>
                <span
                  className={`font-bold tabular-nums ${
                    s.weeklyReturnPct >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'
                  }`}
                >
                  {s.weeklyReturnPct >= 0 ? '+' : ''}{s.weeklyReturnPct.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </ReportSection>
      )}

      {/* Institutional Monthly Cash Flows */}
      {content.fiiDiiMonthly && (
        <ReportSection title="Institutional Cash Flow Dynamics">
          <div className="border border-[var(--color-hairline)] bg-[var(--color-surface)] p-4 text-xs font-mono space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-[var(--color-muted)] uppercase block">FII Net Cash</span>
                <span
                  className={`text-base font-bold tabular-nums ${
                    content.fiiDiiMonthly.fiiNetCrore >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'
                  }`}
                >
                  {content.fiiDiiMonthly.fiiNetCrore >= 0 ? '+' : '−'}₹
                  {Math.abs(content.fiiDiiMonthly.fiiNetCrore).toLocaleString('en-IN')} cr
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--color-muted)] uppercase block">DII Net Cash</span>
                <span
                  className={`text-base font-bold tabular-nums ${
                    content.fiiDiiMonthly.diiNetCrore >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'
                  }`}
                >
                  {content.fiiDiiMonthly.diiNetCrore >= 0 ? '+' : '−'}₹
                  {Math.abs(content.fiiDiiMonthly.diiNetCrore).toLocaleString('en-IN')} cr
                </span>
              </div>
            </div>
            {content.fiiDiiMonthly.summary && (
              <p className="text-xs font-serif text-[var(--color-muted)] pt-2 border-t border-[var(--color-hairline)]/60 leading-relaxed">
                {content.fiiDiiMonthly.summary}
              </p>
            )}
          </div>
        </ReportSection>
      )}

      {/* Mid-Term Bets (Historical Archive) */}
      {content.midTermBets && content.midTermBets.length > 0 && (
        <ReportSection title="Mid-Term Bets (Historical Archive)">
          <div className="overflow-x-auto border border-[var(--color-hairline)] bg-[var(--color-surface)]">
            <table className="w-full text-xs font-mono text-left">
              <thead className="text-[10px] uppercase text-[var(--color-muted)] bg-[var(--color-raised)]/30 border-b border-[var(--color-hairline)]">
                <tr>
                  <th className="py-2.5 px-3 font-bold">Ticker</th>
                  <th className="py-2.5 px-3 font-bold">Action</th>
                  <th className="py-2.5 px-3 font-bold">Signal</th>
                  <th className="py-2.5 px-3 text-right font-bold">Confidence</th>
                  <th className="py-2.5 px-3 font-bold">Thesis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-hairline)]/60">
                {content.midTermBets.map((bet) => (
                  <tr key={bet.ticker} className="hover:bg-[var(--color-hairline)]/20 transition-colors">
                    <td className="py-2 px-3">
                      <div>
                        <span className="font-bold text-[var(--color-ink)]">
                          {bet.ticker.replace('.NS', '').replace('.BO', '')}
                        </span>
                        <div className="text-[10px] text-[var(--color-muted)]">{bet.name}</div>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className="font-bold text-[10px] uppercase tracking-wider px-1.5 py-0.5 border"
                        style={{
                          borderColor:
                            bet.action === 'buy'
                              ? 'var(--color-bullish)'
                              : bet.action === 'sell'
                              ? 'var(--color-bearish)'
                              : 'var(--color-hairline)',
                          color:
                            bet.action === 'buy'
                              ? 'var(--color-bullish)'
                              : bet.action === 'sell'
                              ? 'var(--color-bearish)'
                              : 'var(--color-ink)',
                        }}
                      >
                        {bet.action.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <SignalBadge signal={bet.signal} />
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-[var(--color-ink)] font-semibold">
                      {confidencePct(bet.confidence)}
                    </td>
                    <td className="py-2 px-3 text-[11px] font-serif text-[var(--color-muted)] leading-relaxed max-w-xs">
                      {bet.thesis}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportSection>
      )}

      {/* Ledger rollup (Phase 3b) */}
      {content.ledgerRollup && (
        <ReportSection title="Ledger Rollup">
          <p className="tabular-nums font-semibold text-sm text-[var(--color-ink)] mb-2">
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
