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

const PUBLICATION_URLS: Record<string, string> = {
  'economic times': 'https://economictimes.indiatimes.com',
  'et': 'https://economictimes.indiatimes.com',
  'bloomberg': 'https://www.bloomberg.com/markets',
  'reuters': 'https://www.reuters.com/markets',
  'mint': 'https://www.livemint.com/market',
  'livemint': 'https://www.livemint.com/market',
  'business standard': 'https://www.business-standard.com/markets',
  'moneycontrol': 'https://www.moneycontrol.com/news/business',
  'financial express': 'https://www.financialexpress.com/market',
  'cnbc-tv18': 'https://www.cnbctv18.com/market',
  'ndtv profit': 'https://www.ndtvprofit.com',
};

export function resolveArticleUrl(value?: string, source?: string): string | undefined {
  const safe = safeArticleUrl(value);
  if (safe) return safe;
  if (!source) return undefined;
  const clean = source.toLowerCase().trim();
  for (const [name, domain] of Object.entries(PUBLICATION_URLS)) {
    if (clean.includes(name)) return domain;
  }
  return undefined;
}

export function cleanTicker(symbol: string): string {
  return symbol.replace(/\.(NS|BO)$/i, '');
}
