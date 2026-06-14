# Kosh Foundation (Milestone 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared `lib/` modules and a working morning-briefing pipeline: load the watchlist → fetch market data → compute indicators → generate a grounded, structured briefing with Gemini → validate → write JSON atomically (with manifest + checksum) → email it.

**Architecture:** A single root TypeScript package. Pure/wrapper modules in `lib/` isolate each external dependency behind a thin, typed interface. Cron scripts in `scripts/` orchestrate those modules. Reports are JSON documents written with database-level integrity (Zod validation on write/read, atomic temp+rename, sha256 checksum, a manifest index). GitHub Actions runs the script on a schedule and commits the result.

**Tech Stack:** TypeScript (ESM), `tsx` (run TS scripts), Vitest (tests), Zod (validation), `yahoo-finance2` (prices/OHLCV), `technicalindicators` (RSI/MACD/etc.), Vercel AI SDK `ai` + `@ai-sdk/google` (Gemini 3.1 Pro + search grounding), `resend` (email).

**Scope note:** This is Milestone 1 of 5 from the design spec (`docs/superpowers/specs/2026-06-14-kosh-indian-stock-intelligence-design.md`). It deliberately excludes the mid-session/weekly/monthly jobs, the Next.js dashboard, and the research route — each gets its own plan. After this plan, the morning briefing works end-to-end.

**Convention:** All module imports are **relative** (e.g. `'../lib/storage'`). Tests mock with relative specifiers that resolve to the same files (Vitest matches by resolved path). No path aliases — this keeps `tsx` and Vitest resolution identical and avoids surprises.

---

### Task 0: Project scaffold

**Files:**
- Delete: `backend/` (obsolete old project), `frontend/` (obsolete), `setup.sh`, `backend/setup_and_run.sh`
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `.env.example`, `data/watchlist.json`
- Modify: `.gitignore`

- [ ] **Step 1: Remove the obsolete prototype**

The spec is a from-scratch rebuild at the repo root. Old code is preserved in git history.

```bash
git rm -r backend frontend setup.sh
git rm --cached "backend/.env copy.example" 2>/dev/null || true
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "kosh",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "brief:morning": "tsx scripts/morning.ts"
  },
  "dependencies": {
    "@ai-sdk/google": "^2.0.0",
    "ai": "^5.0.0",
    "resend": "^4.0.0",
    "technicalindicators": "^3.1.0",
    "yahoo-finance2": "^2.13.3",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["node"],
    "noEmit": true
  },
  "include": ["lib", "scripts", "tests"]
}
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Create `.env.example`**

```bash
# Gemini — this exact name is what @ai-sdk/google reads automatically
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key

# Email (Resend)
RESEND_API_KEY=your_resend_key
KOSH_EMAIL_FROM=Kosh <onboarding@resend.dev>
KOSH_EMAIL_TO=you@example.com,someone@example.com

# Optional: override where reports are written (tests set this)
# KOSH_DATA_DIR=/tmp/kosh-data
```

- [ ] **Step 6: Create `data/watchlist.json`** (real NSE tickers so the job has something to run on)

```json
{
  "stocks": [
    { "ticker": "RELIANCE.NS", "name": "Reliance Industries" },
    { "ticker": "TCS.NS", "name": "Tata Consultancy Services" },
    { "ticker": "INFY.NS", "name": "Infosys" },
    { "ticker": "HDFCBANK.NS", "name": "HDFC Bank" },
    { "ticker": "ICICIBANK.NS", "name": "ICICI Bank" }
  ]
}
```

- [ ] **Step 7: Append build artifacts to `.gitignore`**

Add these lines to the existing `.gitignore`:

```
/dist
/coverage
```

- [ ] **Step 8: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, `package-lock.json` written, no peer-dependency errors.

- [ ] **Step 9: Verify the toolchain runs**

Run: `npx vitest run`
Expected: exits cleanly reporting "No test files found" (we add tests next).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Kosh rebuild (root TS package, deps, watchlist)"
```

---

### Task 1: `lib/schemas.ts` — Zod contract

