import { getLatest } from '../lib/reports';
import type { DailyContent, RetroContent } from '../../lib/schemas';
import { MarketDashboard } from '../components/market/MarketDashboard';
import { NewsDigest } from '../components/market/NewsDigest';
import { Section } from '../components/market/Figure';
import { SeverityBadge } from '../components/SeverityBadge';

export default async function TodayPage() {
  const [daily, retro, weekly, monthly, recap] = await Promise.all([
    getLatest('daily'),
    getLatest('retro'),
    getLatest('weekly'),
    getLatest('monthly'),
    getLatest('recap'),
  ]);

  // Check if retro is from today (IST approximation)
  const today = new Date().toISOString().slice(0, 10);
  const midContent =
    retro && (retro.content as RetroContent).date === today
      ? (retro.content as RetroContent)
      : null;

  const mastheadReports = [
    { type: 'weekly', label: 'Weekly Outlook', report: weekly },
    { type: 'monthly', label: 'Monthly Outlook', report: monthly },
    { type: 'recap', label: 'Weekly Recap', report: recap },
  ].filter((item) => item.report !== null);

  const dailyContent = daily ? (daily.content as DailyContent) : null;

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-[var(--color-ink)] leading-tight">
          Today
        </h1>
        <div className="mt-3 h-px bg-[var(--color-hairline)]" />
      </div>

      {/* Masthead row: links to latest weekly / monthly / recap */}
      {mastheadReports.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-3 mb-10">
          {mastheadReports.map(({ type, label, report }) => (
            <a
              key={type}
              href={`/reports/${type}/${report!.dateKey}`}
              className="border border-[var(--color-hairline)] rounded-lg bg-[var(--color-surface)] p-3 hover:border-[var(--color-brand)] transition-colors block"
            >
              <p className="font-sans text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)] mb-1">
                {label}
              </p>
              <p className="font-mono text-sm text-[var(--color-ink)]">{report!.dateKey}</p>
            </a>
          ))}
        </div>
      )}

      {/* Mid-session alerts strip (today only) */}
      {midContent && midContent.alerts.length > 0 && (
        <section className="mb-8">
          <div className="mb-4 pb-2 border-b border-[var(--color-hairline)] flex items-center gap-3">
            <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
              Mid-Session Alerts
            </h2>
            <span className="font-mono text-xs text-[var(--color-bearish)] bg-[var(--color-bearish-bg)] px-2 py-0.5 rounded border border-[var(--color-bearish-bg)]">
              {midContent.alerts.length}
            </span>
          </div>
          <div className="space-y-2">
            {midContent.alerts.map((alert, i) => (
              <div
                key={`${alert.ticker}-${i}`}
                className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-raised)] border border-[var(--color-hairline)]"
              >
                <SeverityBadge severity={alert.severity} />
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-sm font-semibold text-[var(--color-ink)] mr-2">
                    {alert.ticker.replace('.NS', '')}
                  </span>
                  <span className="text-sm text-[var(--color-muted)]">{alert.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main dashboard */}
      {dailyContent ? (
        <div>
          {/* Small summary */}
          <p className="text-sm text-[var(--color-muted)] leading-relaxed mb-2">{dailyContent.outlook}</p>

          {/* News — single section, theme-based headlines */}
          {dailyContent.snapshot.news.some((g) => g.items.length > 0) && (
            <Section title="News">
              <NewsDigest groups={dailyContent.snapshot.news} />
            </Section>
          )}

          {/* Market dashboard */}
          <MarketDashboard snapshot={dailyContent.snapshot} />
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="font-display text-2xl text-[var(--color-faint)] mb-2">No briefing yet.</p>
          <p className="text-sm text-[var(--color-faint)]">
            The daily brief will appear here once generated.
          </p>
        </div>
      )}
    </div>
  );
}
