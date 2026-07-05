import { getQuoteDetail, getHistorical, searchTicker } from './market-data';
import { rsi, macd, trend } from './indicators';
import { generateGroundedObject } from './llm';
import { ResearchContentSchema, type ResearchContent } from './schemas';
import { resolveYahooTicker } from './ticker-aliases';

function looksLikeYahooTicker(query: string): boolean {
  return /^[A-Z0-9&-]+\.(NS|BO)$/i.test(query.trim());
}

const RESEARCH_QUERY_ALIASES: Record<string, string> = {
  itc: 'ITC.NS',
  psb: 'PSB.NS',
};

function formatMacd(value: { MACD?: number; signal?: number } | null | undefined): string {
  if (typeof value?.MACD !== 'number' || typeof value.signal !== 'number') return 'n/a';
  return `${value.MACD.toFixed(2)} / ${value.signal.toFixed(2)}`;
}

function formatPrice(value: number | null): string {
  return value == null ? 'n/a' : `Rs ${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function format52WeekPosition(price: number, high: number | null, low: number | null): string {
  if (high == null || low == null || high <= low) return 'n/a';
  const position = ((price - low) / (high - low)) * 100;
  return `${Math.round(position)}% of range`;
}

function formatPercentRatio(value: number | null): string {
  if (value == null) return 'n/a';
  const percent = Math.abs(value) <= 1 ? value * 100 : value;
  return `${percent.toFixed(2)}%`;
}

export async function resolveResearchTicker(query: string): Promise<string> {
  const normalized = query.trim();
  if (!normalized) throw new Error('Research query cannot be empty.');

  const alias = RESEARCH_QUERY_ALIASES[normalized.toLowerCase()];
  if (alias) return alias;

  if (looksLikeYahooTicker(normalized)) return resolveYahooTicker(normalized.toUpperCase());

  const matches = await searchTicker(normalized);
  const preferred = matches.find((symbol) => symbol.endsWith('.NS'))
    ?? matches.find((symbol) => symbol.endsWith('.BO'))
    ?? matches[0];

  if (!preferred) {
    throw new Error(`No Yahoo Finance ticker found for research query "${normalized}".`);
  }

  return resolveYahooTicker(preferred);
}

export async function buildResearch(query: string, now: Date = new Date(), ticker?: string): Promise<ResearchContent> {
  const resolvedTicker = ticker ?? await resolveResearchTicker(query);
  const period1 = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const quote = await getQuoteDetail(resolvedTicker);
  const candles = await getHistorical(resolvedTicker, period1);
  const closes = candles.map((c) => c.close);

  const rsiSeries = rsi(closes);
  const lastRsi = rsiSeries.length ? rsiSeries[rsiSeries.length - 1] : null;
  const macdSeries = macd(closes);
  const lastMacd = macdSeries.length ? macdSeries[macdSeries.length - 1] : null;

  const techBlock =
    `Price ${quote.price} ${quote.currency}; trend ${trend(closes)}; ` +
    `RSI ${lastRsi?.toFixed(1) ?? 'n/a'}; ` +
    `MACD ${lastMacd?.MACD?.toFixed(2) ?? 'n/a'} / signal ${lastMacd?.signal?.toFixed(2) ?? 'n/a'}.`;
  const metrics = [
    { label: 'LTP', value: formatPrice(quote.price) },
    { label: '52W Position', value: format52WeekPosition(quote.price, quote.high52w, quote.low52w) },
    { label: '52W High', value: formatPrice(quote.high52w) },
    { label: '52W Low', value: formatPrice(quote.low52w) },
    { label: 'Trend', value: trend(closes) },
    { label: 'RSI', value: lastRsi == null ? 'n/a' : lastRsi.toFixed(1) },
    { label: 'P/E', value: quote.trailingPE == null ? 'n/a' : quote.trailingPE.toFixed(2) },
    {
      label: 'MACD',
      value: formatMacd(lastMacd),
    },
    { label: 'ROE', value: formatPercentRatio(quote.returnOnEquity) },
    { label: 'Debt/Equity', value: quote.debtToEquity == null ? 'n/a' : quote.debtToEquity.toFixed(2) },
  ];

  const researchPrompt =
    `Deep-dive research on Indian company "${query}" resolved to market symbol ${resolvedTicker} (${quote.name}) as of ${now.toISOString().slice(0, 10)}. ` +
    `Cover company fundamentals (financials, valuation, growth, risks), recent news & sentiment, brokerage rating changes, target-price changes, upgrades/downgrades, and the technical picture. ` +
    `Use the latest available information.\n\nComputed technicals: ${techBlock}`;

  const buildStructurePrompt = (research: string) =>
    `Structure the research into this fixed schema only: ` +
    `"verdict" as one direct line; ` +
    `"fundamentals": { "growth", "quality", "valuation" }; ` +
    `"technicals": { "trend", "momentum", "levels" }; ` +
    `"sentiment": { "news", "brokerage", "marketTone" }; ` +
    `and "recommendation": { "action": "buy"|"sell"|"hold", "reasoning" }. ` +
    `Every value must be one concise line. Technical fields must incorporate the computed indicators. Brokerage must mention rating/target changes or say none were found.\n\nResearch:\n${research}`;

  const { object } = await generateGroundedObject(researchPrompt, buildStructurePrompt, ResearchContentSchema);
  return ResearchContentSchema.parse({
    ...object,
    ticker: resolvedTicker,
    name: quote.name,
    asOf: now.toISOString(),
    price: quote.price,
    metrics,
  });
}
