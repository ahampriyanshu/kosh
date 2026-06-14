import Link from 'next/link';
import type { ManifestEntry } from '../../lib/schemas';
import { VerificationBadge } from './VerificationBadge';

const TYPE_LABELS: Record<string, string> = {
  daily: 'Daily Brief', midsession: 'Mid-Session', retro: 'Weekly Retrospective',
  weekly: 'Weekly Outlook', monthly: 'Monthly Outlook', research: 'Research',
};

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

interface ReportCardProps {
  entry: ManifestEntry;
  alertCount?: number;
  ticker?: string;
  verificationHits?: number;
  verificationTotal?: number;
}

export function ReportCard({
  entry,
  alertCount,
  ticker,
  verificationHits,
  verificationTotal,
}: ReportCardProps) {
  const typeLabel = TYPE_LABELS[entry.type] ?? entry.type;
  const title =
    entry.type === 'research' && ticker
      ? `${ticker} Research`
      : typeLabel;

  return (
    <Link href={`/reports/${entry.type}/${entry.dateKey}`} className="block group">
      <article className="border border-[var(--color-hairline)] rounded-lg bg-[var(--color-surface)] p-4 hover:border-[var(--color-brand)] hover:shadow-sm transition-all duration-150">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Eyebrow */}
            <p className="text-xs font-sans font-medium uppercase tracking-widest text-[var(--color-brand)] mb-1">
              {typeLabel}
            </p>
            {/* Title */}
            <h3 className="font-display text-base font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-brand)] transition-colors leading-snug">
              {title}
              {entry.type === 'midsession' && alertCount !== undefined && alertCount > 0 && (
                <span className="ml-2 font-mono text-xs font-normal text-[var(--color-bearish)] bg-[var(--color-bearish-bg)] px-1.5 py-0.5 rounded">
                  {alertCount} alert{alertCount !== 1 ? 's' : ''}
                </span>
              )}
            </h3>
          </div>
          {/* Date */}
          <time className="font-mono text-xs text-[var(--color-faint)] whitespace-nowrap mt-0.5 shrink-0">
            {formatDate(entry.date)}
          </time>
        </div>

        {/* Verification badge for weekly/monthly */}
        {(entry.type === 'weekly' || entry.type === 'monthly') &&
          verificationHits !== undefined &&
          verificationTotal !== undefined && (
            <div className="mt-2">
              <VerificationBadge hits={verificationHits} total={verificationTotal} />
            </div>
          )}
      </article>
    </Link>
  );
}
