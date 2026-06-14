import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PortfolioSchema, type Portfolio } from './schemas';

function dataDir(): string {
  return process.env.KOSH_DATA_DIR || path.join(process.cwd(), 'data');
}

export async function readPortfolio(): Promise<Portfolio> {
  try {
    const raw = await readFile(path.join(dataDir(), 'portfolio.json'), 'utf8');
    return PortfolioSchema.parse(JSON.parse(raw));
  } catch (e) {
    if ((e as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return { asOf: '', holdings: [] };
    }
    throw e;
  }
}
