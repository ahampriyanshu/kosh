import { z } from 'zod';

export const ReportTypeSchema = z.enum(['daily', 'midsession', 'retro', 'weekly', 'monthly', 'research']);
export type ReportType = z.infer<typeof ReportTypeSchema>;

export const SignalSchema = z.enum(['bullish', 'bearish', 'neutral']);
export type Signal = z.infer<typeof SignalSchema>;

export const DailyContentSchema = z.object({
  date: z.string(),
  marketOutlook: z.string(),
  stocksToWatch: z
    .array(
      z.object({
        ticker: z.string(),
        name: z.string(),
        reason: z.string(),
        signal: SignalSchema,
      }),
    )
    .max(5),
  exitSignals: z.array(z.object({ ticker: z.string(), reason: z.string() })),
  topRecommendation: z.object({
    ticker: z.string(),
    action: z.literal('buy'),
    reasoning: z.string(),
    confidence: z.number().min(0).max(1),
  }),
  sectorMovers: z.array(z.object({ sector: z.string(), note: z.string() })),
  fiiDiiSentiment: z.string(),
});
export type DailyContent = z.infer<typeof DailyContentSchema>;

export const SourceDataSchema = z.object({
  tickers: z.array(z.string()),
  priceSnapshot: z.record(z.string(), z.number()),
  searchTimestamp: z.string(),
});
export type SourceData = z.infer<typeof SourceDataSchema>;

export const ReportEnvelopeSchema = z.object({
  schemaVersion: z.number().int().positive(),
  id: z.string().regex(/^[A-Za-z0-9_-]+$/),
  type: ReportTypeSchema,
  dateKey: z.string().min(1),
  generatedAt: z.string().datetime(),
  sourceData: SourceDataSchema,
  content: z.unknown(), // type-specific; callers validate with the matching content schema
  emailSent: z.boolean(),
  checksum: z.string(),
});
export type ReportEnvelope = z.infer<typeof ReportEnvelopeSchema>;

export const WatchlistSchema = z.object({
  stocks: z.array(
    z.object({
      ticker: z.string(),
      name: z.string(),
      notes: z.string().optional(),
    }),
  ),
});
export type Watchlist = z.infer<typeof WatchlistSchema>;

export const ManifestEntrySchema = z.object({
  id: z.string(),
  type: ReportTypeSchema,
  dateKey: z.string().min(1),
  date: z.string(),
  path: z.string(),
  checksum: z.string(),
});
export type ManifestEntry = z.infer<typeof ManifestEntrySchema>;

export const ManifestSchema = z.object({
  reports: z.array(ManifestEntrySchema),
  // string-keyed (not enum-keyed) so a partial map like { daily: "..." } types cleanly
  latest: z.record(z.string(), z.string()).default({}),
});
export type Manifest = z.infer<typeof ManifestSchema>;

export const AlertSeveritySchema = z.enum(['high', 'medium', 'low']);
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;

export const AlertSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  reason: z.string(),
  severity: AlertSeveritySchema,
  triggeredRules: z.array(z.string()),
});
export type Alert = z.infer<typeof AlertSchema>;

export const MidSessionContentSchema = z.object({
  date: z.string(),
  evaluated: z.array(
    z.object({
      ticker: z.string(),
      name: z.string(),
      price: z.number(),
      changePct: z.number(),
      note: z.string(),
    }),
  ),
  alerts: z.array(AlertSchema),
  summary: z.string(),
});
export type MidSessionContent = z.infer<typeof MidSessionContentSchema>;

export const RecapCallSchema = z.object({
  ticker: z.string(),
  predicted: z.string(),
  actual: z.string(),
  hit: z.boolean(),
  why: z.string(),
});

export const RetrospectiveSchema = z.object({
  calls: z.array(RecapCallSchema),
  hits: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  summary: z.string(),
});

