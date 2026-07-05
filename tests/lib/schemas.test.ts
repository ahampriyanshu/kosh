import { describe, it, expect } from 'vitest';
import {
  BetSchema,
  DailyContentSchema,
  WeeklyContentSchema,
  MonthlyContentSchema,
  ReportEnvelopeSchema,
  ManifestEntrySchema,
  ManifestSchema,
  RetroContentSchema,
  RecapContentSchema,
  ReportTypeSchema,
  ResearchContentSchema,
  ResearchRequestSchema,
  MarketSnapshotSchema,
  InternalsSliceSchema,
  GradedBetSchema,
  LedgerSchema,
  LedgerEntrySchema,
  LedgerRollupSchema,
  PortfolioSchema,
} from '../../lib/schemas';

const validDailySnapshot = {
  asOf: '2026-06-14T02:30:00.000Z', window: '1d',
  indianIndices: [], globalIndices: [], commodities: [], currencies: [],
  topGainers: [], topLosers: [], mostActive: [], near52wHigh: [], near52wLow: [],
  volumeShockers: [], sectorRanking: [], news: [], streetRecommendations: [], corporateActions: [],
  giftNifty: null, bondYield: null, vix: null, breadth: null, fiiDii: null,
};

describe('schemas', () => {
  const validDaily = {
    snapshot: validDailySnapshot,
    outlook: 'Nifty flat amid global cues.',
    keyTakeaways: ['Markets steady', 'IT leading'],
  };

  it('accepts valid daily content', () => {
    expect(DailyContentSchema.parse(validDaily)).toBeTruthy();
  });

  it('rejects daily content missing snapshot', () => {
    expect(() => DailyContentSchema.parse({ outlook: 'steady', keyTakeaways: ['a'] })).toThrow();
  });

  it('validates a full report envelope', () => {
    const env = {
      schemaVersion: 1,
      id: '2026-06-14-daily',
      type: 'daily',
      dateKey: '2026-06-14',
      generatedAt: '2026-06-14T02:30:00.000Z',
      sourceData: { tickers: ['TCS.NS'], priceSnapshot: { 'TCS.NS': 3900 }, searchTimestamp: '2026-06-14T02:29:00.000Z' },
      content: validDaily,
      emailSent: false,
      checksum: 'sha256:abc',
    };
    expect(ReportEnvelopeSchema.parse(env).id).toBe('2026-06-14-daily');
  });

  it('accepts an empty manifest', () => {
    expect(ManifestSchema.parse({ reports: [], latest: {} }).reports).toEqual([]);
  });
});

describe('RetroContentSchema', () => {
  const validRetro = {
    date: '2026-06-14',
    evaluated: [
      { ticker: 'TCS.NS', name: 'TCS', price: 3900, changePct: 1.2, note: 'holding steady' },
    ],
    alerts: [
      { ticker: 'INFY.NS', name: 'Infosys', reason: 'dropped 3%+', severity: 'high', triggeredRules: ['drawdown>3%'] },
    ],
    summary: 'Market choppy but IT holding.',
  };

  it('accepts a valid RetroContent with a high-severity alert', () => {
    expect(RetroContentSchema.parse(validRetro)).toBeTruthy();
  });

  it('rejects an alert with an invalid severity', () => {
    const bad = {
      ...validRetro,
      alerts: [{ ...validRetro.alerts[0], severity: 'critical' }],
    };
    expect(() => RetroContentSchema.parse(bad)).toThrow();
  });
});

