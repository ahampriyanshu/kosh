import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  requests: [] as string[],
  manifestReports: [] as Array<{ id: string }>,
  content: {} as any,
  resolvedTicker: 'TCS.NS',
}));

vi.mock('../../data/research-requests', () => ({ researchRequests: h.requests }));
vi.mock('../../lib/research', () => ({
  buildResearch: vi.fn(async () => h.content),
  resolveResearchTicker: vi.fn(async () => h.resolvedTicker),
}));
vi.mock('../../lib/storage', () => ({
  readManifest: vi.fn(async () => ({ reports: h.manifestReports, latest: {} })),
  writeReport: vi.fn(),
  computeChecksum: () => 'sha256:test',
}));
vi.mock('../../lib/email', () => ({ sendReportEmail: vi.fn() }));

import { runResearch } from '../../scripts/research';
import { buildResearch, resolveResearchTicker } from '../../lib/research';
import { writeReport } from '../../lib/storage';
import { sendReportEmail } from '../../lib/email';

const researchContent = {
  ticker: 'TCS.NS',
  name: 'TCS',
  asOf: '2026-06-14T02:30:00.000Z',
  price: 3900,
  fundamental: 'Strong fundamentals.',
  technical: 'RSI at 55, MACD positive.',
  sentiment: 'Positive sentiment.',
  recommendation: {
    action: 'buy' as const,
    reasoning: 'Good entry point.',
    confidence: 0.8,
  },
};

beforeEach(() => {
  vi.mocked(buildResearch).mockReset();
  vi.mocked(resolveResearchTicker).mockReset();
  vi.mocked(writeReport).mockReset();
  vi.mocked(sendReportEmail).mockReset();

  h.content = { ...researchContent };
  h.resolvedTicker = 'TCS.NS';
  h.manifestReports.splice(0);
  h.requests.splice(0);

  vi.mocked(buildResearch).mockResolvedValue(h.content);
  vi.mocked(resolveResearchTicker).mockResolvedValue(h.resolvedTicker);
  vi.mocked(writeReport).mockResolvedValue(undefined);
  vi.mocked(sendReportEmail).mockResolvedValue(undefined);
});

describe('runResearch', () => {
  it('fresh ticker: writes report twice and emails once', async () => {
    h.requests.splice(0);
    h.requests.push('Tata Consultancy Services');

    await runResearch(new Date('2026-06-14T02:30:00.000Z'));

    expect(vi.mocked(writeReport)).toHaveBeenCalledTimes(2);
    const firstCall = vi.mocked(writeReport).mock.calls[0][0];
    expect(firstCall.id).toBe('research-TCS-NS-2026-06-14');
    expect(firstCall.dateKey).toBe('TCS-NS-2026-06-14');
    expect(firstCall.type).toBe('research');
    expect(firstCall.emailSent).toBe(false);

    const secondCall = vi.mocked(writeReport).mock.calls[1][0];
    expect(secondCall.emailSent).toBe(true);

    expect(vi.mocked(sendReportEmail)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(buildResearch)).toHaveBeenCalledWith('Tata Consultancy Services', new Date('2026-06-14T02:30:00.000Z'), 'TCS.NS');
  });

  it('already done: skips buildResearch/writeReport/sendReportEmail', async () => {
    h.requests.splice(0);
    h.requests.push('Tata Consultancy Services');
    h.manifestReports.splice(0);
    h.manifestReports.push({ id: 'research-TCS-NS-2026-06-14' });

    await runResearch(new Date('2026-06-14T02:30:00.000Z'));

    expect(vi.mocked(buildResearch)).not.toHaveBeenCalled();
    expect(vi.mocked(writeReport)).not.toHaveBeenCalled();
    expect(vi.mocked(sendReportEmail)).not.toHaveBeenCalled();
  });

  it('failure surfaces: rejects when buildResearch fails, no email sent', async () => {
    h.requests.splice(0);
    h.requests.push('Tata Consultancy Services');
    vi.mocked(buildResearch).mockRejectedValue(new Error('LLM failure'));

    await expect(runResearch(new Date('2026-06-14T02:30:00.000Z'))).rejects.toThrow();
    expect(vi.mocked(sendReportEmail)).not.toHaveBeenCalled();
  });
});
