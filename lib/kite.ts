import { z } from 'zod';
import { createHash } from 'node:crypto';
import { PortfolioSchema, type Portfolio, type PortfolioHolding } from './schemas';

const KITE_HOLDINGS_URL = 'https://api.kite.trade/portfolio/holdings';
const KITE_SESSION_URL = 'https://api.kite.trade/session/token';
const KITE_LOGIN_URL = 'https://kite.zerodha.com/connect/login?v=3';

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

const KiteSessionResponseSchema = z.object({
  status: z.string(),
  data: z.object({
    access_token: z.string(),
  }),
});

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} for Kite portfolio sync.`);
  return value;
}

export function createKiteLoginUrl(apiKey: string = requiredEnv('KITE_API_KEY')): string {
  return `${KITE_LOGIN_URL}&api_key=${encodeURIComponent(apiKey)}`;
}

export function computeKiteChecksum(apiKey: string, requestToken: string, apiSecret: string): string {
  return createHash('sha256').update(`${apiKey}${requestToken}${apiSecret}`).digest('hex');
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

export async function exchangeKiteRequestToken(
  requestToken: string,
  apiSecret: string = requiredEnv('KITE_API_SECRET'),
  apiKey: string = requiredEnv('KITE_API_KEY'),
): Promise<{ accessToken: string }> {
  const response = await fetch(KITE_SESSION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Kite-Version': '3',
    },
    body: new URLSearchParams({
      api_key: apiKey,
      request_token: requestToken,
      checksum: computeKiteChecksum(apiKey, requestToken, apiSecret),
    }),
  });

  if (!response.ok) {
    throw new Error(`Kite session exchange failed with HTTP ${response.status}.`);
  }

  const payload = KiteSessionResponseSchema.parse(await response.json());
  if (payload.status !== 'success') {
    throw new Error(`Kite session exchange returned status ${payload.status}.`);
  }

  return { accessToken: payload.data.access_token };
}
