import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { PortfolioSchema, type Portfolio } from './schemas';

function dataDir(): string {
  return process.env.KOSH_DATA_DIR || path.join(process.cwd(), 'data');
}

export async function readPortfolio(): Promise<Portfolio> {
  try {
    const raw = await readFile(path.join(dataDir(), 'portfolio.json'), 'utf8');
    return parsePortfolio(JSON.parse(raw));
  } catch (e) {
    if ((e as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return emptyPortfolio();
    }
    throw e;
  }
}

const LegacyPortfolioSchema = z.object({
  asOf: z.string().default(''),
  holdings: z.array(
    z.object({
      ticker: z.string(),
      name: z.string(),
      qty: z.number().nonnegative(),
      avgCost: z.number().nonnegative(),
    }),
  ).default([]),
});

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function emptyPortfolio(): Portfolio {
  return {
    asOf: '',
    source: 'manual',
    holdings: [],
    summary: { investedValue: 0, currentValue: 0, pnl: 0, pnlPct: 0, dayChange: 0, dayChangePct: 0 },
  };
}

export function parsePortfolio(value: unknown): Portfolio {
  const rich = PortfolioSchema.safeParse(value);
  if (rich.success) return rich.data;

  const legacy = LegacyPortfolioSchema.parse(value);
  const totalCurrent = legacy.holdings.reduce((sum, holding) => sum + holding.qty * holding.avgCost, 0);
  const holdings = legacy.holdings.map((holding) => {
    const currentValue = holding.qty * holding.avgCost;
    return {
      ticker: holding.ticker,
      name: holding.name,
      exchange: holding.ticker.endsWith('.BO') ? 'BSE' : 'NSE',
      quantity: holding.qty,
      averagePrice: holding.avgCost,
      lastPrice: holding.avgCost,
      investedValue: currentValue,
      currentValue,
      pnl: 0,
      pnlPct: 0,
      dayChange: 0,
      dayChangePct: 0,
      allocationPct: totalCurrent ? round2((currentValue / totalCurrent) * 100) : 0,
    };
  });

  return PortfolioSchema.parse({
    asOf: legacy.asOf,
    source: 'manual',
    holdings,
    summary: {
      investedValue: totalCurrent,
      currentValue: totalCurrent,
      pnl: 0,
      pnlPct: 0,
      dayChange: 0,
      dayChangePct: 0,
    },
  });
}
