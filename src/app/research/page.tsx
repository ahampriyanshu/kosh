import { getReportsByType } from '../../lib/reports';
import { PageHeader } from '../../components/ui/PageHeader';
import { ResearchArchive } from '../../components/ResearchArchive';

export default async function ResearchPage() {
  const reports = await getReportsByType('research');
  const sorted = [...reports].sort(
    (a, b) =>
      b.generatedAt.localeCompare(a.generatedAt) || b.id.localeCompare(a.id),
  );

  return (
    <div className="archive-page">
      <PageHeader
        title="Research"
        description="Company fundamentals, technical signals and the reasoning behind each view."
        action={
          <a
            href="https://github.com/ahampriyanshu/kosh/edit/main/data/research-requests.ts"
            target="_blank"
            rel="noopener noreferrer"
            className="editorial-link"
          >
            Request a company <span aria-hidden="true">↗</span>
          </a>
        }
      />
      {sorted.length === 0 ? (
        <div className="edition-empty">
          <h2>No research reports yet.</h2>
          <p>
            Company reports will appear here once the first research edition is
            published.
          </p>
        </div>
      ) : (
        <ResearchArchive reports={sorted} />
      )}
    </div>
  );
}
