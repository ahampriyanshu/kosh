import { pathToFileURL } from 'node:url';
import { istDateString } from '../lib/time';
import { buildSnapshot } from '../lib/feed/merge';
import { writeSnapshot, deleteFeed, writeSlice } from '../lib/feed/store';
import { fetchIndices } from '../lib/feed/indices';
import { fetchUniverse } from '../lib/feed/universe';
import { computeInternals } from '../lib/feed/internals';
import { buildDailyNarrative } from '../lib/reports-narrative';
import { writeReport, computeChecksum } from '../lib/storage';
import { sendReportEmail } from '../lib/email';
import { renderDailyEmail } from '../lib/email-templates';
import { DailyContentSchema, IndicesSliceSchema, UniverseSliceSchema, InternalsSliceSchema, type ReportEnvelope } from '../lib/schemas';

async function refreshMarketSlices(date: string): Promise<void> {
  const [indices, universe] = await Promise.all([fetchIndices(), fetchUniverse()]);
  const internals = computeInternals(universe.quotes);
  await writeSlice(date, 'indices', indices, IndicesSliceSchema);
  await writeSlice(date, 'universe', universe, UniverseSliceSchema);
  await writeSlice(date, 'internals', internals, InternalsSliceSchema);
}

export async function runDaily(now: Date = new Date()): Promise<void> {
  const date = istDateString(now);
  await refreshMarketSlices(date);
  const snapshot = await buildSnapshot(date, '1d', now.toISOString());
  await writeSnapshot(date, snapshot);

  const narrative = await buildDailyNarrative(snapshot);
  const content = DailyContentSchema.parse({ snapshot, outlook: narrative.outlook, keyTakeaways: narrative.keyTakeaways });

  const base: Omit<ReportEnvelope, 'emailSent'> = {
    schemaVersion: 1,
    id: `daily-${date}`,
    type: 'daily',
    dateKey: date,
    generatedAt: now.toISOString(),
    sourceData: { tickers: [], priceSnapshot: {}, searchTimestamp: now.toISOString() },
    content,
    checksum: computeChecksum(content),
  };
  await writeReport({ ...base, emailSent: false });
  await sendReportEmail('Kosh Daily Brief', renderDailyEmail(content));
  await writeReport({ ...base, emailSent: true });
  await deleteFeed(date); // clean up the feed slices after a successful publish
  console.log(`Daily brief ${base.id} written and emailed.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runDaily().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
