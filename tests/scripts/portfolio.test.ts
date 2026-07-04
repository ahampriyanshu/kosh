import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const h = vi.hoisted(() => ({
  fetchKiteHoldingsSnapshot: vi.fn(),
}));

vi.mock('../../lib/kite', () => ({ fetchKiteHoldingsSnapshot: h.fetchKiteHoldingsSnapshot }));

import { runPortfolioSync } from '../../scripts/portfolio';
import { decryptPortfolioEnvelope } from '../../lib/portfolio-crypto';

let dir: string;
const NOW = new Date('2026-07-04T11:30:00.000Z');

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'kosh-portfolio-'));
  process.env.KOSH_DATA_DIR = dir;
  process.env.KOSH_PUBLIC_DATA_DIR = path.join(dir, 'public-data');
  process.env.KOSH_PORTFOLIO_KEY = 'portfolio-key';
  h.fetchKiteHoldingsSnapshot.mockReset();
  h.fetchKiteHoldingsSnapshot.mockResolvedValue({
    asOf: NOW.toISOString(),
    source: 'kite',
    holdings: [],
    summary: { investedValue: 0, currentValue: 0, pnl: 0, pnlPct: 0, dayChange: 0, dayChangePct: 0 },
  });
});

afterEach(async () => {
  delete process.env.KOSH_DATA_DIR;
  delete process.env.KOSH_PUBLIC_DATA_DIR;
  delete process.env.KOSH_PORTFOLIO_KEY;
  await rm(dir, { recursive: true, force: true });
});

describe('runPortfolioSync', () => {
  it('writes an encrypted Kite holdings snapshot to public/data/portfolio.enc.json', async () => {
    await runPortfolioSync(NOW);

    expect(h.fetchKiteHoldingsSnapshot).toHaveBeenCalledWith(NOW);
    await expect(stat(path.join(dir, 'portfolio.json'))).rejects.toThrow();

    const encrypted = JSON.parse(await readFile(path.join(dir, 'public-data/portfolio.enc.json'), 'utf8'));
    expect(JSON.stringify(encrypted)).not.toContain(NOW.toISOString());
    const written = await decryptPortfolioEnvelope(encrypted, 'portfolio-key');
    expect(written.source).toBe('kite');
    expect(written.asOf).toBe(NOW.toISOString());
  });

  it('requires KOSH_PORTFOLIO_KEY before writing portfolio data', async () => {
    delete process.env.KOSH_PORTFOLIO_KEY;
    await expect(runPortfolioSync(NOW)).rejects.toThrow(/KOSH_PORTFOLIO_KEY/);
  });
});
