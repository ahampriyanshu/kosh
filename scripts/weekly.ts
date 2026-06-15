import { pathToFileURL } from 'node:url';
import { istWeekId, istDateString } from '../lib/time';
import { loadWindowSnapshots, aggregateSnapshots } from '../lib/feed/aggregate';
import { buildWeeklyNarrative } from '../lib/reports-narrative';
import { writeReport, computeChecksum } from '../lib/storage';
import { sendReportEmail } from '../lib/email';
import { renderWeeklyEmail } from '../lib/email-templates';
import { WeeklyContentSchema, type ReportEnvelope } from '../lib/schemas';

export async function runWeekly(now: Date = new Date()): Promise<void> {
  const period = istWeekId(now);
  const date = istDateString(now);
  const snapshot = aggregateSnapshots(await loadWindowSnapshots(date, 7), '7d');
  const narrative = await buildWeeklyNarrative(snapshot);
  const content = WeeklyContentSchema.parse({ snapshot, themes: narrative.themes, positionalBets: narrative.positionalBets });

  const base: Omit<ReportEnvelope, 'emailSent'> = {
    schemaVersion: 1, id: `weekly-${period}`, type: 'weekly', dateKey: period,
    generatedAt: now.toISOString(),
    sourceData: { tickers: content.positionalBets.map((b) => b.ticker), priceSnapshot: {}, searchTimestamp: now.toISOString() },
    content, checksum: computeChecksum(content),
  };
  await writeReport({ ...base, emailSent: false });
  await sendReportEmail('Kosh Weekly Outlook', renderWeeklyEmail(content, period));
  await writeReport({ ...base, emailSent: true });
  console.log(`Weekly ${base.id} written and emailed.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runWeekly().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