describe('PortfolioSchema', () => {
  it('accepts a Kite holdings snapshot', () => {
    const result = PortfolioSchema.safeParse({
      asOf: '2026-07-04T11:30:00.000Z',
      source: 'kite',
      holdings: [{
        ticker: 'TCS.NS',
        name: 'TCS',
        exchange: 'NSE',
        quantity: 10,
        averagePrice: 3500,
        lastPrice: 3900,
        investedValue: 35000,
        currentValue: 39000,
        pnl: 4000,
        pnlPct: 11.43,
        dayChange: 12.5,
        dayChangePct: 0.32,
        allocationPct: 100,
      }],
      summary: {
        investedValue: 35000,
        currentValue: 39000,
        pnl: 4000,
        pnlPct: 11.43,
        dayChange: 125,
        dayChangePct: 0.32,
      },
    });
    expect(result.success).toBe(true);
  });
});

describe('Phase 3b schemas', () => {
  const gradedBet = { ticker: 'TCS.NS', name: 'TCS', thesis: 'momentum', action: 'buy', entryRef: 3800, exitRef: 3950, changePct: 3.95, outcome: 'hit', note: 'ran with the sector' };
  const learnings = { worked: ['TCS: momentum worked'], missed: ['INFY: margin thesis failed'] };
  it('GradedBetSchema validates a graded bet', () => {
    expect(GradedBetSchema.safeParse(gradedBet).success).toBe(true);
    expect(GradedBetSchema.safeParse({ ...gradedBet, outcome: 'maybe' }).success).toBe(false);
  });
  it('RecapContentSchema is the grading shape', () => {
    expect(RecapContentSchema.safeParse({ period: '2026-W24', sourceReportId: 'weekly-2026-W24', graded: [gradedBet], hits: 1, total: 1, summary: '1/1 bets hit', learnings }).success).toBe(true);
  });
  it('LedgerSchema holds entries + nullable summary', () => {
    const entry = { gradedOn: '2026-06-20', sourceReportId: 'weekly-2026-W24', bets: [gradedBet], hits: 1, total: 1 };
    expect(LedgerEntrySchema.safeParse(entry).success).toBe(true);
    expect(LedgerSchema.safeParse({ month: '2026-06', entries: [entry], summary: null }).success).toBe(true);
    expect(LedgerRollupSchema.safeParse({ hits: 1, total: 1, summary: '1/1 bets hit', learnings }).success).toBe(true);
  });
});

describe('ReportTypeSchema — research', () => {
  it("parses 'research' as a valid report type", () => {
    expect(ReportTypeSchema.parse('research')).toBe('research');
  });
});

describe('ReportTypeSchema', () => {
  it('accepts the six v2 report types', () => {
    for (const t of ['daily', 'retro', 'recap', 'weekly', 'monthly', 'research']) {
      expect(ReportTypeSchema.parse(t)).toBe(t);
    }
  });
  it('rejects retired type names', () => {
    expect(ReportTypeSchema.safeParse('morning').success).toBe(false);
    expect(ReportTypeSchema.safeParse('midsession').success).toBe(false);
  });
});

