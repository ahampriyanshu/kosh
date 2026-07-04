import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { pathToFileURL } from 'node:url';
import { createKiteLoginUrl, exchangeKiteRequestToken } from '../lib/kite';

interface RefreshOptions {
  requestToken: string;
  apiSecret: string;
}

function setGitHubSecret(name: string, value: string): void {
  execFileSync('gh', ['secret', 'set', name], { input: value, stdio: ['pipe', 'inherit', 'inherit'] });
}

export async function refreshKiteAccessToken(options: RefreshOptions): Promise<{ loginUrl: string }> {
  const session = await exchangeKiteRequestToken(options.requestToken, options.apiSecret);
  setGitHubSecret('KITE_ACCESS_TOKEN', session.accessToken);
  return { loginUrl: createKiteLoginUrl() };
}

async function runCli(): Promise<void> {
  const loginUrl = createKiteLoginUrl();
  console.log(`Open this URL and complete Kite login:\n${loginUrl}\n`);

  const rl = createInterface({ input, output });
  try {
    const requestToken = (await rl.question('Paste request_token: ')).trim();
    const apiSecret = (await rl.question('Paste KITE_API_SECRET: ')).trim();
    if (!requestToken) throw new Error('request_token is required.');
    if (!apiSecret) throw new Error('KITE_API_SECRET is required.');
    await refreshKiteAccessToken({ requestToken, apiSecret });
    console.log('Updated GitHub secret KITE_ACCESS_TOKEN.');
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
