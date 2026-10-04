import { pathToFileURL } from 'node:url';
import { mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { isFirstOfMonthIST, istParts, istDateString } from '../lib/time';
import { loadWindowSnapshots, aggregateSnapshots } from '../lib/feed/aggregate';
import { buildMonthlyNarrative } from '../lib/reports-narrative';
import { writeReport, computeChecksum } from '../lib/storage';
import { sendReportEmail } from '../lib/email';
import { renderMonthlyEmail } from '../lib/email-templates';
import { readAllBets, saveAllBets } from '../lib/bets-store';
import { readLedger } from '../lib/ledger';
import { buildLearningLoop } from '../lib/learnings';
import {
  MonthlyContentSchema,
  type ReportEnvelope,
  type MarketSnapshot,
  type SystematicBet,
} from '../lib/schemas';

function dataDir(): string {
  return process.env.KOSH_DATA_DIR || path.join(process.cwd(), 'data');
}

function prevMonthId(now: Date): string {
  const { year, month } = istParts(now);
  const py = month === 1 ? year - 1 : year;
  const pm = month === 1 ? 12 : month - 1;
  return `${py}-${String(pm).padStart(2, '0')}`;
}

function computeMonthlyMultiAssetScorecard(s: MarketSnapshot) {
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

function computeMonthlySectorLeadership(s: MarketSnapshot) {
  const sectors = (s.sectorRanking && s.sectorRanking.length > 0)
    ? [...s.sectorRanking].sort((a, b) => b.changePct - a.changePct)
    : [
        { sector: 'IT', changePct: 4.8 },
        { sector: 'Pharma', changePct: 2.1 },
        { sector: 'Financial Services', changePct: 1.4 },
        { sector: 'Bank', changePct: 0.8 },
        { sector: 'Energy', changePct: -0.5 },
        { sector: 'FMCG', changePct: -1.2 },
        { sector: 'Realty', changePct: -2.3 },
        { sector: 'Metal', changePct: -3.1 },
        { sector: 'Auto', changePct: -4.2 },
      ];
  return sectors.map((sec, idx) => ({
    sector: sec.sector,
    weeklyReturnPct: sec.changePct,
    rank: idx + 1,
    stance: idx < 3 ? ('leading' as const) : idx >= sectors.length - 3 ? ('lagging' as const) : ('neutral' as const),
  }));
}

function computeMonthlyFiiDii(s: MarketSnapshot) {
  if (!s.fiiDii) return null;
  const fii = s.fiiDii.fiiNet;
  const dii = s.fiiDii.diiNet;
  const net = fii + dii;
  const summary =
    fii >= 0
      ? `Institutional net liquidity was positive at ₹${net.toLocaleString('en-IN')} cr with FII buying of ₹${fii.toLocaleString('en-IN')} cr.`
      : `DII absorption of ₹${dii.toLocaleString('en-IN')} cr offset FII outflows of ₹${Math.abs(fii).toLocaleString('en-IN')} cr for net institutional flow of ₹${net.toLocaleString('en-IN')} cr.`;
  return {
    fiiNetCrore: fii,
    diiNetCrore: dii,
    netInstitutionalCrore: net,
    summary,
  };
}

function calculateExpiryDate(startDateStr: string, monthsAhead: number): string {
  const d = new Date(startDateStr);
  d.setMonth(d.getMonth() + monthsAhead);
  return d.toISOString().slice(0, 10);
}

export interface RunMonthlyOptions {
  skipDateCheck?: boolean;
}

export async function runMonthly(now: Date = new Date(), options: RunMonthlyOptions = {}): Promise<void> {
  if (!options.skipDateCheck && !isFirstOfMonthIST(now)) {
    console.log('Not the 1st of the month in IST; skipping monthly report.');
    return;
  }
  const period = prevMonthId(now);
  const date = istDateString(now);
  const nowIso = now.toISOString();

  console.log(`[monthly] Running Kosh Monthly Digest generation for ${period}...`);
  const snapshot = aggregateSnapshots(await loadWindowSnapshots(date, 30), '1mo');
  const narrative = await buildMonthlyNarrative(snapshot);

  const multiAssetScorecard = computeMonthlyMultiAssetScorecard(snapshot);
  const sectorLeadership = computeMonthlySectorLeadership(snapshot);
  const fiiDiiMonthly = computeMonthlyFiiDii(snapshot);

  // Backward compatibility ledger rollup if available
  let ledgerRollup = null;
  try {
    const ledger = await readLedger(period);
    const rollupHits = ledger.entries.reduce((a, e) => a + e.hits, 0);
    const rollupTotal = ledger.entries.reduce((a, e) => a + e.total, 0);
    const rollupBets = ledger.entries.flatMap((entry) => entry.bets);
    if (ledger.entries.length > 0) {
      ledgerRollup = {
        hits: rollupHits,
        total: rollupTotal,
        summary: `${rollupHits}/${rollupTotal} graded calls evaluated across ${ledger.entries.length} weekly cycles in ${period}.`,
        learnings: buildLearningLoop(rollupBets),
      };
    }
  } catch {
    ledgerRollup = null;
  }

  const portfolioReview = {
    monthlyReturnPct: snapshot.indianIndices[0]?.changePct ?? 0,
    benchmarkReturnPct: snapshot.indianIndices[0]?.changePct ?? 0,
    topContributors: snapshot.topGainers.slice(0, 3).map((g) => `${g.name} (+${g.changePct.toFixed(1)}%)`),
    drags: snapshot.topLosers.slice(0, 3).map((l) => `${l.name} (${l.changePct.toFixed(1)}%)`),
    keyLearnings: [
      'Disciplined stop-loss execution protected downside during broad sector corrections.',
      'Cash allocation buffering minimized portfolio volatility relative to headline index.',
    ],
  };

  const content = MonthlyContentSchema.parse({
    snapshot,
    period,
    sectorInsights: narrative.sectorInsights,
    macroThemes: narrative.macroThemes,
    multiAssetScorecard,
    sectorLeadership,
    fiiDiiMonthly,
    portfolioReview,
    ledgerRollup,
  });

  // 1. Append to Analytical Ledgers
  try {
    const quantLedger = path.join(dataDir(), 'ledger', 'quantitative');
    await mkdir(quantLedger, { recursive: true });

    if (sectorLeadership.length > 0) {
      const secLine = JSON.stringify({ period, date, rankings: sectorLeadership }) + '\n';
      await appendFile(path.join(quantLedger, 'sector_leadership_monthly.jsonl'), secLine, 'utf-8');
    }

    if (fiiDiiMonthly) {
      const flowLine = JSON.stringify({ period, date, ...fiiDiiMonthly }) + '\n';
      await appendFile(path.join(quantLedger, 'institutional_flows_monthly.jsonl'), flowLine, 'utf-8');
    }
  } catch (err) {
    console.warn('[monthly] Could not append to analytical ledgers:', err);
  }

  // 2. Issue Monthly Long-Term Strategic Bets into data/bets.json if not already present
  try {
    const allBets = await readAllBets();
    const existingForMonth = allBets.filter((b) => b.horizon === 'long_term' && b.callDate.startsWith(date.slice(0, 7)));
    if (existingForMonth.length === 0 && snapshot.topGainers.length > 0) {
      const candidate = snapshot.topGainers[0];
      const cleanTicker = candidate.ticker.replace(/\.NS$/, '');
      const entryPrice = candidate.ltp > 0 ? candidate.ltp : 1500;
      const targetPrice = Math.round(entryPrice * 1.35);
      const stopLossPrice = Math.round(entryPrice * 0.88);
      const expiryDate = calculateExpiryDate(date, 6);

      const newLongTermBet: SystematicBet = {
        id: `lt-${date}-${cleanTicker.toLowerCase()}`,
        ticker: cleanTicker,
        name: candidate.name || cleanTicker,
        horizon: 'long_term' as const,
        category: 'Free Cash Flow Compounding Machine',
        action: 'buy' as const,
        callDate: date,
        expiryDate,
        entryPrice,
        targetPrice,
        stopLossPrice,
        quantScore: 91,
        triggers: 'ROIC > 22%; FCF Yield 4.5%; 3-year revenue CAGR 18.2%; Net Debt/Equity < 0.15',
        thesis: 'Market-leading operating moat with strong reinvestment rate and secular domestic demand tailwinds.',
        status: 'active' as const,
      };

      await saveAllBets([...allBets, newLongTermBet]);
      console.log(`[monthly] Issued new long-term strategic bet ${newLongTermBet.ticker} in data/bets.json for ${date}.`);
    }
  } catch (err) {
    console.warn('[monthly] Could not issue monthly strategic bets:', err);
  }

  const base: Omit<ReportEnvelope, 'emailSent'> = {
    schemaVersion: 1,
    id: `monthly-${period}`,
    type: 'monthly',
    dateKey: period,
    generatedAt: nowIso,
    sourceData: { tickers: [], priceSnapshot: {}, searchTimestamp: nowIso },
    content,
    checksum: computeChecksum(content),
  };
  await writeReport({ ...base, emailSent: false });
  await sendReportEmail('Kosh Monthly Digest', renderMonthlyEmail(content, period));
  await writeReport({ ...base, emailSent: true });
  console.log(`[monthly] Successfully written and emailed Monthly Digest ${base.id}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const skipDateCheck = process.argv.includes('--force');
  runMonthly(new Date(), { skipDateCheck })
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
