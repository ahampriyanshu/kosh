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
   - **Consolidate 11 workflows into 4 high-performance daily jobs**:
     1. `morning-market-data` (yfinance): Fast, batched market cues (08:00 IST).
     2. `morning-llm-intelligence` (Gemini Search + Daily Brief): Grounded news, analyst calls, daily brief email (08:15 IST).
     3. `evening-market-data` (yfinance): Official NSE close, full Nifty 500 microstructure, sector rankings (15:45 IST).
     4. `evening-llm-intelligence` (Gemini Search + Daily Retro): FII/DII verification, portfolio risk screening, retro email (16:15 IST).
   - **Implement a Dual-Plane Storage Architecture**:
     - **Operational Plane**: Fast, atomic snapshots (`data/snapshots/{date}.json`) for Next.js SSR/SSG and email generation.
     - **Analytical Plane**: Append-only, time-series JSONL ledgers for quantitative data (`flows`, `breadth`, `sentiment`, `sectors`) and qualitative knowledge (`news`, `recs`, `risk_alerts`), directly loadable in Pandas, DuckDB, or SQLite/Cloudflare D1 in 1 millisecond.
   - *(Note: Weekly and monthly outlook jobs are deferred per user instruction for dedicated design discussion).*

---

## 2. Complete Inventory of Application Data Needs

Across the homepage, sentiment index, portfolio surveillance, research desk, and email editions, the platform requires 22 discrete data streams:

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

---

## 3. Storage Architecture: Operational Plane vs. Analytical Plane

To support blazing-fast frontend page loads while empowering deep historical, quantitative, and qualitative research in the future, we decouple storage into two specialized planes:

```
data/
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

## 4. The 4 Streamlined Daily Jobs

Instead of running 11 staggered jobs, the entire daily lifecycle is executed by **4 dedicated, decoupled jobs**:

```
08:00 IST                    08:15 IST                   15:45 IST                    16:15 IST
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│  JOB 1: MORNING DATA  │   │  JOB 2: MORNING LLM   │   │  JOB 3: EVENING DATA  │   │  JOB 4: EVENING LLM   │
│  (Yahoo Finance)      │   │  (Gemini + Brief)     │   │  (Yahoo Finance)      │   │  (Gemini + Retro)     │
├───────────────────────┤   ├───────────────────────┤   ├───────────────────────┤   ├───────────────────────┤
│ • Global Indices      │   │ • Morning Top News    │   │ • Indian Indices      │   │ • Portfolio Screening │
│ • Gift Nifty          │   │ • Street Recs         │   │ • Nifty 500 Quotes    │   │ • AI Risk Flags       │
│ • Asian Markets       │   │ • Corporate Calendar  │   │ • Sector Rankings     │   │ • FII/DII Final Check │
│ • Commodities & FX    │   │ • Confirmed FII/DII   │   │ • Breadth & Volume    │   │ • Closing Sentiment   │
│ • Prev Close Ref      │   │ • Morning Sentiment   │   │ • Microstructure      │   │ • Retro Email Sent    │
│                       │   │ • Daily Brief Emailed │   │ • Time-Series Appended│   │ • Report Published    │
└───────────────────────┘   └───────────────────────┘   └───────────────────────┘   └───────────────────────┘
  Runtime: ~2 seconds         Runtime: ~18 seconds        Runtime: ~8 seconds         Runtime: ~15 seconds
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

  // ── Weekend Call Grading & Scorecard ──
  {
    hours: 10,
    minutes: 0,
    daysOfWeek: [6], // Saturday
    job: 'recap',
    workflowFile: 'recap.yml',
    description: 'Positional bet grading, outcome verification & audited scorecard ledger',
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

### 6.5 `data/ledger/quantitative/corporate_actions.jsonl`
```json
{"dateCaptured":"2026-10-02","ticker":"TCS","name":"Tata Consultancy Services Ltd","type":"results","actionDate":"2026-10-07","announcedDate":"2026-09-20"}
{"dateCaptured":"2026-10-02","ticker":"BLS","name":"BLS E-Services Limited","type":"split","actionDate":"2026-10-06","announcedDate":"2026-09-15"}
```

### 6.6 `data/ledger/qualitative/market_news.jsonl`
```json
{"date":"2026-10-02","session":"morning","category":"macro_policy","headline":"RBI MPC Keeps Repo Rate Unchanged at 6.50% Amid Resilient Growth","summary":"Monetary Policy Committee maintains status quo on policy rates with focused stance on inflation alignment.","sentiment":"neutral","tickers":[],"source":"Economic Times"}
```

### 6.7 `data/ledger/qualitative/portfolio_alerts.jsonl`
```json
{"date":"2026-10-02","ticker":"HDFCBANK.NS","name":"HDFC Bank","price":1642.5,"changePct":-3.4,"triggeredRules":["drawdown>3%","below 50DMA support"],"aiReason":"Heavy FII institutional block selling post quarterly updates; genuine downside support test.","severity":"high","isSellSignal":true}
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

---

## 8. Open Discussion: The Ideal Weekly and Monthly Outlooks

Per user instruction, the weekly and monthly outlook structures are deferred for future design alignment. Below are the key design questions and architectural concepts to evaluate:

### 8.1 What Should the Ideal Weekly Outlook Look Like?
- **Timing**: Sunday evening at 21:00 IST (pre-trading week preparation).
- **Core Structural Proposals**:
  1. **Macro & Central Bank Catalyst Radar**: Upcoming RBI/Fed meetings, CPI inflation prints, IIP data, US payrolls scheduled for the week.
  2. **Weekly Sector Rotation Momentum**: Analysis of leading vs lagging sectors over a rolling 4-week window (Which sectors are entering accumulation vs distribution?).
  3. **High-Conviction Positional Setups**: 3–5 tactical swing candidates selected using technical criteria (breakouts from consolidation, volume accumulation, institutional support).
  4. **Market Regime Summary**: 7-day rolling Sentiment Index trajectory and options positioning into the weekly expiry.

### 8.2 What Should the Ideal Monthly Outlook Look Like?
- **Timing**: 1st trading day of each month at 08:00 IST.
- **Core Structural Proposals**:
  1. **Monthly Asset Class Performance Matrix**: Equities (Large, Mid, Small) vs Gold vs 10Y Sovereign Debt vs Crude vs INR.
  2. **Institutional Flow Autopsy**: Monthly cumulative FII vs DII trajectory across primary and secondary markets.
  3. **Quarterly Earnings Season Tracker**: Sector-by-sector profit growth, margin compression themes, and management guidance scorecards.
  4. **Strategic Portfolio Asset Allocation**: Model rebalancing recommendations across cash, defensive equity, and tactical growth.

---

## 9. Next Steps & Implementation Roadmap

1. **Review & Approval**: Align on the 4-job timing schedule and the JSONL analytical ledger schema.
2. **Phase 1: Consolidate Market Data Fetchers**: Create `scripts/morning-market.ts` (08:00 IST) and `scripts/evening-market.ts` (15:45 IST) with batching.
3. **Phase 2: Consolidate LLM Intelligence**: Merge news, flows, and narrative generation into single-pass prompts.
4. **Phase 3: Ledger Append Utility**: Implement `lib/ledger-store.ts` for clean, append-only JSONL writes.
5. **Phase 4: Cloudflare Worker Schedule Update**: Update `workers/cron-dispatcher/src/index.ts` to dispatch the 4 new workflows.
6. **Phase 5: Weekly & Monthly Design Session**: Discuss and implement the new weekly and monthly outlook templates.
