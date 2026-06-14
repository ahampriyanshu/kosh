# Kosh — Indian Stock Market Intelligence

**Design spec · 2026-06-14**

## Summary

Kosh is a personal stock-intelligence tool for an Indian software developer investing in NSE/BSE stocks. It generates curated, AI-written market briefings on a schedule, emails them, and serves them from a static dashboard. The product spine is the **morning briefing**: open the app to see "what's interesting today."

The scheduled briefings need no backend server. GitHub Actions runs the compute on a cron schedule, writes results as validated JSON files committed to the repo, and emails them. A static Next.js site on GitHub Pages reads those JSON files and renders them. The one dynamic feature — on-demand single-stock research — is served by a small standalone serverless function (a Cloudflare Worker) that holds the Gemini key and runs live analysis. Cost is $0.

## Goals

- A curated morning briefing every weekday, available before the market opens.
- A mid-session evaluator that fires sell alerts when a watched stock shows unusual action.
- Weekly and monthly recaps that **verify their own past predictions** before looking forward.
- All reports persisted with database-level integrity discipline (consistency over availability).
- A dashboard to read the latest briefing and browse every past report.
- An on-demand research route: enter any ticker, get live fundamental + technical + sentiment analysis.
- Email delivery of every report to a hardcoded recipient list.
- A minimal, professional UI that loads without layout shift and looks genuinely polished.

## Non-Goals (Phase 2 — explicitly deferred)

These were discussed and intentionally pushed to a later phase, after the basic cycle works:

- CSV portfolio upload → sell suggestions.
- Interactive watchlist management UI (Phase 1 edits `watchlist.json` directly).
- Reddit/X social-signal enrichment.

The architecture must not foreclose these, but none are built now. (The on-demand single-stock research route, previously deferred, is now in scope — see *Single-Stock Research* below.)

## Users & Context

Single user (the developer). No authentication, no multi-tenancy. All schedule times are **IST**. The market is Indian: tickers resolve as `RELIANCE.NS` (NSE) or `500325.BO` (BSE) via Yahoo Finance.

## Architecture

```
Scheduled briefings (static):
GitHub Actions (cron)  →  TS compute script  →  validated JSON in data/  →  git commit + email
                                                                                    │
                                                          push to main triggers deploy.yml
                                                                                    │
                                                   Next.js static export  →  GitHub Pages
                                                                                    │
On-demand research (dynamic):              browser  ⇄  Cloudflare Worker (holds key)  ⇄  Yahoo + Gemini
```

- **Compute layer:** TypeScript scripts run by GitHub Actions. Each fetches market data, calls Gemini, validates output, writes JSON atomically, commits, and emails.
- **Data layer:** JSON files in the repo's `data/` directory. The repo *is* the document database; git history *is* the audit log.
- **Serving layer:** Next.js 15 with `output: 'export'` (fully static). Reads `data/` at build time. Hosted on GitHub Pages.
- **Dynamic layer:** A standalone Cloudflare Worker serves the single-stock research endpoint. It holds the Gemini key, reuses the shared `lib/` modules, and is called from the static frontend over HTTPS (CORS restricted to the Pages origin). It is the only always-on component; it stores nothing.
- **Intelligence:** Gemini 3.1 Pro (`gemini-3.1-pro-preview`) via the Vercel AI SDK (`@ai-sdk/google`), with Google Search grounding for real-time news, sentiment, analyst ratings, and fundamentals — no separate news or fundamentals API.

### Dependencies

| Package | Role | Key required |
|---|---|---|
| `yahoo-finance2` | Price, OHLCV (NSE/BSE) | No |
| `technicalindicators` | RSI, MACD, Bollinger, SMA/EMA | No |
| `@ai-sdk/google` + `ai` | Gemini 3.1 Pro, structured output, search grounding | Gemini |
| `zod` | Schema validation (write + read) | No |
| `resend` | Email delivery | Resend |
| `next`, `react`, `tailwindcss`, `shadcn/ui` | Static dashboard | No |
| `@ai-sdk/google` (in Worker) | Live research analysis | Gemini (Worker secret) |
| `papaparse` | CSV parsing (**Phase 2 only**) | No |

Total external API keys: **2** — `GOOGLE_AI_API_KEY`, `RESEND_API_KEY`. Stored as GitHub repository secrets for the Actions; the Gemini key is also stored as a Cloudflare Worker secret for the research endpoint.

## Schedules

