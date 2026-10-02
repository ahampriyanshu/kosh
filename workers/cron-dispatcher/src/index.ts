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
  GITHUB_TOKEN: string; // Personal Access Token or Fine-grained PAT with actions:write
  REPO_OWNER?: string; // Default: 'ahampriyanshu'
  REPO_NAME?: string; // Default: 'kosh'
  DEFAULT_BRANCH?: string; // Default: 'main'
  ADMIN_KEY?: string; // Optional secret key for manual HTTP /dispatch triggering
  DISPATCH_LOGS?: CloudflareKV; // Optional Cloudflare KV namespace for dispatch history
}

export interface DispatchRecord {
  id: string;
  workflow: string;
  targetJob: 'daily' | 'retro';
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

// Map cron schedules to the two time-sensitive workflows
// 0 3 * * 1-5  -> 03:00 UTC = 08:30 IST Mon-Fri -> daily.yml (Daily Morning Brief)
// 30 8 * * 1-5 -> 08:30 UTC = 14:00 IST Mon-Fri -> retro.yml (Mid-Session Retro)
export const SCHEDULE_MAP: Record<string, { file: string; job: 'daily' | 'retro' }> = {
  '0 3 * * 1-5': { file: 'daily.yml', job: 'daily' },
  '30 8 * * 1-5': { file: 'retro.yml', job: 'retro' },
};

export const JOB_FILE_MAP: Record<'daily' | 'retro', string> = {
  daily: 'daily.yml',
  retro: 'retro.yml',
};

/**
 * Triggers a GitHub Actions workflow via the REST API and records the dispatch.
 */
export async function triggerWorkflow(
  job: 'daily' | 'retro',
  triggerType: 'cron' | 'manual' | 'http',
  env: Env
): Promise<DispatchRecord> {
  const owner = env.REPO_OWNER || 'ahampriyanshu';
  const repo = env.REPO_NAME || 'kosh';
  const branch = env.DEFAULT_BRANCH || 'main';
  const workflowFile = JOB_FILE_MAP[job];
  const now = new Date();
  const dispatchedAt = now.toISOString();
  const recordId = `${job}-${now.getTime()}`;

  if (!env.GITHUB_TOKEN) {
    const errorRecord: DispatchRecord = {
      id: recordId,
      workflow: workflowFile,
      targetJob: job,
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
        'User-Agent': 'Kosh-Cron-Dispatcher/1.0',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ ref: branch }),
    });

    if (!dispatchRes.ok) {
      const errText = await dispatchRes.text();
      const failRecord: DispatchRecord = {
        id: recordId,
        workflow: workflowFile,
        targetJob: job,
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

    // Success response from GitHub dispatches is 204 No Content
    const record: DispatchRecord = {
      id: recordId,
      workflow: workflowFile,
      targetJob: job,
      dispatchedAt,
      triggerType,
      status: 'dispatched',
      httpStatus: dispatchRes.status,
      branch,
    };

    // Optionally fetch the created workflow run ID for observability
    try {
      const runsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/runs?per_page=1`;
      const runsRes = await fetch(runsUrl, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          'User-Agent': 'Kosh-Cron-Dispatcher/1.0',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
      if (runsRes.ok) {
        const data = (await runsRes.json()) as { workflow_runs?: Array<{ id: number; html_url: string; status: string }> };
        const latestRun = data.workflow_runs?.[0];
        if (latestRun) {
          record.workflowRunId = latestRun.id;
          record.workflowRunUrl = latestRun.html_url;
          record.workflowRunStatus = latestRun.status;
        }
      }
    } catch {
      // Non-fatal if metadata fetch fails
    }

    await persistRecord(record, env);
    return record;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const networkFailRecord: DispatchRecord = {
      id: recordId,
      workflow: workflowFile,
      targetJob: job,
      dispatchedAt,
      triggerType,
      status: 'error',
      httpStatus: 500,
      branch,
      error: `Network/Fetch error: ${message}`,
    };
    await persistRecord(networkFailRecord, env);
    return networkFailRecord;
  }
}

/**
 * Persists dispatch records to Cloudflare KV (if bound) and prints structured log.
 */
async function persistRecord(record: DispatchRecord, env: Env): Promise<void> {
  console.log(`[DISPATCH] ${JSON.stringify(record)}`);

  if (env.DISPATCH_LOGS) {
    try {
      // Store historical log
      await env.DISPATCH_LOGS.put(`dispatch:${record.id}`, JSON.stringify(record), {
        expirationTtl: 60 * 60 * 24 * 30, // 30-day retention
      });
      // Store latest pointer for quick status lookups
      await env.DISPATCH_LOGS.put(`latest:${record.targetJob}`, JSON.stringify(record));
    } catch (e) {
      console.warn('Failed to write dispatch log to KV:', e);
    }
  }
}

export default {
  /**
   * Cloudflare Workers Scheduled Cron Handler.
   * Runs precisely at 08:30 IST (03:00 UTC) and 14:00 IST (08:30 UTC), Mon-Fri.
   */
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const cron = controller.cron;
    const matched = SCHEDULE_MAP[cron];

    if (!matched) {
      console.log(`[CRON] Unhandled cron expression: ${cron}`);
      return;
    }

    console.log(`[CRON] Firing precision trigger for job: ${matched.job} (${matched.file}) at ${new Date().toISOString()}`);
    ctx.waitUntil(triggerWorkflow(matched.job, 'cron', env));
  },

  /**
   * HTTP Handler for health checks, status verification, and manual dispatch.
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (path === '/' || path === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'kosh-cron-dispatcher',
          activeCrons: Object.keys(SCHEDULE_MAP),
          targetJobs: ['daily', 'retro'],
          time: new Date().toISOString(),
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Inspect latest dispatch history
    if (path === '/status' || path === '/history') {
      if (!env.DISPATCH_LOGS) {
        return new Response(
          JSON.stringify({
            message: 'KV namespace DISPATCH_LOGS is not bound. Inspect logs via Cloudflare dashboard or wrangler tail.',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const [latestDaily, latestRetro] = await Promise.all([
        env.DISPATCH_LOGS.get('latest:daily'),
        env.DISPATCH_LOGS.get('latest:retro'),
      ]);

      return new Response(
        JSON.stringify({
          latest: {
            daily: latestDaily ? JSON.parse(latestDaily) : null,
            retro: latestRetro ? JSON.parse(latestRetro) : null,
          },
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Manual test dispatch endpoint: /dispatch?job=daily (or /dispatch?job=retro)
    if (path === '/dispatch') {
      // Check auth if ADMIN_KEY is configured
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
      if (jobParam !== 'daily' && jobParam !== 'retro') {
        return new Response(
          JSON.stringify({
            error: "Invalid job parameter. Must be 'daily' or 'retro'. Example: /dispatch?job=daily",
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
