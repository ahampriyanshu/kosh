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
    it('contains all 11 scheduled jobs', () => {
      const jobNames = PIPELINE_SCHEDULE.map((s) => s.job);
      expect(jobNames).toContain('feed-indices');
      expect(jobNames).toContain('feed-global');
      expect(jobNames).toContain('feed-universe');
      expect(jobNames).toContain('feed-internals');
      expect(jobNames).toContain('feed-news');
      expect(jobNames).toContain('feed-flows');
      expect(jobNames).toContain('daily');
      expect(jobNames).toContain('retro');
      expect(jobNames).toContain('recap');
      expect(jobNames).toContain('weekly');
      expect(jobNames).toContain('monthly');
      expect(PIPELINE_SCHEDULE.length).toBe(11);
    });

    it('maps every job to a valid .yml workflow file', () => {
      for (const [job, file] of Object.entries(ALL_JOBS)) {
        expect(file).toMatch(/\.yml$/);
        expect(job.length).toBeGreaterThan(0);
      }
    });
  });

  describe('IST Time Slot & Tick Routing (getJobsForDate)', () => {
    it('accurately converts UTC to IST and matches Monday 02:00 IST for feed-indices', () => {
      // Monday 02:00 IST is Sunday 20:30 UTC
      const date = new Date('2026-10-04T20:30:00Z');
      const ist = getISTTime(date);
      expect(ist.hours).toBe(2);
      expect(ist.minutes).toBe(0);
      expect(ist.dayOfWeek).toBe(1); // Monday

      const jobs = getJobsForDate(date);
      expect(jobs.map((j) => j.job)).toEqual(['feed-indices']);
    });

    it('matches Monday 06:00 IST for feed-news', () => {
      // Monday 06:00 IST is Monday 00:30 UTC
      const date = new Date('2026-10-05T00:30:00Z');
      const jobs = getJobsForDate(date);
      expect(jobs.map((j) => j.job)).toEqual(['feed-news']);
    });

    it('matches Monday 06:30 IST for feed-flows', () => {
      // Monday 06:30 IST is Monday 01:00 UTC
      const date = new Date('2026-10-05T01:00:00Z');
      const jobs = getJobsForDate(date);
      expect(jobs.map((j) => j.job)).toEqual(['feed-flows']);
    });

    it('matches Monday 08:30 IST for daily morning brief', () => {
      // Monday 08:30 IST is Monday 03:00 UTC
      const date = new Date('2026-10-05T03:00:00Z');
      const jobs = getJobsForDate(date);
      expect(jobs.map((j) => j.job)).toEqual(['daily']);
    });

    it('matches Monday 15:45 IST for market close & daily retrospective', () => {
      // Monday 15:45 IST is Monday 10:15 UTC
      const date = new Date('2026-10-05T10:15:00Z');
      const jobs = getJobsForDate(date);
      expect(jobs.map((j) => j.job)).toEqual(['retro']);
    });

    it('matches Saturday 10:00 IST for weekly call grading recap', () => {
      // Saturday 10:00 IST is Saturday 04:30 UTC
      const date = new Date('2026-10-10T04:30:00Z');
      const jobs = getJobsForDate(date);
      expect(jobs.map((j) => j.job)).toEqual(['recap']);
    });

    it('matches Sunday 21:00 IST for weekly forward outlook', () => {
      // Sunday 21:00 IST is Sunday 15:30 UTC
      const date = new Date('2026-10-11T15:30:00Z');
      const jobs = getJobsForDate(date);
      expect(jobs.map((j) => j.job)).toEqual(['weekly']);
    });

    it('matches 1st of month 00:00 IST for monthly recap', () => {
      // Nov 1 00:00 IST is Oct 31 18:30 UTC
      const date = new Date('2026-10-31T18:30:00Z');
      const jobs = getJobsForDate(date);
      expect(jobs.map((j) => j.job)).toEqual(['monthly']);
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
      const record = await triggerWorkflow('feed-news', 'cron', env);

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

      const record = await triggerWorkflow('feed-news', 'cron', env);

      expect(record.status).toBe('dispatched');
      expect(record.httpStatus).toBe(204);
      expect(record.workflowRunId).toBe(98765432);
      expect(record.workflowRunUrl).toBe('https://github.com/ahampriyanshu/kosh/actions/runs/98765432');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/ahampriyanshu/kosh/actions/workflows/feed-news.yml/dispatches',
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
      expect(body.activeJobsCount).toBe(11);
    });

    it('returns 200 OK on /schedule', async () => {
      const req = new Request('https://worker.local/schedule');
      const env: Env = { GITHUB_TOKEN: 'test' };
      const ctx = { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as unknown as ExecutionContext;

      const res = await worker.fetch(req, env, ctx);
      expect(res.status).toBe(200);

      const body = (await res.json()) as Array<{ job: string }>;
      expect(body.length).toBe(11);
    });

    it('allows manual dispatch of any feed with auth', async () => {
      const authedReq = new Request('https://worker.local/dispatch?job=feed-flows&key=my-admin-key');
      const env: Env = { GITHUB_TOKEN: 'test', ADMIN_KEY: 'my-admin-key' };
      const ctx = { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as unknown as ExecutionContext;

      const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
      vi.stubGlobal('fetch', mockFetch);

      const res = await worker.fetch(authedReq, env, ctx);
      expect(res.status).toBe(200);

      const body = (await res.json()) as { status: string; targetJob: string };
      expect(body.status).toBe('dispatched');
      expect(body.targetJob).toBe('feed-flows');
    });
  });
});
