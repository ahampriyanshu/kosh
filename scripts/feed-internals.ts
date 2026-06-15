import { pathToFileURL } from 'node:url';
import { istDateString } from '../lib/time';
import { readSlice, writeSlice } from '../lib/feed/store';
import { computeInternals } from '../lib/feed/internals';
import { UniverseSliceSchema, InternalsSliceSchema } from '../lib/schemas';

export async function runFeedInternals(now: Date = new Date()): Promise<string> {
  const date = istDateString(now);
  const universe = await readSlice(date, 'universe', UniverseSliceSchema);
  if (!universe) throw new Error(`feed-internals: no universe slice for ${date} — run feed-universe first`);
  const slice = computeInternals(universe.quotes);
  await writeSlice(date, 'internals', slice, InternalsSliceSchema);
  console.log(`feed-internals: ranked ${universe.quotes.length} stocks for ${date}`);
  return date;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runFeedInternals().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
