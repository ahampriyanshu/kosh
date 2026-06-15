import { pathToFileURL } from 'node:url';
import { istDateString } from '../lib/time';
import { writeSlice } from '../lib/feed/store';
import { fetchFlows } from '../lib/feed/flows';
import { FlowsSliceSchema } from '../lib/schemas';

export async function runFeedFlows(now: Date = new Date()): Promise<string> {
  const date = istDateString(now);
  const slice = await fetchFlows(now);
  await writeSlice(date, 'flows', slice, FlowsSliceSchema);
  console.log(`feed-flows: wrote flows for ${date}`);
  return date;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runFeedFlows().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
