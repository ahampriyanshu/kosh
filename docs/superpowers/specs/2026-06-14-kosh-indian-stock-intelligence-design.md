# Kosh — Indian Stock Market Intelligence

**Design spec · 2026-06-14**

## Summary

Kosh is a personal stock-intelligence tool for an Indian software developer investing in NSE/BSE stocks. It generates curated, AI-written market briefings on a schedule, emails them, and serves them from a static dashboard. The product spine is the **morning briefing**: open the app to see "what's interesting today."

There is no always-on server and no Vercel. **GitHub is the single source of truth.** GitHub Actions runs all compute — scheduled (cron) and event-triggered (push) — writing results as validated JSON committed to the repo and emailing them. A Next.js **static export** is published to **GitHub Pages**; it reads the committed JSON at build time and renders it. Even single-stock research is **pseudo-dynamic**: you add a ticker to a requests file and commit; that push triggers an Action that deep-evaluates the stock, writes a report, emails it, and the static UI shows it on the next build. Cost is $0 (GitHub Actions + GitHub Pages free tiers).

## Goals

- A curated morning briefing every weekday, available before the market opens.
- A mid-session evaluator that fires sell alerts when a watched stock shows unusual action.
- Weekly and monthly recaps that **verify their own past predictions** before looking forward.
- All reports persisted with database-level integrity discipline (consistency over availability).
- A dashboard to read the latest briefing and browse every past report.
- Pseudo-dynamic single-stock research: request a ticker via a committed file → an Action produces a fundamental + technical + sentiment report you can read in the UI.
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
Scheduled briefings (cron):
GitHub Actions (cron)  →  TS compute script  →  validated JSON in data/  →  git commit + email
                                                                                    │
Pseudo-dynamic research (push):                                                     │
edit data/research-requests.ts + commit  →  research.yml  →  report JSON + email ───┤
                                                                                    │
                                              push to main  →  deploy.yml (GitHub Actions)
                                                                                    │
                                  Next.js static export (output: 'export') reads data/  →  GitHub Pages
