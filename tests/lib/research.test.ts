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
  verdict: 'Solid business with upside potential.',
  fundamentals: {
    growth: 'Strong fundamentals with consistent revenue growth.',
    quality: 'Margins and cash generation are stable.',
    valuation: 'Valuation is reasonable against growth.',
  },
  technicals: {
    trend: 'Trend is bullish.',
    momentum: 'RSI neutral; MACD positive crossover.',
    levels: 'Price is holding above support.',
  },
  sentiment: {
    news: 'Recent news flow is constructive.',
    brokerage: 'Brokerage changes are limited.',
    marketTone: 'Market sentiment is cautiously optimistic.',
  },
  recommendation: {
    action: 'buy' as const,
    reasoning: 'Solid business with upside potential.',
  },
};

beforeEach(() => {
  Object.values(h).forEach((m) => m.mockReset());
  h.getQuoteDetail.mockResolvedValue({
    price: 100,
    currency: 'INR',
    name: 'TCS',
    previousClose: 98,
    volume: 1234567,
    trailingPE: 31.25,
    high52w: 120,
    low52w: 80,
    returnOnEquity: 0.22,
    debtToEquity: 0.35,
  });
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
        { label: 'LTP', value: 'Rs 100' },
        { label: '52W Position', value: '50% of range' },
        { label: '52W High', value: 'Rs 120' },
        { label: '52W Low', value: 'Rs 80' },
        { label: 'Trend', value: 'bullish' },
        { label: 'RSI', value: '55.0' },
        { label: 'P/E', value: '31.25' },
        { label: 'MACD', value: '1.20 / 0.80' },
        { label: 'ROE', value: '22.00%' },
        { label: 'Debt/Equity', value: '0.35' },
      ],
      verdict: expect.any(String),
      fundamentals: {
        growth: expect.any(String),
        quality: expect.any(String),
        valuation: expect.any(String),
      },
      technicals: {
        trend: expect.any(String),
        momentum: expect.any(String),
        levels: expect.any(String),
      },
      sentiment: {
        news: expect.any(String),
        brokerage: expect.any(String),
        marketTone: expect.any(String),
      },
      recommendation: {
        action: expect.stringMatching(/^(buy|sell|hold)$/),
        reasoning: expect.any(String),
      },
    });
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
    expect(buildStructurePrompt('research text')).toContain('"fundamentals": { "growth", "quality", "valuation" }');
  });
});
