import type { MarketSnapshot } from '../../../lib/schemas';
import { ticker } from './Figure';

type NewsCategory = MarketSnapshot['news'][number]['category'];

function safeArticleUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

const CATEGORY_LABELS: Record<NewsCategory, string> = {
  macro_policy: 'Macro & Policy',
  global_cues: 'Global Cues',
  earnings: 'Earnings',
  sectoral: 'Sectoral',
  corporate_actions: 'Corporate Actions',
  stocks_in_focus: 'Stocks in Focus',
};

interface NewsListProps {
  groups: MarketSnapshot['news'];
  showCategoryLabels?: boolean;
}

export default function NewsList({ groups, showCategoryLabels = true }: NewsListProps) {
  const nonEmpty = groups.filter((g) => g.items.length > 0);
  if (nonEmpty.length === 0) return null;

  return (
    <div className="space-y-6">
      {nonEmpty.map((group) => (
        <div key={group.category}>
          {showCategoryLabels && (
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)] mb-3">
              {CATEGORY_LABELS[group.category]}
            </h3>
          )}
          <ul className="space-y-4">
            {group.items.map((item, idx) => (
              <li
                key={idx}
              >
                <p className="font-serif font-semibold text-[var(--color-ink)] leading-snug">
                  {safeArticleUrl(item.url) ? (
                    <a href={safeArticleUrl(item.url)} target="_blank" rel="noopener noreferrer" className="text-inherit hover:underline underline-offset-4">
                      {item.headline}
                    </a>
                  ) : item.headline}
                </p>
                <p className="text-sm text-[var(--color-muted)] mt-0.5">
                  {item.summary}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[var(--color-faint)]">
                    {item.source}
                  </span>
                  {item.tickers && item.tickers.length > 0 && (
                    <span className="flex flex-wrap gap-1">
                      {item.tickers.map((t) => (
                        <span
                          key={t}
                          className="font-serif text-xs border border-[var(--color-hairline)] text-[var(--color-ink)] px-1.5 py-0.5"
                        >
                          {ticker(t)}
                        </span>
                      ))}
                    </span>
                  )}
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        item.sentiment === 'bullish'
                          ? 'var(--color-bullish)'
                          : item.sentiment === 'bearish'
                            ? 'var(--color-bearish)'
                            : 'var(--color-neutral)',
                    }}
                    title={item.sentiment}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
