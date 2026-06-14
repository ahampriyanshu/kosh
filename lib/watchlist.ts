import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { WatchlistSchema, type Watchlist } from './schemas';

function dataDir(): string {
  return process.env.KOSH_DATA_DIR || path.join(process.cwd(), 'data');
}

export async function getWatchlist(): Promise<Watchlist> {
  const raw = await readFile(path.join(dataDir(), 'watchlist.json'), 'utf8');
  return WatchlistSchema.parse(JSON.parse(raw));
}
