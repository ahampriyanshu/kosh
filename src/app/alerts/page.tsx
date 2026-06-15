import { getReportsByType } from '../../lib/reports';
import type { RetroContent } from '../../../lib/schemas';
import { SeverityBadge } from '../../components/SeverityBadge';

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00+05:30');
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return dateStr;
  }
}

export default async function AlertsPage() {
  const reports = await getReportsByType('retro');

  // Flatten all alerts across all retro reports, newest report first
  const sorted = [...reports].sort((a, b) => b.id.localeCompare(a.id));

  interface AlertRow {
    reportId: string;
    reportDate: string;
    ticker: string;
    name: string;
    reason: string;
    severity: 'high' | 'medium' | 'low';
    triggeredRules: string[];
  }

  const allAlerts: AlertRow[] = sorted.flatMap((report) => {
    const content = report.content as RetroContent;
    const date = content.date;
    return (content.alerts ?? []).map((alert) => ({
      reportId: report.id,
      reportDate: date,
      ticker: alert.ticker,
      name: alert.name,
      reason: alert.reason,
      severity: alert.severity,
      triggeredRules: alert.triggeredRules,
    }));
  });

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)] mb-1">
          Monitoring
        </p>
        <h1 className="font-display text-3xl font-black text-[var(--color-ink)] leading-tight">
          Alert History
        </h1>
        <div className="mt-3 h-px bg-[var(--color-hairline)]" />
      </div>

      {allAlerts.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[var(--color-hairline)] rounded-xl">
          <p className="font-display text-xl text-[var(--color-faint)] mb-2">No alerts triggered yet.</p>
          <p className="text-sm text-[var(--color-muted)]">
            Alerts appear here when mid-session rules fire on your watchlist.
          </p>
        </div>
      ) : (
        <>
          <p className="font-mono text-xs text-[var(--color-faint)] mb-6">
            {allAlerts.length} alert{allAlerts.length !== 1 ? 's' : ''} across {reports.length} session{reports.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-3">
            {allAlerts.map((alert, i) => (
              <article
                key={`${alert.reportId}-${alert.ticker}-${i}`}
                className="p-4 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)]"
              >
                <div className="flex items-start gap-3 flex-wrap">
                  <SeverityBadge severity={alert.severity} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-sm font-bold text-[var(--color-ink)]">
                        {alert.ticker.replace('.NS', '')}
                      </span>
                      <span className="text-sm text-[var(--color-muted)]">{alert.name}</span>
                      <time className="font-mono text-xs text-[var(--color-faint)] ml-auto shrink-0">
                        {formatDate(alert.reportDate)}
                      </time>
                    </div>
                    <p className="text-sm text-[var(--color-muted)] mb-2">{alert.reason}</p>
                    {alert.triggeredRules.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
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
        </>
      )}
    </div>
  );
}
