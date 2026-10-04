import type { MarketSnapshot } from '../../../lib/schemas';
import { formatNewsMeta, safeArticleUrl, cleanTicker, CATEGORY_LABELS, formatCategory } from '../../lib/news-format';

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
              {CATEGORY_LABELS[group.category] || formatCategory(group.category)}
            </h3>
          )}
          <ul className="space-y-2">
            {group.items.map((item, idx) => {
              const metaLine = formatNewsMeta(group.category, item.source);
              const url = safeArticleUrl(item.url);

              const cardContent = (
                <>
                  {metaLine && (
                    <div className="text-xs font-mono text-[var(--color-muted)] font-medium">
                      {metaLine}
                    </div>
                  )}
                  <h4 className="font-serif font-bold text-[var(--color-ink)] leading-snug group-hover:underline underline-offset-4">
                    {item.headline}
                  </h4>
                  {item.tickers && item.tickers.length > 0 && (
                    <div className="text-xs font-mono text-[var(--color-muted)] pt-0.5">
                      {item.tickers.map((t) => cleanTicker(t)).join(', ')}
                    </div>
                  )}
                </>
              );

              return (
                <li key={idx} className="py-1">
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block space-y-1 no-underline text-inherit"
                    >
                      {cardContent}
                    </a>
                  ) : (
                    <div className="space-y-1">
                      {cardContent}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