All times IST. GitHub cron is UTC, so each workflow's cron expression is offset by −5:30.

| Job | When (IST) | Cron (UTC) | Purpose |
|---|---|---|---|
| Morning | 8:00, Mon–Fri | `30 2 * * 1-5` | Pre-market brief: top stocks to watch, recommendations, exit signals, overnight global cues, macro/sector themes, FII/DII sentiment. |
| Mid-session | 14:00, Mon–Fri | `30 8 * * 1-5` | Live intraday evaluation of the watchlist. Fires **sell alerts** on unusual action. |
| Weekly | Sun 21:00 | `30 15 * * 0` | Retrospective on last week's calls + next-week outlook. |
| Monthly | ~1st, 00:00 | `30 18 28-31 * *` | Retrospective on last month's calls + next-month outlook. |
| Deploy | on push to `main` | — | Build Next.js static export → publish to GitHub Pages. |

**Monthly cron caveat:** GitHub cron cannot express "last day of month." `monthly.yml` runs at `30 18` UTC on days 28–31. Because that UTC instant is already `00:00` IST of the *next* day, the script converts "now" to IST and proceeds only when the **IST date is the 1st** (otherwise exits early). This fires exactly once per month — on the IST 1st — and handles 28/29/30/31-day months and leap years correctly.

### Mid-session sell-alert logic

For each watchlist stock, the script fetches live intraday data and flags candidates by deterministic rules:

- Volume > 2× the trailing average for the same time-of-day.
- Intraday drawdown > 3% from the day's open.
- Price breaks below a key support level (recent swing low / SMA).
- Price near a circuit-breaker band.

Flagged candidates are passed to Gemini, which judges **noise vs. signal** with reasoning. A confirmed signal becomes a sell alert: written to `data/alerts/` and emailed immediately. The deterministic rules gate the LLM call (cost control); the LLM provides the judgment and explanation.

### Self-verification loop (weekly & monthly)

Before generating a new outlook, the recap looks back:

1. **Load** the previous report of the same type from storage.
2. **Extract** the predictions and calls it made.
3. **Fetch** actual OHLCV for every mentioned ticker over the elapsed period (Yahoo Finance — ground truth).
4. **LLM retrospective:** For each call, did it play out? If right, explain *why* (which signal/catalyst confirmed). If wrong, explain *why* (what was missed, what changed, what to weight differently next time).
5. **LLM outlook:** Generate the new forward-looking report, informed by the retrospective.

The report is stored with both sections: `retrospective` and `outlook`. The first run of each type has no prior report and produces `outlook` only.

## Single-Stock Research

A dynamic route where the user enters any NSE/BSE ticker and gets a live, on-demand analysis — independent of the watchlist and the schedules.

**Flow:** The static frontend has a `/research` page with a ticker input. On submit, it calls the Cloudflare Worker endpoint (`POST /research { ticker }`). The Worker:

1. Resolves and validates the ticker (suggests the correct `.NS`/`.BO` suffix if ambiguous).
2. Fetches quote + historical OHLCV via `lib/market-data.ts`.
3. Computes indicators (RSI, MACD, Bollinger, SMA/EMA) via `lib/indicators.ts`.
4. Calls Gemini (`lib/llm.ts`, search grounding) to produce three sections — **fundamental**, **technical**, **sentiment** — plus a synthesized view, validated against a Zod schema.
5. Returns the structured result. The frontend renders it.

**Properties:**
- The Worker is **stateless** — it stores nothing and writes no files. Research results are not persisted in Phase 1 (no archive entry); the page renders the live response.
- It reuses the exact same `lib/` modules as the cron scripts — no duplicated data or analysis logic. The Worker is a thin HTTP wrapper around them.
- CORS is restricted to the GitHub Pages origin. A basic rate limit guards the Gemini key from abuse.
- The frontend handles three states explicitly — idle, loading (skeleton, reserved layout), result/error — with no layout shift between them.

**Runtime constraint (validate first in the Research milestone):** `yahoo-finance2` depends on Node HTTP APIs. The chosen function host must support them — a Cloudflare Worker with `nodejs_compat` enabled, or, if that proves incompatible, a Node-runtime serverless function (Vercel/Netlify). The first task of the Research milestone is a spike confirming `lib/market-data.ts` + `lib/llm.ts` run on the target runtime before building the page against it. The rest of the architecture (GH Pages static briefings) is unaffected by which is chosen.

## UI / UX Principles

