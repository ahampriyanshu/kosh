import { readSlice } from './store';
import {
  IndicesSliceSchema, GlobalSliceSchema, InternalsSliceSchema, NewsSliceSchema, FlowsSliceSchema,
  MarketSnapshotSchema, type MarketSnapshot,
} from '../schemas';

const SECTOR_INDEX_NAMES = new Map<string, string>([
  ['NIFTY BANK', 'Bank'],
  ['NIFTY IT', 'IT'],
  ['NIFTY PHARMA', 'Pharma'],
  ['NIFTY AUTO', 'Auto'],
  ['NIFTY METAL', 'Metal'],
  ['NIFTY ENERGY', 'Energy'],
  ['NIFTY REALTY', 'Realty'],
  ['NIFTY FIN SERVICE', 'Financial Services'],
  ['NIFTY FMCG', 'FMCG'],
]);

function sectorRankingFromIndices(indices: MarketSnapshot['indianIndices']) {
  return indices
    .map((index) => {
      const sector = SECTOR_INDEX_NAMES.get(index.name);
      return sector ? { sector, changePct: Number(index.changePct.toFixed(2)) } : null;
    })
    .filter((sector): sector is { sector: string; changePct: number } => sector !== null)
    .sort((a, b) => b.changePct - a.changePct);
}

export async function buildSnapshot(date: string, window: MarketSnapshot['window'], asOf?: string): Promise<MarketSnapshot> {
  const [indices, global, internals, news, flows] = await Promise.all([
    readSlice(date, 'indices', IndicesSliceSchema),
    readSlice(date, 'global', GlobalSliceSchema),
    readSlice(date, 'internals', InternalsSliceSchema),
    readSlice(date, 'news', NewsSliceSchema),
    readSlice(date, 'flows', FlowsSliceSchema),
  ]);

  const indianIndices = indices?.indianIndices ?? [];
  const officialSectorRanking = sectorRankingFromIndices(indianIndices);

  const snapshot: MarketSnapshot = {
    asOf: asOf ?? `${date}T00:00:00.000Z`,
    window,
    indianIndices,
    vix: indices?.vix ?? null,
    globalIndices: global?.globalIndices ?? [],
    commodities: global?.commodities ?? [],
    currencies: global?.currencies ?? [],
    topGainers: internals?.topGainers ?? [],
    topLosers: internals?.topLosers ?? [],
    mostActive: internals?.mostActive ?? [],
    near52wHigh: internals?.near52wHigh ?? [],
    near52wLow: internals?.near52wLow ?? [],
    volumeShockers: internals?.volumeShockers ?? [],
    sectorRanking: officialSectorRanking.length ? officialSectorRanking : internals?.sectorRanking ?? [],
    breadth: internals?.breadth ?? null,
    news: news?.news ?? [],
    streetRecommendations: news?.streetRecommendations ?? [],
    fiiDii: flows?.fiiDii ?? null,
    corporateActions: flows?.corporateActions ?? [],
    giftNifty: flows?.giftNifty ?? null,
    bondYield: flows?.bondYield ?? null,
  };
  return MarketSnapshotSchema.parse(snapshot);
}
