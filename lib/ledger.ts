import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { atomicWriteJson } from './storage';
import { LedgerSchema, type Ledger, type LedgerEntry } from './schemas';

function dataDir(): string {
  return process.env.KOSH_DATA_DIR || path.join(process.cwd(), 'data');
}
export function ledgerRelPath(month: string): string {
  const [yyyy, mm] = month.split('-');
  return path.join('ledger', yyyy, `${mm}.json`);
}

export async function readLedger(month: string): Promise<Ledger> {
  try {
    const raw = await readFile(path.join(dataDir(), ledgerRelPath(month)), 'utf8');
    return LedgerSchema.parse(JSON.parse(raw));
  } catch (e) {
    if ((e as NodeJS.ErrnoException)?.code === 'ENOENT') return { month, entries: [], summary: null };
    throw e;
  }
}

export async function appendLedgerEntry(month: string, entry: LedgerEntry): Promise<void> {
  const ledger = await readLedger(month);
  if (ledger.entries.some((e) => e.sourceReportId === entry.sourceReportId)) return; // idempotent
  ledger.entries.push(entry);
  ledger.entries.sort((a, b) => a.gradedOn.localeCompare(b.gradedOn));
  await atomicWriteJson(path.join(dataDir(), ledgerRelPath(month)), LedgerSchema.parse(ledger));
}
