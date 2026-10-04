import { getManifest } from '../../lib/reports';
import { OutlookMonthArchive } from '../../components/OutlookMonthArchive';

export default async function OutlookPage() {
  const manifest = await getManifest();

  return <OutlookMonthArchive entries={manifest.reports} />;
}
