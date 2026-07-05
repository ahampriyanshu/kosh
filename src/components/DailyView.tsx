import type { DailyContent } from '../../lib/schemas';
import { MarketDashboard } from './market/MarketDashboard';

interface DailyViewProps {
  content: DailyContent;
  generatedAt?: string;
}

export function DailyView({ content }: DailyViewProps) {
  return (
    <div className="space-y-8">
      {/* Outlook */}
      <section>
        <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-3 pb-2 border-b border-[var(--color-hairline)]">
          Market Outlook
        </h2>
        <p className="text-[var(--color-ink)] leading-relaxed">{content.outlook}</p>
      </section>

      {/* Key Takeaways */}
      {content.keyTakeaways.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-3 pb-2 border-b border-[var(--color-hairline)]">
            Key Takeaways
          </h2>
          <ul className="space-y-2">
            {content.keyTakeaways.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[var(--color-brand)] mt-1 text-xs" aria-hidden="true">◆</span>
                <span className="text-sm text-[var(--color-muted)] leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Market Dashboard */}
      <MarketDashboard snapshot={content.snapshot} />
    </div>
  );
}
