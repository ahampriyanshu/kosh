import { z } from 'zod';

export const ReportTypeSchema = z.enum(['daily', 'midsession', 'weekly', 'monthly', 'research']);
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
