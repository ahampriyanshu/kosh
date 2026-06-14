import { getManifest, getAllReports } from '../../lib/reports';
import type { ReportType, MidSessionContent, RecapContent, ManifestEntry } from '../../../lib/schemas';
import { ReportCard } from '../../components/ReportCard';

const TYPE_ORDER: ReportType[] = ['morning', 'midsession', 'weekly', 'monthly', 'research'];
const TYPE_HEADINGS: Record<ReportType, string> = {
  morning: 'Morning Briefs',
  midsession: 'Mid-Session',
  weekly: 'Weekly Recaps',
  monthly: 'Monthly Recaps',
  research: 'Research',
};

export default async function ReportsPage() {
  const [manifest, allReports] = await Promise.all([
    getManifest(),
    getAllReports(),
  ]);

  // Build a map from id → full envelope for extra metadata
  const envelopeMap = new Map(allReports.map((r) => [r.id, r]));

  // Group manifest entries by type, newest first within each group
  const byType = new Map<ReportType, ManifestEntry[]>();
  for (const entry of manifest.reports) {
    const type = entry.type as ReportType;
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type)!.push(entry);
  }
  // Sort each group newest first
  for (const [, entries] of byType) {
    entries.sort((a, b) => b.id.localeCompare(a.id));
  }

  const sections = TYPE_ORDER.filter((t) => (byType.get(t)?.length ?? 0) > 0);

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)] mb-1">
          Archive
        </p>
        <h1 className="font-display text-3xl font-black text-[var(--color-ink)] leading-tight">
          All Reports
        </h1>
        <div className="mt-3 h-px bg-[var(--color-hairline)]" />
      </div>

      {sections.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[var(--color-hairline)] rounded-xl">
          <p className="font-display text-xl text-[var(--color-faint)]">No reports yet.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {sections.map((type) => {
            const entries = byType.get(type) ?? [];
            return (
              <section key={type}>
                <h2 className="font-display text-lg font-semibold text-[var(--color-ink)] mb-4 pb-2 border-b border-[var(--color-hairline)]">
                  {TYPE_HEADINGS[type]}
                  <span className="ml-2 font-mono text-sm font-normal text-[var(--color-faint)]">
                    ({entries.length})
                  </span>
                </h2>
                <div className="space-y-3">
                  {entries.map((entry) => {
                    const envelope = envelopeMap.get(entry.id);
                    let alertCount: number | undefined;
                    let verificationHits: number | undefined;
                    let verificationTotal: number | undefined;

                    if (envelope && entry.type === 'midsession') {
                      const c = envelope.content as MidSessionContent;
                      alertCount = c.alerts?.length ?? 0;
                    }

                    if (
                      envelope &&
                      (entry.type === 'weekly' || entry.type === 'monthly')
                    ) {
                      const c = envelope.content as RecapContent;
                      if (c.retrospective) {
                        verificationHits = c.retrospective.hits;
                        verificationTotal = c.retrospective.total;
                      }
                    }

                    return (
                      <ReportCard
                        key={entry.id}
                        entry={entry}
                        alertCount={alertCount}
                        verificationHits={verificationHits}
                        verificationTotal={verificationTotal}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
