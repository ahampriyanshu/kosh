import { getLatest } from '../lib/reports';
import type { DailyContent, RetroContent } from '../../lib/schemas';
import { MarketDashboard } from '../components/market/MarketDashboard';
import { NewsDigest } from '../components/market/NewsDigest';
import { Section } from '../components/market/Figure';
import { SeverityBadge } from '../components/SeverityBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { ReportSection } from '../components/ui/ReportSection';

export default async function TodayPage() {
  const [daily, retro] = await Promise.all([
    getLatest('daily'),
    getLatest('retro'),
  ]);

  // Check if retro is from today (IST approximation)
  const today = new Date().toISOString().slice(0, 10);
  const midContent =
    retro && (retro.content as RetroContent).date === today
      ? (retro.content as RetroContent)
      : null;

  const dailyContent = daily ? (daily.content as DailyContent) : null;

  return (
    <div>
      <PageHeader title="Market Digest" />

      {/* Mid-session alerts strip (today only) */}
      {midContent && midContent.alerts.length > 0 && (
        <section className="mb-8">
          <ReportSection title="Mid-Session Alerts" count={midContent.alerts.length}>
          <div className="space-y-2">
            {midContent.alerts.map((alert, i) => (
              <div
                key={`${alert.ticker}-${i}`}
                className="flex items-start gap-3 py-2"
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
          </ReportSection>
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
