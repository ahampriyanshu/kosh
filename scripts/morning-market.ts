import { pathToFileURL } from 'node:url';
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { istDateString } from '../lib/time';
import { fetchGlobal } from '../lib/feed/global';
import { fetchIndices } from '../lib/feed/indices';
import { writeSlice } from '../lib/feed/store';
import { IndicesSliceSchema, GlobalSliceSchema } from '../lib/schemas';

function dataDir(): string {
  return process.env.KOSH_DATA_DIR || path.join(process.cwd(), 'data');
}

export interface MorningCues {
  date: string;
  timestamp: string;
  indianOpeningRef: Array<{ name: string; symbol: string; ltp: number; changePct: number }>;
  vix: { value: number; changePct: number } | null;
  globalIndices: Array<{ name: string; symbol: string; ltp: number; changePct: number }>;
  commodities: Array<{ name: string; value: number; changePct: number }>;
  currencies: Array<{ pair: string; value: number; changePct: number }>;
}

export async function runMorningMarket(now: Date = new Date()): Promise<MorningCues> {
  const date = istDateString(now);
  const nowIso = now.toISOString();

  console.log(`[morning-market] Fetching global cues and opening indices for ${date}...`);
  const [globalData, indicesData] = await Promise.all([
    fetchGlobal(),
    fetchIndices(),
  ]);

  // Persist operational slices for feed reconciliation
  await writeSlice(date, 'indices', indicesData, IndicesSliceSchema);
  await writeSlice(date, 'global', globalData, GlobalSliceSchema);

  const cues: MorningCues = {
    date,
    timestamp: nowIso,
    indianOpeningRef: indicesData.indianIndices,
    vix: indicesData.vix,
    globalIndices: globalData.globalIndices,
    commodities: globalData.commodities,
    currencies: globalData.currencies,
  };

  // Write staging file for morning brief
  const stagingDir = path.join(dataDir(), 'staging');
  await mkdir(stagingDir, { recursive: true });
  await writeFile(path.join(stagingDir, 'morning_cues.json'), JSON.stringify(cues, null, 2), 'utf-8');

  // Append overnight macro metrics to analytical ledger
  const ledgerDir = path.join(dataDir(), 'ledger', 'quantitative');
  await mkdir(ledgerDir, { recursive: true });
  const ledgerLine = JSON.stringify({
    date,
    timestamp: nowIso,
    giftNiftyLtp: cues.globalIndices.find((i) => i.name.toLowerCase().includes('nifty'))?.ltp ?? null,
    goldLtp: cues.commodities.find((c) => c.name.toLowerCase().includes('gold'))?.value ?? null,
    crudeLtp: cues.commodities.find((c) => c.name.toLowerCase().includes('crude'))?.value ?? null,
    usdInrLtp: cues.currencies.find((c) => c.pair.includes('USD'))?.value ?? null,
    vixLtp: cues.vix?.value ?? null,
  }) + '\n';
  await appendFile(path.join(ledgerDir, 'global_cues.jsonl'), ledgerLine, 'utf-8');

  console.log(`[morning-market] Successfully staged morning cues and appended to global_cues.jsonl for ${date}.`);
  return cues;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMorningMarket().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
