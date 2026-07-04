import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parsePortfolio, readPortfolio } from '../../lib/portfolio';
import { encryptPortfolioEnvelope } from '../../lib/portfolio-crypto';
import type { Portfolio } from '../../lib/schemas';

let dir: string;
beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), 'kosh-')); process.env.KOSH_DATA_DIR = dir; process.env.KOSH_PUBLIC_DATA_DIR = path.join(dir, 'public-data'); process.env.PORTFOLIO_KEY = 'portfolio-key'; });
afterEach(async () => { delete process.env.KOSH_DATA_DIR; delete process.env.KOSH_PUBLIC_DATA_DIR; delete process.env.PORTFOLIO_KEY; await rm(dir, { recursive: true, force: true }); });

describe('readPortfolio', () => {
  it('normalizes legacy manual portfolio files', async () => {
    const p = parsePortfolio({
      asOf: '2026-06-14', holdings: [{ ticker: 'TCS.NS', name: 'TCS', qty: 10, avgCost: 3500 }],
    });
    expect(p.holdings[0].ticker).toBe('TCS.NS');
    expect(p.holdings[0].quantity).toBe(10);
    expect(p.holdings[0].averagePrice).toBe(3500);
    expect(p.summary.investedValue).toBe(35000);
    expect(p.source).toBe('manual');
  });
  it('reads a Kite holdings portfolio file with aggregate summary', async () => {
    const portfolio: Portfolio = {
      asOf: '2026-07-04T11:30:00.000Z',
      source: 'kite',
      holdings: [{
        ticker: 'TCS.NS',
        name: 'TCS',
        exchange: 'NSE',
        quantity: 10,
        averagePrice: 3500,
        lastPrice: 3900,
        investedValue: 35000,
        currentValue: 39000,
        pnl: 4000,
        pnlPct: 11.43,
        dayChange: 12.5,
        dayChangePct: 0.32,
        allocationPct: 100,
      }],
      summary: {
        investedValue: 35000,
        currentValue: 39000,
        pnl: 4000,
        pnlPct: 11.43,
        dayChange: 125,
        dayChangePct: 0.32,
      },
    };
    await mkdir(path.join(dir, 'public-data'), { recursive: true });
    const encrypted = await encryptPortfolioEnvelope(portfolio, 'portfolio-key');
    await writeFile(path.join(dir, 'public-data/portfolio.enc.json'), JSON.stringify(encrypted), 'utf8');

    const p = await readPortfolio();
    expect(p.source).toBe('kite');
    expect(p.holdings[0].currentValue).toBe(39000);
    expect(p.summary.pnl).toBe(4000);
  });
  it('returns empty holdings when no file exists', async () => {
    const p = await readPortfolio();
    expect(p.holdings).toEqual([]);
    expect(p.summary.currentValue).toBe(0);
  });
});
