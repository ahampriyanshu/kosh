import { getReportsByType } from '../../lib/reports';
import { ResearchArchive } from '../../components/ResearchArchive';

export default async function ResearchPage() {
  const reports = await getReportsByType('research');
  const sorted = [...reports].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt) || b.id.localeCompare(a.id));

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <a
          href="https://github.com/ahampriyanshu/kosh/edit/main/data/research-requests.ts"
          target="_blank"
          rel="noopener noreferrer"
          className="font-serif italic text-sm text-[var(--color-ink)] hover:underline underline-offset-4 transition-colors"
        >
          + Add New
        </a>
      </div>

      {sorted.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[var(--color-hairline)]">
          <p className="font-serif text-xl text-[var(--color-faint)] mb-2">No research reports yet.</p>
          <p className="text-sm text-[var(--color-muted)] max-w-sm mx-auto leading-relaxed">
            Request a stock by adding its company name to{' '}
            <code className="text-xs bg-[var(--color-raised)] px-1.5 py-0.5 border border-[var(--color-hairline)]">
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
