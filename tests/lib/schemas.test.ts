import { describe, it, expect } from 'vitest';
import {
  BetSchema,
  DailyContentSchema,
  WeeklyContentSchema,
  MonthlyContentSchema,
  ReportEnvelopeSchema,
  ManifestEntrySchema,
  WatchlistSchema,
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

  it('accepts a watchlist and an empty manifest', () => {
    expect(WatchlistSchema.parse({ stocks: [{ ticker: 'TCS.NS', name: 'TCS' }] }).stocks).toHaveLength(1);
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

describe('Phase 3b schemas', () => {
  const gradedBet = { ticker: 'TCS.NS', name: 'TCS', thesis: 'momentum', action: 'buy', entryRef: 3800, exitRef: 3950, changePct: 3.95, outcome: 'hit', note: 'ran with the sector' };
  it('GradedBetSchema validates a graded bet', () => {
    expect(GradedBetSchema.safeParse(gradedBet).success).toBe(true);
    expect(GradedBetSchema.safeParse({ ...gradedBet, outcome: 'maybe' }).success).toBe(false);
  });
  it('RecapContentSchema is the grading shape', () => {
    expect(RecapContentSchema.safeParse({ period: '2026-W24', sourceReportId: 'weekly-2026-W24', graded: [gradedBet], hits: 1, total: 1, summary: '1/1 bets hit' }).success).toBe(true);
  });
  it('LedgerSchema holds entries + nullable summary', () => {
    const entry = { gradedOn: '2026-06-20', sourceReportId: 'weekly-2026-W24', bets: [gradedBet], hits: 1, total: 1 };
    expect(LedgerEntrySchema.safeParse(entry).success).toBe(true);
    expect(LedgerSchema.safeParse({ month: '2026-06', entries: [entry], summary: null }).success).toBe(true);
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
