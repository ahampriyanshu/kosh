import { pathToFileURL } from 'node:url';
import { istDateString } from '../lib/time';
import { writeSlice } from '../lib/feed/store';
import { fetchUniverse } from '../lib/feed/universe';
import { UniverseSliceSchema } from '../lib/schemas';

export async function runFeedUniverse(now: Date = new Date()): Promise<string> {
  const date = istDateString(now);
  const slice = await fetchUniverse();
  await writeSlice(date, 'universe', slice, UniverseSliceSchema);
  console.log(`feed-universe: wrote ${slice.quotes.length} quotes for ${date}`);
  return date;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runFeedUniverse().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
