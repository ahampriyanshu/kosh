import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { computeChecksum, writeReport, readReport, readManifest, findReportByRoute } from '../../lib/storage';
import type { ReportEnvelope } from '../../lib/schemas';

let dir: string;

function makeEnvelope(id: string, dateKey: string, type: 'daily' | 'weekly' = 'daily'): ReportEnvelope {
  const content = { hello: 'world' };
  return {
    schemaVersion: 1,
    id,
    type,
    dateKey,
    generatedAt: '2026-06-14T02:30:00.000Z',
    sourceData: { tickers: ['TCS.NS'], priceSnapshot: { 'TCS.NS': 3900 }, searchTimestamp: '2026-06-14T02:29:00.000Z' },
    content,
    emailSent: false,
    checksum: computeChecksum(content),
  };
}

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'kosh-'));
  process.env.KOSH_DATA_DIR = dir;
});

afterEach(async () => {
  delete process.env.KOSH_DATA_DIR;
  await rm(dir, { recursive: true, force: true });
});

describe('storage', () => {
  it('computes a stable sha256 checksum', () => {
    expect(computeChecksum({ a: 1 })).toBe(computeChecksum({ a: 1 }));
    expect(computeChecksum({ a: 1 })).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it('writes a report and reads it back', async () => {
    await writeReport(makeEnvelope('daily-2026-06-14', '2026-06-14'));
    const back = await readReport('daily-2026-06-14');
    expect(back.id).toBe('daily-2026-06-14');
    expect(back.type).toBe('daily');
  });

  it('records the report in the manifest and tracks latest by type', async () => {
    await writeReport(makeEnvelope('daily-2026-06-13', '2026-06-13'));
    await writeReport(makeEnvelope('daily-2026-06-14', '2026-06-14'));
    const manifest = await readManifest();
    expect(manifest.reports).toHaveLength(2);
    expect(manifest.latest.daily).toBe('daily-2026-06-14');
    expect(manifest.reports[0].id).toBe('daily-2026-06-14');
  });

  it('is idempotent — re-writing the same id does not duplicate', async () => {
    await writeReport(makeEnvelope('daily-2026-06-14', '2026-06-14'));
    await writeReport(makeEnvelope('daily-2026-06-14', '2026-06-14'));
    const manifest = await readManifest();
    expect(manifest.reports).toHaveLength(1);
  });

  it('returns an empty manifest when none exists', async () => {
    expect(await readManifest()).toEqual({ reports: [], latest: {} });
  });

  it('leaves no .tmp files behind', async () => {
    await writeReport(makeEnvelope('daily-2026-06-14', '2026-06-14'));
    const entries = await readdir(path.join(dir, 'reports', '2026', '06', 'daily'));
    expect(entries.some((f) => f.endsWith('.tmp'))).toBe(false);
    expect(entries).toContain('daily-2026-06-14.json');
  });

  it('rejects an envelope with an unsafe id (path traversal)', async () => {
    await expect(writeReport(makeEnvelope('../evil', '2026-06-14') as ReportEnvelope)).rejects.toThrow();
  });

  it('throws on checksum mismatch when reading a tampered report', async () => {
    const env = makeEnvelope('daily-2026-06-14', '2026-06-14');
    env.checksum = 'sha256:' + '0'.repeat(64); // wrong on purpose
    await writeReport(env); // writeReport does not verify checksum
    await expect(readReport('daily-2026-06-14')).rejects.toThrow(/checksum/i);
  });

  it('writes reports into a year/month/type nested path', async () => {
    await writeReport(makeEnvelope('daily-2026-06-14', '2026-06-14'));
    const manifest = await readManifest();
    expect(manifest.reports[0].path).toBe('reports/2026/06/daily/daily-2026-06-14.json');
    const onDisk = await readFile(path.join(dir, manifest.reports[0].path), 'utf8');
    expect(JSON.parse(onDisk).id).toBe('daily-2026-06-14');
  });

  it('resolves a report by type + dateKey', async () => {
    await writeReport(makeEnvelope('weekly-2026-W24', '2026-W24', 'weekly'));
    const back = await findReportByRoute('weekly', '2026-W24');
    expect(back?.id).toBe('weekly-2026-W24');
    expect(await findReportByRoute('weekly', '2026-W99')).toBeNull();
  });

  it('reads a report back through the nested path', async () => {
    await writeReport(makeEnvelope('daily-2026-06-14', '2026-06-14'));
    const back = await readReport('daily-2026-06-14');
    expect(back.dateKey).toBe('2026-06-14');
  });
});
