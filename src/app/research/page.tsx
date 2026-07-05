import { getReportsByType } from '../../lib/reports';
import { ResearchArchive } from '../../components/ResearchArchive';
import { PageHeader } from '../../components/ui/PageHeader';

export default async function ResearchPage() {
  const reports = await getReportsByType('research');
  const sorted = [...reports].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt) || b.id.localeCompare(a.id));

  return (
    <div>
      <PageHeader
        title="Stock Research"
        description={(
          <>
            Deep research runs across requested companies.{' '}
            <a
              href="https://github.com/ahampriyanshu/kosh/edit/main/data/research-requests.ts"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--color-brand)] underline underline-offset-4"
            >
              Add New
            </a>
          </>
        )}
      />

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
