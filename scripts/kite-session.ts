import { execFileSync } from 'node:child_process';
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

export async function refreshKiteAccessToken(options: RefreshOptions): Promise<{ loginUrl: string }> {
  const session = await exchangeKiteRequestToken(options.requestToken, options.apiSecret, options.apiKey);
  setGitHubSecret('KITE_API_KEY', options.apiKey);
  setGitHubSecret('KITE_ACCESS_TOKEN', session.accessToken);
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
    console.log('Updated GitHub secrets KITE_API_KEY and KITE_ACCESS_TOKEN.');
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
