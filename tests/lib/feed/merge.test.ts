import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { writeSlice } from '../../../lib/feed/store';
import { buildSnapshot } from '../../../lib/feed/merge';
import {
  IndicesSliceSchema, GlobalSliceSchema, InternalsSliceSchema, NewsSliceSchema, FlowsSliceSchema, MarketSnapshotSchema,
} from '../../../lib/schemas';

let dir: string;
beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), 'kosh-')); process.env.KOSH_DATA_DIR = dir; });
afterEach(async () => { delete process.env.KOSH_DATA_DIR; await rm(dir, { recursive: true, force: true }); });

describe('buildSnapshot', () => {
  it('assembles a valid snapshot from all present slices', async () => {
    const date = '2026-06-15';
    await writeSlice(date, 'indices', { indianIndices: [{ name: 'NIFTY 50', symbol: '^NSEI', ltp: 23622.9, changePct: 1.99 }], vix: { value: 14.7, changePct: -2 } }, IndicesSliceSchema);
    await writeSlice(date, 'global', { globalIndices: [{ name: 'Dow Jones', symbol: '^DJI', ltp: 51202, changePct: 0.3 }], commodities: [{ name: 'Gold', value: 4238, changePct: 0.5 }], currencies: [{ pair: 'USD/INR', value: 95.1, changePct: 0.1 }] }, GlobalSliceSchema);
    await writeSlice(date, 'internals', { topGainers: [{ ticker: 'TCS.NS', name: 'TCS', ltp: 3900, changePct: 4 }], topLosers: [], mostActive: [], near52wHigh: [], near52wLow: [], volumeShockers: [], sectorRanking: [{ sector: 'IT', changePct: 2 }], breadth: { advances: 30, declines: 18, unchanged: 2, adRatio: 1.67 } }, InternalsSliceSchema);
    await writeSlice(date, 'news', { news: [{ category: 'macro_policy', items: [] }], streetRecommendations: [] }, NewsSliceSchema);
    await writeSlice(date, 'flows', { fiiDii: { fiiNet: -1200, diiNet: 980, unit: 'crore', asOf: '2026-06-14' }, corporateActions: [], giftNifty: { value: 23650, changePct: 0.2 }, bondYield: null }, FlowsSliceSchema);

    const snap = await buildSnapshot(date, '1d');
    expect(() => MarketSnapshotSchema.parse(snap)).not.toThrow();
    expect(snap.window).toBe('1d');
    expect(snap.indianIndices[0].symbol).toBe('^NSEI');
    expect(snap.giftNifty?.value).toBe(23650);
    expect(snap.breadth?.advances).toBe(30);
  });

  it('uses official sector index quotes for sector ranking when available', async () => {
    const date = '2026-06-15';
    await writeSlice(
      date,
      'indices',
      {
        indianIndices: [
          { name: 'NIFTY 50', symbol: '^NSEI', ltp: 23622.9, changePct: 1.99 },
          { name: 'NIFTY IT', symbol: '^CNXIT', ltp: 30000, changePct: -1.5 },
          { name: 'NIFTY AUTO', symbol: '^CNXAUTO', ltp: 20000, changePct: 2.1 },
        ],
        vix: null,
      },
      IndicesSliceSchema,
    );
    await writeSlice(
      date,
      'internals',
      {
        topGainers: [],
        topLosers: [],
        mostActive: [],
        near52wHigh: [],
        near52wLow: [],
        volumeShockers: [],
        sectorRanking: [{ sector: 'Custom IT Basket', changePct: 9.9 }],
        breadth: null,
      },
      InternalsSliceSchema,
    );

    const snap = await buildSnapshot(date, '1d');

    expect(snap.sectorRanking).toEqual([
      { sector: 'Auto', changePct: 2.1 },
      { sector: 'IT', changePct: -1.5 },
    ]);
  });

  it('omits sections whose slice is missing (consistency over availability)', async () => {
    const date = '2026-06-15';
    await writeSlice(date, 'indices', { indianIndices: [{ name: 'NIFTY 50', symbol: '^NSEI', ltp: 23622.9, changePct: 1.99 }], vix: null }, IndicesSliceSchema);
    const snap = await buildSnapshot(date, '1d');
    expect(() => MarketSnapshotSchema.parse(snap)).not.toThrow();
    expect(snap.indianIndices.length).toBe(1);
    expect(snap.globalIndices).toEqual([]);
    expect(snap.fiiDii).toBeNull();
    expect(snap.breadth).toBeNull();
    expect(snap.news).toEqual([]);
  });

  it('uses the provided asOf, else midnight of the date', async () => {
    const date = '2026-06-15';
    await writeSlice(date, 'indices', { indianIndices: [], vix: null }, IndicesSliceSchema);
    expect((await buildSnapshot(date, '1d', '2026-06-15T02:30:00.000Z')).asOf).toBe('2026-06-15T02:30:00.000Z');
    expect((await buildSnapshot(date, '1d')).asOf).toBe('2026-06-15T00:00:00.000Z');
  });
});
