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

import { runMonthly } from '../../scripts/monthly';

const recapContent = {
  period: '2026-06',
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

describe('runMonthly', () => {
  it('skips when not the 1st of the month in IST', async () => {
    // 2026-06-14T02:30:00.000Z = 2026-06-14 08:00 IST (14th, not 1st)
    await runMonthly(new Date('2026-06-14T02:30:00.000Z'));

    expect(h.buildRecap).not.toHaveBeenCalled();
    expect(h.writeReport).not.toHaveBeenCalled();
    expect(h.sendReportEmail).not.toHaveBeenCalled();
  });

  it('runs on the 1st of the month in IST, using the previous month as period', async () => {
    // 2026-06-30T18:30:00.000Z = 2026-07-01 00:00 IST (the 1st)
    const now = new Date('2026-06-30T18:30:00.000Z');
    await runMonthly(now);

    expect(h.buildRecap).toHaveBeenCalledTimes(1);
    expect(h.buildRecap.mock.calls[0][0].type).toBe('monthly');
    expect(h.buildRecap.mock.calls[0][0].period).toBe('2026-06'); // previous month

    expect(h.writeReport).toHaveBeenCalledTimes(2);
    const first = h.writeReport.mock.calls[0][0];
    const second = h.writeReport.mock.calls[1][0];

    expect(first.id).toBe('2026-06-monthly');
    expect(first.type).toBe('monthly');
    expect(first.emailSent).toBe(false);

    expect(second.id).toBe('2026-06-monthly');
    expect(second.type).toBe('monthly');
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
