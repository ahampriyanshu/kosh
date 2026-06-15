import { describe, it, expect, vi, beforeEach } from 'vitest';
const h = vi.hoisted(() => ({
  readManifest: vi.fn(), readReport: vi.fn(), writeReport: vi.fn(),
  getHistorical: vi.fn(), appendLedgerEntry: vi.fn(), sendReportEmail: vi.fn(),
}));
vi.mock('../../lib/storage', () => ({ readManifest: h.readManifest, readReport: h.readReport, writeReport: h.writeReport, computeChecksum: () => 'sha256:test' }));
vi.mock('../../lib/market-data', () => ({ getHistorical: h.getHistorical }));
vi.mock('../../lib/ledger', () => ({ appendLedgerEntry: h.appendLedgerEntry }));
vi.mock('../../lib/email', () => ({ sendReportEmail: h.sendReportEmail }));
vi.mock('../../lib/email-templates', () => ({ renderRecapEmail: () => '<html></html>' }));
import { runRecap } from '../../scripts/recap';

const SAT = new Date('2026-06-20T04:30:00.000Z'); // Saturday ~10:00 IST
const weekly = {
  id: 'weekly-2026-W24', type: 'weekly', dateKey: '2026-W24', generatedAt: '2026-06-14T15:30:00.000Z',
  content: { snapshot: { window: '7d' }, themes: [], positionalBets: [
    { ticker: 'TCS.NS', name: 'TCS', thesis: 'momentum', action: 'buy', signal: 'bullish', confidence: 0.6 },
  ] },
};
beforeEach(() => {
  Object.values(h).forEach((m) => m.mockReset());
  h.readManifest.mockResolvedValue({ reports: [], latest: { weekly: 'weekly-2026-W24' } });
  h.readReport.mockResolvedValue(weekly);
  h.getHistorical.mockResolvedValue([{ date: new Date('2026-06-14'), close: 100, open: 0, high: 0, low: 0, volume: 0 }, { date: new Date('2026-06-20'), close: 106, open: 0, high: 0, low: 0, volume: 0 }]);
  h.writeReport.mockResolvedValue(undefined); h.appendLedgerEntry.mockResolvedValue(undefined); h.sendReportEmail.mockResolvedValue(undefined);
});

describe('runRecap', () => {
  it('grades the latest weekly bets, writes a recap report + ledger entry, emails', async () => {
    await runRecap(SAT);
    expect(h.appendLedgerEntry).toHaveBeenCalledTimes(1);
    const [month, entry] = h.appendLedgerEntry.mock.calls[0];
    expect(month).toBe('2026-06');
    expect(entry.sourceReportId).toBe('weekly-2026-W24');
    expect(entry.bets[0].outcome).toBe('hit'); // 100 -> 106 buy
    expect(h.writeReport).toHaveBeenCalledTimes(2);
    const rep = h.writeReport.mock.calls[0][0];
    expect(rep.type).toBe('recap');
    expect(rep.id).toMatch(/^recap-2026-06-20/);
    expect(rep.content.hits).toBe(1);
    expect(rep.content.total).toBe(1);
    expect(h.sendReportEmail).toHaveBeenCalledTimes(1);
    expect(h.sendReportEmail).toHaveBeenCalledWith('Kosh Weekly Recap', expect.any(String));
  });
  it('skips gracefully when there is no prior weekly', async () => {
    h.readManifest.mockResolvedValue({ reports: [], latest: {} });
    await runRecap(SAT);
    expect(h.writeReport).not.toHaveBeenCalled();
    expect(h.appendLedgerEntry).not.toHaveBeenCalled();
  });
});