```

- **Compute layer:** TypeScript scripts run by GitHub Actions — both cron-scheduled (briefings) and push-triggered (research). Each fetches market data, calls Gemini, validates output, writes JSON atomically, commits, and emails.
- **Data layer:** JSON files in the repo's `data/` directory. The repo *is* the document database; git history *is* the audit log. Research **requests** are a typed TS file (`data/research-requests.ts`); research **reports** are JSON like every other report.
- **Serving layer:** A Next.js 15 **static export** (`output: 'export'`, no server). It reads `data/` at build time and renders fully static HTML. `deploy.yml` (a GitHub Actions workflow) builds it and publishes to **GitHub Pages** on every push to `main` — including the commits the jobs make.
- **Research as a job, not a server:** There is no serverless route. A push that changes `data/research-requests.ts` triggers `research.yml`, which runs `scripts/research.ts` to deep-evaluate each requested ticker that lacks a current report, writes the report, emails it, and commits. The static UI displays committed research reports — no live API, no exposed key.
- **Intelligence:** Gemini 3.1 Pro (`gemini-3.1-pro-preview`) via the Vercel AI SDK (`@ai-sdk/google`), with Google Search grounding for real-time news, sentiment, analyst ratings, and fundamentals — no separate news or fundamentals API. (The AI SDK is just an npm library here; nothing about it requires Vercel hosting.)

### Dependencies

| Package | Role | Key required |
|---|---|---|
| `yahoo-finance2` | Price, OHLCV (NSE/BSE) | No |
| `technicalindicators` | RSI, MACD, Bollinger, SMA/EMA | No |
| `@ai-sdk/google` + `ai` | Gemini 3.1 Pro, structured output, search grounding | Gemini |
| `zod` | Schema validation (write + read) | No |
| `resend` | Email delivery | Resend |
| `next`, `react`, `tailwindcss`, `shadcn/ui` | Static dashboard (`output: 'export'`) | No |
| `papaparse` | CSV parsing (**Phase 2 only**) | No |

Total external API keys: **2** — `GOOGLE_GENERATIVE_AI_API_KEY` (the exact name the `@ai-sdk/google` provider reads automatically), `RESEND_API_KEY`. Both are **GitHub repository secrets** used only by the Actions (compute side). The static site holds no secrets — it ships only committed JSON.

## Schedules

All times IST. GitHub cron is UTC, so each workflow's cron expression is offset by −5:30.

| Job | When (IST) | Cron (UTC) | Purpose |
|---|---|---|---|
| Morning | 8:00, Mon–Fri | `30 2 * * 1-5` | Pre-market brief: top stocks to watch, recommendations, exit signals, overnight global cues, macro/sector themes, FII/DII sentiment. |
| Mid-session | 14:00, Mon–Fri | `30 8 * * 1-5` | Live intraday evaluation of the watchlist. Fires **sell alerts** on unusual action. |
| Weekly | Sun 21:00 | `30 15 * * 0` | Retrospective on last week's calls + next-week outlook. |
| Monthly | ~1st, 00:00 | `30 18 28-31 * *` | Retrospective on last month's calls + next-month outlook. |

Two non-cron workflows complete the set:
- **`research.yml`** — triggered `on: push` to `data/research-requests.ts` (plus `workflow_dispatch`). Runs `scripts/research.ts`.
- **`deploy.yml`** — triggered `on: push` to `main`. Builds the Next.js static export and publishes to GitHub Pages. Every job's commit lands on `main`, so new reports go live automatically.

**Monthly cron caveat:** GitHub cron cannot express "last day of month." `monthly.yml` runs at `30 18` UTC on days 28–31. Because that UTC instant is already `00:00` IST of the *next* day, the script converts "now" to IST and proceeds only when the **IST date is the 1st** (otherwise exits early). This fires exactly once per month — on the IST 1st — and handles 28/29/30/31-day months and leap years correctly.

### Mid-session sell-alert logic

For each watchlist stock, the script fetches live intraday data and flags candidates by deterministic rules:

- Volume > 2× the trailing average for the same time-of-day.
- Intraday drawdown > 3% from the day's open.
- Price breaks below a key support level (recent swing low / SMA).
- Price near a circuit-breaker band.

Flagged candidates are passed to Gemini, which judges **noise vs. signal** with reasoning. A confirmed signal becomes a sell alert: recorded in the midsession report's `content.alerts[]` and emailed. The deterministic rules gate the LLM call (cost control); the LLM provides the judgment and explanation. The Alerts page aggregates `content.alerts` across all midsession reports.

### Self-verification loop (weekly & monthly)

Before generating a new outlook, the recap looks back:

1. **Load** the previous report of the same type from storage.
2. **Extract** the predictions and calls it made.
3. **Fetch** actual OHLCV for every mentioned ticker over the elapsed period (Yahoo Finance — ground truth).
4. **LLM retrospective:** For each call, did it play out? If right, explain *why* (which signal/catalyst confirmed). If wrong, explain *why* (what was missed, what changed, what to weight differently next time).
5. **LLM outlook:** Generate the new forward-looking report, informed by the retrospective.

The report is stored with both sections: `retrospective` and `outlook`. The first run of each type has no prior report and produces `outlook` only.

## Single-Stock Research (pseudo-dynamic)

Deep, on-demand analysis of any NSE/BSE ticker — independent of the watchlist and the schedules — but produced by an Action, not a live server. The interaction model is "request via commit, read via static page."

**Request file:** `data/research-requests.ts` — a typed TS module exporting an array of requests:

```ts
import type { ResearchRequest } from '../lib/schemas-types'; // or inline the type
export const researchRequests: ResearchRequest[] = [
  { ticker: 'TATAMOTORS.NS' },
  { ticker: 'IRCTC.NS', note: 'checking the post-results dip' },
];
```

You edit this file and commit (locally, or straight from the GitHub web UI). It is TS (not JSON) so it is typed and ergonomic to edit; `scripts/research.ts` imports it directly via `tsx`.

**Flow (`research.yml`, triggered on push to the requests file):**

1. Import `researchRequests`; read the manifest.
2. For each requested ticker that lacks a **current** research report (idempotent by `ticker + IST date`), evaluate it; skip those already done today.
3. Per ticker: resolve/validate the ticker → `getQuote` + `getHistorical` (`lib/market-data.ts`) → indicators (`lib/indicators.ts`) → Gemini grounded analysis (`lib/llm.ts`) producing **fundamental**, **technical**, **sentiment**, and a synthesized **recommendation**, validated against `ResearchContentSchema`.
4. Write the report via `storage.ts` (envelope `type: 'research'`, id `${date}-research-${slug(ticker)}`), update the manifest, commit, and email it.

**Properties:**
- Reuses the exact same `lib/` modules as the cron scripts — `lib/research.ts` composes them; `scripts/research.ts` is the thin job runner. No duplicated analysis logic.
- The Gemini key lives only in the Action (GitHub secret) — never shipped to the browser.
- Research reports are first-class reports: stored, manifested, archived, and viewable like any briefing.
- Idempotent: re-committing the requests file only evaluates tickers missing a report for today; finished ones are skipped (so you can append without recomputing the list).
- The static **Research** page lists completed research reports (newest first) and links to each report's detail view; it also shows the one-line "how to request" instruction.

## UI / UX Principles

The dashboard must look genuinely professional, not like a data dump. Non-negotiables:

- **Minimal and focused.** Restrained palette, generous whitespace, clear typographic hierarchy, no decoration that doesn't carry information. Every screen has one obvious primary thing to read.
- **No layout shift.** Every page is statically pre-rendered from committed JSON, so content paints instantly with no client-side fetching. Images/sparklines have fixed boxes. Target CLS ≈ 0.
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
  morning.yml          # 8 AM IST weekdays (cron)
  midsession.yml       # 2 PM IST weekdays (cron)
  weekly.yml           # Sun 9 PM IST (cron)
  monthly.yml          # ~1st 12 AM IST (cron, 28–31 guard)
  research.yml         # on push to data/research-requests.ts (+ dispatch)
  deploy.yml           # on push to main → build static export → GitHub Pages

data/                  # the document database (committed by Actions)
  watchlist.json       # edited manually; the tracked universe
  research-requests.ts # typed TS list of tickers to research (edit + commit to trigger)
  manifest.json        # index of all reports
  briefings/           # ALL report types live here, flat, keyed by typed id
    2026-06-14-morning.json
    2026-06-14-midsession.json      # sell-alerts embedded in content.alerts
    2026-W24-weekly.json
    2026-06-monthly.json
    2026-06-14-research-TATAMOTORS-NS.json

scripts/               # job runners (thin orchestrators)
  morning.ts
  midsession.ts
  weekly.ts
  monthly.ts
  research.ts          # push-triggered; evaluates requested tickers

lib/                   # shared by scripts AND the Next.js static build
  schemas.ts           # Zod: envelope + all content shapes (morning/midsession/weekly/monthly/research/alert) — single source of truth
  storage.ts           # atomic read/write, manifest, checksum
  market-data.ts       # yahoo-finance2 wrapper: getQuote, getHistorical
  indicators.ts        # technicalindicators wrapper: pure compute functions
  llm.ts               # Gemini client: grounded research + structured output
  email.ts             # Resend wrapper: report → HTML → send to recipient list
  watchlist.ts         # read/parse watchlist.json
  recap.ts             # shared weekly/monthly self-verification builder
  research.ts          # compose market-data + indicators + llm → research result

src/                   # Next.js static export (output: 'export')
  app/
    page.tsx           # Today
    research/page.tsx  # lists completed research reports
    reports/page.tsx   # Archive
    reports/[id]/page.tsx  # Report detail (generateStaticParams from manifest)
    watchlist/page.tsx
    alerts/page.tsx
  lib/
    reports.ts         # build-time data access: read manifest + report files
  components/          # ReportCard, ReportView, BriefingSection, AlertBadge, VerificationBadge, …
```

