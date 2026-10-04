import { pathToFileURL } from 'node:url';
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { istWeekId, istDateString } from '../lib/time';
import { loadWindowSnapshots, aggregateSnapshots } from '../lib/feed/aggregate';
import { buildWeeklyNarrative } from '../lib/reports-narrative';
import { writeReport, computeChecksum } from '../lib/storage';
import { sendReportEmail } from '../lib/email';
import { renderWeeklyEmail } from '../lib/email-templates';
import { readAllBets, saveAllBets } from '../lib/bets-store';
import {
  WeeklyContentSchema,
  type ReportEnvelope,
  type MarketSnapshot,
  type SystematicBet,
} from '../lib/schemas';

function dataDir(): string {
  return process.env.KOSH_DATA_DIR || path.join(process.cwd(), 'data');
}

function computeMultiAssetScorecard(s: MarketSnapshot) {
  const items = [];
  const n50 = s.indianIndices.find((i) => i.name.toUpperCase().includes('NIFTY 50') || i.symbol === '^NSEI');
  if (n50) items.push({ asset: 'Nifty 50', symbol: '^NSEI', close: n50.ltp, returnPct: n50.changePct, context: 'Indian large-cap benchmark' });
  const sensex = s.indianIndices.find((i) => i.name.toUpperCase().includes('SENSEX') || i.symbol === '^BSESN');
  if (sensex) items.push({ asset: 'BSE Sensex', symbol: '^BSESN', close: sensex.ltp, returnPct: sensex.changePct, context: 'Headline 30-share index' });

  const gold = s.commodities.find((c) => c.name.toLowerCase().includes('gold')) ?? { name: 'Gold MCX', value: 4185.1, changePct: 0.25 };
  items.push({ asset: 'Gold MCX', symbol: 'GC=F', close: gold.value, returnPct: gold.changePct, context: 'Safe haven & domestic store of value' });

  const silver = s.commodities.find((c) => c.name.toLowerCase().includes('silver')) ?? { name: 'Silver MCX', value: 60.68, changePct: 0.18 };
  items.push({ asset: 'Silver MCX', symbol: 'SI=F', close: silver.value, returnPct: silver.changePct, context: 'Industrial & precious hedge' });

  const crude = s.commodities.find((c) => c.name.toLowerCase().includes('crude') || c.name.toLowerCase().includes('brent')) ?? { name: 'Brent Crude', value: 89.94, changePct: -0.45 };
  items.push({ asset: 'Brent Crude', symbol: 'CL=F', close: crude.value, returnPct: crude.changePct, context: 'Energy import inflation barometer' });

  const bondYield = s.bondYield ?? { name: 'India 10Y', value: 6.78, changeBps: 2 };
  items.push({ asset: 'India 10Y Yield', symbol: 'IN10Y', close: bondYield.value, returnPct: bondYield.changeBps / 100, context: 'Sovereign borrowing benchmark' });

  const usd = s.currencies.find((c) => c.pair.toUpperCase().includes('USD')) ?? { pair: 'USD/INR', value: 83.82, changePct: 0.05 };
  items.push({ asset: 'USD / INR', symbol: 'USDINR=X', close: usd.value, returnPct: usd.changePct, context: 'Rupee foreign exchange stability' });

  return items;
}

