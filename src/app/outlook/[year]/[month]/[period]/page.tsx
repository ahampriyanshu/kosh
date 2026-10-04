import { getManifest } from '../../../../../lib/reports';
import { reportPath } from '../../../../../../lib/report-routes';
import { LegacyOutlookRedirect } from './LegacyOutlookRedirect';

export const dynamicParams = false;

export async function generateStaticParams() {
  const manifest = await getManifest();
  return manifest.reports
    .filter((entry) => entry.type === 'weekly' || entry.type === 'monthly')
    .map((entry) => {
      const [, , year, month, period] = reportPath(entry).split('/');
      return { year, month, period };
    });
}

interface LegacyOutlookPageProps {
  params: Promise<{ year: string; month: string; period: string }>;
}

export default async function LegacyOutlookPage({ params }: LegacyOutlookPageProps) {
  const { year, month, period } = await params;
  return <LegacyOutlookRedirect destination={`/reports/${year}/${month}/${period}`} />;
}
