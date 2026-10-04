import type { Metadata } from 'next';
import Link from 'next/link';
import { PortfolioUnlock } from '../../components/PortfolioUnlock';
import { getLatest, getManifest, getReport } from '../../lib/reports';
import { dateReportPath } from '../../../lib/report-routes';
import type { DailyContent, RetroContent } from '../../../lib/schemas';

export const metadata: Metadata = {
  title: 'Portfolio & Risk Surveillance | Kosh',
  description:
    'Audited portfolio holdings, valuation tracking, and automated market-close technical risk screening.',
  alternates: { canonical: '/portfolio' },
};

export default async function PortfolioPage() {
  const latestDaily = await getLatest('daily');
  let retroContent = (latestDaily?.content as DailyContent)?.retro ?? null;
  let auditDateKey = latestDaily?.dateKey;

  // Fallback to previous daily report if latest daily is morning-only (before 16:15 IST)
  if (!retroContent) {
    const manifest = await getManifest();
    const dailyEntries = manifest.reports.filter((r) => r.type === 'daily');
    for (const entry of dailyEntries) {
      if (entry.id === latestDaily?.id) continue;
      const report = await getReport(entry.id);
      const content = report.content as DailyContent;
      if (content?.retro) {
        retroContent = content.retro;
        auditDateKey = report.dateKey;
        break;
      }
    }
  }

  // Also support legacy standalone retro report if present during migration
  if (!retroContent) {
    const legacyRetro = await getLatest('retro');
    if (legacyRetro?.content) {
      retroContent = legacyRetro.content as RetroContent;
      auditDateKey = legacyRetro.dateKey;
    }
  }

  return (
    <div className="space-y-12">
      <PortfolioUnlock />

      {/* Portfolio Surveillance & Risk Audit */}
      {retroContent && (
        <section
          aria-label="Portfolio Surveillance & Risk Audit"
          className="pt-10 border-t border-[var(--color-hairline)] space-y-6"
        >
          <div className="border-b border-[var(--color-hairline)] pb-3 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-muted)] block">
                Portfolio Surveillance &amp; Audit
              </span>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-[var(--color-ink)] tracking-tight">
                Market Close Risk Screening &amp; Technical Exceptions
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-[var(--color-muted)]">
                Audit As Of {auditDateKey || 'Latest'} · 16:15 IST
              </span>
              {auditDateKey && (
                <Link
                  href={dateReportPath(auditDateKey)}
                  className="text-[var(--color-ink)] hover:underline font-serif italic text-xs"
                >
                  Full Daily Report &rarr;
                </Link>
              )}
            </div>
          </div>

          {retroContent.summary && (
            <p className="text-xs md:text-sm font-serif italic text-[var(--color-muted)] max-w-3xl leading-relaxed border-b border-[var(--color-hairline)] pb-4">
              &ldquo;{retroContent.summary}&rdquo;
            </p>
          )}

          {retroContent.alerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {retroContent.alerts.map((alert, idx) => {
                const cleanTicker = alert.ticker.replace(/\.(NS|BO)$/, '');
                const evalItem = retroContent.evaluated?.find(
                  (e) => e.ticker.replace(/\.(NS|BO)$/, '') === cleanTicker
                );
                const change = evalItem ? evalItem.changePct : null;
                const isHigh = alert.severity === 'high';

                return (
                  <article
                    key={`${alert.ticker}-${idx}`}
                    className="border-l-2 border-[var(--color-hairline)] pl-3.5 space-y-1.5"
                  >
                    <div className="flex items-baseline justify-between font-mono">
                      <div>
                        <span className="font-bold text-sm text-[var(--color-ink)]">{cleanTicker}</span>
                        <span className="text-[10px] text-[var(--color-muted)] block font-serif truncate max-w-[180px]">
                          {alert.name}
                        </span>
                      </div>
                      <div className="text-right">
                        {change !== null && (
                          <span
                            className={`text-xs font-mono font-semibold tabular-nums block ${
                              change < 0 ? 'text-[var(--color-bearish)]' : 'text-[var(--color-bullish)]'
                            }`}
                          >
                            {change > 0 ? '+' : ''}{change.toFixed(2)}%
                          </span>
                        )}
                        <span
                          className={`text-[9px] font-mono uppercase tracking-wider ${
                            isHigh ? 'text-[var(--color-bearish)] font-bold' : 'text-[var(--color-muted)]'
                          }`}
                        >
                          {alert.severity} alert
                        </span>
                      </div>
                    </div>

                    {alert.triggeredRules && alert.triggeredRules.length > 0 && (
                      <div className="text-[10px] font-mono text-[var(--color-muted)]">
                        {alert.triggeredRules.join(' · ')}
                      </div>
                    )}

                    <p className="text-xs font-serif text-[var(--color-ink)] leading-relaxed text-justify">
                      {alert.reason}
                    </p>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-6 border-l-2 border-[var(--color-bullish)] pl-4">
              <p className="font-serif text-sm font-semibold text-[var(--color-ink)]">
                All Monitored Holdings Within Technical Bounds
              </p>
              <p className="font-serif text-xs text-[var(--color-muted)] mt-1">
                Zero holdings breached drawdown, abnormal volume, or 50DMA moving average support during the latest closing session.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
