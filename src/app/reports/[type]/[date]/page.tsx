import { notFound } from 'next/navigation';
import { getManifest, getReportByRoute } from '../../../../lib/reports';
import type { DailyContent, MidSessionContent, RecapContent, ResearchContent } from '../../../../../lib/schemas';
import { DailyView } from '../../../../components/DailyView';
import { MidSessionView } from '../../../../components/MidSessionView';
import { RecapView } from '../../../../components/RecapView';
import { ResearchView } from '../../../../components/ResearchView';

export const dynamicParams = false;

export async function generateStaticParams() {
  const manifest = await getManifest();
  return manifest.reports.map((r) => ({ type: r.type, date: r.dateKey }));
}

const TYPE_TITLES: Record<string, string> = {
  daily: 'Daily Brief',
  midsession: 'Mid-Session',
  retro: 'Weekly Retrospective',
  weekly: 'Weekly Outlook',
  monthly: 'Monthly Outlook',
  research: 'Research',
};

function formatGeneratedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata', hour12: false,
    }) + ' IST';
  } catch { return iso; }
}

interface ReportPageProps { params: Promise<{ type: string; date: string }>; }

export default async function ReportPage({ params }: ReportPageProps) {
  const { type, date } = await params;
  const envelope = await getReportByRoute(type, date);
  if (!envelope) notFound();

  const typeLabel = TYPE_TITLES[envelope.type] ?? envelope.type;
  let title = typeLabel;
  if (envelope.type === 'research') {
    title = `${(envelope.content as ResearchContent).ticker} Research`;
  }

  return (
    <div>
      <div className="mb-8">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)] mb-1">{typeLabel}</p>
        <h1 className="font-display text-3xl font-black text-[var(--color-ink)] leading-tight">{title}</h1>
        <div className="mt-3 flex items-center gap-4 flex-wrap">
          <time className="font-mono text-xs text-[var(--color-faint)]">{formatGeneratedAt(envelope.generatedAt)}</time>
          <span className="font-mono text-xs text-[var(--color-faint)] truncate max-w-xs" title={envelope.checksum}>{envelope.checksum.slice(0, 20)}&hellip;</span>
        </div>
        <div className="mt-3 h-px bg-[var(--color-hairline)]" />
      </div>
      {envelope.type === 'daily' && <DailyView content={envelope.content as DailyContent} generatedAt={envelope.generatedAt} />}
      {envelope.type === 'midsession' && <MidSessionView content={envelope.content as MidSessionContent} />}
      {(envelope.type === 'weekly' || envelope.type === 'monthly' || envelope.type === 'retro') && <RecapView content={envelope.content as RecapContent} />}
      {envelope.type === 'research' && <ResearchView content={envelope.content as ResearchContent} />}
    </div>
  );
}
