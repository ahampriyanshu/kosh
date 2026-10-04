import { readFile, readdir } from 'node:fs/promises';
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
  const [yyyy, mm] = month.split('-');
  const livePath = path.join(dataDir(), 'ledger', yyyy, `${mm}.json`);
  const archivePath = path.join(dataDir(), 'archive', 'ledger', yyyy, `${mm}.json`);

  try {
    const raw = await readFile(livePath, 'utf8');
    return LedgerSchema.parse(JSON.parse(raw));
  } catch (liveErr) {
    try {
      const raw = await readFile(archivePath, 'utf8');
      return LedgerSchema.parse(JSON.parse(raw));
    } catch {
      if ((liveErr as NodeJS.ErrnoException)?.code === 'ENOENT') return { month, entries: [], summary: null };
      throw liveErr;
    }
  }
}

export async function readAllLedgers(): Promise<Ledger[]> {
  const roots = [
    path.join(dataDir(), 'ledger'),
    path.join(dataDir(), 'archive', 'ledger'),
  ];
  const months = new Set<string>();

  for (const root of roots) {
    let years: string[] = [];
    try {
      years = await readdir(root);
    } catch {
      continue;
    }
    for (const y of years) {
      if (!/^\d{4}$/.test(y)) continue;
      let files: string[] = [];
      try {
        files = await readdir(path.join(root, y));
      } catch {
        continue;
      }
      for (const f of files) {
        if (f.endsWith('.json')) months.add(`${y}-${f.replace('.json', '')}`);
      }
    }
  }

  const sortedMonths = Array.from(months).sort((a, b) => b.localeCompare(a)); // newest first
  return Promise.all(sortedMonths.map((m) => readLedger(m)));
}

export async function appendLedgerEntry(month: string, entry: LedgerEntry): Promise<void> {
  const ledger = await readLedger(month);
  if (ledger.entries.some((e) => e.sourceReportId === entry.sourceReportId)) return; // idempotent
  ledger.entries.push(entry);
  ledger.entries.sort((a, b) => a.gradedOn.localeCompare(b.gradedOn));
  await atomicWriteJson(path.join(dataDir(), ledgerRelPath(month)), LedgerSchema.parse(ledger));
}
