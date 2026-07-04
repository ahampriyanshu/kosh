# Kite Holdings Portfolio Design

## Goal

Replace the static sample portfolio with a GitHub Actions driven Kite holdings snapshot, and use that snapshot as the only source for portfolio sell/risk alerts in retro emails.

## Scope

- Fetch only Kite long-term holdings from `GET /portfolio/holdings`.
- Do not fetch Kite margins.
- Do not fetch Kite positions.
- Run the portfolio sync in GitHub Actions at 17:00 IST.
- Keep Kite secrets and tokens out of browser code and committed data.
- Keep daily, weekly, and monthly reports focused on market opportunities and grading; portfolio alerts are generated only by the retro workflow.

## Architecture

Kite API access stays in Node scripts and GitHub Actions. The public static app renders sanitized JSON from `data/portfolio.json`; it never calls Kite and never sees `api_secret` or `access_token`.

`lib/kite.ts` fetches holdings with `KITE_API_KEY` and `KITE_ACCESS_TOKEN`, normalizes them into the app portfolio schema, and returns a snapshot. `scripts/portfolio.ts` writes that snapshot to `data/portfolio.json`. `.github/workflows/portfolio.yml` runs the script near 17:00 IST using the repo's timezone-aware cron convention and commits data changes.

## Data Model

`data/portfolio.json` contains:

- `asOf`: ISO timestamp when the snapshot was generated.
- `source`: `"kite"` for broker snapshots or `"manual"` for fallback data.
- `holdings`: sanitized holdings with ticker, display name, exchange, quantity, average price, last price, invested value, current value, total P&L, total P&L percent, day change, day change percent, and allocation percent.
- `summary`: aggregate invested value, current value, total P&L, total P&L percent, day change, and day change percent.

No user profile data, tokens, API secrets, or Kite account identifiers are stored.

## Retro Alerts

Retro scans `readPortfolio().holdings` instead of `watchlist.stocks`. It preserves the deterministic flag rules and LLM confirmation step, but its input universe is actual holdings. Other report jobs do not read portfolio holdings for generation.

## Auth

GitHub Actions expects:

- `KITE_API_KEY`
- `KITE_ACCESS_TOKEN`

Kite access tokens expire at 6 AM the next day, so the secret must be refreshed before the 17:00 IST portfolio sync unless long-running read access is separately approved by Kite.

## UI

The `/portfolio` page shows a snapshot dashboard:

- invested value
- current value
- total P&L
- day P&L
- holdings table with allocation, LTP, average price, current value, total P&L, and day change
- stale snapshot warning when the snapshot is older than expected

## Testing

- Schema tests validate the richer portfolio shape and legacy manual shape compatibility where needed.
- Kite client tests mock `fetch`, validate request headers, and validate normalization.
- Portfolio script tests validate it writes `data/portfolio.json`.
- Retro tests validate holdings are used for alerts.
- Build/typecheck validate the static app.
