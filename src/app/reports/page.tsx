import { getManifest } from '../../lib/reports';
import { PageHeader } from '../../components/ui/PageHeader';
import { ReportsMonthArchive } from '../../components/ReportsMonthArchive';

export default async function ReportsPage() {
  const manifest = await getManifest();

  return (
    <div>
      <PageHeader title="Reports" description="Daily briefs and mid-session reports by month." />
      <ReportsMonthArchive entries={manifest.reports} />
    </div>
  );
}
