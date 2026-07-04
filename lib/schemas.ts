import { z } from 'zod';

export const ReportTypeSchema = z.enum(['daily', 'retro', 'recap', 'weekly', 'monthly', 'research']);
export type ReportType = z.infer<typeof ReportTypeSchema>;

export const SignalSchema = z.enum(['bullish', 'bearish', 'neutral']);
export type Signal = z.infer<typeof SignalSchema>;

export const BetSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  thesis: z.string(),
  action: z.enum(['buy', 'sell', 'hold']),
  signal: SignalSchema,
  confidence: z.number().min(0).max(1),
});
export type Bet = z.infer<typeof BetSchema>;

export const DailyContentSchema = z.object({
  snapshot: z.lazy(() => MarketSnapshotSchema),
  outlook: z.string(),
  keyTakeaways: z.array(z.string()),
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

export const RetroContentSchema = z.object({
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
export type RetroContent = z.infer<typeof RetroContentSchema>;

export const GradedBetSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  thesis: z.string(),
  action: z.enum(['buy', 'sell', 'hold']),
  entryRef: z.number(),
  exitRef: z.number(),
  changePct: z.number(),
  outcome: z.enum(['hit', 'miss', 'partial']),
  note: z.string(),
});
export type GradedBet = z.infer<typeof GradedBetSchema>;

export const LearningLoopSchema = z.object({
  worked: z.array(z.string()),
  missed: z.array(z.string()),
});
export type LearningLoop = z.infer<typeof LearningLoopSchema>;

export const RecapContentSchema = z.object({
  period: z.string(),          // the weekly period graded, e.g. '2026-W24'
  sourceReportId: z.string(),  // the weekly report whose bets were graded
  graded: z.array(GradedBetSchema),
  hits: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  summary: z.string(),
  learnings: LearningLoopSchema.default({ worked: [], missed: [] }),
});
export type RecapContent = z.infer<typeof RecapContentSchema>;

export const LedgerEntrySchema = z.object({
  gradedOn: z.string(),        // YYYY-MM-DD (the Saturday that graded it)
  sourceReportId: z.string(),
  bets: z.array(GradedBetSchema),
  hits: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;

export const LedgerSchema = z.object({
  month: z.string(),           // '2026-06'
  entries: z.array(LedgerEntrySchema),
  summary: z.string().nullable(),
});
export type Ledger = z.infer<typeof LedgerSchema>;

export const ResearchRequestSchema = z.string().min(1);
export type ResearchRequest = z.infer<typeof ResearchRequestSchema>;

const OneLineStringSchema = z.string().min(1).transform((value) => value.replace(/\s+/g, ' ').trim());

const ResearchBulletsSchema = z.preprocess(
  (value) => {
    if (typeof value === 'string') return [value];
    return value;
  },
  z.array(OneLineStringSchema).min(1).max(3),
);

export const ResearchMetricSchema = z.object({
  label: OneLineStringSchema,
  value: OneLineStringSchema,
});
export type ResearchMetric = z.infer<typeof ResearchMetricSchema>;

export const ResearchContentSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  asOf: z.string(),
  price: z.number(),
  metrics: z.array(ResearchMetricSchema).default([]),
  fundamental: ResearchBulletsSchema,
  technical: ResearchBulletsSchema,
  sentiment: ResearchBulletsSchema,
  recommendation: z.object({
    action: z.enum(['buy', 'sell', 'hold']),
    reasoning: OneLineStringSchema,
    confidence: z.number().min(0).max(1),
  }),
});
export type ResearchContent = z.infer<typeof ResearchContentSchema>;

export const ResearchReportContentSchema = z.object({
  items: z.array(ResearchContentSchema).min(1),
});
export type ResearchReportContent = z.infer<typeof ResearchReportContentSchema>;

export const PortfolioHoldingSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  exchange: z.string(),
  quantity: z.number().nonnegative(),
  averagePrice: z.number().nonnegative(),
  lastPrice: z.number().nonnegative(),
  investedValue: z.number().nonnegative(),
  currentValue: z.number().nonnegative(),
  pnl: z.number(),
  pnlPct: z.number(),
  dayChange: z.number(),
  dayChangePct: z.number(),
  allocationPct: z.number().nonnegative(),
});
export type PortfolioHolding = z.infer<typeof PortfolioHoldingSchema>;

export const PortfolioSummarySchema = z.object({
  investedValue: z.number().nonnegative(),
  currentValue: z.number().nonnegative(),
  pnl: z.number(),
  pnlPct: z.number(),
  dayChange: z.number(),
  dayChangePct: z.number(),
});
export type PortfolioSummary = z.infer<typeof PortfolioSummarySchema>;

export const PortfolioSchema = z.object({
  asOf: z.string(),
  source: z.enum(['manual', 'kite']),
  holdings: z.array(PortfolioHoldingSchema),
  summary: PortfolioSummarySchema,
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

// ---- Phase 3 content schemas ----
export const WeeklyContentSchema = z.object({
  snapshot: MarketSnapshotSchema,
  themes: z.array(z.string()),
  positionalBets: z.array(BetSchema),
});
export type WeeklyContent = z.infer<typeof WeeklyContentSchema>;

export const LedgerRollupSchema = z.object({
  hits: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  summary: z.string(),
  learnings: LearningLoopSchema.default({ worked: [], missed: [] }),
});

export const MonthlyContentSchema = z.object({
  snapshot: MarketSnapshotSchema,
  sectorInsights: z.array(z.string()),
  macroThemes: z.array(z.string()),
  midTermBets: z.array(BetSchema),
  ledgerRollup: LedgerRollupSchema.nullable(),
});
export type MonthlyContent = z.infer<typeof MonthlyContentSchema>;

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
