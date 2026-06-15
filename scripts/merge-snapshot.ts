import { pathToFileURL } from 'node:url';
import { istDateString } from '../lib/time';
import { buildSnapshot } from '../lib/feed/merge';
import { writeSnapshot, deleteFeed } from '../lib/feed/store';

export async function runMergeSnapshot(now: Date = new Date()): Promise<string> {
  const date = istDateString(now);
  const snapshot = await buildSnapshot(date, '1d', now.toISOString());
  await writeSnapshot(date, snapshot);
  await deleteFeed(date);
  console.log(`merge-snapshot: wrote snapshot for ${date} and cleared feed slices`);
  return date;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMergeSnapshot().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
