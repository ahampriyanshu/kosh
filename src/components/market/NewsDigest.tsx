import type { MarketSnapshot } from '../../../lib/schemas';

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

const THEME_LABELS: Record<NewsCategory, string> = {
  macro_policy: 'Macro & Policy',
  global_cues: 'Global Cues',
  earnings: 'Earnings',
  sectoral: 'Sectoral',
  corporate_actions: 'Corporate Actions',
  stocks_in_focus: 'Stocks in Focus',
};

// Some grounded runs emit a placeholder instead of a real outlet name; hide those.
const PLACEHOLDER_SOURCES = new Set(['research text', 'research', 'source', 'n/a', 'na', 'unknown', '']);
function isRealSource(source: string): boolean {
  return !PLACEHOLDER_SOURCES.has(source.trim().toLowerCase());
}

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
      {picks.map(({ category, item }, i) => (
        <li key={i} className="py-3">
          <span className="font-sans text-[10px] font-semibold uppercase tracking-widest text-[var(--color-brand)]">
            {THEME_LABELS[category]}
          </span>
          <p className="font-display font-semibold text-[var(--color-ink)] leading-snug mt-0.5">
            {item.headline}
          </p>
          {isRealSource(item.source) && (
            <span className="font-mono text-xs text-[var(--color-faint)]">{item.source}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
