import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readdir, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { writeSlice, readSlice, writeSnapshot, readSnapshot, deleteFeed } from '../../../lib/feed/store';
import { IndicesSliceSchema, MarketSnapshotSchema } from '../../../lib/schemas';

let dir: string;
beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), 'kosh-')); process.env.KOSH_DATA_DIR = dir; });
afterEach(async () => { delete process.env.KOSH_DATA_DIR; await rm(dir, { recursive: true, force: true }); });

const slice = { indianIndices: [{ name: 'NIFTY 50', symbol: '^NSEI', ltp: 23622.9, changePct: 1.99 }], vix: null };

describe('feed store', () => {
  it('writes and reads a validated slice', async () => {
    await writeSlice('2026-06-15', 'indices', slice, IndicesSliceSchema);
    const back = await readSlice('2026-06-15', 'indices', IndicesSliceSchema);
    expect(back?.indianIndices[0].symbol).toBe('^NSEI');
  });
  it('readSlice returns null when the slice is absent', async () => {
    expect(await readSlice('2026-06-15', 'global', IndicesSliceSchema)).toBeNull();
  });
  it('writes a snapshot under year/month and reads it back', async () => {
    const snap = MarketSnapshotSchema.parse({
      asOf: '2026-06-15T02:30:00.000Z', window: '1d',
      indianIndices: [], globalIndices: [], commodities: [], currencies: [],
      topGainers: [], topLosers: [], mostActive: [], near52wHigh: [], near52wLow: [],
      volumeShockers: [], sectorRanking: [], news: [], streetRecommendations: [], corporateActions: [],
      giftNifty: null, bondYield: null, vix: null, breadth: null, fiiDii: null,
    });
    await writeSnapshot('2026-06-15', snap);
    const back = await readSnapshot('2026-06-15');
    expect(back?.asOf).toBe('2026-06-15T02:30:00.000Z');
    await access(path.join(dir, 'snapshots', '2026', '06', '2026-06-15.json'));
  });
  it('deleteFeed removes the whole feed/<date> directory', async () => {
    await writeSlice('2026-06-15', 'indices', slice, IndicesSliceSchema);
    await deleteFeed('2026-06-15');
    const entries = await readdir(path.join(dir, 'feed')).catch(() => []);
    expect(entries).not.toContain('2026-06-15');
  });
});
