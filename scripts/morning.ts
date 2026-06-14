import { pathToFileURL } from 'node:url';
import { getWatchlist } from '../lib/watchlist';
import { getQuote, getHistorical } from '../lib/market-data';
import { rsi, trend } from '../lib/indicators';
import { generateGroundedObject } from '../lib/llm';
import { writeReport, computeChecksum } from '../lib/storage';
import { sendReportEmail } from '../lib/email';
import { renderMorningEmail } from '../lib/email-templates';
import { istDateString } from '../lib/time';
import { MorningContentSchema, type ReportEnvelope } from '../lib/schemas';

interface TechSummary {
  ticker: string;
  name: string;
  price: number;
  rsi: number | null;
  trend: string;
}

export async function runMorning(now: Date = new Date()): Promise<void> {
  const date = istDateString(now);
  // ~6 months of daily candles — enough for the 50-day trend SMA — relative to the run date.
  const period1 = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const watchlist = await getWatchlist();

  const summaries: TechSummary[] = [];
  const priceSnapshot: Record<string, number> = {};
  for (const stock of watchlist.stocks) {
    const quote = await getQuote(stock.ticker);
    const candles = await getHistorical(stock.ticker, period1);
    const closes = candles.map((c) => c.close);
    const rsiSeries = rsi(closes);
    priceSnapshot[stock.ticker] = quote.price;
    summaries.push({
      ticker: stock.ticker,
      name: stock.name,
      price: quote.price,
      rsi: rsiSeries.length ? rsiSeries[rsiSeries.length - 1] : null,
      trend: trend(closes),
    });
  }

  const techBlock = summaries
    .map((s) => `${s.ticker} (${s.name}): price ${s.price}, RSI ${s.rsi?.toFixed(1) ?? 'n/a'}, trend ${s.trend}`)
    .join('\n');

  const researchPrompt =
    `You are an equity analyst covering the Indian market (NSE/BSE). ` +
    `Using the latest news and market context, summarize what matters for these watchlist stocks ` +
    `before the Indian market opens today (${date}). Include overnight global cues, sector themes, ` +
    `and FII/DII flows.\n\nWatchlist technical snapshot:\n${techBlock}`;

  const buildStructurePrompt = (research: string) =>
    `Turn the following research into a structured morning brief for ${date}. ` +
    `Pick at most 5 stocks to watch from the watchlist, any exit signals, one buy recommendation ` +
    `with a 0..1 confidence, sector movers, and an FII/DII sentiment line.\n\nResearch:\n${research}`;

  const searchTimestamp = now.toISOString();
  const { object } = await generateGroundedObject(researchPrompt, buildStructurePrompt, MorningContentSchema);

  // Validate on write (content), independent of the LLM layer.
  const content = MorningContentSchema.parse(object);

  const base: Omit<ReportEnvelope, 'emailSent'> = {
    schemaVersion: 1,
    id: `${date}-morning`,
    type: 'morning',
    generatedAt: now.toISOString(),
    sourceData: {
      tickers: watchlist.stocks.map((s) => s.ticker),
      priceSnapshot,
      searchTimestamp,
    },
    content,
    checksum: computeChecksum(content),
  };

  // 1) persist first (emailSent: false)
  await writeReport({ ...base, emailSent: false });

  // 2) email after the report is saved
  await sendReportEmail(`Kosh Morning Brief — ${date}`, renderMorningEmail(content));

  // 3) record that the email was sent
  await writeReport({ ...base, emailSent: true });

  console.log(`Morning brief ${base.id} written and emailed.`);
}

// Auto-run only when executed directly (tsx scripts/morning.ts), not when imported by tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMorning()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
