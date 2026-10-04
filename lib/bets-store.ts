import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import {
  SystematicBetSchema,
  type SystematicBet,
  type BetHorizon,
  type PostMortem,
} from './schemas';
import { atomicWriteJson } from './storage';

function dataDir(): string {
  return process.env.KOSH_DATA_DIR || path.join(process.cwd(), 'data');
}

export function betsFilePath(): string {
  return path.join(dataDir(), 'bets.json');
}

export const INITIAL_BETS: SystematicBet[] = [
  // ── Short-Term Active ──
  {
    id: 'st-2026-10-02-trent',
    ticker: 'TRENT',
    name: 'Trent Ltd',
    horizon: 'short_term',
    category: 'Dual Momentum Breakout',
    action: 'buy',
    callDate: '2026-10-02',
    expiryDate: '2026-10-23',
    entryPrice: 7120,
    targetPrice: 7650,
    stopLossPrice: 6855,
    quantScore: 92,
    triggers: '20 EMA > 50 SMA; RS vs Nifty 1.42; Vol 2.1x SMA20; RSI 62.4',
    thesis: 'Sustained retail network expansion driving operating margin leverage; relative volume outperformance confirms institutional accumulation.',
    status: 'active',
  },
  {
    id: 'st-2026-10-02-bharatforg',
    ticker: 'BHARATFORG',
    name: 'Bharat Forge Ltd',
    horizon: 'short_term',
    category: 'Dual Momentum Breakout',
    action: 'buy',
    callDate: '2026-10-02',
    expiryDate: '2026-10-20',
    entryPrice: 1485,
    targetPrice: 1610,
    stopLossPrice: 1422,
    quantScore: 88,
    triggers: '20-day high breakout; Delivery 58.4%; Vol 1.9x SMA20; RSI 59.8',
    thesis: 'Breakout above 20-day consolidation resistance with high cash delivery percentage indicating strong institutional absorption.',
    status: 'active',
  },
  {
    id: 'st-2026-10-02-hdfcbank',
    ticker: 'HDFCBANK',
    name: 'HDFC Bank Ltd',
    horizon: 'short_term',
    category: 'Contrarian Mean-Reversion',
    action: 'buy',
    callDate: '2026-10-02',
    expiryDate: '2026-10-18',
    entryPrice: 1640,
    targetPrice: 1725,
    stopLossPrice: 1598,
    quantScore: 84,
    triggers: 'Lower Bollinger Band touch (20, 2); RSI 30.5; Delivery 62.1%',
    thesis: 'Temporary panic selling into multi-month support channel with heavy delivery absorption signaling exhaustion of selling pressure.',
    status: 'active',
  },

  // ── Short-Term Closed (Audit Record) ──
  {
    id: 'st-2026-09-11-tatamotors',
    ticker: 'TATAMOTORS',
    name: 'Tata Motors Ltd',
    horizon: 'short_term',
    category: 'Dual Momentum Breakout',
    action: 'buy',
    callDate: '2026-09-11',
    expiryDate: '2026-09-29',
    entryPrice: 975,
    targetPrice: 1045,
    stopLossPrice: 940,
    quantScore: 89,
    triggers: 'JLR order book expansion; Breakout above 960 on 2.2x volume',
    thesis: 'Commercial vehicle margin expansion and strong JLR wholesale volumes driving tactical upward momentum.',
    status: 'closed',
    closedOn: '2026-09-29',
    closePrice: 1052,
    returnPct: 7.9,
    outcome: 'hit',
  },
  {
    id: 'st-2026-09-08-bajfinance',
    ticker: 'BAJFINANCE',
    name: 'Bajaj Finance Ltd',
    horizon: 'short_term',
    category: 'Contrarian Mean-Reversion',
    action: 'buy',
    callDate: '2026-09-08',
    expiryDate: '2026-09-26',
    entryPrice: 7250,
    targetPrice: 7600,
    stopLossPrice: 7050,
    quantScore: 81,
    triggers: 'RSI at 28.5; Support at 7200 psychological level',
    thesis: 'Oversold bounce expected off 200-day moving average following regulatory clarity on consumer credit risk.',
    status: 'closed',
    closedOn: '2026-09-26',
    closePrice: 6980,
    returnPct: -3.7,
    outcome: 'miss',
    postMortem: {
      whatWentWrong: 'Unsecured consumer credit delinquency data deteriorated across NBFCs mid-month, causing persistent institutional liquidation that broke the ₹7,050 stop loss without any reversal wick.',
      howToAvoid: 'Avoid contrarian mean-reversion entries in financial services when the RBI credit risk regime is active or sector-wide NII growth is decelerating.',
      analyzedAt: '2026-09-26T23:15:00.000Z',
    },
  },

  // ── Long-Term Active ──
  {
    id: 'lt-2026-09-01-ltim',
    ticker: 'LTIM',
    name: 'LTIMindtree Ltd',
    horizon: 'long_term',
    category: 'Quality Compounder',
    action: 'buy',
    callDate: '2026-09-01',
    expiryDate: '2027-03-01',
    entryPrice: 5350,
    targetPrice: 6500,
    stopLossPrice: 4800,
    quantScore: 94,
    triggers: '3Y ROE 26.4%; Net Cash Balance Sheet; PEG 1.15; DII Accumulation',
    thesis: 'Premier capital efficiency with net-cash resilience, accelerating BFSI deal ramp-ups, and PEG below 1.2x providing valuation safety.',
    status: 'active',
  },
  {
    id: 'lt-2026-09-01-titan',
    ticker: 'TITAN',
    name: 'Titan Company Ltd',
    horizon: 'long_term',
    category: 'Quality Compounder',
    action: 'buy',
    callDate: '2026-09-01',
    expiryDate: '2027-03-01',
    entryPrice: 3450,
    targetPrice: 4200,
    stopLossPrice: 3100,
    quantScore: 91,
    triggers: '3Y ROE 31.8%; D/E 0.42x; 5Y Sales CAGR 24.1%; FII Stake 32.4%',
    thesis: 'Dominant market share consolidation in organized jewellery and eyewear with consistent >30% ROE and strong festive season demand visibility.',
    status: 'active',
  },
  {
    id: 'lt-2026-09-01-bel',
    ticker: 'BEL',
    name: 'Bharat Electronics Ltd',
    horizon: 'long_term',
    category: 'Capex & De-leveraging',
    action: 'buy',
    callDate: '2026-09-01',
    expiryDate: '2027-03-01',
    entryPrice: 285,
    targetPrice: 360,
    stopLossPrice: 250,
    quantScore: 89,
    triggers: 'Order-book-to-bill > 3.5x; Zero Gross Debt; Operating margin +180bps',
    thesis: 'Record defense order book provides multi-year revenue visibility, while increasing domestic indigenization expands operating EBITDA margins.',
    status: 'active',
  },

  // ── Long-Term Closed (Audit Record) ──
  {
    id: 'lt-2026-03-01-itc',
    ticker: 'ITC',
    name: 'ITC Ltd',
    horizon: 'long_term',
    category: 'Defensive Cash Flow',
    action: 'buy',
    callDate: '2026-03-01',
    expiryDate: '2026-09-01',
    entryPrice: 405,
    targetPrice: 480,
    stopLossPrice: 375,
    quantScore: 87,
    triggers: 'FCF Yield 6.2%; Dividend Yield 3.8%; Hotel demerger value unlocking',
    thesis: 'High free cash flow generation, resilient cigarette volumes, and hotel demerger unlocking non-core asset value.',
    status: 'closed',
    closedOn: '2026-09-01',
    closePrice: 492,
    returnPct: 21.5,
    outcome: 'hit',
  },
  {
    id: 'lt-2026-03-01-asianpaint',
    ticker: 'ASIANPAINT',
    name: 'Asian Paints Ltd',
    horizon: 'long_term',
    category: 'Quality Compounder',
    action: 'buy',
    callDate: '2026-03-01',
    expiryDate: '2026-09-01',
    entryPrice: 2850,
    targetPrice: 3350,
    stopLossPrice: 2600,
    quantScore: 82,
    triggers: 'Historic 3Y ROE 27.5%; Monopolistic distribution moat',
    thesis: 'Pricing power in architectural paints and decorative coatings expected to insulate margins despite raw material crude price volatility.',
    status: 'closed',
    closedOn: '2026-09-01',
    closePrice: 2540,
    returnPct: -10.9,
    outcome: 'miss',
    postMortem: {
      whatWentWrong: 'Aggressive pricing competition from new deep-pocketed conglomerate entrant (Birla Opus) compressed gross margins by 320 bps, permanently invalidating the pricing-power thesis.',
      howToAvoid: 'Incorporate competitive moat stress-testing that detects industry capacity additions >20% within a 12-month window before issuing quality compounder calls.',
      analyzedAt: '2026-09-01T23:30:00.000Z',
    },
  },
];

