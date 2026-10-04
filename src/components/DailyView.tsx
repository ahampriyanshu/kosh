import type { DailyContent } from '../../lib/schemas';
import { MarketDashboard } from './market/MarketDashboard';
import { NewsDigest } from './market/NewsDigest';
import RecommendationsList from './market/RecommendationsList';
import CorpActionsList from './market/CorpActionsList';
import { ReportSection } from './ui/ReportSection';

interface DailyViewProps {
  content: DailyContent;
  generatedAt?: string;
}

export function DailyView({ content }: DailyViewProps) {
  const hasNews = content.snapshot.news && content.snapshot.news.length > 0;
  const hasStreetRecs = content.snapshot.streetRecommendations && content.snapshot.streetRecommendations.length > 0;
  const hasCorpActions = content.snapshot.corporateActions && content.snapshot.corporateActions.length > 0;

  return (
    <div className="space-y-8">
      {/* Outlook */}
      <ReportSection title="Market Outlook">
        <p className="text-[var(--color-ink)] leading-relaxed">{content.outlook}</p>
      </ReportSection>

      {/* Key Takeaways */}
      {content.keyTakeaways.length > 0 && (
        <ReportSection title="Key Takeaways">
          <ul className="space-y-2">
            {content.keyTakeaways.map((item, i) => (
              <li key={i} className="text-sm text-[var(--color-muted)] leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </ReportSection>
      )}

      {/* Curated Market News Digest */}
      {hasNews && (
        <ReportSection title="Top Stories & Market Intelligence">
          <NewsDigest groups={content.snapshot.news} limit={6} />
        </ReportSection>
      )}

      {/* Street Consensus & Brokerage Targets */}
      {hasStreetRecs && (
        <ReportSection title="Street Consensus & Brokerage Radar">
          <RecommendationsList recs={content.snapshot.streetRecommendations} />
        </ReportSection>
      )}

      {/* Corporate Actions & Calendar */}
      {hasCorpActions && (
        <ReportSection title="Corporate Actions & Calendar">
          <CorpActionsList actions={content.snapshot.corporateActions} />
        </ReportSection>
      )}

      {/* Market Microstructure Dashboard */}
      <MarketDashboard snapshot={content.snapshot} />
    </div>
  );
}
