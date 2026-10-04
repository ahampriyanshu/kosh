import { pathToFileURL } from 'node:url';
import { mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { istDateString } from '../lib/time';
import { buildSnapshot } from '../lib/feed/merge';
import { writeSnapshot, deleteFeed, writeSlice } from '../lib/feed/store';
import { fetchIndices } from '../lib/feed/indices';
import { fetchUniverse } from '../lib/feed/universe';
import { computeInternals } from '../lib/feed/internals';
import { fetchGlobal } from '../lib/feed/global';
import { fetchNews } from '../lib/feed/news';
import { fetchFlows } from '../lib/feed/flows';
import { buildDailyNarrative } from '../lib/reports-narrative';
import { writeReport, computeChecksum, findReportByRoute } from '../lib/storage';
import { sendReportEmail } from '../lib/email';
import { renderDailyEmail } from '../lib/email-templates';
import {
  DailyContentSchema, IndicesSliceSchema, UniverseSliceSchema, InternalsSliceSchema,
  GlobalSliceSchema, NewsSliceSchema, FlowsSliceSchema, type ReportEnvelope, type DailyContent
} from '../lib/schemas';
import { computeMoodSnapshot } from '../lib/sentiment';

function dataDir(): string {
  return process.env.KOSH_DATA_DIR || path.join(process.cwd(), 'data');
}

async function refreshMarketSlices(date: string, now: Date): Promise<void> {
  const [indices, universe, global, news, flows] = await Promise.all([
    fetchIndices(),
    fetchUniverse(),
    fetchGlobal().catch((err) => {
      console.warn('[daily] Could not fetch global slice:', err);
      return null;
    }),
    fetchNews(now).catch((err) => {
      console.warn('[daily] Could not fetch news slice:', err);
      return null;
    }),
    fetchFlows(now).catch((err) => {
      console.warn('[daily] Could not fetch flows slice:', err);
      return null;
    }),
  ]);
  const internals = computeInternals(universe.quotes);
  await writeSlice(date, 'indices', indices, IndicesSliceSchema);
  await writeSlice(date, 'universe', universe, UniverseSliceSchema);
  await writeSlice(date, 'internals', internals, InternalsSliceSchema);
  if (global) {
    await writeSlice(date, 'global', global, GlobalSliceSchema);
  }
  if (news) {
    await writeSlice(date, 'news', news, NewsSliceSchema);
  }
  if (flows) {
    await writeSlice(date, 'flows', flows, FlowsSliceSchema);
  }
}

export interface RunDailyOptions {
  sendEmail?: boolean;
  deleteFeedSlices?: boolean;
  skipRefresh?: boolean;
  dateOverride?: string;
  session?: 'morning' | 'closing';
}

export async function runDaily(now: Date = new Date(), options: RunDailyOptions = {}): Promise<void> {
  const date = options.dateOverride ?? istDateString(now);
  const nowIso = now.toISOString();

  if (!options.skipRefresh) {
    await refreshMarketSlices(date, now);
  }
  const snapshot = await buildSnapshot(date, '1d', nowIso);
  const session = options.session ?? 'morning';
  const mood = computeMoodSnapshot(snapshot, session);
  snapshot.sentiment = mood;
  await writeSnapshot(date, snapshot);

  const narrative = await buildDailyNarrative(snapshot);
  let existingRetro: DailyContent['retro'];
  try {
    const existing = await findReportByRoute('daily', date);
    if (existing?.content && typeof existing.content === 'object' && 'retro' in existing.content) {
      existingRetro = (existing.content as DailyContent).retro;
    }
  } catch {
    // ignore
  }

  const content = DailyContentSchema.parse({
    snapshot,
    outlook: narrative.outlook,
    keyTakeaways: narrative.keyTakeaways,
    ...(existingRetro ? { retro: existingRetro } : {}),
  });

  const shouldSendEmail = options.sendEmail ?? true;
  const shouldDeleteFeed = options.deleteFeedSlices ?? true;

  const base: Omit<ReportEnvelope, 'emailSent'> = {
    schemaVersion: 1,
    id: `daily-${date}`,
    type: 'daily',
    dateKey: date,
    generatedAt: nowIso,
    sourceData: { tickers: [], priceSnapshot: {}, searchTimestamp: nowIso },
    content,
    checksum: computeChecksum(content),
  };
  await writeReport({ ...base, emailSent: false });
  if (shouldSendEmail) {
    try {
      await sendReportEmail('Kosh Daily Brief', renderDailyEmail(content));
      await writeReport({ ...base, emailSent: true });
    } catch (e) {
      console.warn('[daily] Could not send email:', e);
    }
  } else {
    await writeReport({ ...base, emailSent: true });
  }

  // Append to analytical ledgers
  try {
    const quantLedger = path.join(dataDir(), 'ledger', 'quantitative');
    const qualLedger = path.join(dataDir(), 'ledger', 'qualitative');
    await mkdir(quantLedger, { recursive: true });
    await mkdir(qualLedger, { recursive: true });

    const sentimentLine = JSON.stringify({
      date,
      session,
      composite: mood.composite,
      regime: mood.regime,
      timestamp: nowIso,
    }) + '\n';
    await appendFile(path.join(quantLedger, 'sentiment_ledger.jsonl'), sentimentLine, 'utf-8');

    const narrativeLine = JSON.stringify({
      date,
      session,
      outlook: narrative.outlook,
      keyTakeaways: narrative.keyTakeaways,
      timestamp: nowIso,
    }) + '\n';
    await appendFile(path.join(qualLedger, 'daily_narratives.jsonl'), narrativeLine, 'utf-8');

    if (snapshot.streetRecommendations && snapshot.streetRecommendations.length > 0) {
      const streetLines = snapshot.streetRecommendations.map((rec) =>
        JSON.stringify({
          date,
          ticker: rec.ticker,
          name: rec.name,
          brokerage: rec.brokerage,
          action: rec.action,
          target: rec.target ?? null,
          rationale: rec.rationale ?? null,
          timestamp: nowIso,
        })
      ).join('\n') + '\n';
      await appendFile(path.join(qualLedger, 'street_recs.jsonl'), streetLines, 'utf-8');
    }

    if (snapshot.corporateActions && snapshot.corporateActions.length > 0) {
      const corpLines = snapshot.corporateActions.map((ca) =>
        JSON.stringify({
          date,
          ticker: ca.ticker,
          name: ca.name,
          type: ca.type,
          actionDate: ca.date,
          timestamp: nowIso,
        })
      ).join('\n') + '\n';
      await appendFile(path.join(quantLedger, 'corporate_actions.jsonl'), corpLines, 'utf-8');
    }

    if (snapshot.news && snapshot.news.length > 0) {
      const newsLines: string[] = [];
      for (const grp of snapshot.news) {
        for (const item of grp.items) {
          newsLines.push(JSON.stringify({
            date,
            category: grp.category,
            headline: item.headline,
            summary: item.summary,
            source: item.source,
            url: item.url ?? null,
            tickers: item.tickers ?? [],
            sentiment: item.sentiment,
            timestamp: nowIso,
          }));
        }
      }
      if (newsLines.length > 0) {
        await appendFile(path.join(qualLedger, 'market_news.jsonl'), newsLines.join('\n') + '\n', 'utf-8');
      }
    }
  } catch (err) {
    console.warn('[daily] Could not append to analytical ledgers:', err);
  }

  if (shouldDeleteFeed) {
    await deleteFeed(date); // clean up the feed slices after a successful publish
  }
  console.log(`Daily brief ${base.id} written.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dateArg = process.argv.slice(2).find((arg) => /^\d{4}-\d{2}-\d{2}$/.test(arg)) || process.env.DATE;
  const targetNow = dateArg ? new Date(`${dateArg}T08:15:00+05:30`) : new Date();
  const skipEmail = process.argv.includes('--no-email') || process.env.NO_EMAIL === 'true';
  runDaily(targetNow, { dateOverride: dateArg, sendEmail: !skipEmail }).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
