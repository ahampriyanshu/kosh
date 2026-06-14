import { z } from 'zod';

export const ReportTypeSchema = z.enum(['morning', 'midsession', 'weekly', 'monthly']);
export type ReportType = z.infer<typeof ReportTypeSchema>;

export const SignalSchema = z.enum(['bullish', 'bearish', 'neutral']);
export type Signal = z.infer<typeof SignalSchema>;

export const MorningContentSchema = z.object({
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
export type MorningContent = z.infer<typeof MorningContentSchema>;

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
  // string-keyed (not enum-keyed) so a partial map like { morning: "..." } types cleanly
  latest: z.record(z.string(), z.string()).default({}),
});
export type Manifest = z.infer<typeof ManifestSchema>;
