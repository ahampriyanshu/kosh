import { notFound } from 'next/navigation';
import { getManifest, getReport } from '../../../lib/reports';
import { ReportDetail } from '../../../components/ReportDetail';

export const dynamicParams = false;

export async function generateStaticParams() {
  const manifest = await getManifest();
  const params = manifest.reports
    .filter((entry) => entry.type === 'research')
    .map((entry) => ({ id: entry.id }));
  return params.length ? params : [{ id: '__empty__' }];
}

interface ResearchDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResearchDetailPage({ params }: ResearchDetailPageProps) {
  const { id } = await params;
  const manifest = await getManifest();
  const entry = manifest.reports.find((item) => item.id === id && item.type === 'research');
  if (!entry) notFound();

  const report = await getReport(id);
  if (report.type !== 'research') notFound();

  return <ReportDetail envelope={report} />;
}
