import type { DailyContent, MonthlyContent, RecapContent, ReportEnvelope, ResearchContent, RetroContent, WeeklyContent } from '../../lib/schemas';
import { DailyView } from './DailyView';
import { MonthlyView } from './MonthlyView';
import { RecapView } from './RecapView';
import { ResearchView } from './ResearchView';
import { RetroView } from './RetroView';
import { WeeklyView } from './WeeklyView';

const TYPE_TITLES: Record<string, string> = {
  daily: 'Daily Brief',
  retro: 'Mid-Session',
  recap: 'Weekly Recap',
  weekly: 'Weekly Outlook',
  monthly: 'Monthly Outlook',
  research: 'Research',
};

function formatGeneratedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
      hour12: false,
    }) + ' IST';
  } catch {
    return iso;
  }
}

export function ReportDetail({ envelope }: { envelope: ReportEnvelope }) {
  const typeLabel = TYPE_TITLES[envelope.type] ?? envelope.type;
  const title =
    envelope.type === 'research'
      ? `${(envelope.content as ResearchContent).name} Research`
      : typeLabel;

  return (
    <div>
      <div className="mb-8">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)] mb-1">{typeLabel}</p>
        <h1 className="font-display text-3xl font-black text-[var(--color-ink)] leading-tight">{title}</h1>
        <div className="mt-3 flex items-center gap-4 flex-wrap">
          <time className="font-mono text-xs text-[var(--color-faint)]">{formatGeneratedAt(envelope.generatedAt)}</time>
        </div>
        <div className="mt-3 h-px bg-[var(--color-hairline)]" />
      </div>
      {envelope.type === 'daily' && <DailyView content={envelope.content as DailyContent} generatedAt={envelope.generatedAt} />}
      {envelope.type === 'retro' && <RetroView content={envelope.content as RetroContent} />}
      {envelope.type === 'weekly' && <WeeklyView content={envelope.content as WeeklyContent} />}
      {envelope.type === 'monthly' && <MonthlyView content={envelope.content as MonthlyContent} />}
      {envelope.type === 'recap' && <RecapView content={envelope.content as RecapContent} />}
      {envelope.type === 'research' && <ResearchView content={envelope.content as ResearchContent} />}
    </div>
  );
}
