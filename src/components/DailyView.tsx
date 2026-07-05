import type { DailyContent } from '../../lib/schemas';
import { MarketDashboard } from './market/MarketDashboard';
import { ReportSection } from './ui/ReportSection';

interface DailyViewProps {
  content: DailyContent;
  generatedAt?: string;
}

export function DailyView({ content }: DailyViewProps) {
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

      {/* Market Dashboard */}
      <MarketDashboard snapshot={content.snapshot} />
    </div>
  );
}
