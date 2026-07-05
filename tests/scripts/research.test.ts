import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  requests: [] as string[],
  manifestReports: [] as Array<{ id: string; type?: string }>,
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

import { runResearch } from '../../scripts/research';
import { buildResearch, resolveResearchTicker } from '../../lib/research';
import { writeReport } from '../../lib/storage';
import type { ResearchReportContent } from '../../lib/schemas';

const researchContent = {
  ticker: 'TCS.NS',
  name: 'TCS',
  asOf: '2026-06-14T02:30:00.000Z',
  price: 3900,
  metrics: [
    { label: 'LTP', value: 'Rs 3,900' },
    { label: '52W Position', value: '72% of range' },
    { label: 'P/E', value: '31.25' },
  ],
  verdict: 'Setup is attractive.',
  fundamentals: {
    growth: 'Strong fundamentals.',
    quality: 'Cash generation is stable.',
    valuation: 'Valuation is reasonable.',
  },
  technicals: {
    trend: 'Trend is positive.',
    momentum: 'RSI at 55, MACD positive.',
    levels: 'Price is above support.',
  },
  sentiment: {
    news: 'Positive sentiment.',
    brokerage: 'No major target change found.',
    marketTone: 'Market tone is constructive.',
  },
  recommendation: {
    action: 'buy' as const,
    reasoning: 'Good entry point.',
  },
};

beforeEach(() => {
  vi.mocked(buildResearch).mockReset();
  vi.mocked(resolveResearchTicker).mockReset();
  vi.mocked(writeReport).mockReset();

  h.content = { ...researchContent };
  h.resolvedTicker = 'TCS.NS';
  h.manifestReports.splice(0);
  h.requests.splice(0);

  vi.mocked(buildResearch).mockResolvedValue(h.content);
  vi.mocked(resolveResearchTicker).mockResolvedValue(h.resolvedTicker);
  vi.mocked(writeReport).mockResolvedValue(undefined);
});

describe('runResearch', () => {
  it('writes one batch report and sends no email', async () => {
    h.requests.splice(0);
    h.requests.push('Tata Consultancy Services', 'Infosys');
    vi.mocked(resolveResearchTicker)
      .mockResolvedValueOnce('TCS.NS')
      .mockResolvedValueOnce('INFY.NS');
    vi.mocked(buildResearch)
      .mockResolvedValueOnce({ ...researchContent, ticker: 'TCS.NS', name: 'TCS' })
      .mockResolvedValueOnce({ ...researchContent, ticker: 'INFY.NS', name: 'Infosys', price: 1500 });

    await runResearch(new Date('2026-06-14T02:30:00.000Z'));

    expect(vi.mocked(writeReport)).toHaveBeenCalledTimes(1);
    const firstCall = vi.mocked(writeReport).mock.calls[0][0];
    expect(firstCall.id).toBe('1');
    expect(firstCall.dateKey).toBe('1');
    expect(firstCall.type).toBe('research');
    expect(firstCall.emailSent).toBe(false);
    expect(firstCall.sourceData.tickers).toEqual(['TCS.NS', 'INFY.NS']);
    expect((firstCall.content as ResearchReportContent).items).toHaveLength(2);
    expect(vi.mocked(buildResearch)).toHaveBeenCalledWith('Tata Consultancy Services', new Date('2026-06-14T02:30:00.000Z'), 'TCS.NS');
  });

  it('increments the numeric research id', async () => {
    h.requests.splice(0);
    h.requests.push('Tata Consultancy Services');
    h.manifestReports.splice(0);
    h.manifestReports.push({ id: '1', type: 'research' }, { id: '2', type: 'research' });

    await runResearch(new Date('2026-06-14T02:30:00.000Z'));

    expect(vi.mocked(writeReport).mock.calls[0][0].id).toBe('3');
  });

  it('failure surfaces after writing successful items', async () => {
    h.requests.splice(0);
    h.requests.push('Tata Consultancy Services');
    vi.mocked(buildResearch).mockRejectedValue(new Error('LLM failure'));

    await expect(runResearch(new Date('2026-06-14T02:30:00.000Z'))).rejects.toThrow();
    expect(vi.mocked(writeReport)).not.toHaveBeenCalled();
  });
});
