export interface CloudflareKV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface ScheduledController {
  cron: string;
  type: string;
  scheduledTime: number;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

export interface Env {
  GITHUB_TOKEN: string; // Personal Access Token with actions:write
  REPO_OWNER?: string; // Default: 'ahampriyanshu'
  REPO_NAME?: string; // Default: 'kosh'
  DEFAULT_BRANCH?: string; // Default: 'main'
  ADMIN_KEY?: string; // Optional secret key for manual HTTP /dispatch triggering
  DISPATCH_LOGS?: CloudflareKV; // Optional Cloudflare KV namespace for dispatch history
}

export interface ScheduledSlot {
  hours: number;
  minutes: number;
  daysOfWeek?: number[]; // [1, 2, 3, 4, 5] for Mon-Fri; 6 for Sat; 0 for Sun
  dayOfMonth?: number; // 1 for 1st of month
  job: string;
  workflowFile: string;
  description: string;
}

export interface DispatchRecord {
  id: string;
  workflow: string;
  targetJob: string;
  dispatchedAt: string;
  triggerType: 'cron' | 'manual' | 'http';
  status: 'dispatched' | 'error';
  httpStatus: number;
  branch: string;
  workflowRunId?: number;
  workflowRunUrl?: string;
  workflowRunStatus?: string;
  error?: string;
}

/**
 * Full master schedule for Kosh in Indian Standard Time (IST = UTC + 5:30).
 * Driven by a single 15-minute tick ('* / 15 * * * *') on Cloudflare Workers.
 */
export const PIPELINE_SCHEDULE: ScheduledSlot[] = [
  // ── Nightly Market Data Extraction (Mon–Fri) ──
  {
    hours: 2,
    minutes: 0,
    daysOfWeek: [1, 2, 3, 4, 5],
    job: 'feed-indices',
    workflowFile: 'feed-indices.yml',
    description: 'NSE & BSE benchmark index quotes',
  },
  {
    hours: 2,
    minutes: 15,
    daysOfWeek: [1, 2, 3, 4, 5],
    job: 'feed-global',
    workflowFile: 'feed-global.yml',
    description: 'Global cues & currency/yields',
  },
  {
    hours: 2,
    minutes: 30,
    daysOfWeek: [1, 2, 3, 4, 5],
    job: 'feed-universe',
    workflowFile: 'feed-universe.yml',
    description: 'Nifty 500 universe prices & volume',
  },
  {
    hours: 2,
    minutes: 45,
    daysOfWeek: [1, 2, 3, 4, 5],
    job: 'feed-internals',
    workflowFile: 'feed-internals.yml',
    description: 'Market breadth & advance/decline internals',
  },

  // ── Morning Pre-Market News & Institutional Cash Flows (Mon–Fri) ──
  {
    hours: 6,
    minutes: 0,
    daysOfWeek: [1, 2, 3, 4, 5],
    job: 'feed-news',
    workflowFile: 'feed-news.yml',
    description: 'Morning market news synthesis',
  },
  {
    hours: 6,
    minutes: 30,
    daysOfWeek: [1, 2, 3, 4, 5],
    job: 'feed-flows',
    workflowFile: 'feed-flows.yml',
    description: 'FII & DII institutional cash flows',
  },

  // ── Time-Sensitive Market Hours Publications (Mon–Fri) ──
  {
    hours: 8,
    minutes: 30,
    daysOfWeek: [1, 2, 3, 4, 5],
    job: 'daily',
    workflowFile: 'daily.yml',
    description: 'Kosh Daily Morning Brief (Delivered pre-market)',
  },
  {
    hours: 15,
    minutes: 45,
    daysOfWeek: [1, 2, 3, 4, 5],
    job: 'retro',
    workflowFile: 'retro.yml',
    description: 'Market Close & Daily Retrospective (Post-close snapshot & risk surveillance)',
  },

  // ── Weekend & Monthly Audits ──
  {
    hours: 10,
    minutes: 0,
    daysOfWeek: [6],
    job: 'recap',
    workflowFile: 'recap.yml',
    description: 'Saturday weekly call grading & audited scorecard',
  },
  {
    hours: 21,
    minutes: 0,
    daysOfWeek: [0],
    job: 'weekly',
    workflowFile: 'weekly.yml',
    description: 'Sunday evening forward outlook for coming week',
  },
  {
    hours: 0,
    minutes: 0,
    dayOfMonth: 1,
    job: 'monthly',
    workflowFile: 'monthly.yml',
    description: '1st of month macro review',
  },

  // ── Nightly Systematic Bets Evaluation ──
  {
    hours: 23,
    minutes: 0,
    job: 'evaluate-bets',
    workflowFile: 'evaluate-bets.yml',
    description: 'Daily late-night evaluation and settlement of expiring systematic bets',
  },
];

/** Map of all valid job names to workflow files */
export const ALL_JOBS: Record<string, string> = Object.fromEntries(
  PIPELINE_SCHEDULE.map((s) => [s.job, s.workflowFile])
);

/**
 * Converts a UTC Date into IST (UTC + 5:30) slot coordinates,
 * rounding to the nearest 15-minute tick to eliminate minor jitter.
 */
export function getISTTime(date: Date): {
  hours: number;
  minutes: number;
  dayOfWeek: number;
  dayOfMonth: number;
  formattedIST: string;
} {
  const slotMs = 15 * 60 * 1000;
  const roundedEpoch = Math.round(date.getTime() / slotMs) * slotMs;
  const istEpoch = roundedEpoch + 5.5 * 60 * 60 * 1000;
  const istDate = new Date(istEpoch);

  const hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();
  const dayOfWeek = istDate.getUTCDay();
  const dayOfMonth = istDate.getUTCDate();

  const pad = (n: number) => n.toString().padStart(2, '0');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const formattedIST = `${days[dayOfWeek]} ${pad(hours)}:${pad(minutes)} IST`;

  return { hours, minutes, dayOfWeek, dayOfMonth, formattedIST };
}

/**
 * Returns any pipeline jobs scheduled to execute for the given Date slot.
 */
export function getJobsForDate(date: Date): ScheduledSlot[] {
  const ist = getISTTime(date);
  return PIPELINE_SCHEDULE.filter((slot) => {
    if (slot.hours !== ist.hours || slot.minutes !== ist.minutes) {
      return false;
    }
    if (slot.dayOfMonth !== undefined && slot.dayOfMonth !== ist.dayOfMonth) {
      return false;
    }
    if (slot.daysOfWeek && !slot.daysOfWeek.includes(ist.dayOfWeek)) {
      return false;
    }
    return true;
  });
}

/**
 * Triggers a GitHub Actions workflow via the REST API and records the dispatch.
 */
export async function triggerWorkflow(
  jobName: string,
  triggerType: 'cron' | 'manual' | 'http',
  env: Env
): Promise<DispatchRecord> {
  const owner = env.REPO_OWNER || 'ahampriyanshu';
  const repo = env.REPO_NAME || 'kosh';
  const branch = env.DEFAULT_BRANCH || 'main';
  const workflowFile = ALL_JOBS[jobName];
  const now = new Date();
  const dispatchedAt = now.toISOString();
  const recordId = `${jobName}-${now.getTime()}`;

  if (!workflowFile) {
    const errorRecord: DispatchRecord = {
      id: recordId,
      workflow: 'unknown',
      targetJob: jobName,
      dispatchedAt,
      triggerType,
      status: 'error',
      httpStatus: 400,
      branch,
      error: `Unknown job '${jobName}'. Valid jobs: ${Object.keys(ALL_JOBS).join(', ')}`,
    };
    await persistRecord(errorRecord, env);
    return errorRecord;
  }

  if (!env.GITHUB_TOKEN) {
    const errorRecord: DispatchRecord = {
      id: recordId,
      workflow: workflowFile,
      targetJob: jobName,
      dispatchedAt,
      triggerType,
      status: 'error',
      httpStatus: 500,
      branch,
      error: 'GITHUB_TOKEN is not configured in worker environment',
    };
    await persistRecord(errorRecord, env);
    return errorRecord;
  }

  const dispatchUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`;

  try {
    const dispatchRes = await fetch(dispatchUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        'User-Agent': 'Kosh-Cron-Dispatcher/2.0',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ ref: branch }),
    });

    if (!dispatchRes.ok) {
      const errText = await dispatchRes.text();
      const failRecord: DispatchRecord = {
        id: recordId,
        workflow: workflowFile,
        targetJob: jobName,
        dispatchedAt,
        triggerType,
        status: 'error',
        httpStatus: dispatchRes.status,
        branch,
        error: `GitHub API error (${dispatchRes.status}): ${errText}`,
      };
      await persistRecord(failRecord, env);
      return failRecord;
    }

    const record: DispatchRecord = {
      id: recordId,
      workflow: workflowFile,
      targetJob: jobName,
      dispatchedAt,
      triggerType,
      status: 'dispatched',
      httpStatus: dispatchRes.status,
      branch,
    };

    // Attempt to grab the created run metadata
    try {
      const runsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/runs?per_page=1`;
      const runsRes = await fetch(runsUrl, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          'User-Agent': 'Kosh-Cron-Dispatcher/2.0',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
      if (runsRes.ok) {
        const data = (await runsRes.json()) as {
          workflow_runs?: Array<{ id: number; html_url: string; status: string }>;
        };
        const latestRun = data.workflow_runs?.[0];
        if (latestRun) {
          record.workflowRunId = latestRun.id;
          record.workflowRunUrl = latestRun.html_url;
          record.workflowRunStatus = latestRun.status;
        }
      }
    } catch {
      // Non-fatal
    }

    await persistRecord(record, env);
    return record;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const networkFailRecord: DispatchRecord = {
      id: recordId,
      workflow: workflowFile,
      targetJob: jobName,
      dispatchedAt,
      triggerType,
      status: 'error',
      httpStatus: 500,
      branch,
      error: `Network error: ${message}`,
    };
    await persistRecord(networkFailRecord, env);
    return networkFailRecord;
  }
}

