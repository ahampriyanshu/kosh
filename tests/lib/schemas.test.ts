import { describe, it, expect } from 'vitest';
import {
  DailyContentSchema,
  ReportEnvelopeSchema,
  WatchlistSchema,
  ManifestSchema,
  MidSessionContentSchema,
  RecapContentSchema,
  OutlookSchema,
  ReportTypeSchema,
  ResearchContentSchema,
  ResearchRequestSchema,
} from '../../lib/schemas';

describe('schemas', () => {
  const validDaily = {
    date: '2026-06-14',
    marketOutlook: 'Nifty flat amid global cues.',
    stocksToWatch: [
      { ticker: 'TCS.NS', name: 'TCS', reason: 'breakout', signal: 'bullish' },
    ],
    exitSignals: [{ ticker: 'INFY.NS', reason: 'weak guidance' }],
    topRecommendation: {
      ticker: 'RELIANCE.NS',
      action: 'buy',
      reasoning: 'oversold + positive news',
      confidence: 0.7,
    },
    sectorMovers: [{ sector: 'IT', note: 'recovering' }],
    fiiDiiSentiment: 'FIIs net buyers',
  };

  it('accepts valid daily content', () => {
    expect(DailyContentSchema.parse(validDaily)).toBeTruthy();
  });

  it('rejects confidence outside 0..1', () => {
    const bad = { ...validDaily, topRecommendation: { ...validDaily.topRecommendation, confidence: 2 } };
    expect(() => DailyContentSchema.parse(bad)).toThrow();
  });

  it('rejects more than 5 stocks to watch', () => {
    const six = Array.from({ length: 6 }, () => ({ ticker: 'X.NS', name: 'X', reason: 'r', signal: 'neutral' }));
    expect(() => DailyContentSchema.parse({ ...validDaily, stocksToWatch: six })).toThrow();
  });

  it('validates a full report envelope', () => {
    const env = {
      schemaVersion: 1,
      id: '2026-06-14-daily',
      type: 'daily',
      generatedAt: '2026-06-14T02:30:00.000Z',
      sourceData: { tickers: ['TCS.NS'], priceSnapshot: { 'TCS.NS': 3900 }, searchTimestamp: '2026-06-14T02:29:00.000Z' },
      content: validDaily,
      emailSent: false,
      checksum: 'sha256:abc',
    };
    expect(ReportEnvelopeSchema.parse(env).id).toBe('2026-06-14-daily');
  });

  it('accepts a watchlist and an empty manifest', () => {
    expect(WatchlistSchema.parse({ stocks: [{ ticker: 'TCS.NS', name: 'TCS' }] }).stocks).toHaveLength(1);
    expect(ManifestSchema.parse({ reports: [], latest: {} }).reports).toEqual([]);
  });
});

describe('MidSessionContentSchema', () => {
  const validMidSession = {
    date: '2026-06-14',
    evaluated: [
      { ticker: 'TCS.NS', name: 'TCS', price: 3900, changePct: 1.2, note: 'holding steady' },
    ],
    alerts: [
      { ticker: 'INFY.NS', name: 'Infosys', reason: 'dropped 3%+', severity: 'high', triggeredRules: ['drawdown>3%'] },
    ],
    summary: 'Market choppy but IT holding.',
  };

  it('accepts a valid MidSessionContent with a high-severity alert', () => {
    expect(MidSessionContentSchema.parse(validMidSession)).toBeTruthy();
  });

  it('rejects an alert with an invalid severity', () => {
    const bad = {
      ...validMidSession,
      alerts: [{ ...validMidSession.alerts[0], severity: 'critical' }],
    };
    expect(() => MidSessionContentSchema.parse(bad)).toThrow();
  });
});

describe('RecapContentSchema', () => {
  const validOutlook = {
    themes: ['rate cuts likely', 'IT recovery'],
    stocksToWatch: [
      { ticker: 'TCS.NS', name: 'TCS', reason: 'breakout setup', signal: 'bullish' },
    ],
    recommendation: {
      ticker: 'RELIANCE.NS',
      action: 'buy',
      reasoning: 'oversold bounce expected',
      confidence: 0.8,
    },
  };

  it('accepts a valid RecapContent with retrospective: null (first-run case)', () => {
    const recap = {
      period: '2026-W24',
      retrospective: null,
      outlook: validOutlook,
    };
    expect(RecapContentSchema.parse(recap)).toBeTruthy();
  });

  it('accepts a valid RecapContent with a populated retrospective', () => {
    const recap = {
      period: '2026-W24',
      retrospective: {
        calls: [
          { ticker: 'TCS.NS', predicted: 'bullish', actual: 'bullish', hit: true, why: 'breakout played out' },
        ],
        hits: 1,
        total: 1,
        summary: 'Good week.',
      },
      outlook: validOutlook,
    };
    expect(RecapContentSchema.parse(recap)).toBeTruthy();
  });
});

describe('OutlookSchema', () => {
  it('rejects recommendation with confidence > 1', () => {
    const bad = {
      themes: ['theme'],
      stocksToWatch: [],
      recommendation: {
        ticker: 'X.NS',
        action: 'hold',
        reasoning: 'uncertain',
        confidence: 1.5,
      },
    };
    expect(() => OutlookSchema.parse(bad)).toThrow();
  });
});

describe('ReportTypeSchema — research', () => {
  it("parses 'research' as a valid report type", () => {
    expect(ReportTypeSchema.parse('research')).toBe('research');
  });
});

describe('ResearchContentSchema', () => {
  const validResearch = {
    ticker: 'TCS.NS',
    name: 'Tata Consultancy Services',
    asOf: '2026-06-14',
    price: 3900,
    fundamental: 'Strong revenue growth, healthy margins.',
    technical: 'Trading above 200-DMA, RSI neutral.',
    sentiment: 'Positive analyst coverage post-results.',
    recommendation: {
      action: 'buy',
      reasoning: 'Valuation reasonable relative to growth.',
      confidence: 0.7,
    },
  };

  it('parses a valid ResearchContent', () => {
    expect(ResearchContentSchema.parse(validResearch)).toBeTruthy();
  });

  it('rejects confidence: 2 (out of range)', () => {
    const bad = {
      ...validResearch,
      recommendation: { ...validResearch.recommendation, confidence: 2 },
    };
    expect(() => ResearchContentSchema.parse(bad)).toThrow();
  });
});

describe('ResearchRequestSchema', () => {
  it('parses { ticker } with note omitted', () => {
    expect(ResearchRequestSchema.parse({ ticker: 'TCS.NS' })).toEqual({ ticker: 'TCS.NS' });
  });

  it('parses { ticker, note }', () => {
    expect(ResearchRequestSchema.parse({ ticker: 'TCS.NS', note: 'x' })).toEqual({
      ticker: 'TCS.NS',
      note: 'x',
    });
  });
});
