import { pathToFileURL } from 'node:url';
import { buildRecap } from '../lib/recap';
import { writeReport, computeChecksum } from '../lib/storage';
import { sendReportEmail } from '../lib/email';
import { isFirstOfMonthIST, istParts } from '../lib/time';
import type { ReportEnvelope, RecapContent } from '../lib/schemas';

function prevMonthId(now: Date): string {
  const { year, month } = istParts(now);
  const py = month === 1 ? year - 1 : year;
  const pm = month === 1 ? 12 : month - 1;
  return `${py}-${String(pm).padStart(2, '0')}`;
}

function renderEmailHtml(content: RecapContent, title: string): string {
  const retro = content.retrospective
    ? `<h3>Retrospective (${content.retrospective.hits}/${content.retrospective.total} hit)</h3><p>${content.retrospective.summary}</p>`
    : '';
  const watch = content.outlook.stocksToWatch
    .map((s) => `<li><b>${s.ticker}</b> (${s.signal}) — ${s.reason}</li>`)
    .join('');
  const rec = content.outlook.recommendation;
  return `<h2>${title}</h2>${retro}<h3>Outlook</h3><p>${content.outlook.themes.join('; ')}</p><ul>${watch}</ul>` +
    `<p><b>Call:</b> ${rec.action.toUpperCase()} ${rec.ticker} — ${rec.reasoning}</p>`;
}

export async function runMonthly(now: Date = new Date()): Promise<void> {
  if (!isFirstOfMonthIST(now)) {
    console.log('Not the 1st of the month in IST; skipping monthly recap.');
    return;
  }
  const period = prevMonthId(now);
  const lookbackPeriod1 = new Date(now.getTime() - 33 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const content = await buildRecap({
    type: 'monthly',
    period,
    periodLabel: `month ${period}`,
    lookbackPeriod1,
    now,
  });

  const base: Omit<ReportEnvelope, 'emailSent'> = {
    schemaVersion: 1,
    id: `${period}-monthly`,
    type: 'monthly',
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
  await sendReportEmail(`Kosh Monthly — ${period}`, renderEmailHtml(content, `Kosh Monthly Recap — ${period}`));
  await writeReport({ ...base, emailSent: true });
  console.log(`Monthly ${base.id} written and emailed.`);
}

// Auto-run only when executed directly (tsx scripts/monthly.ts), not when imported by tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMonthly().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
