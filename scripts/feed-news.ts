import { pathToFileURL } from 'node:url';
import { istDateString } from '../lib/time';
import { writeSlice } from '../lib/feed/store';
import { fetchNews } from '../lib/feed/news';
import { NewsSliceSchema } from '../lib/schemas';

export async function runFeedNews(now: Date = new Date()): Promise<string> {
  const date = istDateString(now);
  const slice = await fetchNews(now);
  await writeSlice(date, 'news', slice, NewsSliceSchema);
  console.log(`feed-news: wrote ${slice.news.length} news groups for ${date}`);
  return date;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runFeedNews().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
