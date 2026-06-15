import type { InternalsSlice, UniverseQuote } from '../schemas';

const TOP_N = 10;
const NEAR_PCT = 2; // within 2% of 52w high/low
const SHOCK_RATIO = 2; // volume strictly greater than 2x average

export function computeInternals(quotes: UniverseQuote[]): InternalsSlice {
  const byChangeDesc = [...quotes].sort((a, b) => b.changePct - a.changePct);
  const topGainers = byChangeDesc.slice(0, TOP_N).map((q) => ({ ticker: q.ticker, name: q.name, ltp: q.ltp, changePct: q.changePct }));
  const topLosers = [...byChangeDesc].reverse().slice(0, TOP_N).map((q) => ({ ticker: q.ticker, name: q.name, ltp: q.ltp, changePct: q.changePct }));

  const mostActive = [...quotes]
    .sort((a, b) => b.ltp * b.volume - a.ltp * a.volume)
    .slice(0, TOP_N)
    .map((q) => ({ ticker: q.ticker, name: q.name, ltp: q.ltp, changePct: q.changePct, volume: q.volume }));

  const near52wHigh = quotes
    .filter((q) => q.high52w > 0 && ((q.high52w - q.ltp) / q.high52w) * 100 <= NEAR_PCT && q.ltp <= q.high52w)
    .map((q) => ({ ticker: q.ticker, name: q.name, ltp: q.ltp, pctFromHigh: Number((((q.high52w - q.ltp) / q.high52w) * 100).toFixed(2)) }))
    .sort((a, b) => a.pctFromHigh - b.pctFromHigh)
    .slice(0, TOP_N);

  const near52wLow = quotes
    .filter((q) => q.low52w > 0 && ((q.ltp - q.low52w) / q.low52w) * 100 <= NEAR_PCT && q.ltp >= q.low52w)
    .map((q) => ({ ticker: q.ticker, name: q.name, ltp: q.ltp, pctFromLow: Number((((q.ltp - q.low52w) / q.low52w) * 100).toFixed(2)) }))
    .sort((a, b) => a.pctFromLow - b.pctFromLow)
    .slice(0, TOP_N);

  const volumeShockers = quotes
    .filter((q) => q.avgVolume > 0 && q.volume / q.avgVolume > SHOCK_RATIO)
    .map((q) => ({ ticker: q.ticker, name: q.name, volume: q.volume, avgVolume: q.avgVolume, ratio: Number((q.volume / q.avgVolume).toFixed(2)) }))
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, TOP_N);

  const sectorAgg = new Map<string, { sum: number; n: number }>();
  for (const q of quotes) {
    const s = sectorAgg.get(q.sector) ?? { sum: 0, n: 0 };
    s.sum += q.changePct; s.n += 1; sectorAgg.set(q.sector, s);
  }
  const sectorRanking = [...sectorAgg.entries()]
    .map(([sector, { sum, n }]) => ({ sector, changePct: Number((sum / n).toFixed(2)) }))
    .sort((a, b) => b.changePct - a.changePct);

  let advances = 0, declines = 0, unchanged = 0;
  for (const q of quotes) {
    if (q.changePct > 0) advances++;
    else if (q.changePct < 0) declines++;
    else unchanged++;
  }
  const breadth = quotes.length
    ? { advances, declines, unchanged, adRatio: declines ? Number((advances / declines).toFixed(2)) : advances }
    : null;

  return { topGainers, topLosers, mostActive, near52wHigh, near52wLow, volumeShockers, sectorRanking, breadth };
}
