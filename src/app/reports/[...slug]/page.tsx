import { notFound } from 'next/navigation';
import { getManifest, getReport } from '../../../lib/reports';
import { reportPath, parseReportSlug } from '../../../../lib/report-routes';
import type { ReportType } from '../../../../lib/schemas';
import { ReportDetail } from '../../../components/ReportDetail';

export const dynamicParams = false;

export async function generateStaticParams() {
  const manifest = await getManifest();
  const slugSet = new Set<string>();
  const cleanParams: Array<{ slug: string[] }> = [];

  for (const entry of manifest.reports) {
    if (entry.type === 'research' || entry.type === 'recap') continue;
    const path = reportPath(entry);
    const parts = path.replace(/^\/reports\//, '').split('/').filter(Boolean);
    if (parts.length === 3) {
      const key = parts.join('/');
      if (!slugSet.has(key)) {
        slugSet.add(key);
        cleanParams.push({ slug: parts });
      }
    }
  }

  return cleanParams;
}

interface ReportPageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { slug } = await params;
  const parsed = parseReportSlug(slug);
  if (!parsed) notFound();

  const manifest = await getManifest();

  if (parsed.type === 'daily') {
    const entries = manifest.reports
      .filter((entry) => entry.date === parsed.date && (entry.type === 'daily' || entry.type === 'retro'))
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

  const currentPath = `/reports/${slug.join('/')}`;
  const entry = manifest.reports.find((candidate) => reportPath(candidate) === currentPath);
  if (!entry) notFound();

  const envelope = await getReport(entry.id);
  return <ReportDetail envelope={envelope} />;
}

function reportOrder(type: ReportType): number {
  const order: ReportType[] = ['daily', 'retro', 'weekly', 'monthly', 'recap', 'research'];
  return order.indexOf(type);
}
