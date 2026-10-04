import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker, {
  PIPELINE_SCHEDULE,
  ALL_JOBS,
  getISTTime,
  getJobsForDate,
  triggerWorkflow,
  type Env,
  type ExecutionContext,
} from '../../workers/cron-dispatcher/src/index';

describe('Cloudflare Worker Master Tick Pipeline Dispatcher', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Pipeline Schedule & Jobs', () => {
    it('contains all 7 streamlined scheduled jobs', () => {
      const jobNames = PIPELINE_SCHEDULE.map((s) => s.job);
      expect(jobNames).toEqual([
        'morning-market-data',
        'morning-llm-intelligence',
        'evening-market-data',
        'evening-llm-intelligence',
        'weekly-outlook',
        'monthly-outlook',
        'evaluate-bets',
      ]);
      expect(PIPELINE_SCHEDULE.length).toBe(7);
    });

    it('maps every job to a valid .yml workflow file', () => {
      for (const [job, file] of Object.entries(ALL_JOBS)) {
        expect(file).toMatch(/\.yml$/);
        expect(job.length).toBeGreaterThan(0);
      }
    });
  });

  describe('IST Time Slot & Tick Routing (getJobsForDate)', () => {
    it('accurately converts UTC to IST and matches Monday 08:00 IST for morning-market-data', () => {
      // Monday 08:00 IST is Monday 02:30 UTC
      const date = new Date('2026-10-05T02:30:00Z');
      const ist = getISTTime(date);
      expect(ist.hours).toBe(8);
      expect(ist.minutes).toBe(0);
      expect(ist.dayOfWeek).toBe(1); // Monday

      const jobs = getJobsForDate(date);
      expect(jobs.map((j) => j.job)).toEqual(['morning-market-data']);
    });

    it('matches Monday 08:15 IST for morning-llm-intelligence', () => {
      // Monday 08:15 IST is Monday 02:45 UTC
      const date = new Date('2026-10-05T02:45:00Z');
      const jobs = getJobsForDate(date);
      expect(jobs.map((j) => j.job)).toEqual(['morning-llm-intelligence']);
    });

    it('matches Monday 15:45 IST for evening-market-data', () => {
      // Monday 15:45 IST is Monday 10:15 UTC
      const date = new Date('2026-10-05T10:15:00Z');
      const jobs = getJobsForDate(date);
      expect(jobs.map((j) => j.job)).toEqual(['evening-market-data']);
    });

    it('matches Monday 16:15 IST for evening-llm-intelligence', () => {
      // Monday 16:15 IST is Monday 10:45 UTC
      const date = new Date('2026-10-05T10:45:00Z');
      const jobs = getJobsForDate(date);
      expect(jobs.map((j) => j.job)).toEqual(['evening-llm-intelligence']);
    });

    it('matches Sunday 21:00 IST for weekly forward outlook', () => {
      // Sunday 21:00 IST is Sunday 15:30 UTC
      const date = new Date('2026-10-11T15:30:00Z');
      const jobs = getJobsForDate(date);
      expect(jobs.map((j) => j.job)).toEqual(['weekly-outlook']);
    });

    it('matches 1st of month 08:00 IST for monthly outlook on weekends', () => {
      // Nov 1, 2026 is Sunday. 08:00 IST is 02:30 UTC
      const date = new Date('2026-11-01T02:30:00Z');
      const jobs = getJobsForDate(date);
      expect(jobs.map((j) => j.job)).toEqual(['monthly-outlook']);
    });

    it('matches daily 23:00 IST for evaluate-bets', () => {
      // Daily 23:00 IST is 17:30 UTC
      const date = new Date('2026-10-05T17:30:00Z');
      const jobs = getJobsForDate(date);
      expect(jobs.map((j) => j.job)).toEqual(['evaluate-bets']);
    });

    it('returns empty array during non-scheduled slots', () => {
      // Monday 03:15 IST
      const date = new Date('2026-10-04T21:45:00Z');
      const jobs = getJobsForDate(date);
      expect(jobs).toEqual([]);
    });
  });

  describe('triggerWorkflow', () => {
    it('returns an error record if GITHUB_TOKEN is missing', async () => {
      const env: Env = { GITHUB_TOKEN: '' };
      const record = await triggerWorkflow('morning-market-data', 'cron', env);

      expect(record.status).toBe('error');
      expect(record.error).toContain('GITHUB_TOKEN is not configured');
    });

    it('successfully triggers workflow_dispatch on GitHub API', async () => {
      const mockFetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('/dispatches')) {
          return new Response(null, { status: 204 });
        }
        if (url.includes('/runs')) {
          return new Response(
            JSON.stringify({
              workflow_runs: [
                {
                  id: 98765432,
                  html_url: 'https://github.com/ahampriyanshu/kosh/actions/runs/98765432',
                  status: 'queued',
                },
              ],
            }),
            { status: 200 }
          );
        }
        return new Response('Not found', { status: 404 });
      });

      vi.stubGlobal('fetch', mockFetch);

      const env: Env = {
        GITHUB_TOKEN: 'ghp_test_token',
        REPO_OWNER: 'ahampriyanshu',
        REPO_NAME: 'kosh',
      };

      const record = await triggerWorkflow('morning-market-data', 'cron', env);

      expect(record.status).toBe('dispatched');
      expect(record.httpStatus).toBe(204);
      expect(record.workflowRunId).toBe(98765432);
      expect(record.workflowRunUrl).toBe('https://github.com/ahampriyanshu/kosh/actions/runs/98765432');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/ahampriyanshu/kosh/actions/workflows/morning-market.yml/dispatches',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer ghp_test_token',
          }),
        })
      );
    });
  });

  describe('HTTP Handler (fetch)', () => {
    it('returns 200 OK on /health with schedule overview', async () => {
      const req = new Request('https://worker.local/health');
      const env: Env = { GITHUB_TOKEN: 'test' };
      const ctx = { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as unknown as ExecutionContext;

      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(200);

      const body = (await res.json()) as { status: string; activeJobsCount: number };
      expect(body.status).toBe('ok');
      expect(body.activeJobsCount).toBe(7);
    });

    it('returns 200 OK on /schedule', async () => {
      const req = new Request('https://worker.local/schedule');
      const env: Env = { GITHUB_TOKEN: 'test' };
      const ctx = { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as unknown as ExecutionContext;

      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(200);

      const body = (await res.json()) as Array<{ job: string }>;
      expect(body.length).toBe(7);
    });

    it('allows manual dispatch of jobs or aliases with auth', async () => {
      const authedReq = new Request('https://worker.local/dispatch?job=morning-market-data&key=my-admin-key');
      const env: Env = { GITHUB_TOKEN: 'test', ADMIN_KEY: 'my-admin-key' };
      const ctx = { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as unknown as ExecutionContext;

      const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
      vi.stubGlobal('fetch', mockFetch);

      const res = await worker.fetch(authedReq, env, ctx);
      expect(res.status).toBe(200);

      const body = (await res.json()) as { status: string; targetJob: string };
      expect(body.status).toBe('dispatched');
      expect(body.targetJob).toBe('morning-market-data');
    });

    it('supports alias dispatch such as ?job=daily', async () => {
      const authedReq = new Request('https://worker.local/dispatch?job=daily&key=my-admin-key');
      const env: Env = { GITHUB_TOKEN: 'test', ADMIN_KEY: 'my-admin-key' };
      const ctx = { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as unknown as ExecutionContext;

      const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
      vi.stubGlobal('fetch', mockFetch);

      const res = await worker.fetch(authedReq, env, ctx);
      expect(res.status).toBe(200);

      const body = (await res.json()) as { status: string; targetJob: string };
      expect(body.status).toBe('dispatched');
      expect(body.targetJob).toBe('daily');
    });
  });
});
