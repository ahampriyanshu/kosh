import { pathToFileURL } from 'node:url';
import { researchRequests } from '../data/research-requests';
import { buildResearch, resolveResearchTicker } from '../lib/research';
import { readManifest, writeReport, computeChecksum } from '../lib/storage';
import { istDateString } from '../lib/time';
import { ResearchReportContentSchema, type ReportEnvelope, type ResearchContent } from '../lib/schemas';

function slug(ticker: string): string {
  return ticker.replace(/[^A-Za-z0-9]/g, '-');
}

function nextResearchId(existingIds: string[]): string {
  const max = existingIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0)
    .reduce((highest, id) => Math.max(highest, id), 0);
  return String(max + 1);
}

export async function runResearch(now: Date = new Date()): Promise<void> {
  const date = istDateString(now);
  const manifest = await readManifest();
  const id = nextResearchId(manifest.reports.filter((r) => r.type === 'research').map((r) => r.id));

  const items: ResearchContent[] = [];
  let failed = 0;
  for (const query of researchRequests) {
    try {
      const ticker = await resolveResearchTicker(query);
      const content = await buildResearch(query, now, ticker);
      items.push(content);
      console.log(`Researched ${query} (${content.ticker}).`);
    } catch (e) {
      failed++;
      console.error(`Failed to research ${query}:`, e);
    }
  }

  if (items.length > 0) {
    const tickers = items.map((item) => item.ticker);
    const content = ResearchReportContentSchema.parse({ items });
    const base: Omit<ReportEnvelope, 'emailSent'> = {
      schemaVersion: 1,
      id,
      dateKey: id,
      type: 'research',
      generatedAt: now.toISOString(),
      sourceData: {
        tickers,
        priceSnapshot: Object.fromEntries(items.map((item) => [item.ticker, item.price])),
        searchTimestamp: now.toISOString(),
      },
      content,
      checksum: computeChecksum(content),
    };
    await writeReport({ ...base, emailSent: false });
    console.log(`Research report ${id} written for ${tickers.map(slug).join(', ')}.`);
  }

  console.log(`Research run complete: ${items.length} item(s), ${failed} failed.`);
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
