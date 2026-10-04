# Kosh Data Architecture & Pipeline Redesign Plan

## 1. Executive Summary & Problem Diagnosis

### 1.1 The Current Problem: Fragmentation & Redundancy
The existing Kosh data pipeline suffers from extreme workflow fragmentation, redundant computation, and storage formats that hinder quantitative and qualitative research:

1. **Job Explosion (11 Independent GitHub Workflows)**:
   - 4 middle-of-the-night jobs (`feed-indices`, `feed-global`, `feed-universe`, `feed-internals`) execute sequentially between 02:00 AM and 02:45 AM IST.
   - At 02:00 AM IST, the Indian market closed 11 hours prior, Asian markets have not yet opened, and Gift Nifty morning trading has not begun.
   - Worse, at 08:30 AM (`daily.ts`) and 15:45 PM (`retro.ts`), the pipeline **re-fetches** indices and universe quotes from Yahoo Finance all over again. The 02:00 AM jobs are 100% throwaway runs.
   - 2 morning LLM jobs (`feed-news` at 06:00 AM and `feed-flows` at 06:30 AM) run separately, followed by `daily.ts` running another LLM call at 08:30 AM.
   - Every single workflow run spins up a full GitHub Actions Ubuntu runner, installs dependencies via `npm ci` (~45s overhead), and commits small slice files with `git pull --rebase`, creating merge conflicts and commit spam.

2. **Storage Deficit for Quantitative & Qualitative Research**:
   - All historical data is trapped in monolithic, deeply nested JSON blobs (`data/snapshots/{yyyy}/{mm}/{date}.json`).
   - Slices (`data/feed/{date}/*.json`) are deleted immediately after daily publication (`deleteFeed(date)`).
   - To query 30 days of market sentiment for the `/sentiment-index` page, the server must parse 30 separate 500KB JSON files from disk on every load.
   - To backtest sector momentum or analyze institutional flow correlation with Nifty returns, a quantitative researcher must walk directory trees and parse hundreds of redundant JSON documents. All non-top-10 universe stock prices are discarded.

3. **The Proposed Solution**:
   - **Consolidate workflows into 5 high-performance daily jobs**:
     1. `morning-market-data` (yfinance): Fast, batched market cues (08:00 IST).
     2. `morning-llm-intelligence` (Gemini Search + Daily Brief): Grounded news, analyst calls, daily brief email (08:15 IST).
     3. `evening-market-data` (yfinance): Official NSE close, full Nifty 500 microstructure, sector rankings (15:45 IST).
     4. `evening-llm-intelligence` (Gemini Search + Daily Retro): FII/DII verification, portfolio risk screening, retro email (16:15 IST).
     5. `evaluate-bets` (yfinance + Gemini): Nightly evaluation and binary settlement (`hit` vs `miss`) of expiring systematic bets with automated causal post-mortems (23:00 IST).
   - **Implement a Dual-Plane Storage Architecture with Systematic Bets Store**:
     - **Operational Plane**: Fast, atomic snapshots (`data/snapshots/{date}.json`) for Next.js SSR/SSG and email generation.
     - **Systematic Bets Store**: High-conviction tactical (weekly) and strategic (monthly) bets in `data/bets.json` with immutable audit history.
     - **Analytical Plane**: Append-only, time-series JSONL ledgers for quantitative data (`flows`, `breadth`, `sentiment`, `sectors`) and qualitative knowledge (`news`, `recs`, `risk_alerts`), directly loadable in Pandas, DuckDB, or SQLite/Cloudflare D1 in 1 millisecond.
   - *(Note: Weekly and monthly outlook jobs are decoupled from buy/sell bets and redesigned as institutional research dossiers).*

---

## 2. Complete Inventory of Application Data Needs

Across the homepage, sentiment index, portfolio surveillance, research desk, email editions, and systematic bet ledgers, the platform requires 25 discrete data streams:

| # | Data Stream | Consumers | Provider / Method | Frequency | Latency / Cost Profile |
|---|---|---|---|---|---|
| **1** | Indian Benchmark Indices (Nifty 50, Sensex, Bank Nifty) | Homepage, Emails, Sentiment Index | Yahoo Finance (`yf.quote`) | Morning & Close | Instant (~200ms), Free |
| **2** | Sectoral Indices (11 NSE Sectors) | Homepage (Sector Rotation), Morning Brief | Yahoo Finance (`yf.quote`) | Close (15:45 IST) | Instant, Free |
| **3** | India VIX | Homepage Marquee, Sentiment Index, Emails | Yahoo Finance (`^INDIAVIX`) | Morning & Close | Instant, Free |
| **4** | Global Benchmark Indices (US, Asia, Europe) | Homepage, Morning Brief | Yahoo Finance (`yf.quote`) | Morning (08:00 IST) | Instant, Free |
| **5** | Overnight Commodities (Gold, Silver, Brent) | Homepage, Morning Brief, Sentiment | Yahoo Finance (`yf.quote`) | Morning & Close | Instant, Free |
| **6** | Currencies (USD/INR) | Homepage Marquee, Morning Brief | Yahoo Finance (`USDINR=X`) | Morning & Close | Instant, Free |
| **7** | Gift Nifty | Homepage, Morning Brief | Yahoo Finance / NSE IFSC | Morning (08:00 IST) | Instant, Free |
| **8** | Nifty 500 Universe Quotes (500 tickers) | Internals, Gainers/Losers, Volume Shockers | Yahoo Finance (Batched chunks of 50) | Close (15:45 IST) | ~6-8s total, Free |
| **9** | Market Breadth (Advances, Declines, A/D Ratio) | Homepage, Sentiment Index (BMI) | Computed in-memory from Nifty 500 quotes | Close (15:45 IST) | ~5ms CPU |
| **10** | Top 10 Gainers & Losers | Homepage, Daily Retro | Computed in-memory from Nifty 500 quotes | Close (15:45 IST) | ~2ms CPU |
| **11** | Most Active by Turnover | Homepage Microstructure | Computed in-memory from Nifty 500 quotes | Close (15:45 IST) | ~2ms CPU |
| **12** | Volume Shockers (>2x 3M avg volume) | Homepage, Daily Retro | Computed in-memory from Nifty 500 quotes | Close (15:45 IST) | ~2ms CPU |
| **13** | 52-Week High & Low Proximity (<2% margin) | Homepage Microstructure, Sentiment | Computed in-memory from Nifty 500 quotes | Close (15:45 IST) | ~2ms CPU |
| **14** | Institutional Cash Flows (FII & DII Net in ₹ cr) | Homepage, Sentiment Index (IFI), Emails | Grounded Gemini LLM / NSE API | Morning (Confirmed) & Close | 8-15s, LLM quota |
| **15** | India 10Y Sovereign Bond Yield | Homepage, Morning Brief | Grounded Gemini LLM / CCIL | Morning (08:15 IST) | Shared LLM prompt |
| **16** | Nifty Derivatives Skew (PCR OI & Volume) | Sentiment Index (Options Factor) | Grounded Gemini LLM / NSE Derivatives | Morning & Close | Shared LLM prompt |
| **17** | Categorized Market News (Macro, Policy, Sector) | Homepage News Grid, Morning Brief | Grounded Gemini LLM (Search) | Morning (08:15 IST) | 10-18s, LLM quota |
| **18** | Street Analyst Recommendations (Target & Action) | Homepage, Morning Brief | Grounded Gemini LLM (Search) | Morning (08:15 IST) | Shared LLM prompt |
| **19** | Corporate Actions Calendar (Ex-Date, Split, Bonus) | Homepage Calendar, Morning Brief | Grounded Gemini LLM (Search) | Morning (08:15 IST) | Shared LLM prompt |
| **20** | Morning Editorial Narrative & Key Takeaways | Morning Brief Email, `/reports/daily-{date}` | Gemini LLM Synthesis | Morning (08:15 IST) | 5-10s, LLM quota |
| **21** | Portfolio Surveillance & AI Risk Screening | Daily Retro Email, `/reports/retro-{date}` | Zerodha Kite + Technicals + Gemini | Close (16:15 IST) | 8-15s, LLM quota |
| **22** | Master Sentiment Index (0-100 & 4 Factors) | Homepage, `/sentiment-index`, Emails | Pure TypeScript Multi-Factor Algorithm | Morning & Close | <1ms CPU |
| **23** | Short-Term Systematic Bets (5–20 day tactical setups) | `/bets/short-term`, Header Nav | Pure Quantitative Screening (RSI, Bollinger, Volume, Breakout) | Weekly (Sunday/Monday) | <10ms CPU |
| **24** | Long-Term Systematic Bets (3–12 month compounders) | `/bets/long-term`, Header Nav | Pure Fundamental & Structural Models (Piotroski, ROIC, Duopoly) | Monthly (1st of month) | <10ms CPU |
| **25** | Nightly Bet Expiry Settlement & Causal Post-Mortems | `/bets/short-term`, `/bets/long-term`, Ledger | Yahoo Finance candles + Grounded Gemini 2.5 Flash | Daily Late-Night (23:00 IST) | 5-10s (on misses) |

