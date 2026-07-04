# Kosh

A personal, $0-to-run stock-intelligence tool for the Indian market (NSE/BSE). GitHub Actions generate AI-written market briefings on a schedule, commit them as validated JSON, and email them; a static Next.js dashboard on GitHub Pages renders the committed reports. **GitHub is the single source of truth** — there is no always-on server.

Design spec: [`docs/superpowers/specs/2026-06-14-kosh-indian-stock-intelligence-design.md`](docs/superpowers/specs/2026-06-14-kosh-indian-stock-intelligence-design.md)

## How it works

```
GitHub Actions (cron / push)  →  TS job  →  validated JSON in data/  →  git commit + email
                                                                              │
                                          push to main → deploy.yml → Next.js static export → GitHub Pages
```

- **Compute:** TypeScript jobs in `scripts/` run by GitHub Actions. Shared logic lives in `lib/` (market data, indicators, LLM, storage, email). Market data from `yahoo-finance2`; analysis/news/sentiment from Google **Gemini** with search grounding (`@ai-sdk/google`); email via **Resend**.
- **Data:** JSON documents in `data/briefings/`, indexed by `data/manifest.json`. Written atomically with sha256 checksums and Zod validation on write **and** read (consistency over availability). Git history is the audit log.
- **Dashboard:** A static Next.js export (`output: 'export'`) — no client data fetching, zero layout shift.

## Schedules (IST)

| Job | When | Workflow |
|---|---|---|
| Morning brief | 08:00, Mon–Fri | `morning.yml` |
| Mid-session evaluator (sell alerts) | 14:00, Mon–Fri | `midsession.yml` |
| Weekly recap (self-verifying) | Sun 21:00 | `weekly.yml` |
| Monthly recap (self-verifying) | 1st, 00:00 | `monthly.yml` |
| Single-stock research | on request (see below) | `research.yml` |
| Deploy to Pages | on push to `main` | `deploy.yml` |

Weekly/monthly recaps first grade the *previous* report's calls against actual price moves, then write a new outlook.

## Single-stock research (pseudo-dynamic)

Edit [`data/research-requests.ts`](data/research-requests.ts), add a ticker, and commit:

```ts
export const researchRequests: ResearchRequest[] = [
  { ticker: 'TATAMOTORS.NS', note: 'post-results dip' },
];
```

The push triggers `research.yml`, which deep-evaluates each requested ticker (fundamental + technical + sentiment + a recommendation), writes a report, emails it, and the dashboard shows it. Idempotent: a ticker already researched today is skipped.

## Setup

1. **Secrets** (repo → Settings → Secrets and variables → Actions):
   - `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini API key
   - `RESEND_API_KEY`, `KOSH_EMAIL_FROM`, `KOSH_EMAIL_TO` (comma-separated), optional `KOSH_EMAIL_REPLY_TO`
   - `KITE_API_KEY`, `KITE_ACCESS_TOKEN`, and `KOSH_PORTFOLIO_KEY` for encrypted portfolio sync. Use `npm run kite:session` with your Kite API secret to refresh the access token.
   - Optional repo **variable** `KOSH_GOOGLE_MODEL` to override the default Gemini model.
2. **Pages:** Settings → Pages → Source = **GitHub Actions**.
3. **Portfolio:** refresh holdings with `npm run kite:session` and `npm run portfolio:sync`.

## Portfolio encryption

Portfolio holdings are never committed as plaintext. `npm run portfolio:sync` fetches Kite holdings, encrypts the portfolio with `KOSH_PORTFOLIO_KEY`, and writes `public/data/portfolio.enc.json`. The static portfolio page fetches that encrypted file and decrypts it in the browser only after you enter the same phrase.

That means the phrase is used twice: first by the sync job to create the encrypted snapshot, then by your browser to open it. Adding the phrase to `.env` or GitHub Secrets does not create the snapshot by itself; run the sync after the env values are present. If the modal shows a 404, `public/data/portfolio.enc.json` has not been generated or deployed yet.

To enable it in your fork:

1. Create a Kite Connect v3 app.
2. Add `KITE_API_KEY`, `KITE_API_SECRET`, `KITE_ACCESS_TOKEN`, and `KOSH_PORTFOLIO_KEY` in GitHub Actions secrets.
3. Run `npm run kite:session` when the Kite access token needs refresh.
4. Run the portfolio sync workflow or `npm run portfolio:sync`.
5. Open `/portfolio` and enter the same value you used for `KOSH_PORTFOLIO_KEY`.

## Local development

```bash
npm install
npm test                 # vitest
npm run typecheck        # tsc (node code)
npm run build            # next build → static export in out/
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

## Layout

```
lib/        shared modules (schemas, storage, market-data, indicators, llm, email, recap, research, time, portfolio)
scripts/    job runners (morning, midsession, weekly, monthly, research)
data/       the document database (committed by Actions)
src/        Next.js static dashboard (6 pages + components)
.github/workflows/   6 workflows
```
