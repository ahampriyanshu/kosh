# Kosh Master Tick Pipeline Dispatcher (Cloudflare Worker)

Precision Cloudflare Worker that manages and dispatches **all 11 scheduled pipelines** for Kosh on a single 15-minute tick (`*/15 * * * *`).

By using Cloudflare's global edge scheduler, every job triggers at the **exact second** in Indian Standard Time (IST), completely eliminating GitHub Actions' 20–60 minute scheduler queue delays and timezone misconfigurations.

---

## Master Pipeline Schedule (Indian Standard Time)

| Job | Trigger Time (IST) | Days | Workflow | Output / Downstream Impact |
|---|---|---|---|---|
| **`feed-indices`** | `02:00 IST` | Mon–Fri | `feed-indices.yml` | Writes NSE & BSE benchmark index quotes to `data/feed/` |
| **`feed-global`** | `02:15 IST` | Mon–Fri | `feed-global.yml` | Writes global cues, USD/INR, 10Y yields, and commodities |
| **`feed-universe`** | `02:30 IST` | Mon–Fri | `feed-universe.yml` | Fetches Nifty 500 universe prices & volume metrics |
| **`feed-internals`** | `02:45 IST` | Mon–Fri | `feed-internals.yml` | Computes market breadth & advance/decline ratio |
| **`feed-news`** | `06:00 IST` | Mon–Fri | `feed-news.yml` | Synthesizes pre-market morning financial news |
| **`feed-flows`** | `06:30 IST` | Mon–Fri | `feed-flows.yml` | Fetches FII & DII institutional cash flows |
| **`daily`** | `08:30 IST` | Mon–Fri | `daily.yml` | **Kosh Daily Morning Brief** (guaranteed fresh feed data) |
| **`retro`** | `15:45 IST` | Mon–Fri | `retro.yml` | **Market Close & Daily Retrospective** (post-close snapshot & risk audit) |
| **`recap`** | `10:00 IST` | Saturday | `recap.yml` | Weekly positional bet grading & audited scorecard |
| **`weekly`** | `21:00 IST` | Sunday | `weekly.yml` | Forward weekly macro outlook |
| **`monthly`** | `00:00 IST` | 1st of month | `monthly.yml` | Monthly macro recap |

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
   - Downstream recaps and historical audits always have full access to historical data.
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
You can manually trigger **any of the 11 jobs** on demand:

```bash
# Trigger morning news feed:
curl "https://kosh-cron-dispatcher.avampiryanshu.workers.dev/dispatch?job=feed-news&key=YOUR_ADMIN_KEY"

# Trigger daily morning brief:
curl "https://kosh-cron-dispatcher.avampiryanshu.workers.dev/dispatch?job=daily&key=YOUR_ADMIN_KEY"

# Trigger institutional cash flows:
curl "https://kosh-cron-dispatcher.avampiryanshu.workers.dev/dispatch?job=feed-flows&key=YOUR_ADMIN_KEY"
```

Available `job` values:
`feed-indices`, `feed-global`, `feed-universe`, `feed-internals`, `feed-news`, `feed-flows`, `daily`, `retro`, `recap`, `weekly`, `monthly`.