`lib/` sits at the repo root because two consumers share it: the job scripts and the Next.js static build (which reads `data/` at build time only). No code runs at request time — the deployed site is pure static files.

## Module Boundaries

Each unit has one purpose, a defined interface, and is testable in isolation.

- **`schemas.ts`** — The contract. All other modules depend on it; it depends on nothing. Defines the envelope and one content schema per report type.
- **`market-data.ts`** — The only module that talks to Yahoo Finance. Returns typed price/OHLCV data. Knows nothing about reports or the LLM.
- **`indicators.ts`** — Pure functions over OHLCV arrays. No I/O. Trivially unit-testable.
- **`llm.ts`** — The only module that talks to Gemini. Takes a prompt + Zod schema, returns validated structured output. Knows nothing about storage or email.
- **`storage.ts`** — The only module that touches the `data/` filesystem. Owns atomicity, checksums, and the manifest. Returns/accepts validated documents.
- **`email.ts`** — The only module that talks to Resend. Renders a report to HTML and sends it.
- **`watchlist.ts`** — Reads the tracked universe.
- **`research.ts`** — Composes `market-data` + `indicators` + `llm` into a single research result. Pure orchestration, no I/O of its own beyond those modules. Used by `scripts/research.ts`; trivially testable.
- **`recap.ts`** — The shared weekly/monthly self-verification builder (load prior report → fetch actuals → retrospective → outlook). `weekly.ts` and `monthly.ts` are thin wrappers that pass it a period.
- **Job scripts** (`morning`/`midsession`/`weekly`/`monthly`/`research`) — Orchestrate the lib modules; contain no I/O logic of their own beyond sequencing and the persist→email→mark-sent flow.
- **Next.js `lib/reports.ts`** — The static build's only data-access point; reads via `storage.ts`/manifest at build time.

