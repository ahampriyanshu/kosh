import { getReportsByType } from '../../lib/reports';
import type { ManifestEntry } from '../../../lib/schemas';

// We need getManifest to get ManifestEntry objects with IDs for ReportCard
import { getManifest } from '../../lib/reports';
import { ReportCard } from '../../components/ReportCard';

export default async function ResearchPage() {
  const [reports, manifest] = await Promise.all([
    getReportsByType('research'),
    getManifest(),
  ]);

  // Build a map from id → ManifestEntry for the ReportCard
  const entryMap = new Map<string, ManifestEntry>(
    manifest.reports.map((e) => [e.id, e]),
  );

  // Sort newest first
  const sorted = [...reports].sort((a, b) => b.id.localeCompare(a.id));

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-[var(--color-ink)] leading-tight">
          Stock Research
        </h1>
        <div className="mt-3 h-px bg-[var(--color-hairline)]" />
      </div>

      {sorted.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[var(--color-hairline)] rounded-xl">
          <p className="font-display text-xl text-[var(--color-faint)] mb-2">No research reports yet.</p>
          <p className="text-sm text-[var(--color-muted)] max-w-sm mx-auto leading-relaxed">
            Request a stock by adding it to{' '}
            <code className="font-mono text-xs bg-[var(--color-raised)] px-1.5 py-0.5 rounded border border-[var(--color-hairline)]">
              data/research-requests.ts
            </code>{' '}
            and committing.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-[var(--color-muted)] mb-6">
            Request a stock: add it to{' '}
            <code className="font-mono text-xs bg-[var(--color-raised)] px-1.5 py-0.5 rounded border border-[var(--color-hairline)]">
              data/research-requests.ts
            </code>{' '}
            and commit.
          </p>
          <div className="space-y-3">
            {sorted.map((report) => {
              const entry = entryMap.get(report.id);
              if (!entry) return null;
              return (
                <ReportCard
                  key={report.id}
                  entry={entry}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
