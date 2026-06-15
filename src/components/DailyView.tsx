import type { DailyContent } from '../../lib/schemas';
import { DigestView } from './DigestView';

function formatIST(isoStr: string): string {
  try {
    return new Date(isoStr).toLocaleString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return isoStr;
  }
}

interface DailyViewProps {
  content: DailyContent;
  generatedAt?: string;
}

export function DailyView({ content, generatedAt }: DailyViewProps) {
  return (
    <div className="space-y-8">
      {/* Date line */}
      {generatedAt && (
        <p className="font-mono text-xs text-[var(--color-faint)]">{formatIST(generatedAt)}</p>
      )}

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

      {/* Snapshot digest */}
      <section>
        <h2 className="font-display text-xl font-semibold text-[var(--color-ink)] mb-4 pb-2 border-b border-[var(--color-hairline)]">
          Market Snapshot
        </h2>
        <DigestView snapshot={content.snapshot} />
      </section>
    </div>
  );
}
