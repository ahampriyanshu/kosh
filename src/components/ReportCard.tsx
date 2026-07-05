import type { ManifestEntry } from '../../lib/schemas';
import { entryPath } from '../../lib/report-routes';
import { formatPeriodLabel } from '../../lib/time';
import { VerificationBadge } from './VerificationBadge';
import { IndexList } from './ui/IndexList';

const TYPE_LABELS: Record<string, string> = {
  daily: 'Daily Brief', retro: 'Mid-Session', recap: 'Weekly Recap',
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
  const dateLabel = entry.type === 'weekly' ? formatPeriodLabel(entry.dateKey) : formatDate(entry.date);
  const title =
    entry.type === 'research' && ticker
      ? `${ticker} Research`
      : typeLabel;
  const description = entry.type === 'retro' && alertCount !== undefined && alertCount > 0
    ? `${alertCount} alert${alertCount !== 1 ? 's' : ''}`
    : undefined;

  return (
    <IndexList.Row
      href={entryPath(entry)}
      meta={dateLabel}
      title={title}
      description={description}
      aside={
        entry.type === 'recap' &&
        verificationHits !== undefined &&
        verificationTotal !== undefined ? (
          <VerificationBadge hits={verificationHits} total={verificationTotal} />
        ) : undefined
      }
    />
  );
}
