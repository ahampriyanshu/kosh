import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const h = vi.hoisted(() => ({
  fetchKiteHoldingsSnapshot: vi.fn(),
}));

vi.mock('../../lib/kite', () => ({ fetchKiteHoldingsSnapshot: h.fetchKiteHoldingsSnapshot }));

import { runPortfolioSync } from '../../scripts/portfolio';

let dir: string;
const NOW = new Date('2026-07-04T11:30:00.000Z');

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'kosh-portfolio-'));
  process.env.KOSH_DATA_DIR = dir;
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
  await rm(dir, { recursive: true, force: true });
});

describe('runPortfolioSync', () => {
  it('writes the Kite holdings snapshot to data/portfolio.json', async () => {
    await runPortfolioSync(NOW);

    expect(h.fetchKiteHoldingsSnapshot).toHaveBeenCalledWith(NOW);
    const written = JSON.parse(await readFile(path.join(dir, 'portfolio.json'), 'utf8'));
    expect(written.source).toBe('kite');
    expect(written.asOf).toBe(NOW.toISOString());
  });
});
