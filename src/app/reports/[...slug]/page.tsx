import { notFound } from 'next/navigation';
import { getManifest, getReport } from '../../../lib/reports';
import { isOutlookReportType } from '../../../../lib/report-taxonomy';
import { parseDateReportSlug } from '../../../../lib/report-routes';
import type { ReportType } from '../../../../lib/schemas';
import { ReportDetail } from '../../../components/ReportDetail';

export const dynamicParams = false;

export async function generateStaticParams() {
  const manifest = await getManifest();
  const cleanDates = Array.from(
    new Set(
      manifest.reports
        .filter((entry) => !isOutlookReportType(entry.type))
        .map((entry) => entry.date),
    ),
  );
  const cleanParams = cleanDates.map((date) => {
    const [year, month, day] = date.split('-');
    return { slug: [year, month, day] };
  });
  return cleanParams;
}

interface ReportPageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { slug } = await params;

  const date = parseDateReportSlug(slug);
  if (!date) notFound();

  const manifest = await getManifest();
  const entries = manifest.reports
    .filter((entry) => entry.date === date && !isOutlookReportType(entry.type))
    .sort((a, b) => reportOrder(a.type) - reportOrder(b.type) || b.id.localeCompare(a.id));

  if (entries.length === 0) notFound();

  const reports = await Promise.all(entries.map((entry) => getReport(entry.id)));

  if (reports.length === 1) return <ReportDetail envelope={reports[0]!} />;

  return (
    <div className="space-y-12">
      {reports.map((report) => (
        <ReportDetail key={report.id} envelope={report} />
      ))}
    </div>
  );
}

function reportOrder(type: ReportType): number {
  const order: ReportType[] = ['daily', 'retro', 'recap', 'research', 'weekly', 'monthly'];
  return order.indexOf(type);
}
