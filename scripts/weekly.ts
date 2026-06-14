import { pathToFileURL } from 'node:url';
import { buildRecap } from '../lib/recap';
import { writeReport, computeChecksum } from '../lib/storage';
import { sendReportEmail } from '../lib/email';
import { renderRecapEmail } from '../lib/email-templates';
import { istWeekId, istDateString } from '../lib/time';
import type { ReportEnvelope } from '../lib/schemas';

export async function runWeekly(now: Date = new Date()): Promise<void> {
  const period = istWeekId(now);
  const lookbackPeriod1 = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const content = await buildRecap({
    type: 'weekly',
    period,
    periodLabel: `week ${period} (ending ${istDateString(now)})`,
    lookbackPeriod1,
    now,
  });

  const base: Omit<ReportEnvelope, 'emailSent'> = {
    schemaVersion: 1,
    id: `weekly-${period}`,
    dateKey: period,
    type: 'weekly',
    generatedAt: now.toISOString(),
    sourceData: {
      tickers: content.outlook.stocksToWatch.map((s) => s.ticker),
      priceSnapshot: {},
      searchTimestamp: now.toISOString(),
    },
    content,
    checksum: computeChecksum(content),
  };

  await writeReport({ ...base, emailSent: false });
  await sendReportEmail(`Kosh Weekly — ${period}`, renderRecapEmail(content, `Kosh Weekly Recap — ${period}`));
  await writeReport({ ...base, emailSent: true });
  console.log(`Weekly ${base.id} written and emailed.`);
}

// Auto-run only when executed directly (tsx scripts/weekly.ts), not when imported by tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runWeekly().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
