import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowDir = join(process.cwd(), '.github', 'workflows');
const crowdedMinutes = new Set([0, 15, 30, 45]);

function scheduledWorkflowFiles(): string[] {
  return readdirSync(workflowDir)
    .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))
    .filter((file) => readFileSync(join(workflowDir, file), 'utf8').includes('schedule:'))
    .sort();
}

function cronEntries(workflow: string): Array<{ cron: string; block: string }> {
  const entries: Array<{ cron: string; block: string }> = [];
  const pattern = /-\s+cron:\s+['"]([^'"]+)['"]([\s\S]*?)(?=\n\s*-\s+cron:|\n\s*workflow_dispatch:|\npermissions:|\njobs:|$)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(workflow))) {
    entries.push({ cron: match[1], block: match[0] });
  }

  return entries;
}

describe('scheduled GitHub Actions workflows', () => {
  it('use timezone-aware IST cron entries instead of UTC conversions', () => {
    for (const file of scheduledWorkflowFiles()) {
      const workflow = readFileSync(join(workflowDir, file), 'utf8');

      for (const entry of cronEntries(workflow)) {
        expect(entry.block, `${file} ${entry.cron}`).toContain('timezone: "Asia/Kolkata"');
      }
    }
  });

  it('avoid crowded quarter-hour trigger minutes', () => {
    for (const file of scheduledWorkflowFiles()) {
      const workflow = readFileSync(join(workflowDir, file), 'utf8');

      for (const entry of cronEntries(workflow)) {
        const minute = Number(entry.cron.split(/\s+/)[0]);

        expect(crowdedMinutes.has(minute), `${file} ${entry.cron}`).toBe(false);
      }
    }
  });
});