export async function readAllBets(): Promise<SystematicBet[]> {
  const filePath = betsFilePath();
  try {
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return z.array(SystematicBetSchema).parse(parsed);
  } catch (e) {
    if ((e as NodeJS.ErrnoException)?.code === 'ENOENT') {
      await atomicWriteJson(filePath, INITIAL_BETS);
      return INITIAL_BETS;
    }
    throw e;
  }
}

export async function saveAllBets(bets: SystematicBet[]): Promise<void> {
  const filePath = betsFilePath();
  const validated = z.array(SystematicBetSchema).parse(bets);
  await atomicWriteJson(filePath, validated);
}

export async function getActiveBets(horizon?: BetHorizon): Promise<SystematicBet[]> {
  const all = await readAllBets();
  return all.filter((b) => b.status === 'active' && (!horizon || b.horizon === horizon));
}

export async function getClosedBets(horizon?: BetHorizon): Promise<SystematicBet[]> {
  const all = await readAllBets();
  return all.filter((b) => b.status === 'closed' && (!horizon || b.horizon === horizon));
}

export async function getExpiringActiveBets(asOfDate: string): Promise<SystematicBet[]> {
  const all = await readAllBets();
  return all.filter((b) => b.status === 'active' && b.expiryDate <= asOfDate);
}

