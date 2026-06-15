import { describe, it, expect, vi, beforeEach } from 'vitest';
const h = vi.hoisted(() => ({
  loadWindowSnapshots: vi.fn(), aggregateSnapshots: vi.fn(),
  buildWeeklyNarrative: vi.fn(), writeReport: vi.fn(), sendReportEmail: vi.fn(),
}));
vi.mock('../../lib/feed/aggregate', () => ({ loadWindowSnapshots: h.loadWindowSnapshots, aggregateSnapshots: h.aggregateSnapshots }));
vi.mock('../../lib/reports-narrative', () => ({ buildWeeklyNarrative: h.buildWeeklyNarrative }));
vi.mock('../../lib/storage', () => ({ writeReport: h.writeReport, computeChecksum: () => 'sha256:test' }));
vi.mock('../../lib/email', () => ({ sendReportEmail: h.sendReportEmail }));
vi.mock('../../lib/email-templates', () => ({ renderWeeklyEmail: () => '<html></html>' }));
import { runWeekly } from '../../scripts/weekly';
import { MarketSnapshotSchema } from '../../lib/schemas';

const NOW = new Date('2026-06-14T15:30:00.000Z'); // Sun 21:00 IST
const snap = MarketSnapshotSchema.parse({
  asOf: NOW.toISOString(), window: '7d',
  indianIndices: [], globalIndices: [], commodities: [], currencies: [], topGainers: [], topLosers: [],
  mostActive: [], near52wHigh: [], near52wLow: [], volumeShockers: [], sectorRanking: [],
  news: [], streetRecommendations: [], corporateActions: [],
  giftNifty: null, bondYield: null, vix: null, breadth: null, fiiDii: null,
});
beforeEach(() => {
  Object.values(h).forEach((m) => m.mockReset());
  h.loadWindowSnapshots.mockResolvedValue([snap]);
  h.aggregateSnapshots.mockReturnValue(snap);
  h.buildWeeklyNarrative.mockResolvedValue({ themes: ['rotation'], positionalBets: [] });
  h.writeReport.mockResolvedValue(undefined); h.sendReportEmail.mockResolvedValue(undefined);
});

describe('runWeekly', () => {
  it('aggregates 7d snapshots and writes a forward weekly report', async () => {
    await runWeekly(NOW);
    expect(h.loadWindowSnapshots).toHaveBeenCalledWith(expect.any(String), 7);
    expect(h.writeReport).toHaveBeenCalledTimes(2);
    const first = h.writeReport.mock.calls[0][0];
    expect(first.type).toBe('weekly');
    expect(first.id).toMatch(/^weekly-2026-W/);
    expect(first.content.themes).toEqual(['rotation']);
    expect(first.content.snapshot.window).toBe('7d');
  });
});
