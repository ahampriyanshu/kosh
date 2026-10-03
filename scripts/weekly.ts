import { pathToFileURL } from 'node:url';
import { istWeekId, istDateString } from '../lib/time';
import { loadWindowSnapshots, aggregateSnapshots } from '../lib/feed/aggregate';
import { buildWeeklyNarrative } from '../lib/reports-narrative';
import { writeReport, computeChecksum } from '../lib/storage';
import { sendReportEmail } from '../lib/email';
import { renderWeeklyEmail } from '../lib/email-templates';
import { WeeklyContentSchema, type ReportEnvelope, type MarketSnapshot } from '../lib/schemas';

function computeMultiAssetScorecard(s: MarketSnapshot) {
  const items = [];
  const n50 = s.indianIndices.find((i) => i.name.toUpperCase().includes('NIFTY 50') || i.symbol === '^NSEI');
  if (n50) items.push({ asset: 'Nifty 50', symbol: '^NSEI', close: n50.ltp, returnPct: n50.changePct, context: 'Indian large-cap benchmark' });
  const sensex = s.indianIndices.find((i) => i.name.toUpperCase().includes('SENSEX') || i.symbol === '^BSESN');
  if (sensex) items.push({ asset: 'BSE Sensex', symbol: '^BSESN', close: sensex.ltp, returnPct: sensex.changePct, context: 'Headline 30-share index' });

  const gold = s.commodities.find((c) => c.name.toLowerCase().includes('gold'));
  if (gold) items.push({ asset: 'Gold MCX', symbol: 'GC=F', close: gold.value, returnPct: gold.changePct, context: 'Safe haven & domestic store of value' });
  const silver = s.commodities.find((c) => c.name.toLowerCase().includes('silver'));
  if (silver) items.push({ asset: 'Silver MCX', symbol: 'SI=F', close: silver.value, returnPct: silver.changePct, context: 'Industrial & precious hedge' });
  const crude = s.commodities.find((c) => c.name.toLowerCase().includes('crude') || c.name.toLowerCase().includes('brent'));
  if (crude) items.push({ asset: 'Brent Crude', symbol: 'CL=F', close: crude.value, returnPct: crude.changePct, context: 'Energy import inflation barometer' });

  if (s.bondYield) {
    items.push({ asset: 'India 10Y Yield', symbol: 'IN10Y', close: s.bondYield.value, returnPct: s.bondYield.changeBps / 100, context: 'Sovereign borrowing benchmark' });
  }

  const usd = s.currencies.find((c) => c.pair.toUpperCase().includes('USD'));
  if (usd) items.push({ asset: 'USD / INR', symbol: 'USDINR=X', close: usd.value, returnPct: usd.changePct, context: 'Rupee foreign exchange stability' });

  return items;
}

function computeSectorGrowth(s: MarketSnapshot) {
  const sectors = [...(s.sectorRanking || [])].sort((a, b) => b.changePct - a.changePct);
  return sectors.map((sec, idx) => ({
    sector: sec.sector,
    weeklyReturnPct: sec.changePct,
    rank: idx + 1,
    stance: idx < 3 ? ('leading' as const) : idx >= sectors.length - 3 ? ('lagging' as const) : ('neutral' as const),
  }));
}

function computeFiiDiiWeekly(s: MarketSnapshot) {
  if (!s.fiiDii) return null;
  const fii = s.fiiDii.fiiNet;
  const dii = s.fiiDii.diiNet;
  const net = fii + dii;
  const summary =
    fii >= 0
      ? `Foreign Institutional Investors were net buyers with weekly inflows of ₹${fii.toLocaleString('en-IN')} cr, supported by DII net activity of ₹${dii.toLocaleString('en-IN')} cr.`
      : `Foreign Institutional Investors recorded weekly net outflows of ₹${Math.abs(fii).toLocaleString('en-IN')} cr, with domestic institutions absorbing ₹${dii.toLocaleString('en-IN')} cr in cash.`;
  return {
    fiiNetCrore: fii,
    diiNetCrore: dii,
    netInstitutionalCrore: net,
    summary,
  };
}

export async function runWeekly(now: Date = new Date()): Promise<void> {
  const period = istWeekId(now);
  const date = istDateString(now);
  const snapshot = aggregateSnapshots(await loadWindowSnapshots(date, 7), '7d');
  const narrative = await buildWeeklyNarrative(snapshot);

  const multiAssetScorecard = computeMultiAssetScorecard(snapshot);
  const sectorGrowth = computeSectorGrowth(snapshot);
  const fiiDiiWeekly = computeFiiDiiWeekly(snapshot);

  const content = WeeklyContentSchema.parse({
    snapshot,
    period,
    themes: narrative.themes,
    multiAssetScorecard,
    sectorGrowth,
    fiiDiiWeekly,
    portfolioFocus: narrative.portfolioFocus ?? [],
    iposInFocus: narrative.iposInFocus ?? [],
    macroThemes: narrative.themes,
  });

  const sourceTickers = [
    ...(content.portfolioFocus?.map((p) => p.ticker) ?? []),
    ...(content.positionalBets?.map((b) => b.ticker) ?? []),
  ];

  const base: Omit<ReportEnvelope, 'emailSent'> = {
    schemaVersion: 1,
    id: `weekly-${period}`,
    type: 'weekly',
    dateKey: period,
    generatedAt: now.toISOString(),
    sourceData: { tickers: sourceTickers, priceSnapshot: {}, searchTimestamp: now.toISOString() },
    content,
    checksum: computeChecksum(content),
  };
  await writeReport({ ...base, emailSent: false });
  await sendReportEmail('Kosh Weekly Outlook', renderWeeklyEmail(content, period));
  await writeReport({ ...base, emailSent: true });
  console.log(`Weekly ${base.id} written and emailed.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runWeekly().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
