import { pathToFileURL } from 'node:url';
import { istDateString } from '../lib/time';
import { writeSlice } from '../lib/feed/store';
import { fetchGlobal } from '../lib/feed/global';
import { GlobalSliceSchema } from '../lib/schemas';

export async function runFeedGlobal(now: Date = new Date()): Promise<string> {
  const date = istDateString(now);
  const slice = await fetchGlobal();
  await writeSlice(date, 'global', slice, GlobalSliceSchema);
  console.log(`feed-global: wrote ${slice.globalIndices.length} global indices for ${date}`);
  return date;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runFeedGlobal().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
