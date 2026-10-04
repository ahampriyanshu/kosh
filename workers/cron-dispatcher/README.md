# Kosh Master Tick Pipeline Dispatcher (Cloudflare Worker)

Precision Cloudflare Worker that manages and dispatches **all 7 streamlined pipelines** for Kosh on a single 15-minute tick (`*/15 * * * *`).

By using Cloudflare's global edge scheduler, every job triggers at the **exact second** in Indian Standard Time (IST), completely eliminating GitHub Actions' 20–60 minute scheduler queue delays and timezone misconfigurations.

---

## Master Pipeline Schedule (Indian Standard Time)

| Job | Trigger Time (IST) | Days | Workflow | Output / Downstream Impact |
|---|---|---|---|---|
| **`morning-market-data`** | `08:00 IST` | Mon–Fri | `morning-market.yml` | Fast pre-market quotes (Global cues, Gift Nifty, Commodities, FX) |
| **`morning-llm-intelligence`** | `08:15 IST` | Mon–Fri | `daily.yml` | **Kosh Daily Morning Brief** & Grounded Intelligence |
| **`evening-market-data`** | `15:45 IST` | Mon–Fri | `evening-market.yml` | Official NSE close quotes, market breadth & sector rankings |
| **`evening-llm-intelligence`** | `16:15 IST` | Mon–Fri | `retro.yml` | **Market Close & Daily Retrospective** (Post-close risk surveillance) |
| **`weekly-outlook`** | `21:00 IST` | Sunday | `weekly.yml` | Sunday forward outlook & tactical short-term bets |
| **`monthly-outlook`** | `08:00 IST` | 1st of month | `monthly.yml` | 1st of month institutional macro review & strategic long-term bets |
| **`evaluate-bets`** | `23:00 IST` | Daily | `evaluate-bets.yml` | Daily late-night evaluation and binary settlement of expiring systematic bets |

---

## How It Works

1. **The 15-Minute Edge Tick**:
   - The worker runs every 15 minutes (`*/15 * * * *`) via Cloudflare Cron Triggers.
   - It converts the current timestamp into IST (`UTC + 5:30`) and checks if any jobs match the current 15-minute slot.
   - During off-schedule slots (e.g. 03:00, 04:15), the worker completes silently in <1ms.
2. **Instant Runner Dispatch**:
   - For matching jobs, it calls GitHub REST API (`POST /repos/{owner}/{repo}/actions/workflows/{workflow}/dispatches`).
   - GitHub prioritizes API dispatches, provisioning an Ubuntu runner within **10–25 seconds**.
3. **Output Preservation**:
   - The GitHub runner runs the data fetch or report generation script.
   - The runner commits all outputs directly to `data/` and pushes to `main`.
   - Systematic bets are updated in `data/bets.json` with binary hit/miss and automated causal post-mortems on miss.
4. **Audit Trail**:
   - The worker queries GitHub Actions API immediately after dispatch to fetch the `workflowRunId` and direct `html_url`.
   - Stored in Cloudflare logs and optionally in Cloudflare KV.

---

## Deploying the Updated Worker

Run from `workers/cron-dispatcher/`:

```bash
cd workers/cron-dispatcher
npx wrangler deploy
```

---

## Testing & Verification

### 1. View Full Live Schedule
```bash
curl https://kosh-cron-dispatcher.avampiryanshu.workers.dev/health
```

### 2. Manual Test Trigger
You can manually trigger **any of the 7 jobs** on demand:

```bash
# Trigger morning market data:
curl "https://kosh-cron-dispatcher.avampiryanshu.workers.dev/dispatch?job=morning-market-data&key=YOUR_ADMIN_KEY"

# Trigger daily morning brief:
curl "https://kosh-cron-dispatcher.avampiryanshu.workers.dev/dispatch?job=daily&key=YOUR_ADMIN_KEY"

# Trigger expiring bets evaluation:
curl "https://kosh-cron-dispatcher.avampiryanshu.workers.dev/dispatch?job=evaluate-bets&key=YOUR_ADMIN_KEY"
```

Available `job` values:
`morning-market-data`, `morning-llm-intelligence` (or `daily`), `evening-market-data`, `evening-llm-intelligence` (or `retro`), `weekly-outlook` (or `weekly`), `monthly-outlook` (or `monthly`), `evaluate-bets`.
