export const CATEGORY_LABELS: Record<string, string> = {
  macro_policy: 'Macro & Policy',
  global_cues: 'Global Cues',
  earnings: 'Earnings',
  sectoral: 'Sectoral',
  corporate_actions: 'Corporate Actions',
  stocks_in_focus: 'Stocks in Focus',
  economy: 'Economy',
  institutional_flows: 'Institutional Flows',
  capital_goods: 'Capital Goods',
  primary_markets: 'Primary Markets',
  energy_infra: 'Energy & Infrastructure',
  energy_infrastructure: 'Energy & Infrastructure',
};

const PLACEHOLDER_SOURCES = new Set([
  'research text',
  'research',
  'source',
  'n/a',
  'na',
  'unknown',
  '',
]);

export function cleanSource(source?: string): string | undefined {
  if (!source) return undefined;
  const trimmed = source.trim();
  if (PLACEHOLDER_SOURCES.has(trimmed.toLowerCase())) return undefined;
  return trimmed;
}

export function formatCategory(category?: string): string {
  if (!category) return '';
  const key = category.toLowerCase().trim();
  if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key];
  if (/[A-Z]/.test(category) && /[a-z]/.test(category)) return category;
  return category
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function formatNewsMeta(category?: string, source?: string): string {
  const cat = formatCategory(category);
  const src = cleanSource(source);
  if (cat && src) return `${cat} - ${src}`;
  return cat || src || '';
}

export function safeArticleUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function cleanTicker(symbol: string): string {
  return symbol.replace(/\.(NS|BO)$/i, '');
}
