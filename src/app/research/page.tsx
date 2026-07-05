import { getReportsByType } from '../../lib/reports';
import { ResearchArchive } from '../../components/ResearchArchive';

export default async function ResearchPage() {
  const reports = await getReportsByType('research');
  const sorted = [...reports].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt) || b.id.localeCompare(a.id));

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)] mb-1">
              Deep research
            </p>
            <h1 className="font-display text-3xl font-black text-[var(--color-ink)] leading-tight">
              Stock Research
            </h1>
          </div>
          <a
            href="https://github.com/ahampriyanshu/kosh/edit/main/data/research-requests.ts"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg border border-[var(--color-hairline)] px-3 py-2 text-sm font-semibold text-[var(--color-brand)] hover:border-[var(--color-brand)]"
          >
            Add New
          </a>
        </div>
        <div className="mt-3 h-px bg-[var(--color-hairline)]" />
      </div>

      {sorted.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[var(--color-hairline)] rounded-xl">
          <p className="font-display text-xl text-[var(--color-faint)] mb-2">No research reports yet.</p>
          <p className="text-sm text-[var(--color-muted)] max-w-sm mx-auto leading-relaxed">
            Request a stock by adding its company name to{' '}
            <code className="font-mono text-xs bg-[var(--color-raised)] px-1.5 py-0.5 rounded border border-[var(--color-hairline)]">
              data/research-requests.ts
            </code>{' '}
            and committing.
          </p>
        </div>
      ) : (
        <>
          <ResearchArchive reports={sorted} />
        </>
      )}
    </div>
  );
}
