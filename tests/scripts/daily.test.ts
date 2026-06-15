import { describe, it, expect, vi, beforeEach } from 'vitest';
const h = vi.hoisted(() => ({
  buildSnapshot: vi.fn(), writeSnapshot: vi.fn(), deleteFeed: vi.fn(),
  buildDailyNarrative: vi.fn(), writeReport: vi.fn(), sendReportEmail: vi.fn(),
}));
vi.mock('../../lib/feed/merge', () => ({ buildSnapshot: h.buildSnapshot }));
vi.mock('../../lib/feed/store', () => ({ writeSnapshot: h.writeSnapshot, deleteFeed: h.deleteFeed }));
vi.mock('../../lib/reports-narrative', () => ({ buildDailyNarrative: h.buildDailyNarrative }));
vi.mock('../../lib/storage', () => ({ writeReport: h.writeReport, computeChecksum: () => 'sha256:test' }));
vi.mock('../../lib/email', () => ({ sendReportEmail: h.sendReportEmail }));
vi.mock('../../lib/email-templates', () => ({ renderDailyEmail: () => '<html></html>' }));
import { runDaily } from '../../scripts/daily';
import { MarketSnapshotSchema } from '../../lib/schemas';

const NOW = new Date('2026-06-15T02:30:00.000Z');
const snap = MarketSnapshotSchema.parse({
  asOf: NOW.toISOString(), window: '1d',
  indianIndices: [], globalIndices: [], commodities: [], currencies: [], topGainers: [], topLosers: [],
  mostActive: [], near52wHigh: [], near52wLow: [], volumeShockers: [], sectorRanking: [],
  news: [], streetRecommendations: [], corporateActions: [],
  giftNifty: null, bondYield: null, vix: null, breadth: null, fiiDii: null,
});
beforeEach(() => {
  Object.values(h).forEach((m) => m.mockReset());
  h.buildSnapshot.mockResolvedValue(snap);
  h.buildDailyNarrative.mockResolvedValue({ outlook: 'steady', keyTakeaways: ['a'] });
  h.writeReport.mockResolvedValue(undefined); h.writeSnapshot.mockResolvedValue(undefined);
  h.deleteFeed.mockResolvedValue(undefined); h.sendReportEmail.mockResolvedValue(undefined);
});

describe('runDaily', () => {
  it('builds + persists the snapshot, writes the report embedding it, emails, deletes slices', async () => {
    await runDaily(NOW);
    expect(h.writeSnapshot).toHaveBeenCalledTimes(1);
    expect(h.writeReport).toHaveBeenCalledTimes(2);          // emailSent:false then true
    const first = h.writeReport.mock.calls[0][0];
    expect(first.type).toBe('daily');
    expect(first.id).toMatch(/^daily-/);
    expect(first.content.snapshot.window).toBe('1d');
    expect(first.content.outlook).toBe('steady');
    expect(h.sendReportEmail).toHaveBeenCalledTimes(1);
    expect(h.sendReportEmail).toHaveBeenCalledWith('Kosh Daily Brief', expect.any(String));
    expect(h.deleteFeed).toHaveBeenCalledTimes(1);            // cleanup last
  });
});
