import { readSnapshot } from './store';
import { MarketSnapshotSchema, type MarketSnapshot } from '../schemas';

// Compound a series of daily percent moves into one window percent move.
function compoundPct(pcts: number[]): number {
  const factor = pcts.reduce((acc, p) => acc * (1 + p / 100), 1);
  return Number(((factor - 1) * 100).toFixed(2));
}

// Aggregate daily snapshots (any order) into one window snapshot.
// LTP/levels come from the latest day; changePct is compounded across the window;
// FII/DII net is summed; movers/breadth/news/sectors are taken from the latest day.
export function aggregateSnapshots(snapshots: MarketSnapshot[], window: MarketSnapshot['window']): MarketSnapshot {
  const sorted = [...snapshots].sort((a, b) => a.asOf.localeCompare(b.asOf));
  const latest = sorted[sorted.length - 1];
  if (!latest) {
    return MarketSnapshotSchema.parse({
      asOf: '', window,
      indianIndices: [], globalIndices: [], commodities: [], currencies: [],
      topGainers: [], topLosers: [], mostActive: [], near52wHigh: [], near52wLow: [],
      volumeShockers: [], sectorRanking: [], news: [], streetRecommendations: [], corporateActions: [],
      giftNifty: null, bondYield: null, vix: null, breadth: null, fiiDii: null,
    });
  }

  const compoundIndex = (pick: (s: MarketSnapshot) => { name: string; symbol: string; ltp: number; changePct: number }[]) =>
    pick(latest).map((idx) => {
      const series = sorted.map((s) => pick(s).find((i) => i.symbol === idx.symbol)?.changePct).filter((p): p is number => p != null);
      return { ...idx, changePct: compoundPct(series) };
    });

  let fiiDii: MarketSnapshot['fiiDii'] = null;
  const flows = sorted.map((s) => s.fiiDii).filter((f): f is NonNullable<MarketSnapshot['fiiDii']> => f != null);
  if (flows.length) {
    fiiDii = {
      fiiNet: Number(flows.reduce((a, f) => a + f.fiiNet, 0).toFixed(2)),
      diiNet: Number(flows.reduce((a, f) => a + f.diiNet, 0).toFixed(2)),
      unit: 'crore',
      asOf: flows[flows.length - 1].asOf,
    };
  }

  return MarketSnapshotSchema.parse({
    asOf: latest.asOf,
    window,
    indianIndices: compoundIndex((s) => s.indianIndices),
    globalIndices: compoundIndex((s) => s.globalIndices),
    commodities: latest.commodities,
    currencies: latest.currencies,
    giftNifty: latest.giftNifty,
    bondYield: latest.bondYield,
    vix: latest.vix,
    breadth: latest.breadth,
    topGainers: latest.topGainers,
    topLosers: latest.topLosers,
    mostActive: latest.mostActive,
    near52wHigh: latest.near52wHigh,
    near52wLow: latest.near52wLow,
    volumeShockers: latest.volumeShockers,
    sectorRanking: latest.sectorRanking,
    fiiDii,
    news: latest.news,
    streetRecommendations: latest.streetRecommendations,
    corporateActions: latest.corporateActions,
  });
}

// Load the persisted daily snapshots for the N calendar days ending at `endDate` (inclusive).
export async function loadWindowSnapshots(endDate: string, days: number): Promise<MarketSnapshot[]> {
  const end = new Date(`${endDate}T00:00:00.000Z`);
  const out: MarketSnapshot[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(end.getTime() - i * 86400000).toISOString().slice(0, 10);
    const snap = await readSnapshot(d);
    if (snap) out.push(snap);
  }
  return out;
}
