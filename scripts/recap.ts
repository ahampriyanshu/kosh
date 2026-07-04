import { pathToFileURL } from 'node:url';
import { formatPeriodLabel, istDateString } from '../lib/time';
import { readManifest, readReport, writeReport, computeChecksum } from '../lib/storage';
import { getHistorical } from '../lib/market-data';
import { gradeBet } from '../lib/grade';
import { appendLedgerEntry } from '../lib/ledger';
import { sendReportEmail } from '../lib/email';
import { renderRecapEmail } from '../lib/email-templates';
import { RecapContentSchema, type Bet, type GradedBet, type LedgerEntry, type ReportEnvelope, type WeeklyContent } from '../lib/schemas';

export async function runRecap(now: Date = new Date()): Promise<void> {
  const date = istDateString(now);
  const manifest = await readManifest();
  const weeklyId = manifest.latest.weekly;
  if (!weeklyId) {
    console.log('recap: no prior weekly report to grade; skipping.');
    return;
  }
  const weekly = await readReport(weeklyId);
  const content = weekly.content as WeeklyContent;
  const bets: Bet[] = content.positionalBets ?? [];
  const entryDate = weekly.generatedAt.slice(0, 10);

  const graded: GradedBet[] = [];
  for (const bet of bets) {
    let entryRef = 0;
    let exitRef = 0;
    let note = '';
    try {
      const candles = await getHistorical(bet.ticker, entryDate);
      if (candles.length) {
        entryRef = candles[0].close;
        exitRef = candles[candles.length - 1].close;
      } else {
        note = 'no price data for the period';
      }
    } catch {
      note = 'price data unavailable';
    }
    const { changePct, outcome } = gradeBet(bet, entryRef, exitRef);
    graded.push({
      ticker: bet.ticker, name: bet.name, thesis: bet.thesis, action: bet.action,
      entryRef, exitRef, changePct, outcome,
      note: note || `${bet.action} call moved ${changePct >= 0 ? '+' : ''}${changePct}%`,
    });
  }

  const hits = graded.filter((g) => g.outcome === 'hit').length;
  const total = graded.length;
  const periodLabel = formatPeriodLabel(weekly.dateKey);
  const recapContent = RecapContentSchema.parse({
    period: weekly.dateKey,
    sourceReportId: weekly.id,
    graded,
    hits,
    total,
    summary: total ? `${hits}/${total} positional bets hit over ${periodLabel}.` : 'No bets to grade for the prior week.',
  });

  const month = date.slice(0, 7); // YYYY-MM
  const ledgerEntry: LedgerEntry = { gradedOn: date, sourceReportId: weekly.id, bets: graded, hits, total };

  const base: Omit<ReportEnvelope, 'emailSent'> = {
    schemaVersion: 1, id: `recap-${date}`, type: 'recap', dateKey: date,
    generatedAt: now.toISOString(),
    sourceData: { tickers: bets.map((b) => b.ticker), priceSnapshot: {}, searchTimestamp: now.toISOString() },
    content: recapContent, checksum: computeChecksum(recapContent),
  };
  await writeReport({ ...base, emailSent: false });
  await appendLedgerEntry(month, ledgerEntry);
  await sendReportEmail('Kosh Weekly Recap', renderRecapEmail(recapContent, 'Weekly Recap'));
  await writeReport({ ...base, emailSent: true });
  console.log(`Recap ${base.id} written and emailed (${hits}/${total} hit).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runRecap().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
