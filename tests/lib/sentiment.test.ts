import { describe, it, expect } from 'vitest';
import {
  getRegime,
  computeBreadthIndex,
  computeFlowsIndex,
  computeVolatilityIndex,
  computeDerivativesIndex,
  computeMoodSnapshot,
  getHistoricalMoods,
} from '../../lib/sentiment';
import type { MarketSnapshot } from '../../lib/schemas';

function makeMockSnapshot(overrides: Partial<MarketSnapshot> = {}): MarketSnapshot {
  return {
    asOf: '2026-10-02T10:15:00.000Z',
    window: '1d',
    indianIndices: [
      { name: 'NIFTY 50', symbol: '^NSEI', ltp: 25000, changePct: 0.1 },
    ],
    giftNifty: null,
    globalIndices: [],
    commodities: [{ name: 'Gold MCX', value: 75000, changePct: 0.1 }],
    currencies: [{ pair: 'USD/INR', value: 83.5, changePct: 0.05 }],
    bondYield: null,
    vix: { value: 13.5, changePct: 0.0 },
    breadth: { advances: 250, declines: 250, unchanged: 0, adRatio: 1.0 },
    topGainers: [],
    topLosers: [],
    mostActive: [],
    near52wHigh: [],
    near52wLow: [],
    volumeShockers: [],
    sectorRanking: [],
    fiiDii: { fiiNet: 0, diiNet: 0, unit: 'crore', asOf: '2026-10-02' },
    news: [],
    streetRecommendations: [],
    corporateActions: [],
    derivatives: {
      pcrOi: 1.0,
      pcrVolume: 1.0,
      callVolumePct: 50,
      putVolumePct: 50,
      asOf: '2026-10-02',
    },
    ...overrides,
  };
}

