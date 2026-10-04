import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runEveningMarket } from '../../scripts/evening-market';

const mockIndices = {
  indianIndices: [{ name: 'NIFTY 50', symbol: '^NSEI', ltp: 25100, changePct: 0.4 }],
  vix: { value: 13.8, changePct: -2.1 },
};

const mockUniverse = {
  quotes: [
    { ticker: 'RELIANCE.NS', name: 'Reliance', sector: 'Energy', ltp: 3000, changePct: 1.5, volume: 1000000, avgVolume: 500000, high52w: 3100, low52w: 2200 },
    { ticker: 'TCS.NS', name: 'TCS', sector: 'IT', ltp: 4200, changePct: -0.8, volume: 800000, avgVolume: 600000, high52w: 4500, low52w: 3400 },
  ],
};

const mockSnapshot = {
  asOf: '2026-10-05T10:15:00Z',
  window: '1d',
  indianIndices: mockIndices.indianIndices,
  globalIndices: [],
  commodities: [],
  currencies: [],
  topGainers: [],
  topLosers: [],
  mostActive: [],
  near52wHigh: [],
  near52wLow: [],
  volumeShockers: [],
  sectorRanking: [{ sector: 'Energy', changePct: 1.5 }, { sector: 'IT', changePct: -0.8 }],
  news: [],
  streetRecommendations: [],
  corporateActions: [],
  giftNifty: null,
  bondYield: null,
  vix: mockIndices.vix,
  breadth: { advances: 1, declines: 1, unchanged: 0, adRatio: 1 },
  fiiDii: null,
};

vi.mock('../../lib/feed/indices', () => ({
  fetchIndices: vi.fn(async () => mockIndices),
}));

vi.mock('../../lib/feed/universe', () => ({
  fetchUniverse: vi.fn(async () => mockUniverse),
}));

vi.mock('../../lib/feed/merge', () => ({
  buildSnapshot: vi.fn(async () => ({ ...mockSnapshot })),
}));

vi.mock('../../lib/feed/store', () => ({
  writeSlice: vi.fn(async () => undefined),
  writeSnapshot: vi.fn(async () => undefined),
}));

describe('runEveningMarket', () => {
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

  it('fetches closing indices, universe internals, and persists official closing snapshot', async () => {
    const testDate = new Date('2026-10-05T10:15:00Z');
    const snapshot = await runEveningMarket(testDate);

    expect(snapshot).toBeDefined();
    expect(snapshot.sentiment).toBeDefined();
    expect(snapshot.indianIndices.length).toBe(1);
    expect(snapshot.sectorRanking.length).toBe(2);
  });
});
