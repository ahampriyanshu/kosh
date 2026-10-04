import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { readPortfolio } from '../lib/portfolio';
import { getQuoteDetail, getHistorical } from '../lib/market-data';
import { sma } from '../lib/indicators';
import { generateGroundedObject } from '../lib/llm';
import { writeReport, computeChecksum, findReportByRoute, readReport } from '../lib/storage';
import { sendReportEmail } from '../lib/email';
import { renderRetroEmail } from '../lib/email-templates';
import { istDateString } from '../lib/time';
import { fetchIndices } from '../lib/feed/indices';
import { fetchUniverse } from '../lib/feed/universe';
import { computeInternals } from '../lib/feed/internals';
import { buildSnapshot } from '../lib/feed/merge';
import { writeSnapshot, writeSlice } from '../lib/feed/store';
import { computeMoodSnapshot } from '../lib/sentiment';
import {
  AlertSchema,
  RetroContentSchema,
  DailyContentSchema,
  IndicesSliceSchema,
  UniverseSliceSchema,
  InternalsSliceSchema,
  type RetroContent,
  type DailyContent,
  type MarketSnapshot,
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

function fallbackSnapshot(asOf: string): MarketSnapshot {
  return {
    asOf,
    window: '1d',
    indianIndices: [],
    giftNifty: null,
    globalIndices: [],
    commodities: [],
    currencies: [],
    bondYield: null,
    vix: null,
    breadth: null,
    topGainers: [],
    topLosers: [],
    mostActive: [],
    near52wHigh: [],
    near52wLow: [],
    volumeShockers: [],
    sectorRanking: [],
    fiiDii: null,
    news: [],
    streetRecommendations: [],
    corporateActions: [],
    derivatives: null,
  };
}

async function refreshMarketClosingSlices(date: string, nowIso: string): Promise<MarketSnapshot | null> {
  try {
    const [indices, universe] = await Promise.all([fetchIndices(), fetchUniverse()]);
    const internals = computeInternals(universe.quotes);
    await writeSlice(date, 'indices', indices, IndicesSliceSchema);
    await writeSlice(date, 'universe', universe, UniverseSliceSchema);
    await writeSlice(date, 'internals', internals, InternalsSliceSchema);
    const snapshot = await buildSnapshot(date, '1d', nowIso);
    const mood = computeMoodSnapshot(snapshot, 'closing');
    snapshot.sentiment = mood;
    await writeSnapshot(date, snapshot);
    console.log(`Updated official closing snapshot and mood index for ${date} (${mood.composite}/100 · ${mood.regime}).`);
    return snapshot;
  } catch (err) {
    console.warn(`Could not refresh closing snapshot for ${date}:`, err);
    return null;
  }
}

export async function runRetro(now: Date = new Date(), options: { sendEmail?: boolean } = {}): Promise<void> {
  const date = istDateString(now);
  const nowIso = now.toISOString();
  const period1 = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Refresh the day's official closing snapshot so website and analytics reflect today's close
  const closingSnapshot = await refreshMarketClosingSlices(date, nowIso);

  const portfolio = await readPortfolio();
  const holdings = portfolio.holdings;

  const evaluated: RetroContent['evaluated'] = [];
  const flags: Flag[] = [];
  const priceSnapshot: Record<string, number> = {};

  for (const holding of holdings) {
    const q = await getQuoteDetail(holding.ticker);
    const candles = await getHistorical(holding.ticker, period1);
    const closes = candles.map((c) => c.close);
    const volumes = candles.map((c) => c.volume);
    priceSnapshot[holding.ticker] = q.price;

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
      ticker: holding.ticker,
      name: holding.name,
      price: q.price,
      changePct: Number(changePct.toFixed(2)),
      note: `${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}% vs prev close, vol ${volRatio.toFixed(1)}x avg${rules.length ? ` — flags: ${rules.join(', ')}` : ''}`,
    });
    if (rules.length) {
      flags.push({ ticker: holding.ticker, name: holding.name, price: q.price, changePct, volRatio, rules });
    }
  }

  let alerts: RetroContent['alerts'] = [];
  let summary = 'No unusual closing session activity across portfolio holdings.';

  if (flags.length) {
    const flagBlock = flags
      .map((f) => `${f.ticker} (${f.name}): ${f.changePct.toFixed(1)}% vs prev close, vol ${f.volRatio.toFixed(1)}x avg, rules: ${f.rules.join(', ')}`)
      .join('\n');
    const researchPrompt =
      `Indian equity market closing session today (${date}). The market has closed for the day. ` +
      `These portfolio holdings tripped end-of-day alert rules:\n\n${flagBlock}\n\n` +
      `Using current market news, evaluate why these stocks moved, judge which represent genuine SELL/RISK signals vs. noise (market-wide pullback, ex-dividend, known event), and assess carry-over risk for tomorrow.`;
    const buildStructurePrompt = (research: string) =>
      `Return "alerts": only tickers that are genuine sell signals, each with ticker, name, reason, severity (high/medium/low), and triggeredRules (chosen from the rules listed for that ticker). ` +
      `Also a one-line "summary".\n\nResearch:\n${research}`;
    const { object } = await generateGroundedObject(researchPrompt, buildStructurePrompt, JudgmentSchema);
    const flagged = new Set(flags.map((f) => f.ticker));
    alerts = object.alerts.filter((a) => flagged.has(a.ticker));
    summary = object.summary;
  }

  const retroContent = RetroContentSchema.parse({ date, evaluated, alerts, summary });

  // Read existing morning daily report to preserve outlook and morning cues
  let existingDaily: ReportEnvelope | null = null;
  try {
    existingDaily = await findReportByRoute('daily', date);
  } catch {
    existingDaily = null;
  }
  if (!existingDaily) {
    try {
      existingDaily = await readReport(`daily-${date}`);
    } catch {
      existingDaily = null;
    }
  }

  const existingContent = (existingDaily?.content as Partial<DailyContent>) ?? {};
  let snapshot = closingSnapshot;
  if (!snapshot) {
    if (existingContent.snapshot) {
      snapshot = existingContent.snapshot;
    } else {
      try {
        snapshot = await buildSnapshot(date, '1d', nowIso);
      } catch {
        snapshot = fallbackSnapshot(nowIso);
      }
    }
  }

  const dailyContent = DailyContentSchema.parse({
    snapshot,
    outlook: existingContent.outlook ?? `Market session concluded on ${date}. Portfolio surveillance and risk screening complete.`,
    keyTakeaways: existingContent.keyTakeaways ?? [],
    retro: retroContent,
  });

  const base: Omit<ReportEnvelope, 'emailSent'> = {
    schemaVersion: 1,
    id: `daily-${date}`,
    dateKey: date,
    type: 'daily',
    generatedAt: nowIso,
    sourceData: {
      tickers: Array.from(new Set([...(existingDaily?.sourceData?.tickers ?? []), ...holdings.map((s) => s.ticker)])),
      priceSnapshot: {
        ...(existingDaily?.sourceData?.priceSnapshot ?? {}),
        ...priceSnapshot,
      },
      searchTimestamp: nowIso,
    },
    content: dailyContent,
    checksum: computeChecksum(dailyContent),
  };

  const shouldSendEmail = options.sendEmail ?? true;
  await writeReport({ ...base, emailSent: false });
  if (shouldSendEmail) {
    try {
      await sendReportEmail('Kosh Market Close & Daily Retro', renderRetroEmail(retroContent));
      await writeReport({ ...base, emailSent: true });
    } catch (e) {
      console.warn('[retro] Could not send email:', e);
    }
  } else {
    await writeReport({ ...base, emailSent: true });
  }

  // Append alerts to analytical ledger
  if (alerts.length > 0) {
    try {
      const fs = await import('node:fs/promises');
      const p = await import('node:path');
      const dataDir = process.env.KOSH_DATA_DIR || p.join(process.cwd(), 'data');
      const qualDir = p.join(dataDir, 'ledger', 'qualitative');
      await fs.mkdir(qualDir, { recursive: true });
      for (const alert of alerts) {
        const line = JSON.stringify({ date, ...alert, timestamp: now.toISOString() }) + '\n';
        await fs.appendFile(p.join(qualDir, 'portfolio_alerts.jsonl'), line, 'utf-8');
      }
    } catch (err) {
      console.warn('[retro] Could not append to portfolio_alerts.jsonl:', err);
    }
  }

  console.log(`Updated daily report ${base.id} with market close & retro surveillance (${alerts.length} alerts).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dateArg = process.argv.slice(2).find((arg) => /^\d{4}-\d{2}-\d{2}$/.test(arg)) || process.env.DATE;
  const targetNow = dateArg ? new Date(`${dateArg}T16:15:00+05:30`) : new Date();
  const skipEmail = process.argv.includes('--no-email') || process.env.NO_EMAIL === 'true';
  runRetro(targetNow, { sendEmail: !skipEmail })
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
