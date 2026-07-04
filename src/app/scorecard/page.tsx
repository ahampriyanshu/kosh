import { getReportsByType } from '../../lib/reports';
import { ScorecardRecaps } from '../../components/ScorecardRecaps';

export default async function ScorecardPage() {
  const recaps = (await getReportsByType('recap')).sort((a, b) => b.dateKey.localeCompare(a.dateKey));

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)] mb-1">
          Backward view
        </p>
        <h1 className="font-display text-3xl font-black text-[var(--color-ink)] leading-tight">
          Scorecard
        </h1>
        <div className="mt-3 h-px bg-[var(--color-hairline)]" />
      </div>

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
