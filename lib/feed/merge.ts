import { readSlice, readSnapshot } from './store';
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
  const [indices, global, internals, news, flows, existing] = await Promise.all([
    readSlice(date, 'indices', IndicesSliceSchema),
    readSlice(date, 'global', GlobalSliceSchema),
    readSlice(date, 'internals', InternalsSliceSchema),
    readSlice(date, 'news', NewsSliceSchema),
    readSlice(date, 'flows', FlowsSliceSchema),
    readSnapshot(date),
  ]);

  const indianIndices = (indices?.indianIndices && indices.indianIndices.length > 0) ? indices.indianIndices : existing?.indianIndices ?? [];
  const officialSectorRanking = sectorRankingFromIndices(indianIndices);

  const snapshot: MarketSnapshot = {
    asOf: asOf ?? existing?.asOf ?? `${date}T00:00:00.000Z`,
    window,
    indianIndices,
    vix: indices?.vix ?? existing?.vix ?? null,
    globalIndices: (global?.globalIndices && global.globalIndices.length > 0) ? global.globalIndices : existing?.globalIndices ?? [],
    commodities: (global?.commodities && global.commodities.length > 0) ? global.commodities : existing?.commodities ?? [],
    currencies: (global?.currencies && global.currencies.length > 0) ? global.currencies : existing?.currencies ?? [],
    topGainers: (internals?.topGainers && internals.topGainers.length > 0) ? internals.topGainers : existing?.topGainers ?? [],
    topLosers: (internals?.topLosers && internals.topLosers.length > 0) ? internals.topLosers : existing?.topLosers ?? [],
    mostActive: (internals?.mostActive && internals.mostActive.length > 0) ? internals.mostActive : existing?.mostActive ?? [],
    near52wHigh: (internals?.near52wHigh && internals.near52wHigh.length > 0) ? internals.near52wHigh : existing?.near52wHigh ?? [],
    near52wLow: (internals?.near52wLow && internals.near52wLow.length > 0) ? internals.near52wLow : existing?.near52wLow ?? [],
    volumeShockers: (internals?.volumeShockers && internals.volumeShockers.length > 0) ? internals.volumeShockers : existing?.volumeShockers ?? [],
    sectorRanking: officialSectorRanking.length ? officialSectorRanking : (internals?.sectorRanking && internals.sectorRanking.length > 0) ? internals.sectorRanking : existing?.sectorRanking ?? [],
    breadth: internals?.breadth ?? existing?.breadth ?? null,
    news: (news?.news && news.news.length > 0) ? news.news : existing?.news ?? [],
    streetRecommendations: (news?.streetRecommendations && news.streetRecommendations.length > 0) ? news.streetRecommendations : existing?.streetRecommendations ?? [],
    fiiDii: flows?.fiiDii ?? existing?.fiiDii ?? null,
    corporateActions: (flows?.corporateActions && flows.corporateActions.length > 0) ? flows.corporateActions : existing?.corporateActions ?? [],
    giftNifty: flows?.giftNifty ?? existing?.giftNifty ?? null,
    bondYield: flows?.bondYield ?? existing?.bondYield ?? null,
    derivatives: flows?.derivatives ?? existing?.derivatives ?? null,
    sentiment: existing?.sentiment ?? null,
  };
  return MarketSnapshotSchema.parse(snapshot);
}
