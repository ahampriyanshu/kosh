import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import {
  renderDailyEmail,
  renderRetroEmail,
  renderWeeklyEmail,
  renderMonthlyEmail,
  renderRecapEmail,
  renderResearchEmail,
  escapeHtml,
} from '../lib/email-templates';
import { sendReportEmail } from '../lib/email';
import { ResearchReportContentSchema } from '../lib/schemas';
import type {
  DailyContent,
  RetroContent,
  WeeklyContent,
  MonthlyContent,
  RecapContent,
} from '../lib/schemas';

const editions = [
  'daily',
  'retro',
  'weekly',
  'monthly',
  'recap',
  'research',
] as const;
type Edition = (typeof editions)[number];

async function latestReport(type: Edition): Promise<string | null> {
  const root = path.join(process.cwd(), 'data', 'reports');
  const years = (await fs.readdir(root))
    .filter((name) => /^\d{4}$/.test(name))
    .sort()
    .reverse();
  for (const year of years) {
    const months = (await fs.readdir(path.join(root, year)))
      .filter((name) => /^\d{2}$/.test(name))
      .sort()
      .reverse();
    for (const month of months) {
      const folder = path.join(root, year, month, type);
      let files: string[];
      try {
        files = await fs.readdir(folder);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
        throw error;
      }
      const candidates = await Promise.all(
        files
          .filter((name) => name.endsWith('.json'))
          .map(async (name) => ({
            name,
            generatedAt: JSON.parse(
              await fs.readFile(path.join(folder, name), 'utf8'),
            ).generatedAt as string,
          })),
      );
      const latest = candidates.sort((a, b) =>
        b.generatedAt.localeCompare(a.generatedAt),
      )[0];
      if (latest) return path.join(folder, latest.name);
    }
  }
  return null;
}

async function main() {
  const shouldSend = process.argv.includes('--send');
  const output = path.join(process.cwd(), 'preview');
  await fs.mkdir(output, { recursive: true });
  const previews: { type: Edition; html: string }[] = [];
  for (const type of editions) {
    const filename = await latestReport(type);
    const source =
      filename ?? (type === 'retro' ? await latestReport('daily') : null);
    if (!source) {
      console.log(`Skipping ${type}: no report available.`);
      continue;
    }
    const report = JSON.parse(await fs.readFile(source, 'utf8'));
    const content =
      !filename && type === 'retro' ? report.content.retro : report.content;
    if (!content) {
      console.log(`Skipping ${type}: no report available.`);
      continue;
    }
    const html =
      type === 'daily'
        ? renderDailyEmail(content as DailyContent)
        : type === 'retro'
          ? renderRetroEmail(content as RetroContent)
          : type === 'weekly'
            ? renderWeeklyEmail(content as WeeklyContent, report.dateKey)
            : type === 'monthly'
              ? renderMonthlyEmail(content as MonthlyContent, report.dateKey)
              : type === 'recap'
                ? renderRecapEmail(content as RecapContent, 'Weekly Recap')
                : renderResearchEmail(
                    ResearchReportContentSchema.parse(content).items[0],
                  );
    await fs.writeFile(path.join(output, `${type}.html`), html);
    previews.push({ type, html });
    console.log(
      `${type}: ${path.relative(process.cwd(), source)} → preview/${type}.html`,
    );
  }
  const gallery = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kosh email previews</title>
  <style>*{box-sizing:border-box}body{margin:0;background:#e8e8e8;font:14px Arial,sans-serif;color:#222}header{position:sticky;top:0;background:white;padding:16px 24px;display:flex;flex-wrap:wrap;align-items:center;gap:18px;border-bottom:1px solid #ccc;z-index:1}h1{font:600 20px Georgia,serif;margin:0}nav{display:flex;gap:16px;flex-wrap:wrap}a{color:#065568}label{margin-left:auto;display:flex;gap:8px;align-items:center}select{font:inherit;padding:6px}iframe{display:block;border:0;width:680px;max-width:100%;height:calc(100vh - 72px);margin:0 auto;background:#fff}p{margin:0;color:#666;font-size:12px}</style>
  <header><h1>Kosh editions</h1><nav aria-label="Email editions">${previews.map(({ type }) => `<a href="${type}.html" target="email">${escapeHtml(type)}</a>`).join('')}</nav><label>Preview width <select id="width"><option value="680">Desktop · 680px</option><option value="375">Mobile · 375px</option><option value="320">Small mobile · 320px</option></select></label><p>Local preview. No emails sent.</p></header>
  <iframe name="email" title="Email preview" src="${previews[0]?.type ?? 'daily'}.html"></iframe><script>document.getElementById('width').addEventListener('change',function(){document.querySelector('iframe').style.width=this.value+'px'})</script></html>`;
  const index = path.join(output, 'index.html');
  await fs.writeFile(index, gallery);
  console.log(`Gallery: ${index}`);
  if (shouldSend) {
    for (const { type, html } of previews)
      await sendReportEmail(`[PREVIEW] Kosh ${type}`, html);
  }
  if (!process.argv.includes('--no-open') && process.platform === 'darwin')
    execFile('open', [index]);
}

main().catch((error) => {
  console.error('Email preview failed:', error);
  process.exitCode = 1;
});
