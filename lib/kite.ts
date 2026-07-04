import { z } from 'zod';
import { PortfolioSchema, type Portfolio, type PortfolioHolding } from './schemas';

const KITE_HOLDINGS_URL = 'https://api.kite.trade/portfolio/holdings';

const KiteHoldingSchema = z.object({
  tradingsymbol: z.string(),
  exchange: z.string(),
  quantity: z.number(),
  average_price: z.number(),
  last_price: z.number(),
  pnl: z.number(),
  day_change: z.number(),
  day_change_percentage: z.number(),
});

const KiteHoldingsResponseSchema = z.object({
  status: z.string(),
  data: z.array(KiteHoldingSchema),
});

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} for Kite portfolio sync.`);
  return value;
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function tickerFor(exchange: string, tradingsymbol: string): string {
  if (tradingsymbol.includes('.')) return tradingsymbol;
  if (exchange === 'NSE') return `${tradingsymbol}.NS`;
  if (exchange === 'BSE') return `${tradingsymbol}.BO`;
  return `${tradingsymbol}.${exchange}`;
}

function normalizeHolding(holding: z.infer<typeof KiteHoldingSchema>): PortfolioHolding {
  const investedValue = holding.quantity * holding.average_price;
  const currentValue = holding.quantity * holding.last_price;
  const pnlPct = investedValue ? (holding.pnl / investedValue) * 100 : 0;

  return {
    ticker: tickerFor(holding.exchange, holding.tradingsymbol),
    name: holding.tradingsymbol,
    exchange: holding.exchange,
    quantity: holding.quantity,
    averagePrice: holding.average_price,
    lastPrice: holding.last_price,
    investedValue: round2(investedValue),
    currentValue: round2(currentValue),
    pnl: round2(holding.pnl),
    pnlPct: round2(pnlPct),
    dayChange: round2(holding.day_change),
    dayChangePct: round2(holding.day_change_percentage),
    allocationPct: 0,
  };
}

function summarize(holdings: PortfolioHolding[]): Portfolio['summary'] {
  const investedValue = round2(holdings.reduce((sum, holding) => sum + holding.investedValue, 0));
  const currentValue = round2(holdings.reduce((sum, holding) => sum + holding.currentValue, 0));
  const pnl = round2(holdings.reduce((sum, holding) => sum + holding.pnl, 0));
  const dayChange = round2(holdings.reduce((sum, holding) => sum + holding.dayChange * holding.quantity, 0));

  return {
    investedValue,
    currentValue,
    pnl,
    pnlPct: investedValue ? round2((pnl / investedValue) * 100) : 0,
    dayChange,
    dayChangePct: currentValue ? round2((dayChange / currentValue) * 100) : 0,
  };
}

export async function fetchKiteHoldingsSnapshot(now: Date = new Date()): Promise<Portfolio> {
  const apiKey = requiredEnv('KITE_API_KEY');
  const accessToken = requiredEnv('KITE_ACCESS_TOKEN');

  const response = await fetch(KITE_HOLDINGS_URL, {
    headers: {
      Authorization: `token ${apiKey}:${accessToken}`,
      'X-Kite-Version': '3',
    },
  });

  if (!response.ok) {
    throw new Error(`Kite holdings request failed with HTTP ${response.status}.`);
  }

  const payload = KiteHoldingsResponseSchema.parse(await response.json());
  if (payload.status !== 'success') {
    throw new Error(`Kite holdings request returned status ${payload.status}.`);
  }

  const holdings = payload.data.map(normalizeHolding);
  const summary = summarize(holdings);
  const enriched = holdings.map((holding) => ({
    ...holding,
    allocationPct: summary.currentValue ? round2((holding.currentValue / summary.currentValue) * 100) : 0,
  }));

  return PortfolioSchema.parse({
    asOf: now.toISOString(),
    source: 'kite',
    holdings: enriched,
    summary,
  });
}