describe('Sentiment & Market Mood Engine', () => {
  describe('getRegime', () => {
    it('accurately categorizes sentiment scores into the 5 discrete regimes', () => {
      expect(getRegime(15)).toBe('Extreme Fear');
      expect(getRegime(25)).toBe('Extreme Fear');
      expect(getRegime(35)).toBe('Fear');
      expect(getRegime(45)).toBe('Fear');
      expect(getRegime(50)).toBe('Neutral');
      expect(getRegime(55)).toBe('Neutral');
      expect(getRegime(65)).toBe('Greed');
      expect(getRegime(75)).toBe('Greed');
      expect(getRegime(85)).toBe('Extreme Greed');
      expect(getRegime(100)).toBe('Extreme Greed');
    });
  });

  describe('computeBreadthIndex (BMI)', () => {
    it('scores neutral (~50) when advances equal declines', () => {
      const snap = makeMockSnapshot({
        breadth: { advances: 250, declines: 250, unchanged: 0, adRatio: 1.0 },
      });
      const res = computeBreadthIndex(snap);
      expect(res.score).toBe(50);
      expect(res.regime).toBe('Neutral');
    });

    it('scores high greed (>75) on massive advance/decline breadth expansion', () => {
      const snap = makeMockSnapshot({
        breadth: { advances: 420, declines: 70, unchanged: 10, adRatio: 6.0 },
        near52wHigh: [
          { ticker: 'TCS.NS', name: 'TCS', ltp: 4000, pctFromHigh: 0.5 },
          { ticker: 'INFY.NS', name: 'Infosys', ltp: 1800, pctFromHigh: 0.8 },
        ],
        near52wLow: [],
      });
      const res = computeBreadthIndex(snap);
      expect(res.score).toBeGreaterThanOrEqual(80);
      expect(res.regime).toMatch(/Greed/);
      expect(res.metrics.pctAdvancing).toBeCloseTo(84, 0);
    });

    it('scores extreme fear (<25) on severe cash market breakdown', () => {
      const snap = makeMockSnapshot({
        breadth: { advances: 50, declines: 440, unchanged: 10, adRatio: 0.11 },
        near52wHigh: [],
        near52wLow: [
          { ticker: 'A.NS', name: 'A', ltp: 100, pctFromLow: 0.2 },
          { ticker: 'B.NS', name: 'B', ltp: 200, pctFromLow: 0.5 },
        ],
      });
      const res = computeBreadthIndex(snap);
      expect(res.score).toBeLessThanOrEqual(25);
      expect(res.regime).toBe('Extreme Fear');
    });
  });

  describe('computeFlowsIndex (IFI)', () => {
    it('scores neutral (50) when institutional flows are zero', () => {
      const snap = makeMockSnapshot({
        fiiDii: { fiiNet: 0, diiNet: 0, unit: 'crore', asOf: '2026-10-02' },
      });
      const res = computeFlowsIndex(snap);
      expect(res.score).toBe(50);
      expect(res.regime).toBe('Neutral');
    });

    it('scores greed (>85) on massive FII capital inflows', () => {
      const snap = makeMockSnapshot({
        fiiDii: { fiiNet: 4500, diiNet: 1200, unit: 'crore', asOf: '2026-10-02' },
      });
      const res = computeFlowsIndex(snap);
      expect(res.score).toBeGreaterThanOrEqual(85);
      expect(res.regime).toBe('Extreme Greed');
    });

    it('scores fear (<20) on aggressive FII dumping', () => {
      const snap = makeMockSnapshot({
        fiiDii: { fiiNet: -6500, diiNet: 800, unit: 'crore', asOf: '2026-10-02' },
      });
      const res = computeFlowsIndex(snap);
      expect(res.score).toBeLessThanOrEqual(20);
      expect(res.regime).toBe('Extreme Fear');
    });

    it('cushions score when DII aggressively absorbs foreign selling', () => {
      const snapWithoutDii = makeMockSnapshot({
        fiiDii: { fiiNet: -3000, diiNet: 0, unit: 'crore', asOf: '2026-10-02' },
      });
      const snapWithDii = makeMockSnapshot({
        fiiDii: { fiiNet: -3000, diiNet: 3500, unit: 'crore', asOf: '2026-10-02' },
      });

      const resWithout = computeFlowsIndex(snapWithoutDii);
      const resWith = computeFlowsIndex(snapWithDii);
      expect(resWith.score).toBeGreaterThan(resWithout.score);
    });
  });

  describe('computeVolatilityIndex (VRI)', () => {
    it('scores high greed (>70) when India VIX is very subdued (complacency)', () => {
      const snap = makeMockSnapshot({
        vix: { value: 11.2, changePct: -2.5 },
      });
      const res = computeVolatilityIndex(snap);
      expect(res.score).toBeGreaterThanOrEqual(75);
      expect(res.regime).toMatch(/Greed/);
    });

    it('scores extreme fear (<20) when India VIX spikes into high anxiety', () => {
      const snap = makeMockSnapshot({
        vix: { value: 24.5, changePct: 18.0 },
      });
      const res = computeVolatilityIndex(snap);
      expect(res.score).toBeLessThanOrEqual(20);
      expect(res.regime).toBe('Extreme Fear');
    });

    it('penalizes score when Gold and USD/INR surge together (safe haven flight)', () => {
      const calmSnap = makeMockSnapshot({
        commodities: [{ name: 'Gold', value: 75000, changePct: 0.1 }],
        currencies: [{ pair: 'USD/INR', value: 83.5, changePct: 0.05 }],
      });
      const flightSnap = makeMockSnapshot({
        commodities: [{ name: 'Gold', value: 76000, changePct: 1.8 }],
        currencies: [{ pair: 'USD/INR', value: 84.1, changePct: 0.65 }],
      });

      const calmRes = computeVolatilityIndex(calmSnap);
      const flightRes = computeVolatilityIndex(flightSnap);
      expect(flightRes.score).toBeLessThan(calmRes.score);
    });
  });

  describe('computeDerivativesIndex (DSI)', () => {
    it('scores neutral (50) on balanced Nifty PCR = 1.0', () => {
      const snap = makeMockSnapshot({
        derivatives: {
          pcrOi: 1.0,
          pcrVolume: 1.0,
          callVolumePct: 50,
          putVolumePct: 50,
        },
      });
      const res = computeDerivativesIndex(snap);
      expect(res.score).toBe(50);
      expect(res.regime).toBe('Neutral');
    });

    it('scores extreme greed (>80) on low PCR (<0.65) indicating call speculation & lack of protection', () => {
      const snap = makeMockSnapshot({
        derivatives: {
          pcrOi: 0.58,
          pcrVolume: 0.62,
          callVolumePct: 62,
          putVolumePct: 38,
        },
      });
      const res = computeDerivativesIndex(snap);
      expect(res.score).toBeGreaterThanOrEqual(80);
      expect(res.regime).toMatch(/Greed/);
    });

    it('scores extreme fear (<25) on high PCR (>1.35) indicating panic put buying & hedging', () => {
      const snap = makeMockSnapshot({
        derivatives: {
          pcrOi: 1.42,
          pcrVolume: 1.48,
          callVolumePct: 40,
          putVolumePct: 60,
        },
      });
      const res = computeDerivativesIndex(snap);
      expect(res.score).toBeLessThanOrEqual(25);
      expect(res.regime).toBe('Extreme Fear');
    });

    it('returns neutral baseline 50 if derivatives data is null', () => {
      const snap = makeMockSnapshot({ derivatives: null });
      const res = computeDerivativesIndex(snap);
      expect(res.score).toBe(50);
      expect(res.regime).toBe('Neutral');
      expect(res.metrics.pcrOi).toBeNull();
    });
  });

  describe('computeMoodSnapshot (Composite)', () => {
    it('accurately blends all 4 categories with 25% weights', () => {
      const snap = makeMockSnapshot();
      const mood = computeMoodSnapshot(snap, 'closing');

      expect(mood.composite).toBe(53);
      expect(mood.regime).toBe('Neutral');
      expect(mood.session).toBe('closing');
      expect(mood.categories.breadth.score).toBe(50);
      expect(mood.categories.flows.score).toBe(50);
      expect(mood.categories.volatility.score).toBe(61); // VIX 13.5 is mild complacency
      expect(mood.categories.derivatives.score).toBe(50);
    });

    it('dynamically re-weights to 3 categories when derivatives data is missing', () => {
      const snap = makeMockSnapshot({ derivatives: null });
      const mood = computeMoodSnapshot(snap, 'morning');

      expect(mood.session).toBe('morning');
      expect(mood.categories.derivatives.weight).toBe(0);
      expect(mood.categories.breadth.weight).toBeCloseTo(0.34, 2);
      expect(mood.categories.flows.weight).toBeCloseTo(0.33, 2);
      expect(mood.categories.volatility.weight).toBeCloseTo(0.33, 2);
    });
  });

  describe('getHistoricalMoods', () => {
    it('reads existing snapshots and computes valid historical mood snapshots', () => {
      const history = getHistoricalMoods();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);

      const latest = history[0];
      expect(latest.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(latest.mood.composite).toBeGreaterThanOrEqual(0);
      expect(latest.mood.composite).toBeLessThanOrEqual(100);
      expect(latest.mood.categories.breadth).toBeDefined();
      expect(latest.mood.categories.flows).toBeDefined();
      expect(latest.mood.categories.volatility).toBeDefined();
      expect(latest.mood.categories.derivatives).toBeDefined();
    });
  });
});