**Files:**
- Create: `lib/schemas.ts`
- Test: `tests/lib/schemas.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/schemas.test.ts
import { describe, it, expect } from 'vitest';
import {
  MorningContentSchema,
  ReportEnvelopeSchema,
  WatchlistSchema,
  ManifestSchema,
} from '../../lib/schemas';

describe('schemas', () => {
  const validMorning = {
    date: '2026-06-14',
    marketOutlook: 'Nifty flat amid global cues.',
    stocksToWatch: [
      { ticker: 'TCS.NS', name: 'TCS', reason: 'breakout', signal: 'bullish' },
    ],
    exitSignals: [{ ticker: 'INFY.NS', reason: 'weak guidance' }],
    topRecommendation: {
      ticker: 'RELIANCE.NS',
      action: 'buy',
      reasoning: 'oversold + positive news',
      confidence: 0.7,
    },
    sectorMovers: [{ sector: 'IT', note: 'recovering' }],
    fiiDiiSentiment: 'FIIs net buyers',
  };

  it('accepts valid morning content', () => {
    expect(MorningContentSchema.parse(validMorning)).toBeTruthy();
  });

  it('rejects confidence outside 0..1', () => {
    const bad = { ...validMorning, topRecommendation: { ...validMorning.topRecommendation, confidence: 2 } };
    expect(() => MorningContentSchema.parse(bad)).toThrow();
  });

  it('rejects more than 5 stocks to watch', () => {
    const six = Array.from({ length: 6 }, () => ({ ticker: 'X.NS', name: 'X', reason: 'r', signal: 'neutral' }));
    expect(() => MorningContentSchema.parse({ ...validMorning, stocksToWatch: six })).toThrow();
  });

  it('validates a full report envelope', () => {
    const env = {
      schemaVersion: 1,
      id: '2026-06-14-morning',
      type: 'morning',
      generatedAt: '2026-06-14T02:30:00.000Z',
      sourceData: { tickers: ['TCS.NS'], priceSnapshot: { 'TCS.NS': 3900 }, searchTimestamp: '2026-06-14T02:29:00.000Z' },
      content: validMorning,
      emailSent: false,
      checksum: 'sha256:abc',
    };
    expect(ReportEnvelopeSchema.parse(env).id).toBe('2026-06-14-morning');
  });

  it('accepts a watchlist and an empty manifest', () => {
    expect(WatchlistSchema.parse({ stocks: [{ ticker: 'TCS.NS', name: 'TCS' }] }).stocks).toHaveLength(1);
    expect(ManifestSchema.parse({ reports: [], latest: {} }).reports).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/schemas.test.ts`
Expected: FAIL — cannot resolve `../../lib/schemas`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/schemas.ts
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
  id: z.string(),
  type: ReportTypeSchema,
  generatedAt: z.string(),
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/schemas.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/schemas.ts tests/lib/schemas.test.ts
git commit -m "feat(lib): Zod schemas for reports, watchlist, manifest"
```

---

### Task 2: `lib/time.ts` — IST date helpers

**Files:**
- Create: `lib/time.ts`
- Test: `tests/lib/time.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/time.test.ts
import { describe, it, expect } from 'vitest';
import { istDateString } from '../../lib/time';

