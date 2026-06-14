import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { getWatchlist } from '../../lib/watchlist';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'kosh-wl-'));
  process.env.KOSH_DATA_DIR = dir;
});
afterEach(async () => {
  delete process.env.KOSH_DATA_DIR;
  await rm(dir, { recursive: true, force: true });
});

describe('getWatchlist', () => {
  it('reads and validates watchlist.json', async () => {
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, 'watchlist.json'),
      JSON.stringify({ stocks: [{ ticker: 'TCS.NS', name: 'TCS' }] }),
      'utf8',
    );
    const wl = await getWatchlist();
    expect(wl.stocks[0].ticker).toBe('TCS.NS');
  });

  it('throws on malformed watchlist', async () => {
    await writeFile(path.join(dir, 'watchlist.json'), JSON.stringify({ nope: true }), 'utf8');
    await expect(getWatchlist()).rejects.toThrow();
  });
});