---

## 3. Storage Architecture: Operational Plane, Bets Store & Analytical Plane

To support blazing-fast frontend page loads while empowering deep historical, quantitative, and qualitative research in the future, we decouple storage into three specialized tiers:

```
data/
├── bets.json                        ◄── SYSTEMATIC BETS STORE (Active positions, closed ledger, causal post-mortems)
│
├── snapshots/                       ◄── OPERATIONAL PLANE (Fast Frontend & Email Serving)
│   ├── latest.json                  ◄── Symlink / cache of current active market state
│   └── 2026/
│       └── 10/
│           └── 2026-10-02.json      ◄── Complete atomic daily snapshot (Immutable)
│
├── reports/                         ◄── PUBLISHED ENVELOPES (Public Archive)
│   └── 2026/10/2026-10-02/
│       ├── daily-2026-10-02.json    ◄── Morning brief report envelope
│       └── retro-2026-10-02.json    ◄── Market close retrospective envelope
│
└── ledger/                          ◄── ANALYTICAL PLANE (Quantitative & Qualitative Ledgers)
    ├── quantitative/                ◄── Time-series tabular records (Append-only NDJSON / JSONL)
    │   ├── sentiment_ledger.jsonl   ◄── Daily composite score, regime, 4 factor breakdown
    │   ├── institutional_flows.jsonl◄── Daily FII Net, DII Net, 10Y Yield
    │   ├── market_breadth.jsonl     ◄── Advances, declines, A/D ratio, 52W high/low counts
    │   ├── sector_rotation.jsonl    ◄── Daily % change and rank across all 11 sectors
    │   ├── derivatives_skew.jsonl   ◄── Put-Call Ratio (OI & Volume), options posture
    │   └── corporate_actions.jsonl  ◄── Forthcoming splits, dividends, bonuses, earnings
    │
    └── qualitative/                 ◄── Semantic & thematic knowledge logs (NDJSON / JSONL)
        ├── market_news.jsonl        ◄── Headlines, summaries, tickers, sentiment, sources
        ├── street_recs.jsonl        ◄── Brokerage calls, targets, rationale
        ├── portfolio_alerts.jsonl   ◄── Tripped risk rules, AI reasoning, sell recommendations
        └── daily_narratives.jsonl   ◄── Morning editorial outlook & key takeaways
```

### 3.1 Why Append-Only JSONL for the Analytical Plane?
1. **Ultra-Low Latency Frontend Reading**:
   Instead of `getHistoricalMoods(30)` opening and parsing 30 separate JSON files, it reads the last 30 lines of `sentiment_ledger.jsonl` in a single 0.5ms file read.
2. **Git & Automation Friendly**:
   Appending one line per session creates clean 1-line git diffs, completely eliminating git merge contention.
3. **Instant Quantitative Analysis**:
   In Python, DuckDB, or Pandas, data scientists can query the entire history in one line:
   ```python
   import pandas as pd
   df_flows = pd.read_json('data/ledger/quantitative/institutional_flows.jsonl', lines=True)
   df_sentiment = pd.read_json('data/ledger/quantitative/sentiment_ledger.jsonl', lines=True)
   merged = pd.merge(df_flows, df_sentiment, on='date')
   correlation = merged['fii_net'].corr(merged['composite_score'])
   ```
4. **Cloudflare D1 / SQLite Ready**:
   Each JSONL file maps 1:1 to an audited relational schema. If migrated to Cloudflare D1 or a local SQLite database (`kosh.db`), these schemas are already normalized.

---

## 4. The 5 Streamlined Daily Jobs

Instead of running 11 staggered jobs, the entire daily lifecycle is executed by **5 dedicated, decoupled jobs**:

```
08:00 IST                    08:15 IST                   15:45 IST                    16:15 IST                    23:00 IST
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│  JOB 1: MORNING DATA  │   │  JOB 2: MORNING LLM   │   │  JOB 3: EVENING DATA  │   │  JOB 4: EVENING LLM   │   │  JOB 5: BET AUDIT     │
│  (Yahoo Finance)      │   │  (Gemini + Brief)     │   │  (Yahoo Finance)      │   │  (Gemini + Retro)     │   │  (yfinance + Gemini)  │
├───────────────────────┤   ├───────────────────────┤   ├───────────────────────┤   ├───────────────────────┤   ├───────────────────────┤
│ • Global Indices      │   │ • Morning Top News    │   │ • Indian Indices      │   │ • Portfolio Screening │   │ • Scan Expiring Bets  │
│ • Gift Nifty          │   │ • Street Recs         │   │ • Nifty 500 Quotes    │   │ • AI Risk Flags       │   │ • Fetch Closing Quote │
│ • Asian Markets       │   │ • Corporate Calendar  │   │ • Sector Rankings     │   │ • FII/DII Final Check │   │ • Strict Hit/Miss     │
│ • Commodities & FX    │   │ • Confirmed FII/DII   │   │ • Breadth & Volume    │   │ • Closing Sentiment   │   │ • AI Causal Autopsy   │
│ • Prev Close Ref      │   │ • Morning Sentiment   │   │ • Microstructure      │   │ • Retro Email Sent    │   │ • "What Went Wrong"   │
│                       │   │ • Daily Brief Emailed │   │ • Time-Series Appended│   │ • Report Published    │   │ • "How to Avoid It"   │
└───────────────────────┘   └───────────────────────┘   └───────────────────────┘   └───────────────────────┘   └───────────────────────┘
  Runtime: ~2 seconds         Runtime: ~18 seconds        Runtime: ~8 seconds         Runtime: ~15 seconds        Runtime: ~5 seconds
```