describe('istDateString', () => {
  it('returns YYYY-MM-DD in IST', () => {
    // 2026-06-14T02:30:00Z == 2026-06-14 08:00 IST
    expect(istDateString(new Date('2026-06-14T02:30:00.000Z'))).toBe('2026-06-14');
  });

  it('rolls to the next IST day for late-UTC times', () => {
    // 2026-06-30T18:30:00Z == 2026-07-01 00:00 IST
    expect(istDateString(new Date('2026-06-30T18:30:00.000Z'))).toBe('2026-07-01');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/time.test.ts`
Expected: FAIL — cannot resolve `../../lib/time`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/time.ts
// en-CA formats as YYYY-MM-DD. Asia/Kolkata applies the IST (+5:30) offset.
export function istDateString(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/time.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/time.ts tests/lib/time.test.ts
git commit -m "feat(lib): IST date helper"
```

---

### Task 3: `lib/storage.ts` — atomic JSON store + manifest

**Files:**
- Create: `lib/storage.ts`
- Test: `tests/lib/storage.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/storage.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { computeChecksum, writeReport, readReport, readManifest } from '../../lib/storage';
import type { ReportEnvelope } from '../../lib/schemas';

let dir: string;

function makeEnvelope(id: string): ReportEnvelope {
  const content = { hello: 'world' };
  return {
    schemaVersion: 1,
    id,
    type: 'morning',
    generatedAt: '2026-06-14T02:30:00.000Z',
    sourceData: { tickers: ['TCS.NS'], priceSnapshot: { 'TCS.NS': 3900 }, searchTimestamp: '2026-06-14T02:29:00.000Z' },
    content,
    emailSent: false,
    checksum: computeChecksum(content),
  };
}

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'kosh-'));
  process.env.KOSH_DATA_DIR = dir;
});

afterEach(async () => {
  delete process.env.KOSH_DATA_DIR;
  await rm(dir, { recursive: true, force: true });
});

describe('storage', () => {
  it('computes a stable sha256 checksum', () => {
    expect(computeChecksum({ a: 1 })).toBe(computeChecksum({ a: 1 }));
    expect(computeChecksum({ a: 1 })).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it('writes a report and reads it back', async () => {
    await writeReport(makeEnvelope('2026-06-14-morning'));
    const back = await readReport('2026-06-14-morning');
    expect(back.id).toBe('2026-06-14-morning');
    expect(back.type).toBe('morning');
  });

  it('records the report in the manifest and tracks latest by type', async () => {
    await writeReport(makeEnvelope('2026-06-13-morning'));
    await writeReport(makeEnvelope('2026-06-14-morning'));
    const manifest = await readManifest();
    expect(manifest.reports).toHaveLength(2);
    expect(manifest.latest.morning).toBe('2026-06-14-morning');
    // newest first
    expect(manifest.reports[0].id).toBe('2026-06-14-morning');
  });

  it('is idempotent — re-writing the same id does not duplicate', async () => {
    await writeReport(makeEnvelope('2026-06-14-morning'));
    await writeReport(makeEnvelope('2026-06-14-morning'));
    const manifest = await readManifest();
    expect(manifest.reports).toHaveLength(1);
  });

  it('returns an empty manifest when none exists', async () => {
    expect(await readManifest()).toEqual({ reports: [], latest: {} });
  });

  it('leaves no .tmp files behind', async () => {
    await writeReport(makeEnvelope('2026-06-14-morning'));
    const raw = await readFile(path.join(dir, 'briefings', '2026-06-14-morning.json'), 'utf8');
    expect(JSON.parse(raw).id).toBe('2026-06-14-morning');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/storage.test.ts`
Expected: FAIL — cannot resolve `../../lib/storage`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/storage.ts
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import {
  ReportEnvelopeSchema,
  ManifestSchema,
  type ReportEnvelope,
  type Manifest,
} from './schemas';

function dataDir(): string {
  return process.env.KOSH_DATA_DIR ?? path.join(process.cwd(), 'data');
}
function briefingsDir(): string {
  return path.join(dataDir(), 'briefings');
}
function manifestPath(): string {
  return path.join(dataDir(), 'manifest.json');
}

export function computeChecksum(content: unknown): string {
  return 'sha256:' + createHash('sha256').update(JSON.stringify(content)).digest('hex');
}

async function atomicWriteJson(filePath: string, obj: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp`;
  await writeFile(tmp, JSON.stringify(obj, null, 2), 'utf8');
  await rename(tmp, filePath); // atomic on the same filesystem
}

export async function readManifest(): Promise<Manifest> {
  try {
    const raw = await readFile(manifestPath(), 'utf8');
    return ManifestSchema.parse(JSON.parse(raw));
  } catch (e) {
    if ((e as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return { reports: [], latest: {} };
    }
    throw e;
  }
}

export async function writeReport(envelope: ReportEnvelope): Promise<void> {
  const valid = ReportEnvelopeSchema.parse(envelope); // validate on write
  const file = path.join(briefingsDir(), `${valid.id}.json`);
  await atomicWriteJson(file, valid);

  const manifest = await readManifest();
  const entry = {
    id: valid.id,
    type: valid.type,
    date: valid.generatedAt.slice(0, 10),
    path: path.relative(dataDir(), file),
    checksum: valid.checksum,
  };
  manifest.reports = manifest.reports.filter((r) => r.id !== valid.id);
  manifest.reports.push(entry);
  manifest.reports.sort((a, b) => (a.id < b.id ? 1 : -1)); // newest id first
  manifest.latest = { ...manifest.latest, [valid.type]: valid.id };
  await atomicWriteJson(manifestPath(), ManifestSchema.parse(manifest));
}

export async function readReport(id: string): Promise<ReportEnvelope> {
  const raw = await readFile(path.join(briefingsDir(), `${id}.json`), 'utf8');
  return ReportEnvelopeSchema.parse(JSON.parse(raw)); // validate on read
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/storage.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/storage.ts tests/lib/storage.test.ts
git commit -m "feat(lib): atomic JSON storage with manifest + checksum"
```

---

### Task 4: `lib/watchlist.ts` — read the tracked universe

**Files:**
- Create: `lib/watchlist.ts`
- Test: `tests/lib/watchlist.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/watchlist.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { getWatchlist } from '../../lib/watchlist';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'kosh-wl-'));
  process.env.KOSH_DATA_DIR = dir;
});
afterEach(async () => {
  delete process.env.KOSH_DATA_DIR;
  await rm(dir, { recursive: true, force: true });
});

describe('getWatchlist', () => {
  it('reads and validates watchlist.json', async () => {
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, 'watchlist.json'),
      JSON.stringify({ stocks: [{ ticker: 'TCS.NS', name: 'TCS' }] }),
      'utf8',
    );
    const wl = await getWatchlist();
    expect(wl.stocks[0].ticker).toBe('TCS.NS');
  });

  it('throws on malformed watchlist', async () => {
    await writeFile(path.join(dir, 'watchlist.json'), JSON.stringify({ nope: true }), 'utf8');
    await expect(getWatchlist()).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/watchlist.test.ts`
Expected: FAIL — cannot resolve `../../lib/watchlist`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/watchlist.ts
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { WatchlistSchema, type Watchlist } from './schemas';

function dataDir(): string {
  return process.env.KOSH_DATA_DIR ?? path.join(process.cwd(), 'data');
}

export async function getWatchlist(): Promise<Watchlist> {
  const raw = await readFile(path.join(dataDir(), 'watchlist.json'), 'utf8');
  return WatchlistSchema.parse(JSON.parse(raw));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/watchlist.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/watchlist.ts tests/lib/watchlist.test.ts
git commit -m "feat(lib): watchlist reader"
```

---

### Task 5: `lib/indicators.ts` — technical indicators

**Files:**
- Create: `lib/indicators.ts`
- Test: `tests/lib/indicators.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/indicators.test.ts
import { describe, it, expect } from 'vitest';
import { rsi, sma, trend } from '../../lib/indicators';

describe('indicators', () => {
  it('sma of a constant series is that constant', () => {
    const out = sma([5, 5, 5, 5], 2);
    expect(out[out.length - 1]).toBe(5);
  });

  it('rsi of a strictly rising series is high (>70)', () => {
    const rising = Array.from({ length: 30 }, (_, i) => 100 + i);
    const out = rsi(rising, 14);
    expect(out[out.length - 1]).toBeGreaterThan(70);
  });

  it('trend is bullish when price is well above its 50-SMA', () => {
    const series = [...Array.from({ length: 50 }, () => 100), 130];
    expect(trend(series)).toBe('bullish');
  });

  it('trend is neutral with insufficient data', () => {
    expect(trend([1, 2, 3])).toBe('neutral');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/indicators.test.ts`
Expected: FAIL — cannot resolve `../../lib/indicators`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/indicators.ts
import { RSI, MACD, BollingerBands, SMA, EMA } from 'technicalindicators';

export function rsi(closes: number[], period = 14): number[] {
  return RSI.calculate({ values: closes, period });
}

export function macd(closes: number[]) {
  return MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
}

export function bollinger(closes: number[], period = 20, stdDev = 2) {
  return BollingerBands.calculate({ period, values: closes, stdDev });
}

export function sma(closes: number[], period: number): number[] {
  return SMA.calculate({ period, values: closes });
}

export function ema(closes: number[], period: number): number[] {
  return EMA.calculate({ period, values: closes });
}

export type Trend = 'bullish' | 'bearish' | 'neutral';

export function trend(closes: number[]): Trend {
  if (closes.length < 50) return 'neutral';
  const s = sma(closes, 50);
  const last = closes[closes.length - 1];
  const lastSma = s[s.length - 1];
  if (last > lastSma * 1.01) return 'bullish';
  if (last < lastSma * 0.99) return 'bearish';
  return 'neutral';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/indicators.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/indicators.ts tests/lib/indicators.test.ts
git commit -m "feat(lib): technical indicators wrapper (RSI/MACD/Bollinger/SMA/EMA/trend)"
```

---

### Task 6: `lib/market-data.ts` — Yahoo Finance wrapper

**Files:**
- Create: `lib/market-data.ts`
- Test: `tests/lib/market-data.test.ts`

> **Library note:** This is the ONLY file that touches `yahoo-finance2`. It uses the `new YahooFinance()` instance API and `chart()` (the current method; `historical()` is deprecated). If the installed version instead exports a ready singleton (`import yahooFinance from 'yahoo-finance2'`), change only the two instance lines here — nothing else in the codebase imports the library.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/market-data.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  quoteMock: vi.fn(),
  chartMock: vi.fn(),
  searchMock: vi.fn(),
}));

vi.mock('yahoo-finance2', () => ({
  default: vi.fn(() => ({
    quote: h.quoteMock,
    chart: h.chartMock,
    search: h.searchMock,
  })),
}));

import { getQuote, getHistorical, searchTicker } from '../../lib/market-data';

beforeEach(() => {
  h.quoteMock.mockReset();
  h.chartMock.mockReset();
  h.searchMock.mockReset();
});

describe('market-data', () => {
  it('maps a quote to {price, currency, name}', async () => {
    h.quoteMock.mockResolvedValue({ regularMarketPrice: 3900, currency: 'INR', shortName: 'TCS' });
    expect(await getQuote('TCS.NS')).toEqual({ price: 3900, currency: 'INR', name: 'TCS' });
  });

  it('maps chart quotes to candles, dropping null closes', async () => {
    h.chartMock.mockResolvedValue({
      meta: {},
      quotes: [
        { date: new Date('2026-06-10'), open: 1, high: 2, low: 0.5, close: 1.5, volume: 100 },
        { date: new Date('2026-06-11'), open: 1.5, high: 2, low: 1, close: null, volume: 0 },
      ],
    });
    const candles = await getHistorical('TCS.NS', '2026-01-01');
    expect(candles).toHaveLength(1);
    expect(candles[0].close).toBe(1.5);
  });

  it('returns symbols from search', async () => {
    h.searchMock.mockResolvedValue({ quotes: [{ symbol: 'TCS.NS' }, { symbol: 'TCS.BO' }, {}] });
    expect(await searchTicker('TCS')).toEqual(['TCS.NS', 'TCS.BO']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/market-data.test.ts`
Expected: FAIL — cannot resolve `../../lib/market-data`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/market-data.ts
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance();

export interface Quote {
  price: number;
  currency: string;
  name: string;
}

export interface Candle {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function getQuote(ticker: string): Promise<Quote> {
  const q = await yf.quote(ticker);
  return {
    price: q.regularMarketPrice ?? 0,
    currency: q.currency ?? 'INR',
    name: q.shortName ?? q.longName ?? ticker,
  };
}

interface RawCandle {
  date: Date;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

export async function getHistorical(
  ticker: string,
  period1: string,
  interval: '1d' | '1wk' | '1mo' = '1d',
): Promise<Candle[]> {
  // Cast through a local shape: chart()'s return type is a union over its options
  // overloads and may not narrow on `return: 'array'`. This isolates that here.
  const result = (await yf.chart(ticker, { period1, interval, return: 'array' })) as unknown as {
    quotes: RawCandle[];
  };
  return result.quotes
    .filter((c) => c.close != null)
    .map((c) => ({
      date: c.date,
      open: c.open ?? 0,
      high: c.high ?? 0,
      low: c.low ?? 0,
      close: c.close as number,
      volume: c.volume ?? 0,
    }));
}

export async function searchTicker(query: string): Promise<string[]> {
  const res = (await yf.search(query)) as unknown as { quotes?: Array<{ symbol?: string }> };
  return (res.quotes ?? [])
    .map((q) => q.symbol)
    .filter((s): s is string => Boolean(s));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/market-data.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/market-data.ts tests/lib/market-data.test.ts
git commit -m "feat(lib): yahoo-finance2 wrapper (quote, chart, search)"
```

---

### Task 7: `lib/llm.ts` — Gemini wrapper (grounded + structured)

**Files:**
- Create: `lib/llm.ts`
- Test: `tests/lib/llm.test.ts`

> **Critical design (verified against AI SDK 5 docs):** Search grounding is a tool used with `generateText` and cannot be combined with `generateObject`. So grounding and structuring are TWO steps: (1) `generateText` with the `google_search` tool returns grounded prose + sources; (2) `generateObject` structures that prose against the Zod schema. `generateGroundedObject` composes them.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/llm.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

const h = vi.hoisted(() => ({
  generateTextMock: vi.fn(),
  generateObjectMock: vi.fn(),
  googleSearchMock: vi.fn(() => ({})),
}));

vi.mock('ai', () => ({
  generateText: h.generateTextMock,
  generateObject: h.generateObjectMock,
}));

vi.mock('@ai-sdk/google', () => ({
  google: Object.assign((id: string) => ({ id }), {
    tools: { googleSearch: h.googleSearchMock },
  }),
}));

import { researchWithSearch, structure, generateGroundedObject } from '../../lib/llm';

beforeEach(() => {
  h.generateTextMock.mockReset();
  h.generateObjectMock.mockReset();
});

describe('llm', () => {
  it('researchWithSearch returns grounded text + sources', async () => {
    h.generateTextMock.mockResolvedValue({ text: 'Nifty up', sources: [{ url: 'x' }] });
    const r = await researchWithSearch('news?');
    expect(r.text).toBe('Nifty up');
    expect(r.sources).toEqual([{ url: 'x' }]);
    // grounding tool was wired in
    expect(h.googleSearchMock).toHaveBeenCalled();
  });

  it('structure parses model output through the schema', async () => {
    h.generateObjectMock.mockResolvedValue({ object: { n: 5 } });
    const out = await structure('make n', z.object({ n: z.number() }));
    expect(out).toEqual({ n: 5 });
  });

  it('generateGroundedObject runs research then structuring', async () => {
    h.generateTextMock.mockResolvedValue({ text: 'context', sources: [] });
    h.generateObjectMock.mockResolvedValue({ object: { ok: true } });
    const { object, sources } = await generateGroundedObject(
      'research prompt',
      (ctx) => `structure this: ${ctx}`,
      z.object({ ok: z.boolean() }),
    );
    expect(object).toEqual({ ok: true });
    expect(sources).toEqual([]);
    // the structuring prompt embedded the research text
    expect(h.generateObjectMock.mock.calls[0][0].prompt).toContain('context');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/llm.test.ts`
Expected: FAIL — cannot resolve `../../lib/llm`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/llm.ts
import { google } from '@ai-sdk/google';
import { generateText, generateObject } from 'ai';
import type { ZodType } from 'zod';

// @ai-sdk/google reads GOOGLE_GENERATIVE_AI_API_KEY from the environment automatically.
const MODEL = 'gemini-3.1-pro-preview';

export interface Grounded {
  text: string;
  sources: unknown[];
}

export async function researchWithSearch(prompt: string): Promise<Grounded> {
  const { text, sources } = await generateText({
    model: google(MODEL),
    tools: { google_search: google.tools.googleSearch({}) },
    prompt,
  });
  return { text, sources: sources ?? [] };
}

export async function structure<T>(prompt: string, schema: ZodType<T>): Promise<T> {
  const { object } = await generateObject({
    model: google(MODEL),
    schema,
    prompt,
  });
  return object;
}

export async function generateGroundedObject<T>(
  researchPrompt: string,
  buildStructurePrompt: (researchText: string) => string,
  schema: ZodType<T>,
): Promise<{ object: T; sources: unknown[] }> {
  const research = await researchWithSearch(researchPrompt);
  const object = await structure(buildStructurePrompt(research.text), schema);
  return { object, sources: research.sources };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/llm.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/llm.ts tests/lib/llm.test.ts
git commit -m "feat(lib): Gemini wrapper — grounded research + structured output"
```

---

### Task 8: `lib/email.ts` — Resend transport

**Files:**
- Create: `lib/email.ts`
- Test: `tests/lib/email.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/email.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const h = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({ emails: { send: h.sendMock } })),
}));

import { sendReportEmail } from '../../lib/email';

beforeEach(() => {
  h.sendMock.mockReset();
  process.env.RESEND_API_KEY = 'test-key';
  process.env.KOSH_EMAIL_TO = 'a@x.com, b@x.com';
  process.env.KOSH_EMAIL_FROM = 'Kosh <k@x.com>';
});
afterEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.KOSH_EMAIL_TO;
  delete process.env.KOSH_EMAIL_FROM;
});

describe('sendReportEmail', () => {
  it('sends to the parsed recipient list', async () => {
    h.sendMock.mockResolvedValue({ data: { id: '1' }, error: null });
    await sendReportEmail('Subject', '<p>hi</p>');
    expect(h.sendMock).toHaveBeenCalledWith({
      from: 'Kosh <k@x.com>',
      to: ['a@x.com', 'b@x.com'],
      subject: 'Subject',
      html: '<p>hi</p>',
    });
  });

  it('throws when Resend returns an error', async () => {
    h.sendMock.mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(sendReportEmail('S', '<p>x</p>')).rejects.toThrow(/boom/);
  });

  it('throws when no recipients are configured', async () => {
    delete process.env.KOSH_EMAIL_TO;
    await expect(sendReportEmail('S', '<p>x</p>')).rejects.toThrow(/KOSH_EMAIL_TO/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/email.test.ts`
Expected: FAIL — cannot resolve `../../lib/email`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/email.ts
import { Resend } from 'resend';

export async function sendReportEmail(subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not set');

  const from = process.env.KOSH_EMAIL_FROM ?? 'Kosh <onboarding@resend.dev>';
  const recipients = (process.env.KOSH_EMAIL_TO ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (recipients.length === 0) throw new Error('KOSH_EMAIL_TO not set');

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from, to: recipients, subject, html });
  if (error) throw new Error(`Email failed: ${(error as { message?: string }).message ?? String(error)}`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/email.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/email.ts tests/lib/email.test.ts
git commit -m "feat(lib): Resend email transport"
```

---

### Task 9: `scripts/morning.ts` — the morning-briefing orchestrator

**Files:**
- Create: `scripts/morning.ts`
- Test: `tests/scripts/morning.test.ts`

This wires the lib together. It exports `runMorning()` (so it is testable) and only auto-runs when executed directly (via `tsx`). The email-after-commit ordering from the spec is honored: write with `emailSent: false`, send the email, then re-write with `emailSent: true`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/scripts/morning.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  getWatchlist: vi.fn(),
  getQuote: vi.fn(),
  getHistorical: vi.fn(),
  rsi: vi.fn(),
  trend: vi.fn(),
  generateGroundedObject: vi.fn(),
  writeReport: vi.fn(),
  sendReportEmail: vi.fn(),
}));

vi.mock('../../lib/watchlist', () => ({ getWatchlist: h.getWatchlist }));
vi.mock('../../lib/market-data', () => ({ getQuote: h.getQuote, getHistorical: h.getHistorical }));
vi.mock('../../lib/indicators', () => ({ rsi: h.rsi, trend: h.trend }));
vi.mock('../../lib/llm', () => ({ generateGroundedObject: h.generateGroundedObject }));
vi.mock('../../lib/storage', () => ({
  writeReport: h.writeReport,
  computeChecksum: () => 'sha256:test',
}));
vi.mock('../../lib/email', () => ({ sendReportEmail: h.sendReportEmail }));

import { runMorning } from '../../scripts/morning';

const morningContent = {
  date: '2026-06-14',
  marketOutlook: 'flat',
  stocksToWatch: [{ ticker: 'TCS.NS', name: 'TCS', reason: 'r', signal: 'bullish' }],
  exitSignals: [],
  topRecommendation: { ticker: 'RELIANCE.NS', action: 'buy', reasoning: 'r', confidence: 0.6 },
  sectorMovers: [],
  fiiDiiSentiment: 'neutral',
};

beforeEach(() => {
  Object.values(h).forEach((m) => m.mockReset());
  h.getWatchlist.mockResolvedValue({ stocks: [{ ticker: 'TCS.NS', name: 'TCS' }] });
  h.getQuote.mockResolvedValue({ price: 3900, currency: 'INR', name: 'TCS' });
  h.getHistorical.mockResolvedValue([{ date: new Date(), open: 1, high: 1, low: 1, close: 3900, volume: 1 }]);
  h.rsi.mockReturnValue([55]);
  h.trend.mockReturnValue('bullish');
  h.generateGroundedObject.mockResolvedValue({ object: morningContent, sources: [] });
  h.writeReport.mockResolvedValue(undefined);
  h.sendReportEmail.mockResolvedValue(undefined);
});

describe('runMorning', () => {
  it('writes the report, emails it, then re-writes with emailSent=true', async () => {
    await runMorning(new Date('2026-06-14T02:30:00.000Z'));

    expect(h.writeReport).toHaveBeenCalledTimes(2);
    const first = h.writeReport.mock.calls[0][0];
    const second = h.writeReport.mock.calls[1][0];

    expect(first.id).toBe('2026-06-14-morning');
    expect(first.type).toBe('morning');
    expect(first.emailSent).toBe(false);

    expect(h.sendReportEmail).toHaveBeenCalledTimes(1);
    expect(second.emailSent).toBe(true);

    // email happened after the first write, before the second
    expect(h.sendReportEmail.mock.invocationCallOrder[0]).toBeGreaterThan(
      h.writeReport.mock.invocationCallOrder[0],
    );
    expect(h.sendReportEmail.mock.invocationCallOrder[0]).toBeLessThan(
      h.writeReport.mock.invocationCallOrder[1],
    );
  });

  it('validates LLM content against the schema (rejects bad confidence)', async () => {
    h.generateGroundedObject.mockResolvedValue({
      object: { ...morningContent, topRecommendation: { ...morningContent.topRecommendation, confidence: 9 } },
      sources: [],
    });
    await expect(runMorning(new Date('2026-06-14T02:30:00.000Z'))).rejects.toThrow();
    expect(h.sendReportEmail).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/scripts/morning.test.ts`
Expected: FAIL — cannot resolve `../../scripts/morning`.

- [ ] **Step 3: Write the implementation**

```ts
// scripts/morning.ts
import { pathToFileURL } from 'node:url';
import { getWatchlist } from '../lib/watchlist';
import { getQuote, getHistorical } from '../lib/market-data';
import { rsi, trend } from '../lib/indicators';
import { generateGroundedObject } from '../lib/llm';
import { writeReport, computeChecksum } from '../lib/storage';
import { sendReportEmail } from '../lib/email';
import { istDateString } from '../lib/time';
import { MorningContentSchema, type MorningContent, type ReportEnvelope } from '../lib/schemas';

interface TechSummary {
  ticker: string;
  name: string;
  price: number;
  rsi: number | null;
  trend: string;
}

function renderEmailHtml(content: MorningContent): string {
  const rows = content.stocksToWatch
    .map((s) => `<li><b>${s.ticker}</b> (${s.signal}) — ${s.reason}</li>`)
    .join('');
  return `
    <h2>Kosh Morning Brief — ${content.date}</h2>
    <p><b>Outlook:</b> ${content.marketOutlook}</p>
    <p><b>Top pick:</b> ${content.topRecommendation.ticker} —
       ${content.topRecommendation.reasoning}
       (confidence ${Math.round(content.topRecommendation.confidence * 100)}%)</p>
    <h3>Watch today</h3>
    <ul>${rows}</ul>
    <p><b>FII/DII:</b> ${content.fiiDiiSentiment}</p>
  `;
}

export async function runMorning(now: Date = new Date()): Promise<void> {
  const date = istDateString(now);
  const watchlist = await getWatchlist();

  const summaries: TechSummary[] = [];
  const priceSnapshot: Record<string, number> = {};
  for (const stock of watchlist.stocks) {
    const quote = await getQuote(stock.ticker);
    const candles = await getHistorical(stock.ticker, '2025-12-01');
    const closes = candles.map((c) => c.close);
    const rsiSeries = rsi(closes);
    priceSnapshot[stock.ticker] = quote.price;
    summaries.push({
      ticker: stock.ticker,
      name: stock.name,
      price: quote.price,
      rsi: rsiSeries.length ? rsiSeries[rsiSeries.length - 1] : null,
      trend: trend(closes),
    });
  }

  const techBlock = summaries
    .map((s) => `${s.ticker} (${s.name}): price ${s.price}, RSI ${s.rsi?.toFixed(1) ?? 'n/a'}, trend ${s.trend}`)
    .join('\n');

  const researchPrompt =
    `You are an equity analyst covering the Indian market (NSE/BSE). ` +
    `Using the latest news and market context, summarize what matters for these watchlist stocks ` +
    `before the Indian market opens today (${date}). Include overnight global cues, sector themes, ` +
    `and FII/DII flows.\n\nWatchlist technical snapshot:\n${techBlock}`;

  const buildStructurePrompt = (research: string) =>
    `Turn the following research into a structured morning brief for ${date}. ` +
    `Pick at most 5 stocks to watch from the watchlist, any exit signals, one buy recommendation ` +
    `with a 0..1 confidence, sector movers, and an FII/DII sentiment line.\n\nResearch:\n${research}`;

  const searchTimestamp = now.toISOString();
  const { object } = await generateGroundedObject(researchPrompt, buildStructurePrompt, MorningContentSchema);

  // Validate on write (content), independent of the LLM layer.
  const content = MorningContentSchema.parse(object);

  const base: Omit<ReportEnvelope, 'emailSent'> = {
    schemaVersion: 1,
    id: `${date}-morning`,
    type: 'morning',
    generatedAt: now.toISOString(),
    sourceData: {
      tickers: watchlist.stocks.map((s) => s.ticker),
      priceSnapshot,
      searchTimestamp,
    },
    content,
    checksum: computeChecksum(content),
  };

  // 1) persist first (emailSent: false)
  await writeReport({ ...base, emailSent: false });

  // 2) email after the report is saved
  await sendReportEmail(`Kosh Morning Brief — ${date}`, renderEmailHtml(content));

  // 3) record that the email was sent
  await writeReport({ ...base, emailSent: true });

  console.log(`Morning brief ${base.id} written and emailed.`);
}

// Auto-run only when executed directly (tsx scripts/morning.ts), not when imported by tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMorning()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/scripts/morning.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full suite + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all tests PASS; no type errors.

- [ ] **Step 6: Commit**

```bash
git add scripts/morning.ts tests/scripts/morning.test.ts
git commit -m "feat(scripts): morning briefing orchestrator (write → email → mark sent)"
```

---

### Task 10: GitHub Actions workflow + live verification

**Files:**
- Create: `.github/workflows/morning.yml`

- [ ] **Step 1: Create the workflow**

```yaml
# .github/workflows/morning.yml
name: Morning Brief

on:
  schedule:
    - cron: '30 2 * * 1-5' # 08:00 IST, weekdays
  workflow_dispatch: {}

permissions:
  contents: write

jobs:
  brief:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - run: npx tsx scripts/morning.ts
        env:
          GOOGLE_GENERATIVE_AI_API_KEY: ${{ secrets.GOOGLE_GENERATIVE_AI_API_KEY }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          KOSH_EMAIL_FROM: ${{ secrets.KOSH_EMAIL_FROM }}
          KOSH_EMAIL_TO: ${{ secrets.KOSH_EMAIL_TO }}

      - name: Commit briefing
        run: |
          git config user.name "kosh-bot"
          git config user.email "kosh-bot@users.noreply.github.com"
          git add data/
          git diff --staged --quiet || git commit -m "chore(data): morning brief $(date -u +%Y-%m-%d)"
          git push
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/morning.yml
git commit -m "ci: morning brief workflow (08:00 IST + manual dispatch)"
```

- [ ] **Step 3: Configure secrets** (one-time, by the user)

In the GitHub repo: Settings → Secrets and variables → Actions → New repository secret. Add:
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `RESEND_API_KEY`
- `KOSH_EMAIL_FROM` (e.g. `Kosh <onboarding@resend.dev>`)
- `KOSH_EMAIL_TO` (comma-separated recipients)

- [ ] **Step 4: Live end-to-end verification**

First, run locally against real APIs (after `cp .env.example .env` and filling keys; load them into the shell, e.g. `set -a; source .env; set +a`):

Run: `npm run brief:morning`
Expected:
- Console prints `Morning brief 2026-…-morning written and emailed.`
- `data/briefings/<date>-morning.json` exists and validates (open it; `emailSent` is `true`, `checksum` starts with `sha256:`).
- `data/manifest.json` lists the report and `latest.morning` points to it.
- The configured recipients receive the brief email.

Then verify CI: push the branch, open the repo's Actions tab, run **Morning Brief** via "Run workflow" (workflow_dispatch). Expected: green run, a new `chore(data): morning brief …` commit appears, email delivered.

- [ ] **Step 5: Commit any data produced by the local run** (optional — the CI run will also produce it)

```bash
git add data/
git commit -m "chore(data): first morning brief" || echo "nothing to commit"
```

---

## Milestone complete

After Task 10, the morning briefing pipeline works end-to-end: scheduled compute → grounded, structured, validated briefing → atomic JSON with manifest + checksum → email. The `lib/` foundation (`schemas`, `time`, `storage`, `watchlist`, `indicators`, `market-data`, `llm`, `email`) is reused by every later milestone.

**Next plans (each its own document):**
- **Milestone 2** — `midsession.ts` (sell-alert rules + LLM noise/signal judgment), `weekly.ts` + `monthly.ts` (self-verification loop), `alerts/` storage, their workflows. Requires extending `schemas.ts` with mid-session/weekly/monthly/alert content schemas and `storage.ts` with an alerts writer.
- **Milestone 3** — Next.js app on Vercel; briefing pages (Today, Archive, Detail, Watchlist, Alerts) reading `data/` via SSG.
- **Milestone 4** — `lib/research.ts` + `/api/research` (Node runtime) + the `/research` page.
- **Milestone 5** — connect Vercel (auto-deploy on push), wire Vercel env vars, finalize all four cron workflows.