describe('ResearchContentSchema', () => {
  const validResearch = {
    ticker: 'TCS.NS',
    name: 'Tata Consultancy Services',
    asOf: '2026-06-14',
    price: 3900,
    metrics: [
      { label: 'LTP', value: 'Rs 3,900' },
      { label: '52W Range', value: 'Rs 3,000 - Rs 4,200' },
      { label: 'P/E', value: '31.25' },
    ],
    fundamentals: {
      growth: 'Strong revenue growth, healthy margins.',
      valuation: 'Valuation is reasonable.',
    },
    technicals: {
      trend: 'Trading above 200-DMA.',
      momentum: 'RSI neutral.',
      levels: 'Support is nearby.',
    },
    sentiment: {
      news: 'Positive analyst coverage post-results.',
      brokerage: 'No major target cut found.',
    },
    entryExit: {
      fundamental: 'Entry is reasonable on fundamentals.',
      technicalSentiment: 'Wait for technical confirmation.',
    },
    targets: [{ source: 'Consensus', target: 'Rs 4,200', duration: '12 months', view: '+8%' }],
    recommendation: {
      action: 'buy',
      reasoning: 'Valuation reasonable relative to growth.',
    },
  };

  it('parses a valid ResearchContent', () => {
    expect(ResearchContentSchema.parse(validResearch)).toBeTruthy();
  });

  it('coerces legacy research paragraphs into fixed sections', () => {
    const {
      fundamentals,
      technicals,
      sentiment: fixedSentiment,
      entryExit,
      targets,
      ...legacyBase
    } = validResearch;
    const parsed = ResearchContentSchema.parse({
      ...legacyBase,
      fundamental: 'Strong revenue growth.',
      technical: 'RSI neutral.',
      sentiment: 'Brokerage coverage is balanced.',
    });
    expect(parsed.fundamentals.growth).toBe('Strong revenue growth.');
    expect(parsed.technicals.momentum).toBe('RSI neutral.');
    expect(parsed.sentiment.brokerage).toBe('Brokerage coverage is balanced.');
  });

  it('compacts noisy legacy research bullet arrays before fixed-section conversion', () => {
    const {
      fundamentals,
      technicals,
      sentiment: fixedSentiment,
      entryExit,
      targets,
      ...legacyBase
    } = validResearch;
    const parsed = ResearchContentSchema.parse({
      ...legacyBase,
      fundamental: 'Growth is steady.',
      technical: 'Momentum is neutral.',
      sentiment: ['rating moved from ', 'Hold', ' to ', 'Sell', ' after earnings.'],
    });
    expect(parsed.sentiment.news).toBe('rating moved from');
    expect(parsed.sentiment.brokerage).toBe('Hold');
    expect(parsed.targets).toEqual([]);
  });

  it('does not turn legacy market tone into a target', () => {
    const parsed = ResearchContentSchema.parse({
      ticker: 'VISHNU.NS',
      name: 'Vishnu Chemicals',
      asOf: '2026-07-04T19:21:52.885Z',
      price: 432,
      metrics: [{ label: 'LTP', value: 'Rs 432' }],
      fundamentals: {
        growth: 'Growth is improving.',
        quality: 'Quality detail from the older schema.',
        valuation: 'Valuation is reasonable.',
      },
      technicals: {
        trend: 'Trend is mixed.',
        momentum: 'Momentum is neutral.',
        levels: 'Support is nearby.',
      },
      sentiment: {
        news: 'News flow is mixed.',
        brokerage: 'No target update found.',
        marketTone: 'MarketsMOJO downgraded to Sell while another source stayed constructive.',
      },
      recommendation: {
        action: 'hold',
        reasoning: 'Wait for a cleaner setup.',
      },
    });

    expect(parsed.targets).toEqual([]);
  });
});

describe('ResearchRequestSchema', () => {
  it('parses a company-name research request', () => {
    expect(ResearchRequestSchema.parse('Tata Motors')).toBe('Tata Motors');
  });
});

describe('envelope dateKey', () => {
  it('requires a dateKey on the envelope', () => {
    const base = {
      schemaVersion: 1, id: 'daily-2026-06-14', type: 'daily',
      generatedAt: '2026-06-14T02:30:00.000Z',
      sourceData: { tickers: [], priceSnapshot: {}, searchTimestamp: '2026-06-14T02:29:00.000Z' },
      content: {}, emailSent: false, checksum: 'sha256:' + '0'.repeat(64),
    };
    expect(ReportEnvelopeSchema.safeParse(base).success).toBe(false); // missing dateKey
    expect(ReportEnvelopeSchema.safeParse({ ...base, dateKey: '2026-06-14' }).success).toBe(true);
  });
  it('requires a dateKey on manifest entries', () => {
    const entry = { id: 'daily-2026-06-14', type: 'daily', date: '2026-06-14', path: 'reports/2026/06/daily/daily-2026-06-14.json', checksum: 'sha256:x' };
    expect(ManifestEntrySchema.safeParse(entry).success).toBe(false); // missing dateKey
    expect(ManifestEntrySchema.safeParse({ ...entry, dateKey: '2026-06-14' }).success).toBe(true);
  });
});

