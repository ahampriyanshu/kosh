import { getQuoteDetail, getHistorical, searchTicker } from './market-data';
import { rsi, macd, trend } from './indicators';
import { generateGroundedObject } from './llm';
import { ResearchContentSchema, ResearchGeneratedContentSchema, type ResearchContent } from './schemas';
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

function format52WeekRange(high: number | null, low: number | null): string {
  if (high == null || low == null) return 'n/a';
  return `${formatPrice(low)} - ${formatPrice(high)}`;
}

function extractFallbackTargets(...texts: string[]): Array<{ source: string; target: string; duration: string; view: string }> {
  const text = texts.filter(Boolean).join(' ');
  if (!text || /\bno\s+(?:major\s+)?(?:institutional\s+)?(?:brokerage\s+)?(?:rating\s+changes?\s+or\s+)?target\b/i.test(text)) {
    return [];
  }

  const targetMatch = text.match(/\b(?:average\s+)?(?:target(?:\s+price)?|price\s+target)\s+(?:of|at|to|is|around)?\s*(?:Rs\.?|INR|₹)?\s*([0-9][0-9,]*[0-9](?:\.\d+)?|[0-9](?:\.\d+)?)/i);
  if (!targetMatch) return [];

  const durationMatch = text.match(/\b(12[-\s]?month|one[-\s]?year|[0-9]+\s*(?:months?|years?))\b/i);
  const upsideMatch = text.match(/([+-]?\d+(?:\.\d+)?)\s*%\s*(upside|downside)/i);
  const sourceMatch = text.match(/\b(Jefferies|Morgan Stanley|Goldman Sachs|Nomura|CLSA|Citi|HSBC|Motilal Oswal|ICICI Securities|HDFC Securities|Kotak|Nuvama|Axis Securities|Brokerage consensus|Consensus)\b/i);

  const percentage = upsideMatch ? `${upsideMatch[2].toLowerCase() === 'downside' ? '-' : '+'}${upsideMatch[1].replace(/^[+-]/, '')}%` : 'Not specified';

  return [{
    source: sourceMatch?.[1] ?? 'Brokerage consensus',
    target: `Rs ${targetMatch[1]}`,
    duration: durationMatch?.[1].replace(/-/g, ' ') ?? 'Not specified',
    view: percentage,
  }];
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
    { label: '52W Range', value: format52WeekRange(quote.high52w, quote.low52w) },
    { label: 'Trend', value: trend(closes) },
    { label: 'RSI', value: lastRsi == null ? 'n/a' : lastRsi.toFixed(1) },
    { label: 'P/E', value: quote.trailingPE == null ? 'n/a' : quote.trailingPE.toFixed(2) },
    {
      label: 'MACD',
      value: formatMacd(lastMacd),
    },
  ];

  const researchPrompt =
    `Deep-dive research on Indian company "${query}" resolved to market symbol ${resolvedTicker} (${quote.name}) as of ${now.toISOString().slice(0, 10)}. ` +
    `Cover company fundamentals (financials, valuation, growth, risks), recent news & sentiment, brokerage rating changes, target-price changes, upgrades/downgrades, and the technical picture. ` +
    `Use the latest available information.\n\nComputed technicals: ${techBlock}`;

  const buildStructurePrompt = (research: string) =>
    `Structure the research into this fixed schema only: ` +
    `"fundamentals": { "growth", "valuation" }; ` +
    `"technicals": { "trend", "momentum", "levels" }; ` +
    `"sentiment": { "news", "brokerage" }; ` +
    `"entryExit": { "fundamental", "technicalSentiment" }; ` +
    `"targets": [{ "source", "target", "duration", "view" }]; ` +
    `and "recommendation": { "action": "buy"|"sell"|"hold", "reasoning" }. ` +
    `Every value must be one concise line. Technical fields must incorporate the computed indicators. Brokerage must mention rating/target changes or say none were found. ` +
    `Entry/exit must clearly say whether the setup supports entry, exit, or wait based on fundamentals and based on technical/sentiment analysis. ` +
    `Targets must list respected sources, target/upside or downside, and duration when available; use an empty array if no credible sourced targets were found.\n\nResearch:\n${research}`;

  const { object } = await generateGroundedObject(researchPrompt, buildStructurePrompt, ResearchGeneratedContentSchema);
  const generatedTargets = object.targets ?? [];
  const targets = generatedTargets.length > 0
    ? generatedTargets
    : extractFallbackTargets(object.sentiment.brokerage, object.recommendation.reasoning);
  return ResearchContentSchema.parse({
    ...object,
    targets,
    ticker: resolvedTicker,
    name: quote.name,
    asOf: now.toISOString(),
    price: quote.price,
    metrics,
  });
}