export async function upsertBet(bet: SystematicBet): Promise<void> {
  const validated = SystematicBetSchema.parse(bet);
  const all = await readAllBets();
  const idx = all.findIndex((b) => b.id === validated.id);
  if (idx >= 0) {
    all[idx] = validated;
  } else {
    all.push(validated);
  }
  await saveAllBets(all);
}

export async function settleBet(
  betId: string,
  settlement: {
    closePrice: number;
    closedOn: string;
    outcome: 'hit' | 'miss';
    postMortem?: PostMortem;
  },
): Promise<SystematicBet> {
  const all = await readAllBets();
  const idx = all.findIndex((b) => b.id === betId);
  if (idx < 0) {
    throw new Error(`Bet with ID "${betId}" not found in storage.`);
  }

  const bet = all[idx];
  const returnPct = Number(
    (((settlement.closePrice - bet.entryPrice) / bet.entryPrice) * 100).toFixed(2),
  );

  const updated: SystematicBet = {
    ...bet,
    status: 'closed',
    closedOn: settlement.closedOn,
    closePrice: settlement.closePrice,
    returnPct,
    outcome: settlement.outcome,
    postMortem: settlement.outcome === 'miss' ? settlement.postMortem : undefined,
  };

  all[idx] = SystematicBetSchema.parse(updated);
  await saveAllBets(all);
  return all[idx];
}