The dashboard must look genuinely professional, not like a data dump. Non-negotiables:

- **Minimal and focused.** Restrained palette, generous whitespace, clear typographic hierarchy, no decoration that doesn't carry information. Every screen has one obvious primary thing to read.
- **No layout shift.** Reserve space for all async content. Skeleton loaders match the final content's dimensions. Images/sparklines have fixed boxes. Target CLS ≈ 0. Static briefing pages are pre-rendered so they paint instantly; only `/research` has a loading state, and that state holds its layout.
- **Consistent system.** One component library (shadcn/ui + Tailwind), one spacing scale, one type scale, one set of status colors (bullish/bearish/neutral, severity levels) reused everywhere. A report card looks the same on Today, Archive, and Detail.
- **Readable density.** Financial data is dense; lean on tables, small-caps labels, and tabular numerals so figures align. Color encodes direction but is never the only signal (icons/sign too, for accessibility).
- **Responsive.** Works on a phone (morning read over coffee) and desktop equally.

The `frontend-design` skill is to be used during implementation to hit this bar.

## Data Integrity Contract

JSON is treated with database-level rigor. **Consistency over availability:** a malformed or partial report must never be served — the job fails loudly instead.

- **Validate on write and on read.** Every document is checked against its Zod schema before being written and after being read. Invalid data aborts the job (write) or surfaces a hard error (read) — never a silent bad render.
- **Atomic writes.** Write to a `.tmp` file, then rename. A crashed job cannot leave a half-written file; readers always observe a complete document.
- **Idempotent by date key.** The filename is the primary key. Re-running a job for the same date overwrites cleanly and never duplicates.
- **Email after commit.** Data is persisted first, email sent second. The system never notifies about a report it did not save.
- **Integrity metadata.** Every document carries a `checksum` (sha256 of `content`) and a `schemaVersion` for future migrations.

### Document envelope

Every report shares one envelope shape:

```jsonc
{
  "schemaVersion": 1,
  "id": "2026-06-14-morning",       // == filename stem == primary key
  "type": "morning",                 // morning | midsession | weekly | monthly
  "generatedAt": "2026-06-14T02:30:11Z",
  "sourceData": { /* provenance: tickers queried, price snapshot, search timestamp */ },
  "content": { /* type-specific report body, own Zod schema */ },
  "emailSent": true,
  "checksum": "sha256:…"             // over `content`
}
```

### `manifest.json`

A single committed index of all reports: `{ id, type, date, path, checksum }` per entry, plus pointers to the latest report of each type. Updated atomically alongside each report write. The dashboard's archive reads the manifest rather than globbing the filesystem — deterministic and fast. The manifest is the table of contents of the document database.

## Repository Structure

```
.github/workflows/
  morning.yml          # 8 AM IST weekdays
  midsession.yml       # 2 PM IST weekdays
  weekly.yml           # Sun 9 PM IST
  monthly.yml          # ~1st 12 AM IST (28–31 guard)
  deploy.yml           # on push to main → GH Pages

data/                  # the document database (committed by Actions)
  watchlist.json       # edited manually; the tracked universe
  manifest.json        # index of all reports
  briefings/
    2026-06-14-morning.json
    2026-06-14-midsession.json
    2026-W24-weekly.json
    2026-06-monthly.json
  alerts/
    2026-06-14.json

scripts/               # cron compute (thin orchestrators)
  morning.ts
  midsession.ts
  weekly.ts
  monthly.ts

lib/                   # shared by scripts, Worker, AND Next.js
  schemas.ts           # Zod: envelope + all content shapes + research shape (single source of truth)
  storage.ts           # atomic read/write, manifest, checksum
  market-data.ts       # yahoo-finance2 wrapper: getQuote, getHistorical, getIntraday
  indicators.ts        # technicalindicators wrapper: pure compute functions
  llm.ts               # Gemini client: generateStructured(prompt, schema) w/ grounding
  email.ts             # Resend wrapper: report → HTML → send to recipient list
  watchlist.ts         # read/parse watchlist.json
  research.ts          # compose market-data + indicators + llm → research result

worker/                # Cloudflare Worker — dynamic research endpoint
  index.ts             # POST /research { ticker } → calls lib/research.ts; CORS + rate limit
  wrangler.toml

src/                   # Next.js static app
  app/
    page.tsx           # Today
    research/page.tsx  # Single-stock research (calls the Worker)
    reports/page.tsx   # Archive
    reports/[id]/page.tsx  # Report detail (generateStaticParams from manifest)
    watchlist/page.tsx
    alerts/page.tsx
  lib/
    reports.ts         # build-time data access: read manifest + report files
  components/          # ReportCard, ReportView, BriefingSection, AlertBadge, VerificationBadge, …
```

