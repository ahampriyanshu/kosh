import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

let dir: string;
beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), 'kosh-')); process.env.KOSH_DATA_DIR = dir; });
afterEach(async () => { delete process.env.KOSH_DATA_DIR; vi.restoreAllMocks(); vi.resetModules(); await rm(dir, { recursive: true, force: true }); });

it('runFeedIndices writes an indices slice', async () => {
  vi.doMock('../../lib/feed/indices', () => ({ fetchIndices: vi.fn(async () => ({ indianIndices: [{ name: 'NIFTY 50', symbol: '^NSEI', ltp: 1, changePct: 1 }], vix: null })) }));
  const { runFeedIndices } = await import('../../scripts/feed-indices');
  const date = await runFeedIndices(new Date('2026-06-15T02:00:00Z'));
  await access(path.join(dir, 'feed', date, 'indices.json'));
});

it('runMergeSnapshot assembles a snapshot and deletes the feed dir', async () => {
  const { writeSlice } = await import('../../lib/feed/store');
  const { IndicesSliceSchema } = await import('../../lib/schemas');
  await writeSlice('2026-06-15', 'indices', { indianIndices: [{ name: 'NIFTY 50', symbol: '^NSEI', ltp: 1, changePct: 1 }], vix: null }, IndicesSliceSchema);
  const { runMergeSnapshot } = await import('../../scripts/merge-snapshot');
  await runMergeSnapshot(new Date('2026-06-15T02:30:00Z'));
  await access(path.join(dir, 'snapshots', '2026', '06', '2026-06-15.json'));
  await expect(access(path.join(dir, 'feed', '2026-06-15'))).rejects.toBeTruthy();
});