---

### Job 1: `morning-market-data` (yfinance)
* **Execution Time**: Mon–Fri at 08:00 AM IST (02:30 UTC).
* **Execution Engine**: GitHub Actions / Node / Bun script (`scripts/morning-market.ts`).
* **Source**: Yahoo Finance API (`yahoo-finance2`).
* **Batching**: All ~20 global and commodity symbols requested in **1 single HTTP request**.
* **What it fetches**:
  - Global Indices: Dow Jones (`^DJI`), Nasdaq (`^IXIC`), S&P 500 (`^GSPC`), Nikkei 225 (`^N225`), Hang Seng (`^HSI`), FTSE 100 (`^FTSE`).
  - Gift Nifty / Early Cues: Gift Nifty futures LTP, overnight basis spread.
  - Commodities: Gold (`GC=F`), Silver (`SI=F`), Brent Crude (`CL=F`).
  - Currencies: USD/INR (`USDINR=X`).
  - Benchmark Opening Reference: Nifty 50 (`^NSEI`), Sensex (`^BSESN`), India VIX (`^INDIAVIX`).
* **Outputs**:
  - Writes operational staging file: `data/staging/morning_cues.json`.
  - Appends overnight macro metrics to `data/ledger/quantitative/global_cues.jsonl`.
* **Reliability**: Deterministic, 0 LLM cost, executes in **<2 seconds**.

---

### Job 2: `morning-llm-intelligence` (Gemini Search + Daily Brief)
* **Execution Time**: Mon–Fri at 08:15 AM IST (02:45 UTC).
* **Execution Engine**: GitHub Actions / Node / Bun script (`scripts/daily.ts`).
* **Source**: Google Gemini 2.5 Flash with Grounded Google Search.
* **Consolidation**: Combines legacy `feed-news`, `feed-flows`, and `daily.ts` narrative into **one single coordinated intelligence prompt**.
* **What it extracts**:
  - **Categorized Market News**: Macro/policy developments, corporate earnings disclosures, sectoral triggers, stocks in focus.
  - **Confirmed Institutional Flows**: Official FII and DII cash net purchases/sales (₹ cr) for the prior trading session (fully verified by NSE/BSE clearinghouse overnight).
  - **Street Recommendations**: Brokerage rating actions, targets, and investment rationale.
  - **Corporate Actions Calendar**: Forthcoming dividends, bonus shares, stock splits, quarterly earnings dates.
  - **Derivatives Baseline**: Overnight Put-Call Ratio (PCR) from Open Interest.
  - **Editorial Narrative**: Morning market stance, key risks, and 3 high-conviction takeaways.
* **Pipeline Actions**:
  1. Combines `morning_cues.json` (from Job 1) + LLM Intelligence.
  2. Computes Morning Sentiment Index (`sentiment.composite` for 08:30 IST session).
  3. Writes full daily snapshot: `data/snapshots/{yyyy}/{mm}/{date}.json` and updates `latest.json`.
  4. Appends to analytical ledgers: `market_news.jsonl`, `street_recs.jsonl`, `corporate_actions.jsonl`, `sentiment_ledger.jsonl`.
  5. Renders and dispatches **Kosh Daily Morning Brief** email (`sendReportEmail`).
  6. Publishes `daily-{date}` report envelope to `data/reports/`.
* **Reliability**: If LLM search fails or times out, it falls back gracefully to previous-day baseline data while keeping all real-time market data intact.

---

### Job 3: `evening-market-data` (yfinance)
* **Execution Time**: Mon–Fri at 15:45 PM IST (10:15 UTC) — 15 minutes after NSE closing bell.
* **Execution Engine**: GitHub Actions / Node / Bun script (`scripts/evening-market.ts`).
* **Source**: Yahoo Finance API (`yahoo-finance2`).
* **Batching**:
  - 1 request for all 11 NSE Sector Indices + India VIX + Nifty 50.
  - 10 batched requests (50 stocks/chunk) for the entire Nifty 500 universe.
* **Microstructure Computation (In-Memory)**:
  - Official Sector Ranking (ranked by performance).
  - Top 10 Gainers & Top 10 Losers.
  - Top 10 Most Active by turnover.
  - Volume Shockers (>2x 3-month average volume).
  - 52-Week High and Low proximity (<2% delta).
  - Cash Market Breadth: Total Advances, Declines, Unchanged, A/D Ratio.
* **Outputs**:
  - Updates `data/snapshots/{yyyy}/{mm}/{date}.json` with official closing prices and market breadth.
  - Appends to analytical ledgers:
    - `data/ledger/quantitative/market_breadth.jsonl`
    - `data/ledger/quantitative/sector_rotation.jsonl`
    - `data/ledger/quantitative/universe_eod.jsonl` (persisting the complete 500-stock daily close for true quantitative factor modeling).
* **Reliability**: Pure quantitative data, 0 LLM cost, executes in **~8 seconds**.

---

### Job 4: `evening-llm-intelligence` (Gemini + Portfolio Retrospective)
* **Execution Time**: Mon–Fri at 16:15 PM IST (10:45 UTC).
* **Execution Engine**: GitHub Actions / Node / Bun script (`scripts/retro.ts`).
* **Source**: Decrypted Portfolio Holdings + Technical Indicators + Grounded Gemini LLM.
* **What it does**:
  1. **Portfolio Technical Surveillance**:
     - Scans portfolio holdings against closing prices from Job 3.
     - Detects violations: 50-day moving average breakdown, single-session drawdown >3%, volume surge >2x average.
  2. **Grounded AI Risk Screening**:
     - For flagged holdings, searches real-time evening disclosures to determine whether the breakdown represents a genuine fundamental SELL/RISK signal vs noisy market pullback.
  3. **Preliminary Flow & PCR Check**:
     - Pulls initial closing Put-Call Ratio and early institutional estimates.
  4. **Closing Sentiment Index Calibration**:
     - Computes official closing Sentiment Index (`session: 'closing'`) reflecting final breadth, closing VIX, and options skew.
  5. **Outputs & Deliverables**:
     - Appends closing sentiment reading to `sentiment_ledger.jsonl`.
     - Appends risk judgments to `data/ledger/qualitative/portfolio_alerts.jsonl`.
     - Renders and dispatches **Kosh Market Close & Daily Retro** email.
     - Publishes `retro-{date}` report envelope to `data/reports/`.
* **Reliability**: Completely decoupled from market data fetching; portfolio evaluation cannot be blocked by Yahoo Finance latency.

---

