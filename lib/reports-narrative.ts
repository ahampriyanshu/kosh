import { z } from 'zod';
import { structure } from './llm';
import { BetSchema, type MarketSnapshot } from './schemas';

function snapshotDigest(s: MarketSnapshot): string {
  const idx = s.indianIndices.map((i) => `${i.name} ${i.ltp} (${i.changePct >= 0 ? '+' : ''}${i.changePct.toFixed(2)}%)`).join(', ');
  const gainers = s.topGainers.slice(0, 5).map((g) => `${g.ticker} +${g.changePct.toFixed(1)}%`).join(', ');
  const losers = s.topLosers.slice(0, 5).map((g) => `${g.ticker} ${g.changePct.toFixed(1)}%`).join(', ');
  const sectors = s.sectorRanking.slice(0, 5).map((x) => `${x.sector} ${x.changePct >= 0 ? '+' : ''}${x.changePct}%`).join(', ');
  const breadth = s.breadth ? `adv ${s.breadth.advances}/dec ${s.breadth.declines}` : 'n/a';
  const fii = s.fiiDii ? `FII ${s.fiiDii.fiiNet}cr, DII ${s.fiiDii.diiNet}cr` : 'n/a';
  return `Indices: ${idx || 'n/a'}\nBreadth: ${breadth}\nTop gainers: ${gainers || 'n/a'}\nTop losers: ${losers || 'n/a'}\nSectors: ${sectors || 'n/a'}\nFlows: ${fii}\nVIX: ${s.vix?.value ?? 'n/a'}`;
}

const DailyNarrativeSchema = z.object({ outlook: z.string(), keyTakeaways: z.array(z.string()).max(6) });
export async function buildDailyNarrative(s: MarketSnapshot): Promise<z.infer<typeof DailyNarrativeSchema>> {
  return structure(
    `You are a pre-market desk analyst for the Indian market. Given today's market snapshot, write a concise "outlook" (2-4 sentences, what to know before the open) and 3-6 short "keyTakeaways" bullet strings. Do not invent numbers beyond the snapshot.\n\n${snapshotDigest(s)}`,
    DailyNarrativeSchema,
  );
}

const WeeklyNarrativeSchema = z.object({ themes: z.array(z.string()).max(6), positionalBets: z.array(BetSchema).max(5) });
export async function buildWeeklyNarrative(s: MarketSnapshot): Promise<z.infer<typeof WeeklyNarrativeSchema>> {
  return structure(
    `You are a swing strategist for the Indian market. Given this 7-day aggregated snapshot, write up to 6 forward-looking "themes" and up to 5 "positionalBets" for the coming week. Each bet: { ticker (NSE symbol), name, thesis, action (buy/sell/hold), signal (bullish/bearish/neutral), confidence 0..1 }. Base bets on the snapshot's movers/sectors/flows.\n\n${snapshotDigest(s)}`,
    WeeklyNarrativeSchema,
  );
}

const MonthlyNarrativeSchema = z.object({ sectorInsights: z.array(z.string()).max(8), macroThemes: z.array(z.string()).max(6), midTermBets: z.array(BetSchema).max(5) });
export async function buildMonthlyNarrative(s: MarketSnapshot): Promise<z.infer<typeof MonthlyNarrativeSchema>> {
  return structure(
    `You are a macro/sector strategist for the Indian market. Given this ~30-day aggregated snapshot, write "sectorInsights" (sector rotation observations), "macroThemes" (rates, flows, global), and up to 5 "midTermBets" { ticker, name, thesis, action, signal, confidence }.\n\n${snapshotDigest(s)}`,
    MonthlyNarrativeSchema,
  );
}
