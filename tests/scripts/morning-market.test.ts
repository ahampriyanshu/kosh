import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runMorningMarket } from '../../scripts/morning-market';

const mockGlobal = {
  globalIndices: [{ name: 'Dow Jones', symbol: '^DJI', ltp: 42000, changePct: 0.5 }],
  commodities: [{ name: 'Gold', value: 75000, changePct: 0.2 }],
  currencies: [{ pair: 'USD/INR', value: 83.9, changePct: 0.05 }],
};

const mockIndices = {
  indianIndices: [{ name: 'NIFTY 50', symbol: '^NSEI', ltp: 25000, changePct: 0.3 }],
  vix: { value: 14.2, changePct: -1.5 },
};

vi.mock('../../lib/feed/global', () => ({
  fetchGlobal: vi.fn(async () => mockGlobal),
}));

vi.mock('../../lib/feed/indices', () => ({
  fetchIndices: vi.fn(async () => mockIndices),
}));

vi.mock('../../lib/feed/store', () => ({
  writeSlice: vi.fn(async () => undefined),
}));

describe('runMorningMarket', () => {
  let dir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    dir = await mkdtemp(path.join(tmpdir(), 'kosh-test-'));
    process.env.KOSH_DATA_DIR = dir;
  });

  afterEach(async () => {
    delete process.env.KOSH_DATA_DIR;
    await rm(dir, { recursive: true, force: true });
  });

  it('fetches global cues and Indian opening indices and returns MorningCues', async () => {
    const testDate = new Date('2026-10-05T02:30:00Z');
    const cues = await runMorningMarket(testDate);

    expect(cues.date).toBe('2026-10-05');
    expect(cues.globalIndices.length).toBe(1);
    expect(cues.indianOpeningRef.length).toBe(1);
    expect(cues.commodities.length).toBe(1);
    expect(cues.currencies.length).toBe(1);
    expect(cues.vix?.value).toBe(14.2);
  });
});