export const OutlookSchema = z.object({
  themes: z.array(z.string()),
  stocksToWatch: z.array(
    z.object({ ticker: z.string(), name: z.string(), reason: z.string(), signal: SignalSchema }),
  ),
  recommendation: z.object({
    ticker: z.string(),
    action: z.enum(['buy', 'sell', 'hold']),
    reasoning: z.string(),
    confidence: z.number().min(0).max(1),
  }),
});

export const RecapContentSchema = z.object({
  period: z.string(),
  retrospective: RetrospectiveSchema.nullable(),
  outlook: OutlookSchema,
});
export type RecapContent = z.infer<typeof RecapContentSchema>;

export const ResearchRequestSchema = z.object({
  ticker: z.string(),
  note: z.string().optional(),
});
export type ResearchRequest = z.infer<typeof ResearchRequestSchema>;

export const ResearchContentSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  asOf: z.string(),
  price: z.number(),
  fundamental: z.string(),
  technical: z.string(),
  sentiment: z.string(),
  recommendation: z.object({
    action: z.enum(['buy', 'sell', 'hold']),
    reasoning: z.string(),
    confidence: z.number().min(0).max(1),
  }),
});
export type ResearchContent = z.infer<typeof ResearchContentSchema>;

export const PortfolioSchema = z.object({
  asOf: z.string(),
  holdings: z.array(
    z.object({
      ticker: z.string(),
      name: z.string(),
      qty: z.number().nonnegative(),
      avgCost: z.number().nonnegative(),
    }),
  ),
});
export type Portfolio = z.infer<typeof PortfolioSchema>;

export const UniverseEntrySchema = z.object({
  ticker: z.string().regex(/\.(NS|BO)$/),
  name: z.string(),
  sector: z.string(),
});
export type UniverseEntry = z.infer<typeof UniverseEntrySchema>;
export const UniverseSchema = z.array(UniverseEntrySchema);

// ---- MarketSnapshot (Phase 2) ----
export const IndexQuoteSchema = z.object({
  name: z.string(), symbol: z.string(), ltp: z.number(), changePct: z.number(),
});
export const SimpleQuoteSchema = z.object({ name: z.string(), value: z.number(), changePct: z.number() });
export const CurrencyQuoteSchema = z.object({ pair: z.string(), value: z.number(), changePct: z.number() });
export const MoverSchema = z.object({ ticker: z.string(), name: z.string(), ltp: z.number(), changePct: z.number() });
export const ActiveSchema = MoverSchema.extend({ volume: z.number() });
export const NearHighSchema = z.object({ ticker: z.string(), name: z.string(), ltp: z.number(), pctFromHigh: z.number() });
export const NearLowSchema = z.object({ ticker: z.string(), name: z.string(), ltp: z.number(), pctFromLow: z.number() });
export const VolumeShockerSchema = z.object({ ticker: z.string(), name: z.string(), volume: z.number(), avgVolume: z.number(), ratio: z.number() });
export const SectorRankSchema = z.object({ sector: z.string(), changePct: z.number() });
export const BreadthSchema = z.object({
  advances: z.number().int().nonnegative(), declines: z.number().int().nonnegative(),
  unchanged: z.number().int().nonnegative(), adRatio: z.number(),
});
export const FiiDiiSchema = z.object({ fiiNet: z.number(), diiNet: z.number(), unit: z.literal('crore'), asOf: z.string() });
export const NewsCategorySchema = z.enum(['macro_policy', 'global_cues', 'earnings', 'sectoral', 'corporate_actions', 'stocks_in_focus']);
export const NewsItemSchema = z.object({
  headline: z.string(), summary: z.string(), source: z.string(),
  tickers: z.array(z.string()).optional(), sentiment: SignalSchema,
});
export const NewsGroupSchema = z.object({ category: NewsCategorySchema, items: z.array(NewsItemSchema) });
export const StreetRecSchema = z.object({
  ticker: z.string(), name: z.string(), brokerage: z.string(),
  action: z.enum(['buy', 'sell', 'hold', 'accumulate', 'reduce']), target: z.number().optional(), rationale: z.string(),
});
export const CorpActionSchema = z.object({
  ticker: z.string(), name: z.string(),
  type: z.enum(['results', 'dividend', 'split', 'agm', 'bonus']), date: z.string(),
});
export const GiftNiftySchema = z.object({ value: z.number(), changePct: z.number() });
export const BondYieldSchema = z.object({ name: z.string(), value: z.number(), changeBps: z.number() });
export const VixSchema = z.object({ value: z.number(), changePct: z.number() });

