import type { DailyContent, MonthlyContent, RecapContent, ReportEnvelope, ResearchReportContent, RetroContent, WeeklyContent } from '../../lib/schemas';
import { DailyView } from './DailyView';
import { MonthlyView } from './MonthlyView';
import { RecapView } from './RecapView';
import { ResearchView } from './ResearchView';
import { RetroView } from './RetroView';
import { WeeklyView } from './WeeklyView';
import { PageHeader } from './ui/PageHeader';

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

function formatResearchGeneratedAt(iso: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
      hour12: false,
    }).formatToParts(new Date(iso));
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
    return `${part('day')} ${part('month')} ${part('year')}, ${part('hour')}:${part('minute')} IST`;
  } catch {
    return iso;
  }
}

export function ReportDetail({ envelope }: { envelope: ReportEnvelope }) {
  const typeLabel = TYPE_TITLES[envelope.type] ?? envelope.type;
  const title =
    envelope.type === 'research'
      ? `Research #${envelope.id}`
      : typeLabel;
  const description = envelope.type === 'research'
    ? formatResearchGeneratedAt(envelope.generatedAt)
    : `${typeLabel} - ${formatGeneratedAt(envelope.generatedAt)}`;
  const researchContent = envelope.content as ResearchReportContent;

  return (
    <div>
      <PageHeader title={title} description={description} />
      {envelope.type === 'daily' && <DailyView content={envelope.content as DailyContent} generatedAt={envelope.generatedAt} />}
      {envelope.type === 'retro' && <RetroView content={envelope.content as RetroContent} />}
      {envelope.type === 'weekly' && <WeeklyView content={envelope.content as WeeklyContent} />}
      {envelope.type === 'monthly' && <MonthlyView content={envelope.content as MonthlyContent} />}
      {envelope.type === 'recap' && <RecapView content={envelope.content as RecapContent} />}
      {envelope.type === 'research' && (
        <div className="space-y-12">
          {researchContent.items.map((item) => (
            <ResearchView key={item.ticker} content={item} />
          ))}
        </div>
      )}
    </div>
  );
}
