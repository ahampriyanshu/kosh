import { getQuote, getHistorical } from './market-data';
import { rsi, macd, trend } from './indicators';
import { generateGroundedObject } from './llm';
import { ResearchContentSchema, type ResearchContent } from './schemas';
import { resolveYahooTicker } from './ticker-aliases';

export async function buildResearch(ticker: string, now: Date = new Date()): Promise<ResearchContent> {
  const resolvedTicker = resolveYahooTicker(ticker);
  const period1 = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const quote = await getQuote(resolvedTicker);
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

  const researchPrompt =
    `Deep-dive research on Indian stock ${resolvedTicker} (${quote.name}) as of ${now.toISOString().slice(0, 10)}. ` +
    `Cover company fundamentals (financials, valuation, growth, risks), recent news & sentiment, and the technical picture. ` +
    `Use the latest available information.\n\nComputed technicals: ${techBlock}`;

  const buildStructurePrompt = (research: string) =>
    `Structure the research into: fundamental (paragraph), technical (paragraph that incorporates the computed indicators), ` +
    `sentiment (paragraph), and a recommendation (buy/sell/hold with reasoning and 0..1 confidence).\n\nResearch:\n${research}`;

  const { object } = await generateGroundedObject(researchPrompt, buildStructurePrompt, ResearchContentSchema);
  return ResearchContentSchema.parse({
    ...object,
    ticker: resolvedTicker,
    name: quote.name,
    asOf: now.toISOString(),
    price: quote.price,
  });
}