export const MarketSnapshotSchema = z.object({
  asOf: z.string(),
  window: z.enum(['1d', '7d', '1mo']),
  indianIndices: z.array(IndexQuoteSchema),
  giftNifty: GiftNiftySchema.nullable(),
  globalIndices: z.array(IndexQuoteSchema),
  commodities: z.array(SimpleQuoteSchema),
  currencies: z.array(CurrencyQuoteSchema),
  bondYield: BondYieldSchema.nullable(),
  vix: VixSchema.nullable(),
  breadth: BreadthSchema.nullable(),
  topGainers: z.array(MoverSchema),
  topLosers: z.array(MoverSchema),
  mostActive: z.array(ActiveSchema),
  near52wHigh: z.array(NearHighSchema),
  near52wLow: z.array(NearLowSchema),
  volumeShockers: z.array(VolumeShockerSchema),
  sectorRanking: z.array(SectorRankSchema),
  fiiDii: FiiDiiSchema.nullable(),
  news: z.array(NewsGroupSchema),
  streetRecommendations: z.array(StreetRecSchema),
  corporateActions: z.array(CorpActionSchema),
});
export type MarketSnapshot = z.infer<typeof MarketSnapshotSchema>;

// ---- Feed slices ----
export const UniverseQuoteSchema = z.object({
  ticker: z.string(), name: z.string(), sector: z.string(),
  ltp: z.number(), changePct: z.number(), volume: z.number(),
  avgVolume: z.number(), high52w: z.number(), low52w: z.number(),
});
export type UniverseQuote = z.infer<typeof UniverseQuoteSchema>;

export const IndicesSliceSchema = z.object({ indianIndices: z.array(IndexQuoteSchema), vix: VixSchema.nullable() });
export const GlobalSliceSchema = z.object({
  globalIndices: z.array(IndexQuoteSchema), commodities: z.array(SimpleQuoteSchema), currencies: z.array(CurrencyQuoteSchema),
});
export const UniverseSliceSchema = z.object({ quotes: z.array(UniverseQuoteSchema) });
export const InternalsSliceSchema = z.object({
  topGainers: z.array(MoverSchema), topLosers: z.array(MoverSchema), mostActive: z.array(ActiveSchema),
  near52wHigh: z.array(NearHighSchema), near52wLow: z.array(NearLowSchema),
  volumeShockers: z.array(VolumeShockerSchema), sectorRanking: z.array(SectorRankSchema), breadth: BreadthSchema.nullable(),
});
export const NewsSliceSchema = z.object({ news: z.array(NewsGroupSchema), streetRecommendations: z.array(StreetRecSchema) });
export const FlowsSliceSchema = z.object({
  fiiDii: FiiDiiSchema.nullable(), corporateActions: z.array(CorpActionSchema),
  giftNifty: GiftNiftySchema.nullable(), bondYield: BondYieldSchema.nullable(),
});
export type IndicesSlice = z.infer<typeof IndicesSliceSchema>;
export type GlobalSlice = z.infer<typeof GlobalSliceSchema>;
export type UniverseSlice = z.infer<typeof UniverseSliceSchema>;
export type InternalsSlice = z.infer<typeof InternalsSliceSchema>;
export type NewsSlice = z.infer<typeof NewsSliceSchema>;
export type FlowsSlice = z.infer<typeof FlowsSliceSchema>;