/**
 * Persists dispatch records to structured logs and Cloudflare KV (if bound).
 */
async function persistRecord(record: DispatchRecord, env: Env): Promise<void> {
  console.log(`[DISPATCH] ${JSON.stringify(record)}`);

  if (env.DISPATCH_LOGS) {
    try {
      await env.DISPATCH_LOGS.put(`dispatch:${record.id}`, JSON.stringify(record), {
        expirationTtl: 60 * 60 * 24 * 30, // 30-day retention
      });
      await env.DISPATCH_LOGS.put(`latest:${record.targetJob}`, JSON.stringify(record));
    } catch (e) {
      console.warn('Failed to write dispatch log to KV:', e);
    }
  }
}

export default {
  /**
   * Master 15-Minute Tick Handler.
   * Evaluates current IST time and dispatches any scheduled pipeline jobs.
   */
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const now = new Date(controller.scheduledTime || Date.now());
    const ist = getISTTime(now);
    const matchedJobs = getJobsForDate(now);

    if (matchedJobs.length === 0) {
      console.log(`[TICK] ${ist.formattedIST} — No jobs scheduled for this slot.`);
      return;
    }

    console.log(
      `[TICK] ${ist.formattedIST} — Firing ${matchedJobs.length} job(s): ${matchedJobs
        .map((j) => `${j.job} (${j.workflowFile})`)
        .join(', ')}`
    );

    ctx.waitUntil(
      Promise.all(matchedJobs.map((slot) => triggerWorkflow(slot.job, 'cron', env)))
    );
  },

  /**
   * HTTP Handler for health check, schedule inspection, and manual testing.
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Health check & Overview
    if (path === '/' || path === '/health') {
      const now = new Date();
      const ist = getISTTime(now);
      return new Response(
        JSON.stringify(
          {
            status: 'ok',
            service: 'kosh-cron-dispatcher',
            version: '2.0.0 (Master Tick)',
            currentTimeUTC: now.toISOString(),
            currentTimeIST: ist.formattedIST,
            activeJobsCount: PIPELINE_SCHEDULE.length,
            schedule: PIPELINE_SCHEDULE.map((s) => ({
              job: s.job,
              workflow: s.workflowFile,
              timeIST: `${s.hours.toString().padStart(2, '0')}:${s.minutes
                .toString()
                .padStart(2, '0')}`,
              days: s.daysOfWeek ? s.daysOfWeek.join(',') : s.dayOfMonth ? `Day ${s.dayOfMonth}` : 'all',
              description: s.description,
            })),
          },
          null,
          2
        ),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Schedule listing endpoint
    if (path === '/schedule') {
      return new Response(JSON.stringify(PIPELINE_SCHEDULE, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Status inspection
    if (path === '/status' || path === '/history') {
      if (!env.DISPATCH_LOGS) {
        return new Response(
          JSON.stringify({
            message:
              'KV namespace DISPATCH_LOGS is not bound. Inspect logs via Cloudflare dashboard or wrangler tail.',
            jobs: Object.keys(ALL_JOBS),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const statusMap: Record<string, unknown> = {};
      await Promise.all(
        Object.keys(ALL_JOBS).map(async (job) => {
          const val = await env.DISPATCH_LOGS!.get(`latest:${job}`);
          statusMap[job] = val ? JSON.parse(val) : null;
        })
      );

      return new Response(JSON.stringify({ latestDispatches: statusMap }, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Manual test trigger endpoint: /dispatch?job=feed-news (or daily, retro, etc.)
    if (path === '/dispatch') {
      if (env.ADMIN_KEY) {
        const authHeader = request.headers.get('Authorization');
        const keyParam = url.searchParams.get('key');
        const isAuthorized =
          keyParam === env.ADMIN_KEY || authHeader === `Bearer ${env.ADMIN_KEY}`;
        if (!isAuthorized) {
          return new Response(JSON.stringify({ error: 'Unauthorized. Provide valid key.' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      const jobParam = url.searchParams.get('job');
      if (!jobParam || !ALL_JOBS[jobParam]) {
        return new Response(
          JSON.stringify({
            error: `Invalid or missing job parameter '${jobParam}'.`,
            availableJobs: Object.keys(ALL_JOBS),
            example: '/dispatch?job=feed-news&key=YOUR_ADMIN_KEY',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const result = await triggerWorkflow(jobParam, 'http', env);
      return new Response(JSON.stringify(result, null, 2), {
        status: result.status === 'dispatched' ? 200 : 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
