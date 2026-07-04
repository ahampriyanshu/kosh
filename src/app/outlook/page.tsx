import { getManifest } from '../../lib/reports';
import type { ManifestEntry, ReportType } from '../../../lib/schemas';
import { OUTLOOK_REPORT_TYPES, REPORT_TYPE_HEADINGS } from '../../../lib/report-taxonomy';
import { ReportCard } from '../../components/ReportCard';

export default async function OutlookPage() {
  const manifest = await getManifest();

  const byType = new Map<ReportType, ManifestEntry[]>();
  for (const entry of manifest.reports) {
    const type = entry.type as ReportType;
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type)!.push(entry);
  }

  for (const [, entries] of byType) {
    entries.sort((a, b) => b.id.localeCompare(a.id));
  }

  const sections = OUTLOOK_REPORT_TYPES.filter((type) => (byType.get(type)?.length ?? 0) > 0);

  return (
    <div>
      <div className="mb-8">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)] mb-1">
          Forward view
        </p>
        <h1 className="font-display text-3xl font-black text-[var(--color-ink)] leading-tight">
          Outlook
        </h1>
        <div className="mt-3 h-px bg-[var(--color-hairline)]" />
      </div>

      {sections.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[var(--color-hairline)] rounded-xl">
          <p className="font-display text-xl text-[var(--color-faint)]">No outlooks yet.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {sections.map((type) => {
            const entries = byType.get(type) ?? [];
            return (
              <section key={type}>
                <h2 className="font-display text-lg font-semibold text-[var(--color-ink)] mb-4 pb-2 border-b border-[var(--color-hairline)]">
                  {REPORT_TYPE_HEADINGS[type]}
                  <span className="ml-2 font-mono text-sm font-normal text-[var(--color-faint)]">
                    ({entries.length})
                  </span>
                </h2>
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <ReportCard key={entry.id} entry={entry} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