### Job 5: `evaluate-bets` (Nightly Systematic Settlement & Post-Mortem Synthesis)
* **Execution Time**: Daily (Mon–Sun) at 23:00 PM IST (17:30 UTC).
* **Execution Engine**: GitHub Actions / Node script (`scripts/evaluate-bets.ts`, `.github/workflows/evaluate-bets.yml`).
* **Source**: `data/bets.json` + Yahoo Finance price quotes/candles + Google Gemini 2.5 Flash API (`PostMortemSchema`).
* **Trigger Engine**: Cloudflare Worker master cron dispatcher (`kosh-cron-dispatcher`).
* **What it does**:
  1. **Active Expiry Scanning**:
     - Reads all bets in `data/bets.json` via [`lib/bets-store.ts`](file:///Users/priyanshu/Desktop/Personal/kosh/lib/bets-store.ts) where `status === 'active'` and `expiryDate <= todayIST`.
  2. **Price & Target/Stop-Loss Reconciliation**:
     - Resolves final closing or range-bound prices using Yahoo Finance.
     - Evaluates whether `targetPrice` or `stopLossPrice` was triggered.
  3. **Strict Binary Settlement**:
     - Evaluates the outcome strictly as `'hit'` or `'miss'` (partial states eliminated).
     - Records realized return (`returnPct`) and closing price (`closePrice`).
  4. **Automated Gemini Miss Post-Mortem**:
     - If the bet misses (`outcome === 'miss'`), prompts Google Gemini 2.5 Flash with structured schema to synthesize an objective causal audit answering:
       - **What went wrong**: Concrete structural failure, sector de-rating, macro liquidity squeeze, or thesis violation.
       - **How could we have avoided it**: Actionable systematic rules (e.g. tighter stop, delivery volume threshold, earnings lockout).
     - Provides deterministic analytical fallback if LLM quota is unavailable.
  5. **Atomic Ledger Persistence**:
     - Sets status to `'closed'`, appends post-mortem notes, and saves atomically to `data/bets.json`.
     - Updates public records on `/bets/short-term` and `/bets/long-term`.
* **Reliability**: Deterministic math evaluation, zero user intervention required, 100% auditable history.

---

## 5. Cloudflare Worker Master Schedule (`kosh-cron-dispatcher`)

The Cloudflare Worker cron dispatcher (`workers/cron-dispatcher/src/index.ts`) will be simplified from 11 legacy schedules down to a clean, deterministic schedule:

```typescript
export const PIPELINE_SCHEDULE: ScheduledSlot[] = [
  // ── Daily Morning Cycle (Mon–Fri) ──
  {
    hours: 8,
    minutes: 0,
    daysOfWeek: [1, 2, 3, 4, 5],
    job: 'morning-market-data',
    workflowFile: 'morning-market.yml',
    description: 'Global cues, Asian markets, Gift Nifty & commodities (yfinance)',
  },
  {
    hours: 8,
    minutes: 15,
    daysOfWeek: [1, 2, 3, 4, 5],
    job: 'morning-llm-intelligence',
    workflowFile: 'morning-brief.yml',
    description: 'News synthesis, confirmed flows, morning sentiment & brief email dispatch',
  },

  // ── Daily Evening Cycle (Mon–Fri) ──
  {
    hours: 15,
    minutes: 45,
    daysOfWeek: [1, 2, 3, 4, 5],
    job: 'evening-market-data',
    workflowFile: 'evening-market.yml',
    description: 'NSE closing quotes, Nifty 500 internals, breadth & sector rankings (yfinance)',
  },
  {
    hours: 16,
    minutes: 15,
    daysOfWeek: [1, 2, 3, 4, 5],
    job: 'evening-llm-intelligence',
    workflowFile: 'evening-retro.yml',
    description: 'Portfolio surveillance, AI sell signal screening & retro email dispatch',
  },

  // ── Weekend & Monthly Outlook Editions ──
  {
    hours: 21,
    minutes: 0,
    daysOfWeek: [0], // Sunday 21:00 IST
    job: 'weekly-outlook',
    workflowFile: 'weekly.yml',
    description: 'Weekly Outlook: Portfolio events, IPOs in focus, sector growth, FII/DII flows & multi-asset scorecard',
  },
  {
    hours: 8,
    minutes: 0,
    dayOfMonth: 1, // 1st of month 08:00 IST
    job: 'monthly-outlook',
    workflowFile: 'monthly.yml',
    description: 'Monthly Digest: Multi-asset performance, sector leadership, monthly flow autopsy & macro review',
  },

  // ── Nightly Systematic Bets Evaluation (Daily) ──
  {
    hours: 23,
    minutes: 0,
    job: 'evaluate-bets',
    workflowFile: 'evaluate-bets.yml',
    description: 'Daily late-night evaluation and settlement of expiring systematic bets',
  },
];
```

---

## 6. Analytical Ledger Schemas (NDJSON / JSONL)

Every record is stored as a single-line JSON object (`JSON.stringify(record) + '\n'`), optimized for append operations and linear scans.

### 6.1 `data/ledger/quantitative/sentiment_ledger.jsonl`
```json
{"date":"2026-10-02","session":"closing","composite":18,"regime":"Extreme Fear","breadth":{"score":15,"adRatio":0.38,"advances":138,"declines":362},"flows":{"score":10,"fiiNet":-3460,"diiNet":1890,"totalNet":-1570},"volatility":{"score":22,"vix":15.8,"vixChangePct":4.2},"derivatives":{"score":25,"pcrOi":1.32,"pcrVolume":1.28},"timestamp":"2026-10-02T16:15:00.000Z"}
```

### 6.2 `data/ledger/quantitative/institutional_flows.jsonl`
```json
{"date":"2026-10-02","fiiNetCash":-3460.5,"diiNetCash":1890.2,"netInstitutional":-1570.3,"india10yYield":6.82,"yieldChangeBps":-1.4,"unit":"crore","verified":true}
```

### 6.3 `data/ledger/quantitative/market_breadth.jsonl`
```json
{"date":"2026-10-02","advances":138,"declines":362,"unchanged":0,"adRatio":0.38,"pctAdvancing":27.6,"near52wHighCount":8,"near52wLowCount":42}
```

### 6.4 `data/ledger/quantitative/sector_rotation.jsonl`
```json
{"date":"2026-10-02","rankings":[{"rank":1,"sector":"IT","changePct":0.45},{"rank":2,"sector":"Pharma","changePct":-0.12},{"rank":3,"sector":"FMCG","changePct":-0.48},{"rank":11,"sector":"Realty","changePct":-2.65}]}
```

### 6.5 `data/ledger/quantitative/multi_asset_weekly.jsonl`
```json
{"weekId":"2026-W40","periodEndDate":"2026-10-02","assets":[{"asset":"Nifty 50","symbol":"^NSEI","close":25014.6,"returnPct":-1.22},{"asset":"BSE Sensex","symbol":"^BSESN","close":81688.4,"returnPct":-1.15},{"asset":"Gold MCX","symbol":"GC=F","close":75980,"returnPct":1.45},{"asset":"Silver MCX","symbol":"SI=F","close":93400,"returnPct":2.10},{"asset":"Brent Crude","symbol":"CL=F","close":78.2,"returnPct":4.85},{"asset":"India 10Y Yield","symbol":"IN10Y","close":6.82,"returnPct":-0.08},{"asset":"USD/INR","symbol":"USDINR=X","close":83.92,"returnPct":0.15}]}
```

### 6.6 `data/ledger/quantitative/weekly_ipos.jsonl`
```json
{"weekId":"2026-W40","dateFetched":"2026-10-04","ipos":[{"company":"Hyundai Motor India","priceBand":"₹1,865 – ₹1,960","issueSize":"₹27,870 cr","gmp":"+₹65","gmpPct":"+3.3%","subscription":"2.37×","status":"Closed","listingDate":"2026-10-22"},{"company":"Waaree Energies","priceBand":"₹1,427 – ₹1,503","issueSize":"₹4,321 cr","gmp":"+₹1,250","gmpPct":"+83.2%","subscription":"76.3×","status":"Upcoming","listingDate":"2026-10-28"}]}
```

### 6.7 `data/ledger/qualitative/market_news.jsonl`
```json
{"date":"2026-10-02","session":"morning","category":"macro_policy","headline":"RBI MPC Keeps Repo Rate Unchanged at 6.50% Amid Resilient Growth","summary":"Monetary Policy Committee maintains status quo on policy rates with focused stance on inflation alignment.","sentiment":"neutral","tickers":[],"source":"Economic Times"}
```

### 6.8 `data/ledger/qualitative/portfolio_events.jsonl`
```json
{"date":"2026-10-04","weekId":"2026-W40","ticker":"HDFCBANK.NS","name":"HDFC Bank","recentEvent":"Announced Q2 gross advance growth of 7% YoY; deposits grew 15.1% YoY.","upcomingCatalyst":"Board meeting for Q2 FY27 audited earnings on 16 Oct 2026.","impactAssessment":"Deposit rebalancing underway; positive long-term margin trajectory.","severity":"neutral"}
```

---

## 7. Performance, Latency & Redundancy Comparison

| Metric | Legacy Architecture | Proposed Streamlined Architecture | Improvement |
|---|---|---|---|
| **Total Daily Workflows** | 8 daily runs (11 total) | 4 daily runs | **50% fewer daily workflows** |
| **CI Runner VM Overhead** | ~400 seconds / day | ~60 seconds / day | **85% reduction in compute waste** |
| **Middle-of-the-Night Runs** | 4 jobs (02:00–02:45 AM IST) | 0 jobs | **100% eliminated stale runs** |
| **Redundant yfinance Fetches** | 3 separate identical fetches | 1 morning cue fetch + 1 closing fetch | **Zero duplicate ticker quotes** |
| **Git Commit Spam** | 6 slice commits/day + rebase conflicts | 2 atomic session commits/day | **67% reduction in git operations** |
| **`/sentiment-index` Load Time** | ~180ms (reads 30 JSON files) | **<1ms** (reads 1 JSONL file) | **99% faster disk I/O** |
| **Historical Data Retention** | 0% (universe deleted daily) | 100% (persisted in JSONL ledgers) | **Full time-series backtest ready** |
| **IPO Data Ingestion** | Hardcoded static fixtures | **Automated weekly live fetch** (Sundays) | **Automated fresh primary market data** |

---

## 8. Finalized Architecture: Weekly & Monthly Outlook (No Bet Analysis)

The legacy outlook structure relied on a `positionalBets` and `midTermBets` buy/sell tipping model. As instructed, **all bet analysis has been completely removed**. The new Outlook structure is strictly an **audited institutional intelligence dossier**:

### 8.1 The 5 Pillars of the New Weekly Outlook
Every Sunday at 21:00 IST (`scripts/weekly.ts`), the weekly pipeline executes:

1. **Portfolio Focus & Company Catalyst Surveillance**:
   - Evaluates the actual model portfolio holdings against news, earnings calendar, and regulatory disclosures.
   - Summarizes:
     - Major news or events that affected each holding over the past week.
     - Critical upcoming catalysts (e.g. board meetings, earnings dates, AGM, order wins, product launches) scheduled for the upcoming week/month.
     - Clear, sober impact assessment without speculative price prediction.

2. **IPOs in Focus (The Authoritative Weekly Primary Market Fetch)**:
   - **Single weekly fetch**: Sunday is designated as the single time per week when comprehensive primary market data is extracted via Grounded Gemini LLM / Chittorgarh / NSE IPO portal.
   - Extracts: Company name, sector, price band, issue size (₹ cr), Grey Market Premium (GMP in ₹ and %), total subscription multiple (QIB, NII, Retail), and key dates (Bidding Open/Close, Basis of Allotment, Listing Date).
   - **Cross-App Data Sharing**: This dataset is saved to `data/staging/weekly_ipos.json` and `data/ledger/quantitative/weekly_ipos.jsonl`, directly populating both the **Weekly Outlook** and the **Homepage Primary Market Table** for the entire week!

3. **Sector Growth & Relative Rotation**:
   - Aggregates weekly returns across all 11+ NSE Sectoral Indices.
   - Ranks sectors from strongest relative momentum to deepest drag.
   - Highlights capital rotation themes (e.g. defensive flight into FMCG/Pharma vs cyclical outflow from Realty/Metals).

4. **Institutional Flow Trend (FII vs. DII)**:
   - 5-day rolling cumulative inflow/outflow balance in ₹ crore.
   - Compares foreign institutional liquidation vs domestic mutual fund absorption capacity.
   - Analyzes impact on market liquidity and rupee stability.

5. **Multi-Asset Scorecard**:
   - Cross-asset weekly performance table:
     - Equities: Nifty 50, Sensex
     - Safe Havens: Gold (MCX / Spot), Silver
     - Energy / Commodities: Brent Crude Oil
     - Sovereign Debt: India 10-Year Benchmark Yield
     - Foreign Exchange: USD/INR
   - Visualizes macro divergence (e.g. rising crude + rising dollar putting pressure on equity multiples).

---

### 8.2 Updated Schemas for Weekly & Monthly Outlooks

#### A. `WeeklyContentSchema`
```typescript
export const WeeklyContentSchema = z.object({
  snapshot: MarketSnapshotSchema,
  period: z.string(), // e.g. "2026-W40"
  
  // 1. Multi-Asset Scorecard
  multiAssetScorecard: z.array(z.object({
    asset: z.string(),
    symbol: z.string(),
    close: z.number(),
    returnPct: z.number(),
    context: z.string(),
  })),

  // 2. Sector Growth & Rotation
  sectorGrowth: z.array(z.object({
    sector: z.string(),
    weeklyReturnPct: z.number(),
    rank: z.number(),
    stance: z.enum(['leading', 'lagging', 'neutral']),
  })),

  // 3. Institutional Flows
  fiiDiiWeekly: z.object({
    fiiNetCrore: z.number(),
    diiNetCrore: z.number(),
    netInstitutionalCrore: z.number(),
    summary: z.string(),
  }),

  // 4. Portfolio Focus & Holding Events
  portfolioFocus: z.array(z.object({
    ticker: z.string(),
    name: z.string(),
    recentEvents: z.string(),
    upcomingCatalysts: z.string(),
    riskNote: z.string().optional(),
  })),

  // 5. IPOs in Focus (Weekly Authoritative Ingestion)
  iposInFocus: z.array(z.object({
    company: z.string(),
    priceBand: z.string(),
    issueSize: z.string(),
    gmp: z.string(),
    gmpPct: z.string(),
    subscription: z.string(),
    status: z.string(),
    listingDate: z.string().optional(),
  })),

  // 6. Macro & Week-Ahead Calendar
  macroThemes: z.array(z.string()),
});
```

#### B. `MonthlyContentSchema`
```typescript
export const MonthlyContentSchema = z.object({
  snapshot: MarketSnapshotSchema,
  period: z.string(), // e.g. "2026-09"

  // 1. Multi-Asset Monthly Scorecard
  multiAssetScorecard: z.array(z.object({
    asset: z.string(),
    symbol: z.string(),
    close: z.number(),
    monthlyReturnPct: z.number(),
    yearToDateReturnPct: z.number().optional(),
  })),

  // 2. Sector Performance & Leadership
  sectorLeadership: z.array(z.object({
    sector: z.string(),
    monthlyReturnPct: z.number(),
    rank: z.number(),
    driver: z.string(),
  })),

  // 3. Monthly Institutional Flow Autopsy
  fiiDiiMonthly: z.object({
    fiiNetCrore: z.number(),
    diiNetCrore: z.number(),
    netInstitutionalCrore: z.number(),
    fiiTrend: z.string(),
    diiTrend: z.string(),
  }),

  // 4. Portfolio Monthly Performance & Allocation
  portfolioReview: z.object({
    monthlyReturnPct: z.number(),
    benchmarkReturnPct: z.number(),
    topContributors: z.array(z.string()),
    drags: z.array(z.string()),
    keyLearnings: z.array(z.string()),
  }),

  // 5. Macro Policy & Thematic Review
  macroThemes: z.array(z.string()),
});
```

---

## 9. Systematic Bets Engine & Settlement Service (`/bets/short-term` & `/bets/long-term`)

Kosh decouples speculative market calls from generic commentary by providing a **systematic, math-grounded bet architecture**. Instead of relying on ungrounded LLM stock tipping, all bets are screened through deterministic mathematical criteria, monitored continuously with explicit `callDate` and `expiryDate` coordinates, and settled every night at 23:00 IST into an immutable public audit ledger.

```
                  SYSTEMATIC BETS LIFECYCLE & CAUSAL AUDIT
                  
  WEEKLY CADENCE (Sunday/Monday)             MONTHLY CADENCE (1st of Month)
  ┌───────────────────────────────┐          ┌───────────────────────────────┐
  │  SHORT-TERM TACTICAL BETS     │          │  LONG-TERM STRATEGIC BETS     │
  │  • 5–20 Trading Days Duration │          │  • 3–12 Months Horizon        │
  │  • Momentum & Mean Reversion  │          │  • Moats, Piotroski & FCF     │
  └──────────────┬────────────────┘          └──────────────┬────────────────┘
                 │                                          │
                 ▼                                          ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                           ACTIVE BETS POOL                               │
  │               Persisted in `data/bets.json` with status="active"         │
  │               Displayed in Section IV of /bets/short-term & long-term    │
  └──────────────────────────────────────┬───────────────────────────────────┘
                                         │
                                         │  Every Night at 23:00 IST
                                         │  (scripts/evaluate-bets.ts)
                                         ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                   EXPIRY EVALUATION & SETTLEMENT ENGINE                  │
  │  1. Filter active bets where `expiryDate <= todayIST`                    │
  │  2. Fetch closing / candle prices from Yahoo Finance                     │
  │  3. STRICT BINARY SETTLEMENT: Evaluated strictly as `hit` or `miss`      │
  └───────────────────┬──────────────────────────────────┬───────────────────┘
                      │                                  │
              Outcome = 'hit'                    Outcome = 'miss'
                      │                                  │
                      ▼                                  ▼
      ┌───────────────────────────────┐  ┌───────────────────────────────────┐
      │  RECORD HIT                   │  │  AUTOMATED AI CAUSAL POST-MORTEM  │
      │  • Realized return logged     │  │  • Trigger Gemini 2.5 Flash       │
      │  • Marked as [HIT] in ledger  │  │  • "What went wrong"              │
      │                               │  │  • "How could we have avoided it" │
      └──────────────┬────────────────┘  └─────────────────┬─────────────────┘
                     │                                     │
                     └─────────────────┬───────────────────┘
                                       ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                    CLOSED SETTLEMENT & AUDIT LEDGER                      │
  │             Persisted in `data/bets.json` with status="closed"           │
  │             Rendered in Section V Broadsheet Tables on Frontend          │
  └──────────────────────────────────────────────────────────────────────────┘
```

---

### 9.1 The Two Investment Horizons

#### A. Short-Term Tactical Bets (`/bets/short-term`)
* **Publication Cadence**: Once per week (Monday 08:00 IST pre-market or Sunday 21:00 IST).
* **Holding Duration**: 5 to 20 trading days with explicit `expiryDate`.
* **Objective**: Exploit short-term liquidity dislocations, volatility squeezes, and high-probability momentum bursts.
* **4 Quantitative Formulations (No LLM Guessing)**:
  1. **Mean-Reversion Oversold**:
     $$\text{Condition: } RSI_{14} < 30 \quad\land\quad \text{Close} \le \text{LowerBollinger}(20, 2) \quad\land\quad \text{Volume} > 1.5 \times \text{SMA}_{20}(\text{Volume})$$
     * *Exit Target*: 20-day Simple Moving Average (mean price).
     * *Stop Loss*: 3.0% below the recent swing low.
  2. **Institutional Block Accumulation**:
     $$\text{Condition: } \text{DeliveryVolume} > 2.5 \times \text{AvgDelivery}_{20} \quad\land\quad \text{DeliveryPct} > 60\% \quad\land\quad \Delta\text{Price} > 0$$
     * *Exit Target*: Key overhead supply/resistance cluster (+6% to +10%).
     * *Stop Loss*: Breakdown below the accumulation base low (-3% to -4%).
  3. **High-Momentum 52-Week Breakout**:
     $$\text{Condition: } \text{Close} \ge 0.985 \times \text{High}_{52W} \quad\land\quad RSI_{14} \in [60, 75] \quad\land\quad \text{MACD Histogram} > 0$$
     * *Exit Target*: Pivot Point R2 resistance projection (+8% to +12%).
     * *Stop Loss*: 3.5% below the breakout pivot level.
  4. **Post-Earnings Momentum Thrust**:
     $$\text{Condition: } \text{EPS Surprise} > 15\% \quad\land\quad \text{Open Gap} > 3\% \quad\land\quad \text{Volume} > 3 \times \text{AvgVolume}_{60}$$
     * *Exit Target*: Fibonacci extension 1.618 of opening range (+8% to +15%).
     * *Stop Loss*: Full closure of the gap day low.

#### B. Long-Term Strategic Bets (`/bets/long-term`)
* **Publication Cadence**: Once per month (1st of every month at 08:00 IST).
* **Holding Duration**: 3 to 12 months with explicit custom `expiryDate`.
* **Objective**: Compound capital in high-return structural leaders, industry monopolies, and fundamental turnarounds.
* **4 Fundamental & Structural Formulations**:
  1. **Piotroski F-Score Deep Value**:
     $$\text{Condition: } \text{F-Score} \ge 8/9 \quad\land\quad P/E < \text{Sector Median} \quad\land\quad \Delta\text{Operating Cash Flow} > \Delta\text{Net Income}$$
     * *Exit Target*: Re-rating to 5-year historical median valuation multiple (+25% to +45%).
     * *Stop Loss*: 12% trailing structural support invalidation.
  2. **Free Cash Flow Compounding Machine**:
     $$\text{Condition: } \text{ROIC} > 20\% \quad\land\quad \text{FCF Yield} > 4\% \quad\land\quad \text{Reinvestment Rate} > 60\% \quad\land\quad \frac{\text{Net Debt}}{\text{Equity}} < 0.3$$
     * *Exit Target*: 3-year discounted cash flow fair value projection (+30% to +60%).
     * *Stop Loss*: 15% structural degradation or consecutive 2-quarter FCF contraction.
  3. **Duopoly Moat & Pricing Power**:
     $$\text{Condition: } \text{Top 2 Market Share} > 65\% \quad\land\quad \text{Gross Margin} > 35\% \quad\land\quad \text{Revenue CAGR}_{5Y} > 14\%$$
     * *Exit Target*: Intrinsic earnings compounding at 1.5× sector multiple (+35% to +50%).
     * *Stop Loss*: 15% margin erosion or anti-trust/regulatory disruption.
  4. **Debt Deleveraging & Balance Sheet Turnaround**:
     $$\text{Condition: } \Delta\text{Net Debt}_{2Y} < -40\% \quad\land\quad \frac{\text{EBITDA}}{\text{Interest Expense}} > 5.0\times \quad\land\quad \text{CFO} > 0$$
     * *Exit Target*: Credit rating upgrade and enterprise multiple expansion (+40% to +80%).
     * *Stop Loss*: 15% debt accumulation reversal.

---

### 9.2 Nightly Expiry Settlement Engine (`scripts/evaluate-bets.ts`)

Every evening at 23:00 IST (17:30 UTC), GitHub Actions executes `evaluate-bets.ts`:

1. **Active Expiry Query**:
   Reads `data/bets.json` via [`lib/bets-store.ts`](file:///Users/priyanshu/Desktop/Personal/kosh/lib/bets-store.ts). Identifies all calls where:
   $$\text{status} = \text{'active'} \quad\land\quad \text{expiryDate} \le \text{todayIST}$$
2. **Reconciliation Against Targets**:
   Pulls market close and daily range for each expiring symbol via `yahoo-finance2`.
3. **Strict Binary Settlement**:
   Settlement is strictly binary. There are **only two possible outcomes**:
   - `hit`: The security achieved or exceeded `targetPrice` without breaching `stopLossPrice`.
   - `miss`: The security stopped out or closed below the target threshold at expiry.
4. **Automated AI Causal Post-Mortem Generation**:
   Whenever a call misses (`outcome === 'miss'`), the engine invokes Google Gemini 2.5 Flash with the structured [`PostMortemSchema`](file:///Users/priyanshu/Desktop/Personal/kosh/lib/schemas.ts#L582) to synthesize an institutional-grade post-mortem:
   - **What went wrong**: Concrete analysis of breakdown factors (e.g. unexpected sector rotation, foreign institutional liquidation, earnings disappointment, resistance failure).
   - **How could we have avoided it**: Actionable systematic rules for future iterations (e.g. requiring a 3-day volume consolidation filter, widening the stop-loss band, or vetoing entries 5 days ahead of monetary policy announcements).
   - *Deterministic Fallback*: If LLM connectivity or quota fails, the engine generates an automated mathematical breakdown based on price delta and target gap, guaranteeing zero pipeline blockage.
5. **Persistence & Verification**:
   The bet is marked `status = 'closed'`, stamped with `closedOn`, `closePrice`, `returnPct`, `outcome`, and `postMortem`, and atomically committed to `data/bets.json`.

---

### 9.3 Data Contract & Storage (`data/bets.json` & `lib/schemas.ts`)

```typescript
export const SystematicBetSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  name: z.string(),
  horizon: z.enum(['short_term', 'long_term']),
  category: z.string(),
  action: z.enum(['buy', 'sell']).default('buy'),
  callDate: z.string(),         // Format: YYYY-MM-DD
  expiryDate: z.string(),       // Format: YYYY-MM-DD
  entryPrice: z.number(),
  targetPrice: z.number(),
  stopLossPrice: z.number(),
  quantScore: z.number(),       // Quantitative score (0-100)
  triggers: z.string(),         // Exact mathematical triggers
  thesis: z.string(),           // Core investment thesis
  status: z.enum(['active', 'closed']).default('active'),
  closedOn: z.string().optional(),
  closePrice: z.number().optional(),
  returnPct: z.number().optional(),
  outcome: z.enum(['hit', 'miss']).optional(),
  postMortem: z.object({
    whatWentWrong: z.string(),
    howToAvoid: z.string(),
    analyzedAt: z.string().optional(),
  }).optional(),
});
```

---

### 9.4 Frontend Presentation & Scorecard Deprecation

1. **Header Navigation Overhaul**:
   - The legacy `Scorecard` tab and weekly grading reports have been completely removed from navigation.
   - The header now features dedicated, first-class routes:
     - **Short Term** (`/bets/short-term`): Tactically focused, weekly calls, 5–20 day trades.
     - **Long Term** (`/bets/long-term`): Strategically focused, monthly calls, 3–12 month positions.
2. **Broadsheet Layout Rules**:
   - Zero colorful badge pills, card containers, or flashy indicators.
   - Formatted in classical broadsheet tabular layouts with hairline borders (`border-t border-b border-[var(--color-ink)]`).
   - Outcomes marked explicitly as `[HIT]` or `[MISSED]`.
   - Post-mortems displayed as indented editorial quote blocks directly beneath the settlement table.

---

## 10. Unified Master Inventory of All Kosh Jobs, Services & Integrations

The complete ecosystem consists of **8 core services**, **7 active automated jobs**, **3 on-demand tooling scripts**, and **2 deprecated legacy suites**:

### 10.1 Master Services & Infrastructure Catalog

| Service Name | Technology / Runtime | Hosting / Environment | Role / Description | Health & Failure Mode |
|---|---|---|---|---|
| **Next.js Web Application** | Next.js 16 (Turbopack, App Router, SSR/SSG) | Node.js / Vercel / Cloudflare | Core web UI, broadsheet typography, static SSG exports (128+ routes) | Static fallback prerender; zero downtime |
| **`kosh-cron-dispatcher`** | Cloudflare Workers (TypeScript) | Cloudflare Edge Network | Master cron trigger; computes IST slots every 15 min; dispatches GitHub Actions workflows | Redundant edge deployment; logs failures |
| **GitHub Actions Runners** | Ubuntu 24.04 VM runners | GitHub Actions | Executes data pipelines, runs analytical scripts, commits snapshot diffs to git | Auto-retries; atomic git rebase |
| **Google Gemini 2.5 Flash** | `@google/genai` (Node SDK) | Google AI Studio | Structured qualitative intelligence, grounded news search, causal post-mortems | Deterministic TypeScript fallbacks on failure |
| **Yahoo Finance Engine** | `yahoo-finance2` (Node library) | Executed in runner scripts | Batched quote fetching, historical candles, benchmark indices, Nifty 500 universe | In-memory retry logic; cached previous day quotes |
| **Zerodha Kite Connect** | Kite Connect REST API | Executed in runner scripts | Daily holdings sync, live portfolio margin, realized P&L | Graceful offline mode if Kite token expired |
| **Resend Delivery API** | Resend API + `@react-email` | Cloud / SaaS | Dispatches Kosh Daily Morning Brief, Daily Retro, and Weekly Outlook emails | Non-blocking email dispatch; logged to console |
| **Git JSON/JSONL Storage** | Git Version Controlled Disk | Repository Filesystem | Dual-plane operational snapshots (`data/snapshots/`), analytical ledgers (`data/ledger/`), and bets (`data/bets.json`) | Immutable history; 0 external database fees |

---

### 10.2 Master Scheduled Pipeline & Job Registry

| Job Identifier | Frequency / Schedule | IST Trigger | Primary Script | Workflow File | Inputs & Dependencies | Primary Outputs & Deliverables | Status |
|---|---|---|---|---|---|---|---|
| **`morning-market-data`** | Mon–Fri | 08:00 AM IST | `scripts/morning-market.ts` | `morning-market.yml` | Yahoo Finance (Global cues, Gift Nifty, commodities, FX) | `data/staging/morning_cues.json`, `global_cues.jsonl` | **Active** |
| **`morning-llm-intelligence`** (`daily`) | Mon–Fri | 08:15 AM IST | `scripts/daily.ts` | `morning-brief.yml` / `daily.yml` | `morning_cues.json` + Gemini Search + Resend API | `data/snapshots/{date}.json`, Daily Brief Email, `/reports/daily-{date}` | **Active** |
| **`evening-market-data`** | Mon–Fri | 15:45 PM IST | `scripts/evening-market.ts` | `evening-market.yml` | Yahoo Finance (NSE closing quotes, Nifty 500 universe) | Closing snapshot, `market_breadth.jsonl`, `sector_rotation.jsonl` | **Active** |
| **`evening-llm-intelligence`** (`retro`) | Mon–Fri | 16:15 PM IST | `scripts/retro.ts` | `evening-retro.yml` / `retro.yml` | Kite Portfolio + Gemini Search + Resend API | Closing sentiment, Daily Retro Email, `/reports/retro-{date}` | **Active** |
| **`evaluate-bets`** | Daily (Mon–Sun) | 23:00 PM IST | `scripts/evaluate-bets.ts` | `evaluate-bets.yml` | `data/bets.json` + Yahoo Finance + Gemini 2.5 Flash | Settle expiring bets, hit/miss flags, causal post-mortems in `bets.json` | **Active** |
| **`weekly-outlook`** (`weekly`) | Weekly (Sunday) | 21:00 PM IST | `scripts/weekly.ts` | `weekly.yml` | Multi-asset snapshots + Gemini (IPO extraction) + Resend | `weekly_ipos.json`, Weekly Outlook Email, `/outlook/{y}/{m}/week-{w}` | **Active** |
| **`monthly-outlook`** (`monthly`) | Monthly (1st) | 08:00 AM IST | `scripts/monthly.ts` | `monthly.yml` | 30-day snapshot history + Gemini macro analysis | Monthly Digest Email, `/outlook/{y}/{m}/month` | **Active** |
| **`portfolio`** | On-Demand / Sync | Manual | `scripts/portfolio.ts` | `portfolio.yml` | Zerodha Kite Connect API | Reconciled portfolio holdings in `data/portfolio.json` | **Active** |
| **`kite-session`** | Pre-Market (Daily) | 07:45 AM IST | `scripts/kite-session.ts` | Manual / Script | Zerodha Kite Connect API + TOTP | Valid `KITE_ACCESS_TOKEN` for daily portfolio queries | **Active** |
| **`preview-emails`** | Development Tool | Local CLI | `scripts/preview-emails.ts` | CLI Command | Local snapshot data + React Email templates | Browser preview of all HTML email editions | **Active** |
| **`research`** | Thematic Studies | On-Demand | `scripts/research.ts` | `research.yml` | Grounded Gemini LLM | Deep-dive research papers on `/research/{id}` | **Active** |
| **`recap` (Scorecard)** | Weekly Audit | *Deprecated* | `scripts/recap.ts` | `recap.yml` | Legacy snapshot comparison | `/scorecard` *(Deprecated in favor of `/bets/*`)* | **Deprecated** |
| **Legacy Feeds** (`feed-*`) | Staggered 02:00 AM | *Deprecated* | `scripts/feed-*.ts` | `feed-*.yml` | Yahoo Finance, Gemini | `data/feed/{date}/*.json` *(Consolidated into 5 clean jobs)* | **Deprecated** |

---

## 11. Implementation Roadmap & Milestones

1. **Phase 1: Systematic Bets Foundation (Complete)**:
   - Implemented `SystematicBetSchema`, `PostMortemSchema`, and storage helpers in [`lib/schemas.ts`](file:///Users/priyanshu/Desktop/Personal/kosh/lib/schemas.ts) and [`lib/bets-store.ts`](file:///Users/priyanshu/Desktop/Personal/kosh/lib/bets-store.ts).
   - Created `scripts/evaluate-bets.ts` for nightly 23:00 IST expiry settlement and AI post-mortems on misses.
   - Registered `evaluate-bets` in Cloudflare Worker dispatcher and `.github/workflows/evaluate-bets.yml`.
   - Built `/bets/short-term` and `/bets/long-term` broadsheet pages with active and settled audit ledgers.
   - Updated header navigation: removed Scorecard, added Short Term and Long Term.

2. **Phase 2: Weekly & Monthly Outlook Redesign (Active)**:
   - Finalize the 5 non-bet pillars for Weekly Outlook (Multi-Asset Scorecard, Sector Rotation, Institutional Flows, Portfolio Focus, Weekly IPOs).
   - Wire authoritative Sunday IPO ingestion from `data/staging/weekly_ipos.json` to the homepage.
   - Typeset `src/components/WeeklyView.tsx` and `src/components/MonthlyView.tsx` in authentic broadsheet typography.

3. **Phase 3: Pipeline Consolidation & Cleanup**:
   - Retire legacy middle-of-the-night workflows (`feed-indices`, `feed-global`, `feed-universe`, `feed-internals`, `feed-news`, `feed-flows`).
   - Standardize all automated jobs on the 5 daily jobs + Sunday Weekly + 1st-of-month Monthly schedule.
   - Switch operational reading of sentiment from multi-file scan to `data/ledger/quantitative/sentiment_ledger.jsonl`.


