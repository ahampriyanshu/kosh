import type { DailyContent } from '../../lib/schemas';
import { MarketDashboard } from './market/MarketDashboard';
import { NewsDigest } from './market/NewsDigest';
import RecommendationsList from './market/RecommendationsList';
import CorpActionsList from './market/CorpActionsList';
import { RetroView } from './RetroView';
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

      {/* Session Close & Portfolio Surveillance */}
      {content.retro ? (
        <section aria-label="Session Close & Portfolio Surveillance" className="pt-6 border-t border-[var(--color-hairline)] space-y-6">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-hairline)] pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-muted)] block">
                Session Close Surveillance
              </span>
              <h2 className="text-xl font-serif font-bold text-[var(--color-ink)]">
                Market Close &amp; Portfolio Surveillance
              </h2>
            </div>
            <span className="text-xs font-mono text-[var(--color-muted)] px-2 py-0.5 rounded border border-[var(--color-hairline)]">
              16:15 IST
            </span>
          </div>
          <RetroView content={content.retro} />
        </section>
      ) : (
        <div className="pt-6 border-t border-[var(--color-hairline)]">
          <div className="rounded border border-dashed border-[var(--color-hairline)] p-4 text-center">
            <p className="text-xs uppercase tracking-widest font-semibold text-[var(--color-faint)] mb-1">
              Closing Surveillance Pending
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              Official closing prices, end-of-day breadth, and portfolio risk screening update after the 15:30 IST market close.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
