import type { MarketSnapshot } from '../../../lib/schemas';
import { formatNewsMeta, safeArticleUrl, cleanTicker } from '../../lib/news-format';

type NewsCategory = MarketSnapshot['news'][number]['category'];
type NewsItem = MarketSnapshot['news'][number]['items'][number];

// Fixed theme order — stable across reruns.
const THEME_ORDER: NewsCategory[] = [
  'macro_policy',
  'global_cues',
  'earnings',
  'sectoral',
  'corporate_actions',
  'stocks_in_focus',
];

interface NewsDigestProps {
  groups: MarketSnapshot['news'];
  limit?: number;
}

// Picks up to `limit` headlines, round-robin across themes for diversity.
export function NewsDigest({ groups, limit = 6 }: NewsDigestProps) {
  const byCategory = new Map(groups.map((g) => [g.category, g.items]));
  const picks: Array<{ category: NewsCategory; item: NewsItem }> = [];

  let round = 0;
  let added = true;
  while (picks.length < limit && added) {
    added = false;
    for (const category of THEME_ORDER) {
      const items = byCategory.get(category);
      if (items && items[round]) {
        picks.push({ category, item: items[round] });
        added = true;
        if (picks.length >= limit) break;
      }
    }
    round += 1;
  }

  if (picks.length === 0) return null;

  return (
    <ul className="divide-y divide-[var(--color-hairline)]">
      {picks.map(({ category, item }, i) => {
        const metaLine = formatNewsMeta(category, item.source);
        const url = safeArticleUrl(item.url);

        const cardContent = (
          <>
            {metaLine && (
              <div className="text-xs font-mono text-[var(--color-muted)] font-medium">
                {metaLine}
              </div>
            )}
            <h3 className="font-serif text-base font-bold text-[var(--color-ink)] leading-snug group-hover:underline underline-offset-4">
              {item.headline}
            </h3>
            {item.tickers && item.tickers.length > 0 && (
              <div className="text-xs font-mono text-[var(--color-muted)] pt-0.5">
                {item.tickers.map((t) => cleanTicker(t)).join(', ')}
              </div>
            )}
          </>
        );

        return (
          <li key={i} className="py-3">
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
  );
}
