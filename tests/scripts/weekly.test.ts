import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  buildRecap: vi.fn(),
  writeReport: vi.fn(),
  sendReportEmail: vi.fn(),
}));

vi.mock('../../lib/recap', () => ({ buildRecap: h.buildRecap }));
vi.mock('../../lib/storage', () => ({
  writeReport: h.writeReport,
  computeChecksum: () => 'sha256:test',
}));
vi.mock('../../lib/email', () => ({ sendReportEmail: h.sendReportEmail }));

import { runWeekly } from '../../scripts/weekly';
import { istWeekId } from '../../lib/time';

const recapContent = {
  period: '2026-W24',
  retrospective: null,
  outlook: {
    themes: ['x'],
    stocksToWatch: [{ ticker: 'AAPL', name: 'Apple', reason: 'test', signal: 'bullish' as const }],
    recommendation: { ticker: 'AAPL', action: 'hold' as const, reasoning: 'test', confidence: 0.5 },
  },
};

beforeEach(() => {
  Object.values(h).forEach((m) => m.mockReset());
  h.buildRecap.mockResolvedValue(recapContent);
  h.writeReport.mockResolvedValue(undefined);
  h.sendReportEmail.mockResolvedValue(undefined);
});

describe('runWeekly', () => {
  it('writes the report, emails it, then re-writes with emailSent=true', async () => {
    const now = new Date('2026-06-14T15:30:00.000Z'); // Sunday 21:00 IST
    await runWeekly(now);

    const expectedPeriod = istWeekId(now); // '2026-W24'
    expect(expectedPeriod).toBe('2026-W24');

    expect(h.buildRecap).toHaveBeenCalledTimes(1);
    expect(h.buildRecap.mock.calls[0][0].type).toBe('weekly');
    expect(h.buildRecap.mock.calls[0][0].period).toBe(expectedPeriod);

    expect(h.writeReport).toHaveBeenCalledTimes(2);
    const first = h.writeReport.mock.calls[0][0];
    const second = h.writeReport.mock.calls[1][0];

    expect(first.id).toBe('2026-W24-weekly');
    expect(first.type).toBe('weekly');
    expect(first.emailSent).toBe(false);

    expect(second.id).toBe('2026-W24-weekly');
    expect(second.type).toBe('weekly');
    expect(second.emailSent).toBe(true);

    expect(h.sendReportEmail).toHaveBeenCalledTimes(1);

    // Order: writeReport(false) → sendReportEmail → writeReport(true)
    expect(h.sendReportEmail.mock.invocationCallOrder[0]).toBeGreaterThan(
      h.writeReport.mock.invocationCallOrder[0],
    );
    expect(h.sendReportEmail.mock.invocationCallOrder[0]).toBeLessThan(
      h.writeReport.mock.invocationCallOrder[1],
    );
  });
});
