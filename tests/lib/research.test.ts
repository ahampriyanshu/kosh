import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  getQuote: vi.fn(),
  getHistorical: vi.fn(),
  rsi: vi.fn(),
  macd: vi.fn(),
  trend: vi.fn(),
  generateGroundedObject: vi.fn(),
}));

vi.mock('../../lib/market-data', () => ({ getQuote: h.getQuote, getHistorical: h.getHistorical }));
vi.mock('../../lib/indicators', () => ({ rsi: h.rsi, macd: h.macd, trend: h.trend }));
vi.mock('../../lib/llm', () => ({ generateGroundedObject: h.generateGroundedObject }));

import { buildResearch } from '../../lib/research';

const llmContent = {
  ticker: 'FAKE.NS',
  name: 'Fake Corp',
  asOf: '1970-01-01T00:00:00.000Z',
  price: 999,
  fundamental: 'Strong fundamentals with consistent revenue growth.',
  technical: 'RSI neutral; MACD positive crossover.',
  sentiment: 'Market sentiment is cautiously optimistic.',
  recommendation: {
    action: 'buy' as const,
    reasoning: 'Solid business with upside potential.',
    confidence: 0.75,
  },
};

beforeEach(() => {
  Object.values(h).forEach((m) => m.mockReset());
  h.getQuote.mockResolvedValue({ price: 100, currency: 'INR', name: 'TCS' });
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
      fundamental: expect.any(String),
      technical: expect.any(String),
      sentiment: expect.any(String),
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
});
