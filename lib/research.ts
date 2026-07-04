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
  const dayChangePct = quote.previousClose > 0
    ? ((quote.price - quote.previousClose) / quote.previousClose) * 100
    : null;
  const metrics = [
    { label: 'Last price', value: `Rs ${quote.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` },
    { label: 'Day change', value: dayChangePct == null ? 'n/a' : `${dayChangePct >= 0 ? '+' : ''}${dayChangePct.toFixed(2)}%` },
    { label: 'Volume', value: quote.volume.toLocaleString('en-IN') },
  ];

  const researchPrompt =
    `Deep-dive research on Indian company "${query}" resolved to market symbol ${resolvedTicker} (${quote.name}) as of ${now.toISOString().slice(0, 10)}. ` +
    `Cover company fundamentals (financials, valuation, growth, risks), recent news & sentiment, brokerage rating changes, target-price changes, upgrades/downgrades, and the technical picture. ` +
    `Use the latest available information.\n\nComputed technicals: ${techBlock}`;

  const buildStructurePrompt = (research: string) =>
    `Structure the research into: fundamental, technical, and sentiment as arrays of 1-3 concise one-line bullet strings each. ` +
    `Technical bullets must incorporate the computed indicators. Sentiment bullets must include recent news, brokerage rating changes, target-price changes, upgrades/downgrades, or say when none were found. ` +
    `Also include a recommendation (buy/sell/hold with one-line reasoning and 0..1 confidence).\n\nResearch:\n${research}`;

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
