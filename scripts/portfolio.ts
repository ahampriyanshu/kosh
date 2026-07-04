import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fetchKiteHoldingsSnapshot } from '../lib/kite';
import { atomicWriteJson } from '../lib/storage';

function dataDir(): string {
  return process.env.KOSH_DATA_DIR || path.join(process.cwd(), 'data');
}

export async function runPortfolioSync(now: Date = new Date()): Promise<void> {
  const portfolio = await fetchKiteHoldingsSnapshot(now);
  await atomicWriteJson(path.join(dataDir(), 'portfolio.json'), portfolio);
  console.log(`Portfolio snapshot written (${portfolio.holdings.length} holdings).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPortfolioSync()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
