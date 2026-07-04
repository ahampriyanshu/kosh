import { pathToFileURL } from 'node:url';
import { isFirstOfMonthIST, istParts, istDateString } from '../lib/time';
import { loadWindowSnapshots, aggregateSnapshots } from '../lib/feed/aggregate';
import { buildMonthlyNarrative } from '../lib/reports-narrative';
import { writeReport, computeChecksum } from '../lib/storage';
import { sendReportEmail } from '../lib/email';
import { renderMonthlyEmail } from '../lib/email-templates';
import { readLedger } from '../lib/ledger';
import { buildLearningLoop } from '../lib/learnings';
import { MonthlyContentSchema, type ReportEnvelope } from '../lib/schemas';

function prevMonthId(now: Date): string {
  const { year, month } = istParts(now);
  const py = month === 1 ? year - 1 : year;
  const pm = month === 1 ? 12 : month - 1;
  return `${py}-${String(pm).padStart(2, '0')}`;
}

export async function runMonthly(now: Date = new Date()): Promise<void> {
  if (!isFirstOfMonthIST(now)) {
    console.log('Not the 1st of the month in IST; skipping monthly report.');
    return;
  }
  const period = prevMonthId(now);
  const date = istDateString(now);
  const snapshot = aggregateSnapshots(await loadWindowSnapshots(date, 30), '1mo');
  const narrative = await buildMonthlyNarrative(snapshot);
  const ledger = await readLedger(period);
  const rollupHits = ledger.entries.reduce((a, e) => a + e.hits, 0);
  const rollupTotal = ledger.entries.reduce((a, e) => a + e.total, 0);
  const rollupBets = ledger.entries.flatMap((entry) => entry.bets);
  const ledgerRollup = ledger.entries.length
    ? {
        hits: rollupHits,
        total: rollupTotal,
        summary: `${rollupHits}/${rollupTotal} graded bets hit across ${ledger.entries.length} weekly recaps in ${period}.`,
        learnings: buildLearningLoop(rollupBets),
      }
    : null;
  const content = MonthlyContentSchema.parse({
    snapshot,
    sectorInsights: narrative.sectorInsights,
    macroThemes: narrative.macroThemes,
    midTermBets: narrative.midTermBets,
    ledgerRollup,
  });

  const base: Omit<ReportEnvelope, 'emailSent'> = {
    schemaVersion: 1, id: `monthly-${period}`, type: 'monthly', dateKey: period,
    generatedAt: now.toISOString(),
    sourceData: { tickers: content.midTermBets.map((b) => b.ticker), priceSnapshot: {}, searchTimestamp: now.toISOString() },
    content, checksum: computeChecksum(content),
  };
  await writeReport({ ...base, emailSent: false });
  await sendReportEmail('Kosh Monthly Digest', renderMonthlyEmail(content, period));
  await writeReport({ ...base, emailSent: true });
  console.log(`Monthly ${base.id} written and emailed.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMonthly().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
