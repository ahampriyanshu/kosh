import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readLedger, appendLedgerEntry, readAllLedgers } from '../../lib/ledger';
import type { LedgerEntry } from '../../lib/schemas';

let dir: string;
beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), 'kosh-')); process.env.KOSH_DATA_DIR = dir; });
afterEach(async () => { delete process.env.KOSH_DATA_DIR; await rm(dir, { recursive: true, force: true }); });

const entry = (sourceReportId: string): LedgerEntry => ({
  gradedOn: '2026-06-20', sourceReportId,
  bets: [{ ticker: 'TCS.NS', name: 'TCS', thesis: 'x', action: 'buy', entryRef: 100, exitRef: 105, changePct: 5, outcome: 'hit', note: 'ok' }],
  hits: 1, total: 1,
});

describe('ledger store', () => {
  it('returns an empty ledger when none exists', async () => {
    const l = await readLedger('2026-06');
    expect(l).toEqual({ month: '2026-06', entries: [], summary: null });
  });
  it('appends an entry and persists under year/month', async () => {
    await appendLedgerEntry('2026-06', entry('weekly-2026-W24'));
    await access(path.join(dir, 'ledger', '2026', '06.json'));
    const l = await readLedger('2026-06');
    expect(l.entries).toHaveLength(1);
    expect(l.entries[0].sourceReportId).toBe('weekly-2026-W24');
  });
  it('is idempotent by sourceReportId (no double-append)', async () => {
    await appendLedgerEntry('2026-06', entry('weekly-2026-W24'));
    await appendLedgerEntry('2026-06', entry('weekly-2026-W24'));
    expect((await readLedger('2026-06')).entries).toHaveLength(1);
  });
});

it('readAllLedgers returns every month newest-first', async () => {
  const mk = (id: string) => ({ gradedOn: '2026-06-20', sourceReportId: id, bets: [], hits: 0, total: 0 });
  await appendLedgerEntry('2026-05', mk('weekly-2026-W20'));
  await appendLedgerEntry('2026-06', mk('weekly-2026-W24'));
  const all = await readAllLedgers();
  expect(all.map((l) => l.month)).toEqual(['2026-06', '2026-05']);
});
it('readAllLedgers is empty when no ledger dir exists', async () => {
  expect(await readAllLedgers()).toEqual([]);
});
