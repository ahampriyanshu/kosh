import { getManifest } from '../../lib/reports';
import { ReportsMonthArchive } from '../../components/ReportsMonthArchive';

export default async function ReportsPage() {
  const manifest = await getManifest();

  return (
    <ReportsMonthArchive entries={manifest.reports} />
  );
}
