import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  createKiteLoginUrl: vi.fn(),
  exchangeKiteRequestToken: vi.fn(),
  execFileSync: vi.fn(),
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock('../../lib/kite', () => ({
  createKiteLoginUrl: h.createKiteLoginUrl,
  exchangeKiteRequestToken: h.exchangeKiteRequestToken,
}));

vi.mock('node:child_process', () => ({
  execFileSync: h.execFileSync,
}));

vi.mock('node:fs', () => ({
  existsSync: h.existsSync,
  readFileSync: h.readFileSync,
  writeFileSync: h.writeFileSync,
}));

import { refreshKiteAccessToken } from '../../scripts/kite-session';

beforeEach(() => {
  Object.values(h).forEach((mock) => mock.mockReset());
  h.createKiteLoginUrl.mockReturnValue('https://kite.zerodha.com/connect/login?v=3&api_key=kite-key');
  h.exchangeKiteRequestToken.mockResolvedValue({ accessToken: 'new-access-token' });
  h.execFileSync.mockReturnValue(Buffer.from(''));
  h.existsSync.mockReturnValue(true);
  h.readFileSync.mockReturnValue('KITE_API_KEY=old-key\nKITE_API_SECRET=keep-secret\n');
});

describe('refreshKiteAccessToken', () => {
  it('exchanges request_token and updates the GitHub Actions secret', async () => {
    const result = await refreshKiteAccessToken({
      apiKey: 'kite-key',
      requestToken: 'request-token',
      apiSecret: 'kite-secret',
    });

    expect(h.exchangeKiteRequestToken).toHaveBeenCalledWith('request-token', 'kite-secret', 'kite-key');
    expect(h.execFileSync).toHaveBeenCalledWith(
      'gh',
      ['secret', 'set', 'KITE_API_KEY'],
      { input: 'kite-key', stdio: ['pipe', 'inherit', 'inherit'] },
    );
    expect(h.execFileSync).toHaveBeenCalledWith(
      'gh',
      ['secret', 'set', 'KITE_ACCESS_TOKEN'],
      { input: 'new-access-token', stdio: ['pipe', 'inherit', 'inherit'] },
    );
    expect(h.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.env'),
      'KITE_API_KEY=kite-key\nKITE_API_SECRET=keep-secret\nKITE_ACCESS_TOKEN=new-access-token\n',
    );
    expect(result.loginUrl).toBe('https://kite.zerodha.com/connect/login?v=3&api_key=kite-key');
  });
});
