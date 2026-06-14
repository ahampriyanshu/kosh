import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { getWatchlist } from '../lib/watchlist';
import { getQuoteDetail, getHistorical } from '../lib/market-data';
import { sma } from '../lib/indicators';
import { generateGroundedObject } from '../lib/llm';
import { writeReport, computeChecksum } from '../lib/storage';
import { sendReportEmail } from '../lib/email';
import { renderMidSessionEmail } from '../lib/email-templates';
import { istDateString } from '../lib/time';
import {
  AlertSchema,
  MidSessionContentSchema,
  type MidSessionContent,
  type ReportEnvelope,
} from '../lib/schemas';

const JudgmentSchema = z.object({
  alerts: z.array(AlertSchema),
  summary: z.string(),
});

interface Flag {
  ticker: string;
  name: string;
  price: number;
  changePct: number;
  volRatio: number;
  rules: string[];
}

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

export async function runMidSession(now: Date = new Date()): Promise<void> {
  const date = istDateString(now);
  const period1 = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const watchlist = await getWatchlist();

  const evaluated: MidSessionContent['evaluated'] = [];
  const flags: Flag[] = [];
  const priceSnapshot: Record<string, number> = {};

  for (const stock of watchlist.stocks) {
    const q = await getQuoteDetail(stock.ticker);
    const candles = await getHistorical(stock.ticker, period1);
    const closes = candles.map((c) => c.close);
    const volumes = candles.map((c) => c.volume);
    priceSnapshot[stock.ticker] = q.price;

    const changePct = q.previousClose ? ((q.price - q.previousClose) / q.previousClose) * 100 : 0;
    const avgVol = avg(volumes.slice(-20));
    const volRatio = avgVol ? q.volume / avgVol : 0;
    const sma50 = sma(closes, 50);
    const lastSma = sma50.length ? sma50[sma50.length - 1] : 0;

    const rules: string[] = [];
    if (changePct <= -3) rules.push('drawdown>3%');
    if (volRatio >= 2) rules.push('volume>2x avg');
    if (lastSma && q.price < lastSma * 0.98) rules.push('below 50DMA support');

    evaluated.push({
      ticker: stock.ticker,
      name: stock.name,
      price: q.price,
      changePct: Number(changePct.toFixed(2)),
      note: `${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}% vs prev close, vol ${volRatio.toFixed(1)}x avg${rules.length ? ` — flags: ${rules.join(', ')}` : ''}`,
    });
    if (rules.length) {
      flags.push({ ticker: stock.ticker, name: stock.name, price: q.price, changePct, volRatio, rules });
    }
  }

  let alerts: MidSessionContent['alerts'] = [];
  let summary = 'No unusual intraday activity across the watchlist.';

  if (flags.length) {
    const flagBlock = flags
      .map((f) => `${f.ticker} (${f.name}): ${f.changePct.toFixed(1)}% vs prev close, vol ${f.volRatio.toFixed(1)}x avg, rules: ${f.rules.join(', ')}`)
      .join('\n');
    const researchPrompt =
      `Indian market mid-session today (${date}). These watchlist stocks tripped deterministic alert rules. ` +
      `Using current news, judge which are genuine SELL signals vs. noise (index-wide move, ex-dividend, known event).\n\n${flagBlock}`;
    const buildStructurePrompt = (research: string) =>
      `Return "alerts": only tickers that are genuine sell signals, each with ticker, name, reason, severity (high/medium/low), and triggeredRules (chosen from the rules listed for that ticker). ` +
      `Also a one-line "summary".\n\nResearch:\n${research}`;
    const { object } = await generateGroundedObject(researchPrompt, buildStructurePrompt, JudgmentSchema);
    const flagged = new Set(flags.map((f) => f.ticker));
    alerts = object.alerts.filter((a) => flagged.has(a.ticker));
    summary = object.summary;
  }

  const content = MidSessionContentSchema.parse({ date, evaluated, alerts, summary });

  const base: Omit<ReportEnvelope, 'emailSent'> = {
    schemaVersion: 1,
    id: `midsession-${date}`,
    dateKey: date,
    type: 'midsession',
    generatedAt: now.toISOString(),
    sourceData: {
      tickers: watchlist.stocks.map((s) => s.ticker),
      priceSnapshot,
      searchTimestamp: now.toISOString(),
    },
    content,
    checksum: computeChecksum(content),
  };

  await writeReport({ ...base, emailSent: false });
  await sendReportEmail(
    `Kosh Mid-Session — ${date}${alerts.length ? ` — ${alerts.length} sell alert${alerts.length > 1 ? 's' : ''}` : ''}`,
    renderMidSessionEmail(content),
  );
  await writeReport({ ...base, emailSent: true });
  console.log(`Mid-session ${base.id} written and emailed (${alerts.length} alerts).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMidSession()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
