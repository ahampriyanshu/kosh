import { promises as fs } from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { renderDailyEmail, renderRetroEmail } from '../lib/email-templates';
import { sendReportEmail } from '../lib/email';
import type { DailyContent, RetroContent } from '../lib/schemas';

async function findLatestReport(type: 'daily' | 'retro'): Promise<string> {
  const reportsDir = path.join(process.cwd(), 'data', 'reports');
  const years = (await fs.readdir(reportsDir)).filter((f) => /^\d{4}$/.test(f)).sort().reverse();

  for (const year of years) {
    const yearDir = path.join(reportsDir, year);
    const months = (await fs.readdir(yearDir)).filter((f) => /^\d{2}$/.test(f)).sort().reverse();
    for (const month of months) {
      const targetDir = path.join(yearDir, month, type);
      try {
        const files = (await fs.readdir(targetDir))
          .filter((f) => f.startsWith(`${type}-`) && f.endsWith('.json'))
          .sort()
          .reverse();
        if (files.length > 0) {
          return path.join(targetDir, files[0]);
        }
      } catch {
        // directory may not exist
      }
    }
  }
  throw new Error(`No ${type} report found in data/reports`);
}

async function main() {
  const shouldSend = process.argv.includes('--send');
  const shouldOpen = !process.argv.includes('--no-open');

  console.log('Finding latest reports...');
  const latestDailyPath = await findLatestReport('daily');
  const latestRetroPath = await findLatestReport('retro');

  console.log(`Latest Daily: ${path.relative(process.cwd(), latestDailyPath)}`);
  console.log(`Latest Retro: ${path.relative(process.cwd(), latestRetroPath)}`);

  const dailyRaw = JSON.parse(await fs.readFile(latestDailyPath, 'utf8'));
  const retroRaw = JSON.parse(await fs.readFile(latestRetroPath, 'utf8'));

  const dailyHtml = renderDailyEmail(dailyRaw.content as DailyContent);
  const retroHtml = renderRetroEmail(retroRaw.content as RetroContent);

  const previewDir = path.join(process.cwd(), 'preview');
  await fs.mkdir(previewDir, { recursive: true });

  const dailyOutPath = path.join(previewDir, 'daily.html');
  const retroOutPath = path.join(previewDir, 'retro.html');

  await fs.writeFile(dailyOutPath, dailyHtml, 'utf8');
  await fs.writeFile(retroOutPath, retroHtml, 'utf8');

  console.log(`\n Generated preview files:`);
  console.log(`  Daily: file://${dailyOutPath}`);
  console.log(`  Retro: file://${retroOutPath}`);

  if (shouldSend) {
    console.log('\nSending test emails to configured EMAIL_TO via Resend...');
    await sendReportEmail('[PREVIEW] Kosh Daily Brief', dailyHtml);
    console.log('  Sent Daily Brief preview email.');
    await sendReportEmail('[PREVIEW] Kosh Daily Retro', retroHtml);
    console.log('  Sent Daily Retro preview email.');
  }

  if (shouldOpen && process.platform === 'darwin') {
    exec(`open "${dailyOutPath}" "${retroOutPath}"`, (err) => {
      if (err) console.warn('Could not auto-open in default browser:', err.message);
      else console.log('\n Opened both email previews in your default browser.');
    });
  }
}

main().catch((err) => {
  console.error('Failed to generate email previews:', err);
  process.exit(1);
});
