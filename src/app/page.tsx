import { getLatest } from '../lib/reports';
import type { DailyContent, RetroContent } from '../../lib/schemas';
import { DailyView } from '../components/DailyView';
import { SeverityBadge } from '../components/SeverityBadge';

export default async function TodayPage() {
  const [daily, retro] = await Promise.all([
    getLatest('daily'),
    getLatest('retro'),
  ]);

  if (!daily) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-2xl text-[var(--color-faint)] mb-2">No briefing yet.</p>
        <p className="text-sm text-[var(--color-faint)]">
          The daily brief will appear here once generated.
        </p>
      </div>
    );
  }

  const dailyContent = daily.content as DailyContent;

  // Check if retro is from today
  const today = new Date().toISOString().slice(0, 10);
  const midContent =
    retro && (retro.content as RetroContent).date === today
      ? (retro.content as RetroContent)
      : null;

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)] mb-1">
          Daily Brief
        </p>
        <h1 className="font-display text-3xl font-black text-[var(--color-ink)] leading-tight">
          Today&rsquo;s Market Briefing
        </h1>
        <div className="mt-3 h-px bg-[var(--color-hairline)]" />
      </div>

      {/* Daily report */}
      <DailyView content={dailyContent} generatedAt={daily.generatedAt} />

      {/* Mid-session alerts (today only) */}
      {midContent && midContent.alerts.length > 0 && (
        <section className="mt-12">
          <div className="mb-4 pb-2 border-b border-[var(--color-hairline)] flex items-center gap-3">
            <h2 className="font-display text-xl font-semibold text-[var(--color-ink)]">
              Mid-Session Alerts
            </h2>
            <span className="font-mono text-xs text-[var(--color-bearish)] bg-[var(--color-bearish-bg)] px-2 py-0.5 rounded border border-[#F2D5CF]">
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
    </div>
  );
}
