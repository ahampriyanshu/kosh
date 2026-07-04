# Kite Holdings Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a holdings-only Kite portfolio sync that runs at 17:00 IST, renders a richer portfolio dashboard, and restricts portfolio alerts to retro reports.

**Architecture:** Kite access stays in Node-only scripts and GitHub Actions. The app renders sanitized `data/portfolio.json`; retro reads that snapshot for sell/risk alerts.

**Tech Stack:** TypeScript, Zod, Vitest, Next.js static export, GitHub Actions, Kite Connect v3.

## Global Constraints

- Fetch only Kite holdings; do not fetch margins or positions.
- GitHub Actions is the default runner for portfolio sync.
- Portfolio cron targets 17:00 IST using the repo's timezone-aware cron convention.
- Do not commit Kite secrets, access tokens, user profile data, or account identifiers.
- Daily, weekly, and monthly reports remain market opportunity/evaluation workflows.
- Portfolio alerts are generated only in retro.

---

### Task 1: Portfolio Schema

**Files:**
- Modify: `lib/schemas.ts`
- Modify: `tests/lib/portfolio.test.ts`

**Interfaces:**
- Produces: `PortfolioSchema`, `PortfolioHolding`, `PortfolioSummary`, `Portfolio`

- [ ] Extend `PortfolioSchema` with `source`, rich holding fields, and `summary`.
- [ ] Keep legacy `ticker`, `name`, `qty`, `avgCost` reads compatible by normalizing in `lib/portfolio.ts`.
- [ ] Add tests for rich portfolio data and missing file behavior.
- [ ] Run: `npm test -- tests/lib/portfolio.test.ts tests/lib/schemas.test.ts`

### Task 2: Kite Holdings Client

**Files:**
- Create: `lib/kite.ts`
- Create: `tests/lib/kite.test.ts`

**Interfaces:**
- Produces: `fetchKiteHoldingsSnapshot(now?: Date): Promise<Portfolio>`

- [ ] Add a Kite response schema for `GET /portfolio/holdings`.
- [ ] Fetch `https://api.kite.trade/portfolio/holdings` with `X-Kite-Version: 3` and `Authorization: token ${KITE_API_KEY}:${KITE_ACCESS_TOKEN}`.
- [ ] Normalize holdings to `Portfolio`.
- [ ] Compute aggregate summary and allocation percentages.
- [ ] Throw clear errors for missing credentials or non-success Kite responses.
- [ ] Run: `npm test -- tests/lib/kite.test.ts`

### Task 3: Portfolio Sync Script and Action

**Files:**
- Create: `scripts/portfolio.ts`
- Create: `.github/workflows/portfolio.yml`
- Modify: `.github/workflows/deploy.yml`
- Create: `tests/scripts/portfolio.test.ts`

**Interfaces:**
- Consumes: `fetchKiteHoldingsSnapshot(now?: Date): Promise<Portfolio>`

- [ ] Add `runPortfolioSync(now?: Date): Promise<void>`.
- [ ] Write the snapshot to `data/portfolio.json`.
- [ ] Add npm script `portfolio:sync`.
- [ ] Add GitHub workflow scheduled at `57 16 * * 1-5` with `timezone: "Asia/Kolkata"`.
- [ ] Commit `data/portfolio.json` changes from the workflow.
- [ ] Ensure deploy triggers after Portfolio sync completes.
- [ ] Run: `npm test -- tests/scripts/portfolio.test.ts`

### Task 4: Retro Uses Portfolio Holdings

**Files:**
- Modify: `scripts/retro.ts`
- Modify: `tests/scripts/retro.test.ts`

**Interfaces:**
- Consumes: `readPortfolio(): Promise<Portfolio>`

- [ ] Replace watchlist scanning with portfolio holdings scanning.
- [ ] Use holding `ticker` and `name` for quote and historical checks.
- [ ] Preserve deterministic alert flags and LLM confirmation.
- [ ] Skip gracefully when there are no holdings.
- [ ] Run: `npm test -- tests/scripts/retro.test.ts`

### Task 5: Portfolio Dashboard

**Files:**
- Modify: `src/app/portfolio/page.tsx`
- Modify: `src/app/sitemap.ts`

**Interfaces:**
- Consumes: `readPortfolio(): Promise<Portfolio>`

- [ ] Replace the rudimentary holdings table with summary metrics and a rich holdings table.
- [ ] Show stale snapshot messaging when `asOf` is older than 36 hours.
- [ ] Keep the watchlist section separate from actual holdings.
- [ ] Run: `npm run build`

### Task 6: Final Verification

**Files:**
- All touched files

- [ ] Run: `npm test -- tests/lib/portfolio.test.ts tests/lib/kite.test.ts tests/scripts/portfolio.test.ts tests/scripts/retro.test.ts tests/lib/schemas.test.ts`
- [ ] Run: `npm run typecheck`
- [ ] Run: `npm run build`
- [ ] Run: `ruby -e "require 'yaml'; YAML.load_file('.github/workflows/portfolio.yml'); YAML.load_file('.github/workflows/deploy.yml'); puts 'workflow YAML valid'"`
