import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fetchKiteHoldingsSnapshot } from '../lib/kite';
import { atomicWriteJson } from '../lib/storage';
import { encryptedPortfolioPath } from '../lib/portfolio';
import { encryptPortfolioEnvelope } from '../lib/portfolio-crypto';

export async function runPortfolioSync(now: Date = new Date()): Promise<void> {
  const portfolio = await fetchKiteHoldingsSnapshot(now);
  const key = process.env.PORTFOLIO_KEY;
  if (!key) throw new Error('Missing PORTFOLIO_KEY for encrypted portfolio sync.');
  const encrypted = await encryptPortfolioEnvelope(portfolio, key);
  const outputPath = encryptedPortfolioPath();
  await mkdir(path.dirname(outputPath), { recursive: true });
  await atomicWriteJson(outputPath, encrypted);
  console.log(`Encrypted portfolio snapshot written (${portfolio.holdings.length} holdings).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPortfolioSync()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
