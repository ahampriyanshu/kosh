import { pathToFileURL } from 'node:url';
import { istDateString } from '../lib/time';
import { writeSlice } from '../lib/feed/store';
import { fetchIndices } from '../lib/feed/indices';
import { IndicesSliceSchema } from '../lib/schemas';

export async function runFeedIndices(now: Date = new Date()): Promise<string> {
  const date = istDateString(now);
  const slice = await fetchIndices();
  await writeSlice(date, 'indices', slice, IndicesSliceSchema);
  console.log(`feed-indices: wrote ${slice.indianIndices.length} indices for ${date}`);
  return date;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runFeedIndices().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