describe('MarketSnapshotSchema', () => {
  const minimal = {
    asOf: '2026-06-15T02:30:00.000Z', window: '1d',
    indianIndices: [], globalIndices: [], commodities: [], currencies: [],
    topGainers: [], topLosers: [], mostActive: [], near52wHigh: [], near52wLow: [],
    volumeShockers: [], sectorRanking: [], news: [], streetRecommendations: [], corporateActions: [],
    giftNifty: null, bondYield: null, vix: null, breadth: null, fiiDii: null,
  };
  it('accepts a minimal empty snapshot', () => {
    expect(MarketSnapshotSchema.safeParse(minimal).success).toBe(true);
  });
  it('rejects an invalid window', () => {
    expect(MarketSnapshotSchema.safeParse({ ...minimal, window: 'daily' }).success).toBe(false);
  });
  it('accepts a populated internals slice', () => {
    const internals = {
      topGainers: [{ ticker: 'TCS.NS', name: 'TCS', ltp: 3900, changePct: 4.2 }],
      topLosers: [], mostActive: [{ ticker: 'SBIN.NS', name: 'SBI', ltp: 800, changePct: 1.1, volume: 1000000 }],
      near52wHigh: [{ ticker: 'INFY.NS', name: 'Infosys', ltp: 1900, pctFromHigh: 0.5 }],
      near52wLow: [], volumeShockers: [{ ticker: 'ITC.NS', name: 'ITC', volume: 5e6, avgVolume: 2e6, ratio: 2.5 }],
      sectorRanking: [{ sector: 'IT', changePct: 2.3 }],
      breadth: { advances: 30, declines: 18, unchanged: 2, adRatio: 1.67 },
    };
    expect(InternalsSliceSchema.safeParse(internals).success).toBe(true);
  });
});

const emptySnap = {
  asOf: '2026-06-15T02:30:00.000Z', window: '1d',
  indianIndices: [], globalIndices: [], commodities: [], currencies: [],
  topGainers: [], topLosers: [], mostActive: [], near52wHigh: [], near52wLow: [],
  volumeShockers: [], sectorRanking: [], news: [], streetRecommendations: [], corporateActions: [],
  giftNifty: null, bondYield: null, vix: null, breadth: null, fiiDii: null,
};
describe('Phase 3 content schemas', () => {
  it('BetSchema requires thesis + action + signal + confidence', () => {
    expect(BetSchema.safeParse({ ticker: 'TCS.NS', name: 'TCS', thesis: 'x', action: 'buy', signal: 'bullish', confidence: 0.6 }).success).toBe(true);
    expect(BetSchema.safeParse({ ticker: 'TCS.NS', name: 'TCS', thesis: 'x', action: 'maybe', signal: 'bullish', confidence: 0.6 }).success).toBe(false);
  });
  it('DailyContent embeds a snapshot + outlook + keyTakeaways', () => {
    expect(DailyContentSchema.safeParse({ snapshot: emptySnap, outlook: 'steady', keyTakeaways: ['a', 'b'] }).success).toBe(true);
  });
  it('WeeklyContent is forward-only: snapshot + themes + positionalBets', () => {
    expect(WeeklyContentSchema.safeParse({ snapshot: { ...emptySnap, window: '7d' }, themes: ['rotation'], positionalBets: [{ ticker: 'TCS.NS', name: 'TCS', thesis: 'x', action: 'buy', signal: 'bullish', confidence: 0.6 }] }).success).toBe(true);
  });
  it('MonthlyContent has sectorInsights, macroThemes, midTermBets, nullable ledgerRollup', () => {
    expect(MonthlyContentSchema.safeParse({ snapshot: { ...emptySnap, window: '1mo' }, sectorInsights: ['IT firm'], macroThemes: ['rates'], midTermBets: [], ledgerRollup: null }).success).toBe(true);
  });
});