`lib/` sits at the repo root because three consumers share it: the cron scripts, the Worker, and (build-time data access in) the Next.js app.

## Module Boundaries

Each unit has one purpose, a defined interface, and is testable in isolation.

- **`schemas.ts`** — The contract. All other modules depend on it; it depends on nothing. Defines the envelope and one content schema per report type.
- **`market-data.ts`** — The only module that talks to Yahoo Finance. Returns typed price/OHLCV data. Knows nothing about reports or the LLM.
- **`indicators.ts`** — Pure functions over OHLCV arrays. No I/O. Trivially unit-testable.
- **`llm.ts`** — The only module that talks to Gemini. Takes a prompt + Zod schema, returns validated structured output. Knows nothing about storage or email.
- **`storage.ts`** — The only module that touches the `data/` filesystem. Owns atomicity, checksums, and the manifest. Returns/accepts validated documents.
- **`email.ts`** — The only module that talks to Resend. Renders a report to HTML and sends it.
- **`watchlist.ts`** — Reads the tracked universe.
- **`research.ts`** — Composes `market-data` + `indicators` + `llm` into a single research result. Pure orchestration, no I/O of its own beyond those modules. Used by the Worker; trivially testable.
- **Cron scripts** — Orchestrate the above; contain no I/O logic of their own beyond sequencing. `weekly.ts` and `monthly.ts` share a recap builder since their shape is identical.
- **`worker/index.ts`** — A thin HTTP boundary: parse request, enforce CORS + rate limit, call `research.ts`, return JSON. No analysis logic lives here.
- **Next.js `lib/reports.ts`** — The serving side's only data-access point; reads via `storage.ts`/manifest at build time.

## Pages (Phase 1)

1. **Today** — landing page; latest morning briefing + any mid-session alerts for the day.
2. **Research** — ticker input → live fundamental + technical + sentiment analysis via the Worker. Idle / loading / result states with no layout shift.
3. **Reports Archive** — every past report, filterable by type, newest-first, with verification badges (e.g. `✓ 7/10 calls hit`) on weekly/monthly.
4. **Report Detail** — full rendered view of one report; weekly/monthly show retrospective + outlook.
5. **Watchlist** — read-only view of the tracked stocks from `watchlist.json`.
6. **Alerts** — history of sell alerts with reason and severity.

## Email

Every cron job, after a successful commit, sends the report as an HTML email via Resend to a hardcoded recipient list (in config/env). Sell alerts are sent the moment they fire. Email rendering reuses the report's structured content.

## Error Handling

- **Validation failure (write):** abort the job, exit non-zero, write nothing, send nothing. The GitHub Action shows red; the last good report remains live.
- **Validation/read failure (serve):** build fails loudly rather than deploying a broken page.
- **Data-source failure (Yahoo/Gemini):** the script retries with backoff; on persistent failure it aborts (no partial report). The previous report stays as the latest.
- **Email failure after commit:** logged and surfaced as a job warning; the report is already persisted and viewable, so data is never lost. The job records `emailSent: false` for later inspection.
- **Research Worker failure (bad ticker / source down / LLM error):** returns a structured error response with a clear message; the `/research` page shows an inline error in the reserved result area without breaking layout. Nothing is persisted, so a failed lookup has no lasting effect — the user can simply retry.

## Build Phasing (for the implementation plan)

A natural order, each milestone independently verifiable:

1. **Foundation** — scaffold repo; build `lib/` (schemas, storage, market-data, indicators, llm, email, watchlist); the morning job end-to-end (data → LLM → validated JSON → commit → email).
2. **Remaining jobs** — mid-session with alert rules; weekly + monthly with the self-verification loop.
3. **Dashboard** — Next.js static app; the briefing pages (Today, Archive, Detail, Watchlist, Alerts) reading `data/`.
4. **Research** — `lib/research.ts`; the Cloudflare Worker; the `/research` page wired to it.
5. **CI/CD** — five GitHub Actions workflows; deploy static site to GitHub Pages; deploy Worker; secrets wired.

## Open Questions

None blocking. Phase 2 features are deferred by design.
