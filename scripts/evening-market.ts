import { pathToFileURL } from 'node:url';
import { mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { istDateString } from '../lib/time';
import { fetchIndices } from '../lib/feed/indices';
import { fetchUniverse } from '../lib/feed/universe';
import { computeInternals } from '../lib/feed/internals';
import { buildSnapshot } from '../lib/feed/merge';
import { writeSnapshot, writeSlice } from '../lib/feed/store';
import { computeMoodSnapshot } from '../lib/sentiment';
import {
  IndicesSliceSchema,
  UniverseSliceSchema,
  InternalsSliceSchema,
  type MarketSnapshot,
} from '../lib/schemas';

function dataDir(): string {
  return process.env.KOSH_DATA_DIR || path.join(process.cwd(), 'data');
}

export async function runEveningMarket(now: Date = new Date()): Promise<MarketSnapshot> {
  const date = istDateString(now);
  const nowIso = now.toISOString();

  console.log(`[evening-market] Fetching official NSE close and Nifty 500 internals for ${date}...`);
  const [indices, universe] = await Promise.all([
    fetchIndices(),
    fetchUniverse(),
  ]);

  const internals = computeInternals(universe.quotes);

  await writeSlice(date, 'indices', indices, IndicesSliceSchema);
  await writeSlice(date, 'universe', universe, UniverseSliceSchema);
  await writeSlice(date, 'internals', internals, InternalsSliceSchema);

  const snapshot = await buildSnapshot(date, '1d', nowIso);
  const closingMood = computeMoodSnapshot(snapshot, 'closing');
  snapshot.sentiment = closingMood;

  await writeSnapshot(date, snapshot);
  console.log(`[evening-market] Persisted official closing snapshot for ${date} (Mood: ${closingMood.composite}/100 · ${closingMood.regime}).`);

  // Append closing breadth & sector rotation to analytical ledgers
  const ledgerDir = path.join(dataDir(), 'ledger', 'quantitative');
  await mkdir(ledgerDir, { recursive: true });

  if (internals.breadth) {
    const breadthLine = JSON.stringify({
      date,
      timestamp: nowIso,
      advances: internals.breadth.advances,
      declines: internals.breadth.declines,
      unchanged: internals.breadth.unchanged,
      adRatio: internals.breadth.adRatio,
      near52wHighCount: internals.near52wHigh.length,
      near52wLowCount: internals.near52wLow.length,
    }) + '\n';
    await appendFile(path.join(ledgerDir, 'market_breadth.jsonl'), breadthLine, 'utf-8');
  }

  if (internals.sectorRanking.length > 0) {
    const sectorLine = JSON.stringify({
      date,
      timestamp: nowIso,
      rankings: internals.sectorRanking,
    }) + '\n';
    await appendFile(path.join(ledgerDir, 'sector_rotation.jsonl'), sectorLine, 'utf-8');
  }

  console.log(`[evening-market] Appended breadth and sector rotation metrics to analytical ledgers for ${date}.`);
  return snapshot;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runEveningMarket().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
