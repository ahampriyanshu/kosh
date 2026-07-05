import { getReportsByType } from '../../lib/reports';
import { ScorecardRecaps } from '../../components/ScorecardRecaps';
import { PageHeader } from '../../components/ui/PageHeader';

export default async function ScorecardPage() {
  const recaps = (await getReportsByType('recap')).sort((a, b) => b.dateKey.localeCompare(a.dateKey));

  return (
    <div>
      <PageHeader title="Scorecard" description="Backward view of weekly calls and what actually worked." />

      {/* Empty state */}
      {recaps.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[var(--color-hairline)] rounded-xl">
          <p className="font-display text-xl text-[var(--color-faint)]">
            No graded calls yet — the first Saturday recap will populate this.
          </p>
        </div>
      ) : (
        <ScorecardRecaps reports={recaps} />
      )}
    </div>
  );
}
