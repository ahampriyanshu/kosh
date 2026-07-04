import { notFound } from 'next/navigation';
import { getManifest, getReport } from '../../../../../lib/reports';
import { OUTLOOK_REPORT_TYPES } from '../../../../../../lib/report-taxonomy';
import { outlookPath, parseOutlookSlug } from '../../../../../../lib/report-routes';
import { ReportDetail } from '../../../../../components/ReportDetail';

export const dynamicParams = false;

export async function generateStaticParams() {
  const manifest = await getManifest();
  return manifest.reports
    .filter((entry) => OUTLOOK_REPORT_TYPES.includes(entry.type as (typeof OUTLOOK_REPORT_TYPES)[number]))
    .map((entry) => {
      const [, , year, month, period] = outlookPath(entry).split('/');
      return { year, month, period };
    });
}

interface OutlookDetailPageProps {
  params: Promise<{ year: string; month: string; period: string }>;
}

export default async function OutlookDetailPage({ params }: OutlookDetailPageProps) {
  const { year, month, period } = await params;
  const parsed = parseOutlookSlug([year, month, period]);
  if (!parsed) notFound();

  const manifest = await getManifest();
  const entry = manifest.reports.find((candidate) => outlookPath(candidate) === `/outlook/${year}/${month}/${period}`);
  if (!entry) notFound();

  const envelope = await getReport(entry.id);
  return <ReportDetail envelope={envelope} />;
}
