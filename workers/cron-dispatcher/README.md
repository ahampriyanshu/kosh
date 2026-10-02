# Kosh Cron Dispatcher (Cloudflare Worker)

Precision Cron Dispatcher for **Kosh**'s time-sensitive weekday market reports:
1. **Daily Morning Brief (`daily.yml`)**: Dispatches at **08:30 IST** (`00 3 * * 1-5` UTC).
2. **Mid-Session Retro / Outlook (`retro.yml`)**: Dispatches at **14:00 IST** (`30 8 * * 1-5` UTC).

All other jobs (feeds, universe, market internals, weekly recap grading, monthly reports, research) remain on their standard GitHub Actions schedules.

---

## Why This Exists

GitHub's internal scheduled cron runner (`on.schedule.cron`) experiences **20 to 60+ minute queue delays** during high-traffic intervals on GitHub's free runners. By moving the cron triggers to Cloudflare Workers:
- The worker executes at the **exact second** on Cloudflare's global edge network.
- It triggers GitHub's `workflow_dispatch` REST API, which spins up a GitHub Actions runner within **10–25 seconds** (bypassing the scheduled cron queue entirely).
- The executed job generates the report, emails it via Resend, and commits the output directly to the repository so it is preserved for future processing.

---

## Output Persistence & Downstream Processing

When the Worker dispatches the workflow, the GitHub Actions runner runs:
1. `npx tsx scripts/daily.ts` (or `scripts/retro.ts`):
   - Computes market indicators & synthesizes narrative.
   - Dispatches the report email via Resend.
   - Writes the immutable JSON reports to `data/reports/` and `data/snapshots/`.
   - Updates `data/manifest.json`.
2. **Git Commit & Push**:
   - The workflow commits the new data directly to the `main` branch.
   - This ensures **weekly recap grading (`scripts/recap.ts`)** and **monthly outlooks (`scripts/monthly.ts`)** have full access to historical snapshots and reports.
   - Triggers `deploy.yml` to refresh the public dashboard.
3. **Dispatch Audit Log**:
   - The Worker records every trigger with timestamp, workflow run ID, and run URL.
   - If Cloudflare KV (`DISPATCH_LOGS`) is bound, audit logs are retained for 30 days and accessible via `/status` and `/history`.

---

## Setup & Deployment

### 1. Requirements
- Node.js 20+
- Cloudflare account with Workers enabled
- GitHub Personal Access Token (PAT) with `repo` or `actions:write` scope

### 2. Configure GitHub Token Secret
In this directory:
```bash
cd workers/cron-dispatcher
npx wrangler secret put GITHUB_TOKEN
# Paste your GitHub Personal Access Token when prompted
```

*(Optional)* Configure an `ADMIN_KEY` if you want to protect manual HTTP triggering:
```bash
npx wrangler secret put ADMIN_KEY
```

### 3. (Optional) Enable Cloudflare KV for Persistent Audit History
```bash
npx wrangler kv:namespace create DISPATCH_LOGS
```
Copy the generated ID and add to `wrangler.jsonc`:
```jsonc
"kv_namespaces": [
  {
    "binding": "DISPATCH_LOGS",
    "id": "<YOUR_KV_NAMESPACE_ID>"
  }
]
```

### 4. Deploy to Cloudflare
```bash
npx wrangler deploy
```

---

## Testing & Verification

### Health Check
```bash
curl https://kosh-cron-dispatcher.<your-subdomain>.workers.dev/health
```

### Manual Trigger (Dry Run / Test)
```bash
curl "https://kosh-cron-dispatcher.<your-subdomain>.workers.dev/dispatch?job=daily"
```
Or with an `ADMIN_KEY`:
```bash
curl -H "Authorization: Bearer <ADMIN_KEY>" "https://kosh-cron-dispatcher.<your-subdomain>.workers.dev/dispatch?job=daily"
```

### Check Latest Dispatch Status
```bash
curl https://kosh-cron-dispatcher.<your-subdomain>.workers.dev/status
```
