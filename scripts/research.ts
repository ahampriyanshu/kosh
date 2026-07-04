import { pathToFileURL } from 'node:url';
import { researchRequests } from '../data/research-requests';
import { buildResearch } from '../lib/research';
import { readManifest, writeReport, computeChecksum } from '../lib/storage';
import { sendReportEmail } from '../lib/email';
import { renderResearchEmail } from '../lib/email-templates';
import { istDateString } from '../lib/time';
import type { ReportEnvelope } from '../lib/schemas';

function slug(ticker: string): string {
  return ticker.replace(/[^A-Za-z0-9]/g, '-');
}

export async function runResearch(now: Date = new Date()): Promise<void> {
  const date = istDateString(now);
  const manifest = await readManifest();
  const existing = new Set(manifest.reports.map((r) => r.id));

  let done = 0;
  let failed = 0;
  for (const req of researchRequests) {
    const dateKey = `${slug(req.ticker)}-${date}`;
    const id = `research-${dateKey}`;
    if (existing.has(id)) {
      console.log(`Skipping ${req.ticker} — already researched today (${id}).`);
      continue;
    }
    try {
      const content = await buildResearch(req.ticker, now);
      const base: Omit<ReportEnvelope, 'emailSent'> = {
        schemaVersion: 1,
        id,
        dateKey,
        type: 'research',
        generatedAt: now.toISOString(),
        sourceData: {
          tickers: [content.ticker],
          priceSnapshot: { [content.ticker]: content.price },
          searchTimestamp: now.toISOString(),
        },
        content,
        checksum: computeChecksum(content),
      };
      await writeReport({ ...base, emailSent: false });
      await sendReportEmail(`Kosh Research — ${req.ticker}`, renderResearchEmail(content));
      await writeReport({ ...base, emailSent: true });
      done++;
      console.log(`Researched ${req.ticker} → ${id}.`);
    } catch (e) {
      failed++;
      console.error(`Failed to research ${req.ticker}:`, e);
    }
  }
  console.log(`Research run complete: ${done} new, ${failed} failed.`);
  if (failed > 0) throw new Error(`${failed} research ticker(s) failed`);
}

// Auto-run only when executed directly (tsx scripts/research.ts), not when imported by tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runResearch()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
