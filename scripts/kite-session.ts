import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { pathToFileURL } from 'node:url';
import { createKiteLoginUrl, exchangeKiteRequestToken } from '../lib/kite';

interface RefreshOptions {
  apiKey: string;
  requestToken: string;
  apiSecret: string;
}

function setGitHubSecret(name: string, value: string): void {
  execFileSync('gh', ['secret', 'set', name], { input: value, stdio: ['pipe', 'inherit', 'inherit'] });
}

function serializeEnvValue(value: string): string {
  return /^[A-Za-z0-9_./:@-]+$/.test(value) ? value : JSON.stringify(value);
}

function upsertEnvValues(source: string, values: Record<string, string>): string {
  const pending = new Set(Object.keys(values));
  const lines = source ? source.split(/\r?\n/) : [];
  if (lines.at(-1) === '') lines.pop();

  const updated = lines.map((line) => {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=/.exec(line);
    const name = match?.[1];
    if (!name || !(name in values)) return line;
    pending.delete(name);
    return `${name}=${serializeEnvValue(values[name])}`;
  });

  for (const name of pending) {
    updated.push(`${name}=${serializeEnvValue(values[name])}`);
  }

  return `${updated.join('\n')}\n`;
}

function updateLocalEnvFile(values: Record<string, string>, envPath = path.join(process.cwd(), '.env')): void {
  const existing = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
  writeFileSync(envPath, upsertEnvValues(existing, values));
}

export async function refreshKiteAccessToken(options: RefreshOptions): Promise<{ loginUrl: string }> {
  const session = await exchangeKiteRequestToken(options.requestToken, options.apiSecret, options.apiKey);
  setGitHubSecret('KITE_API_KEY', options.apiKey);
  setGitHubSecret('KITE_ACCESS_TOKEN', session.accessToken);
  updateLocalEnvFile({
    KITE_API_KEY: options.apiKey,
    KITE_ACCESS_TOKEN: session.accessToken,
  });
  return { loginUrl: createKiteLoginUrl(options.apiKey) };
}

async function runCli(): Promise<void> {
  const rl = createInterface({ input, output });
  try {
    const apiKey = (process.env.KITE_API_KEY || (await rl.question('Paste KITE_API_KEY: '))).trim();
    if (!apiKey) throw new Error('KITE_API_KEY is required.');
    const loginUrl = createKiteLoginUrl(apiKey);
    console.log(`\nOpen this URL and complete Kite login:\n${loginUrl}\n`);

    const requestToken = (await rl.question('Paste request_token: ')).trim();
    const apiSecret = (await rl.question('Paste KITE_API_SECRET: ')).trim();
    if (!requestToken) throw new Error('request_token is required.');
    if (!apiSecret) throw new Error('KITE_API_SECRET is required.');
    await refreshKiteAccessToken({ apiKey, requestToken, apiSecret });
    console.log('Updated local .env and GitHub secrets KITE_API_KEY and KITE_ACCESS_TOKEN.');
  } finally {
    rl.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
