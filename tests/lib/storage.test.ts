import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { computeChecksum, writeReport, readReport, readManifest } from '../../lib/storage';
import type { ReportEnvelope } from '../../lib/schemas';

let dir: string;

function makeEnvelope(id: string): ReportEnvelope {
  const content = { hello: 'world' };
  return {
    schemaVersion: 1,
    id,
    type: 'daily',
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
    await writeReport(makeEnvelope('2026-06-14-daily'));
    const back = await readReport('2026-06-14-daily');
    expect(back.id).toBe('2026-06-14-daily');
    expect(back.type).toBe('daily');
  });

  it('records the report in the manifest and tracks latest by type', async () => {
    await writeReport(makeEnvelope('2026-06-13-daily'));
    await writeReport(makeEnvelope('2026-06-14-daily'));
    const manifest = await readManifest();
    expect(manifest.reports).toHaveLength(2);
    expect(manifest.latest.daily).toBe('2026-06-14-daily');
    expect(manifest.reports[0].id).toBe('2026-06-14-daily');
  });

  it('is idempotent — re-writing the same id does not duplicate', async () => {
    await writeReport(makeEnvelope('2026-06-14-daily'));
    await writeReport(makeEnvelope('2026-06-14-daily'));
    const manifest = await readManifest();
    expect(manifest.reports).toHaveLength(1);
  });

  it('returns an empty manifest when none exists', async () => {
    expect(await readManifest()).toEqual({ reports: [], latest: {} });
  });

  it('leaves no .tmp files behind', async () => {
    await writeReport(makeEnvelope('2026-06-14-daily'));
    const entries = await readdir(path.join(dir, 'briefings'));
    expect(entries.some((f) => f.endsWith('.tmp'))).toBe(false);
    expect(entries).toContain('2026-06-14-daily.json');
  });

  it('rejects an envelope with an unsafe id (path traversal)', async () => {
    await expect(writeReport(makeEnvelope('../evil'))).rejects.toThrow();
  });

  it('throws on checksum mismatch when reading a tampered report', async () => {
    const env = makeEnvelope('2026-06-14-daily');
    env.checksum = 'sha256:' + '0'.repeat(64); // wrong on purpose
    await writeReport(env); // writeReport does not verify checksum
    await expect(readReport('2026-06-14-daily')).rejects.toThrow(/checksum/i);
  });
});
