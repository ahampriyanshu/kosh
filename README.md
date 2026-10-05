# Kosh

Documenting my experiments with Equity Markets

## Pipeline Schedule

| Job | Trigger Time (IST) | Days | Workflow | Output / Downstream Impact |
|---|---|---|---|---|
| **`morning-market-data`** | `08:00 IST` | Mon–Fri | `morning-market.yml` | Fast pre-market quotes (Global cues, Gift Nifty, Commodities, FX) |
| **`morning-llm-intelligence`** | `08:15 IST` | Mon–Fri | `daily.yml` | **Kosh Daily Morning Brief** & Grounded Intelligence |
| **`evening-market-data`** | `15:45 IST` | Mon–Fri | `evening-market.yml` | Official NSE close quotes, market breadth & sector rankings |
| **`evening-llm-intelligence`** | `16:15 IST` | Mon–Fri | `retro.yml` | **Market Close & Daily Retrospective** (Post-close risk surveillance) |
| **`weekly-outlook`** | `21:00 IST` | Sunday | `weekly.yml` | Sunday forward outlook & tactical short-term bets |
| **`monthly-outlook`** | `08:00 IST` | 1st of month | `monthly.yml` | 1st of month institutional macro review & strategic long-term bets |
| **`evaluate-bets`** | `23:00 IST` | Daily | `evaluate-bets.yml` | Daily late-night evaluation and binary settlement of expiring systematic bets |

## Dev Setup

Use npm for this repo. `package-lock.json` is the only dependency lockfile and GitHub Actions installs with `npm ci`.

```bash
npm install
npm run dev              # dashboard at http://localhost:3000

# Run a job locally (needs the env vars above, e.g. via a local .env):
npm run brief:morning
npx tsx scripts/midsession.ts
npx tsx scripts/weekly.ts
npx tsx scripts/monthly.ts
npx tsx scripts/research.ts

# Refresh Kite access token, then sync portfolio holdings:
npm run kite:session
npm run portfolio:sync
```