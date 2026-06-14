import { describe, it, expect } from 'vitest';
import {
  MorningContentSchema,
  ReportEnvelopeSchema,
  WatchlistSchema,
  ManifestSchema,
} from '../../lib/schemas';

describe('schemas', () => {
  const validMorning = {
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

  it('accepts valid morning content', () => {
    expect(MorningContentSchema.parse(validMorning)).toBeTruthy();
  });

  it('rejects confidence outside 0..1', () => {
    const bad = { ...validMorning, topRecommendation: { ...validMorning.topRecommendation, confidence: 2 } };
    expect(() => MorningContentSchema.parse(bad)).toThrow();
  });

  it('rejects more than 5 stocks to watch', () => {
    const six = Array.from({ length: 6 }, () => ({ ticker: 'X.NS', name: 'X', reason: 'r', signal: 'neutral' }));
    expect(() => MorningContentSchema.parse({ ...validMorning, stocksToWatch: six })).toThrow();
  });

  it('validates a full report envelope', () => {
    const env = {
      schemaVersion: 1,
      id: '2026-06-14-morning',
      type: 'morning',
      generatedAt: '2026-06-14T02:30:00.000Z',
      sourceData: { tickers: ['TCS.NS'], priceSnapshot: { 'TCS.NS': 3900 }, searchTimestamp: '2026-06-14T02:29:00.000Z' },
      content: validMorning,
      emailSent: false,
      checksum: 'sha256:abc',
    };
    expect(ReportEnvelopeSchema.parse(env).id).toBe('2026-06-14-morning');
  });

  it('accepts a watchlist and an empty manifest', () => {
    expect(WatchlistSchema.parse({ stocks: [{ ticker: 'TCS.NS', name: 'TCS' }] }).stocks).toHaveLength(1);
    expect(ManifestSchema.parse({ reports: [], latest: {} }).reports).toEqual([]);
  });
});
