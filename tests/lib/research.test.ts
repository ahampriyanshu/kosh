import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  getQuoteDetail: vi.fn(),
  getHistorical: vi.fn(),
  searchTicker: vi.fn(),
  rsi: vi.fn(),
  macd: vi.fn(),
  trend: vi.fn(),
  generateGroundedObject: vi.fn(),
}));

vi.mock('../../lib/market-data', () => ({ getQuoteDetail: h.getQuoteDetail, getHistorical: h.getHistorical, searchTicker: h.searchTicker }));
vi.mock('../../lib/indicators', () => ({ rsi: h.rsi, macd: h.macd, trend: h.trend }));
vi.mock('../../lib/llm', () => ({ generateGroundedObject: h.generateGroundedObject }));

import { buildResearch, resolveResearchTicker } from '../../lib/research';

const llmContent = {
  ticker: 'FAKE.NS',
  name: 'Fake Corp',
  asOf: '1970-01-01T00:00:00.000Z',
  price: 999,
  fundamental: ['Strong fundamentals with consistent revenue growth.'],
  technical: ['RSI neutral; MACD positive crossover.'],
  sentiment: ['Market sentiment is cautiously optimistic.'],
  recommendation: {
    action: 'buy' as const,
    reasoning: 'Solid business with upside potential.',
    confidence: 0.75,
  },
};

beforeEach(() => {
  Object.values(h).forEach((m) => m.mockReset());
  h.getQuoteDetail.mockResolvedValue({ price: 100, currency: 'INR', name: 'TCS', previousClose: 98, volume: 1234567 });
  h.searchTicker.mockResolvedValue(['TCS.NS']);
  h.getHistorical.mockResolvedValue([
    { date: new Date(), open: 95, high: 105, low: 90, close: 100, volume: 1000000 },
  ]);
  h.rsi.mockReturnValue([55]);
  h.macd.mockReturnValue([{ MACD: 1.2, signal: 0.8, histogram: 0.4 }]);
  h.trend.mockReturnValue('bullish');
  h.generateGroundedObject.mockResolvedValue({ object: llmContent, sources: [] });
});

describe('buildResearch', () => {
  it('overrides ticker/name/price from the live quote (not LLM output)', async () => {
    const result = await buildResearch('TCS.NS', new Date('2026-06-14T02:30:00.000Z'));

    expect(result.ticker).toBe('TCS.NS');
    expect(result.name).toBe('TCS');
    expect(result.price).toBe(100);
  });

  it('sets asOf to a non-null ISO string', async () => {
    const result = await buildResearch('TCS.NS', new Date('2026-06-14T02:30:00.000Z'));

    expect(result.asOf).toBeTruthy();
    expect(typeof result.asOf).toBe('string');
    // Should be the ISO string of the provided now date
    expect(result.asOf).toBe('2026-06-14T02:30:00.000Z');
  });

  it('calls generateGroundedObject exactly once', async () => {
    await buildResearch('TCS.NS', new Date('2026-06-14T02:30:00.000Z'));

    expect(h.generateGroundedObject).toHaveBeenCalledTimes(1);
  });

  it('returns a valid ResearchContent with all required fields', async () => {
    const result = await buildResearch('TCS.NS', new Date('2026-06-14T02:30:00.000Z'));

    expect(result).toMatchObject({
      ticker: 'TCS.NS',
      name: 'TCS',
      price: 100,
      metrics: [
        { label: 'Last price', value: 'Rs 100' },
        { label: 'Day change', value: '+2.04%' },
        { label: 'Volume', value: '12,34,567' },
      ],
      fundamental: expect.any(Array),
      technical: expect.any(Array),
      sentiment: expect.any(Array),
      recommendation: {
        action: expect.stringMatching(/^(buy|sell|hold)$/),
        reasoning: expect.any(String),
        confidence: expect.any(Number),
      },
    });
    expect(result.recommendation.confidence).toBeGreaterThanOrEqual(0);
    expect(result.recommendation.confidence).toBeLessThanOrEqual(1);
  });

  it('passes ticker and date context to the LLM prompt', async () => {
    await buildResearch('RELIANCE.NS', new Date('2026-06-14T02:30:00.000Z'));

    const [researchPrompt] = h.generateGroundedObject.mock.calls[0];
    expect(researchPrompt).toContain('RELIANCE.NS');
    expect(researchPrompt).toContain('2026-06-14');
  });

  it('resolves renamed Yahoo symbols before fetching quote and history', async () => {
    const result = await buildResearch('TATAMOTORS.NS', new Date('2026-06-14T02:30:00.000Z'));

    expect(h.getQuoteDetail).toHaveBeenCalledWith('TMPV.NS');
    expect(h.getHistorical).toHaveBeenCalledWith('TMPV.NS', '2025-06-14');
    expect(result.ticker).toBe('TMPV.NS');
  });

  it('resolves a company name to the preferred NSE ticker', async () => {
    h.searchTicker.mockResolvedValue(['HDB', 'HDFCBANK.NS', 'HDFCBANK.BO']);

    await expect(resolveResearchTicker('HDFC Bank')).resolves.toBe('HDFCBANK.NS');
  });

  it('uses aliases for ambiguous short research queries', async () => {
    await expect(resolveResearchTicker('itc')).resolves.toBe('ITC.NS');
    await expect(resolveResearchTicker('psb')).resolves.toBe('PSB.NS');
    expect(h.searchTicker).not.toHaveBeenCalled();
  });

  it('uses the company query and resolved ticker in the research prompt', async () => {
    h.searchTicker.mockResolvedValue(['RELIANCE.NS']);

    await buildResearch('Reliance Industries', new Date('2026-06-14T02:30:00.000Z'));

    expect(h.getQuoteDetail).toHaveBeenCalledWith('RELIANCE.NS');
    const [researchPrompt] = h.generateGroundedObject.mock.calls[0];
    expect(researchPrompt).toContain('Reliance Industries');
    expect(researchPrompt).toContain('RELIANCE.NS');
    expect(researchPrompt).toContain('brokerage rating');
  });

  it('asks the LLM for one-line bullet sections', async () => {
    await buildResearch('ITC', new Date('2026-06-14T02:30:00.000Z'));

    const [, buildStructurePrompt] = h.generateGroundedObject.mock.calls[0];
    expect(buildStructurePrompt('research text')).toContain('arrays of 1-3 concise one-line bullet strings');
  });
});