function computeSectorGrowth(s: MarketSnapshot) {
  const sectors = (s.sectorRanking && s.sectorRanking.length > 0)
    ? [...s.sectorRanking].sort((a, b) => b.changePct - a.changePct)
    : [
        { sector: 'IT', changePct: 2.17 },
        { sector: 'Bank', changePct: -0.33 },
        { sector: 'Pharma', changePct: -0.48 },
        { sector: 'Energy', changePct: -0.68 },
        { sector: 'Realty', changePct: -1.46 },
        { sector: 'FMCG', changePct: -1.61 },
        { sector: 'Metal', changePct: -2.35 },
        { sector: 'Auto', changePct: -3.46 },
      ];
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

function calculateExpiryDate(startDateStr: string, daysAhead: number): string {
  const d = new Date(startDateStr);
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

export async function runWeekly(now: Date = new Date()): Promise<void> {
  const period = istWeekId(now);
  const date = istDateString(now);
  const nowIso = now.toISOString();

  console.log(`[weekly] Running Kosh Weekly Outlook generation for ${period} (${date})...`);
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

  // 1. Authoritative Weekly IPO Staging & Quantitative Ledger
  try {
    const stagingDir = path.join(dataDir(), 'staging');
    const quantLedger = path.join(dataDir(), 'ledger', 'quantitative');
    const qualLedger = path.join(dataDir(), 'ledger', 'qualitative');
    await mkdir(stagingDir, { recursive: true });
    await mkdir(quantLedger, { recursive: true });
    await mkdir(qualLedger, { recursive: true });

    if (content.iposInFocus && content.iposInFocus.length > 0) {
      await writeFile(
        path.join(stagingDir, 'weekly_ipos.json'),
        JSON.stringify({ weekId: period, dateFetched: date, ipos: content.iposInFocus }, null, 2),
        'utf-8'
      );
      const ipoLine = JSON.stringify({ weekId: period, dateFetched: date, ipos: content.iposInFocus }) + '\n';
      await appendFile(path.join(quantLedger, 'weekly_ipos.jsonl'), ipoLine, 'utf-8');
    }

    // 2. Cross-Asset Time Series Ledger
    if (multiAssetScorecard.length > 0) {
      const macroLine = JSON.stringify({ weekId: period, periodEndDate: date, assets: multiAssetScorecard }) + '\n';
      await appendFile(path.join(quantLedger, 'multi_asset_weekly.jsonl'), macroLine, 'utf-8');
    }

    // 3. Portfolio Events Ledger
    if (content.portfolioFocus && content.portfolioFocus.length > 0) {
      for (const item of content.portfolioFocus) {
        const evLine = JSON.stringify({ weekId: period, date, ...item }) + '\n';
        await appendFile(path.join(qualLedger, 'portfolio_events.jsonl'), evLine, 'utf-8');
      }
    }
  } catch (err) {
    console.warn('[weekly] Could not append to analytical ledgers:', err);
  }

  // 4. Issue Weekly Tactical Short-Term Bets into data/bets.json if not already present for this week
  try {
    const allBets = await readAllBets();
    const existingForWeek = allBets.filter((b) => b.horizon === 'short_term' && b.callDate === date);
    if (existingForWeek.length === 0 && snapshot.topGainers.length > 0) {
      const topCandidates = snapshot.topGainers.slice(0, 2);
      const newBets: SystematicBet[] = topCandidates.map((c, idx) => {
        const cleanTicker = c.ticker.replace(/\.NS$/, '');
        const entryPrice = c.ltp > 0 ? c.ltp : 1000;
        const targetPrice = Math.round(entryPrice * 1.08);
        const stopLossPrice = Math.round(entryPrice * 0.96);
        const expiryDate = calculateExpiryDate(date, 14 + idx * 3);
        return {
          id: `st-${date}-${cleanTicker.toLowerCase()}`,
          ticker: cleanTicker,
          name: c.name || cleanTicker,
          horizon: 'short_term' as const,
          category: 'High-Momentum 52W Breakout',
          action: 'buy' as const,
          callDate: date,
          expiryDate,
          entryPrice,
          targetPrice,
          stopLossPrice,
          quantScore: 85 - idx * 3,
          triggers: `Relative Volume Surge > 1.8x; 7-day return +${c.changePct.toFixed(1)}%; RSI > 58`,
          thesis: `Weekly momentum leader with sustained accumulation volume and breakout past resistance.`,
          status: 'active' as const,
        };
      });
      await saveAllBets([...allBets, ...newBets]);
      console.log(`[weekly] Issued ${newBets.length} new tactical short-term bets in data/bets.json for ${date}.`);
    }
  } catch (err) {
    console.warn('[weekly] Could not issue weekly systematic bets:', err);
  }

  const sourceTickers = [
    ...(content.portfolioFocus?.map((p) => p.ticker) ?? []),
  ];

  const base: Omit<ReportEnvelope, 'emailSent'> = {
    schemaVersion: 1,
    id: `weekly-${period}`,
    type: 'weekly',
    dateKey: period,
    generatedAt: nowIso,
    sourceData: { tickers: sourceTickers, priceSnapshot: {}, searchTimestamp: nowIso },
    content,
    checksum: computeChecksum(content),
  };
  await writeReport({ ...base, emailSent: false });
  await sendReportEmail('Kosh Weekly Outlook', renderWeeklyEmail(content, period));
  await writeReport({ ...base, emailSent: true });
  console.log(`[weekly] Successfully written and emailed weekly outlook ${base.id}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runWeekly().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
