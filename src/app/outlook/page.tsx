import { getManifest } from '../../lib/reports';
import { OutlookMonthArchive } from '../../components/OutlookMonthArchive';
import { PageHeader } from '../../components/ui/PageHeader';

export default async function OutlookPage() {
  const manifest = await getManifest();

  return (
    <div>
      <PageHeader title="Outlook" description="Forward-looking weekly and monthly market notes." />
      <OutlookMonthArchive entries={manifest.reports} />
    </div>
  );
}
