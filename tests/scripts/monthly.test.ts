import { describe, it, expect, vi, beforeEach } from 'vitest';
const h = vi.hoisted(() => ({
  loadWindowSnapshots: vi.fn(), aggregateSnapshots: vi.fn(),
  buildMonthlyNarrative: vi.fn(), writeReport: vi.fn(), sendReportEmail: vi.fn(),
  readLedger: vi.fn(),
}));
vi.mock('../../lib/feed/aggregate', () => ({ loadWindowSnapshots: h.loadWindowSnapshots, aggregateSnapshots: h.aggregateSnapshots }));
vi.mock('../../lib/reports-narrative', () => ({ buildMonthlyNarrative: h.buildMonthlyNarrative }));
vi.mock('../../lib/storage', () => ({ writeReport: h.writeReport, computeChecksum: () => 'sha256:test' }));
vi.mock('../../lib/email', () => ({ sendReportEmail: h.sendReportEmail }));
vi.mock('../../lib/email-templates', () => ({ renderMonthlyEmail: () => '<html></html>' }));
vi.mock('../../lib/ledger', () => ({ readLedger: h.readLedger }));
import { runMonthly } from '../../scripts/monthly';
import { MarketSnapshotSchema } from '../../lib/schemas';

const snap = MarketSnapshotSchema.parse({
  asOf: '2026-07-01T00:00:00.000Z', window: '1mo',
  indianIndices: [], globalIndices: [], commodities: [], currencies: [], topGainers: [], topLosers: [],
  mostActive: [], near52wHigh: [], near52wLow: [], volumeShockers: [], sectorRanking: [],
  news: [], streetRecommendations: [], corporateActions: [],
  giftNifty: null, bondYield: null, vix: null, breadth: null, fiiDii: null,
});
beforeEach(() => {
  Object.values(h).forEach((m) => m.mockReset());
  h.loadWindowSnapshots.mockResolvedValue([snap]);
  h.aggregateSnapshots.mockReturnValue(snap);
  h.buildMonthlyNarrative.mockResolvedValue({ sectorInsights: ['IT firm'], macroThemes: ['rates'], midTermBets: [] });
  h.writeReport.mockResolvedValue(undefined); h.sendReportEmail.mockResolvedValue(undefined);
  h.readLedger.mockResolvedValue({ month: '2026-06', summary: null, entries: [
    { gradedOn: '2026-06-13', sourceReportId: 'weekly-2026-W24', hits: 2, total: 3, bets: [] },
    { gradedOn: '2026-06-20', sourceReportId: 'weekly-2026-W25', hits: 1, total: 2, bets: [] },
  ] });
});

describe('runMonthly', () => {
  it('skips when not the 1st of the month IST', async () => {
    await runMonthly(new Date('2026-06-15T00:00:00.000Z')); // 15th
    expect(h.writeReport).not.toHaveBeenCalled();
  });
  it('on the 1st, aggregates 30d snapshots and writes the monthly report with ledgerRollup', async () => {
    const period = '2026-06';
    await runMonthly(new Date('2026-07-01T00:00:00.000Z'));
    expect(h.loadWindowSnapshots).toHaveBeenCalledWith(expect.any(String), 30);
    expect(h.readLedger).toHaveBeenCalledWith(period);
    const first = h.writeReport.mock.calls[0][0];
    expect(first.type).toBe('monthly');
    expect(first.content.sectorInsights).toEqual(['IT firm']);
    expect(first.content.ledgerRollup).toEqual({ hits: 3, total: 5, summary: expect.stringContaining('3/5') });
  });
});
