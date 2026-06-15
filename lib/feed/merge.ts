import { readSlice } from './store';
import {
  IndicesSliceSchema, GlobalSliceSchema, InternalsSliceSchema, NewsSliceSchema, FlowsSliceSchema,
  MarketSnapshotSchema, type MarketSnapshot,
} from '../schemas';

export async function buildSnapshot(date: string, window: MarketSnapshot['window'], asOf?: string): Promise<MarketSnapshot> {
  const [indices, global, internals, news, flows] = await Promise.all([
    readSlice(date, 'indices', IndicesSliceSchema),
    readSlice(date, 'global', GlobalSliceSchema),
    readSlice(date, 'internals', InternalsSliceSchema),
    readSlice(date, 'news', NewsSliceSchema),
    readSlice(date, 'flows', FlowsSliceSchema),
  ]);

  const snapshot: MarketSnapshot = {
    asOf: asOf ?? `${date}T00:00:00.000Z`,
    window,
    indianIndices: indices?.indianIndices ?? [],
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
    sectorRanking: internals?.sectorRanking ?? [],
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
