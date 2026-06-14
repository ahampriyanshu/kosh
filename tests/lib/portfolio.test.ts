import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readPortfolio } from '../../lib/portfolio';

let dir: string;
beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), 'kosh-')); process.env.KOSH_DATA_DIR = dir; });
afterEach(async () => { delete process.env.KOSH_DATA_DIR; await rm(dir, { recursive: true, force: true }); });

describe('readPortfolio', () => {
  it('reads and validates a portfolio file', async () => {
    await writeFile(path.join(dir, 'portfolio.json'), JSON.stringify({
      asOf: '2026-06-14', holdings: [{ ticker: 'TCS.NS', name: 'TCS', qty: 10, avgCost: 3500 }],
    }));
    const p = await readPortfolio();
    expect(p.holdings[0].ticker).toBe('TCS.NS');
  });
  it('returns empty holdings when no file exists', async () => {
    const p = await readPortfolio();
    expect(p.holdings).toEqual([]);
  });
});
