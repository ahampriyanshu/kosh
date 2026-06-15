import { it, vi, beforeEach, afterEach } from 'vitest';
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