## Pages (all statically rendered from committed JSON)

1. **Today** — landing page; latest morning briefing + any mid-session alerts for the day.
2. **Research** — list of completed single-stock research reports (newest first), each linking to its detail view; plus the one-line "edit `data/research-requests.ts` and commit to request" instruction.
3. **Reports Archive** — every past report, filterable by type, newest-first, with verification badges (e.g. `✓ 7/10 calls hit`) on weekly/monthly.
4. **Report Detail** — full rendered view of one report; weekly/monthly show retrospective + outlook; research shows fundamental/technical/sentiment/recommendation.
5. **Watchlist** — read-only view of the tracked stocks from `watchlist.json`.
6. **Alerts** — history of sell alerts with reason and severity.

## Email

Every cron job, after a successful commit, sends the report as an HTML email via Resend to a hardcoded recipient list (in config/env). Sell alerts are sent the moment they fire. Email rendering reuses the report's structured content.

## Error Handling

- **Validation failure (write):** abort the job, exit non-zero, write nothing, send nothing. The GitHub Action shows red; the last good report remains live.
- **Validation/read failure (build):** `deploy.yml`'s `next build` fails loudly rather than publishing a broken page; the previously deployed GitHub Pages site stays live.
- **Data-source failure (Yahoo/Gemini):** the script retries with backoff; on persistent failure it aborts (no partial report). The previous report stays as the latest.
- **Email failure after commit:** logged and surfaced as a job warning; the report is already persisted and viewable, so data is never lost. The job records `emailSent: false` for later inspection.
- **Research job failure (bad ticker / source down / LLM error):** that ticker is skipped with a logged error and the Action surfaces it (red run); other requested tickers still succeed. Nothing partial is written, so re-committing retries only the missing ones.

## Build Phasing (for the implementation plan)

A natural order, each milestone independently verifiable:

1. **Foundation** ✅ *(done)* — scaffold; `lib/` (schemas, storage, market-data, indicators, llm, email, watchlist, time); the morning job end-to-end; `morning.yml`.
2. **Remaining jobs** — extend `schemas.ts` (midsession/weekly/monthly/alert content) and `storage.ts` (alerts writer); `midsession.ts` (alert rules + LLM noise/signal); `recap.ts` + `weekly.ts` + `monthly.ts` (self-verification); their workflows.
3. **Research job** — extend `schemas.ts` (research content + `'research'` type); `data/research-requests.ts`; `lib/research.ts`; `scripts/research.ts`; `research.yml`.
4. **Dashboard** — Next.js static export (`output: 'export'`, `basePath` for the Pages project path); all six pages reading `data/` at build; the component system per the UI principles (use `frontend-design`).
5. **Deploy** — `deploy.yml` building the export and publishing to GitHub Pages; enable Pages; confirm all six workflows green.

## Open Questions

None blocking. Phase 2 features are deferred by design.
