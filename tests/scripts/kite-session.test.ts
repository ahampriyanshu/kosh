import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  createKiteLoginUrl: vi.fn(),
  exchangeKiteRequestToken: vi.fn(),
  execFileSync: vi.fn(),
}));

vi.mock('../../lib/kite', () => ({
  createKiteLoginUrl: h.createKiteLoginUrl,
  exchangeKiteRequestToken: h.exchangeKiteRequestToken,
}));

vi.mock('node:child_process', () => ({
  execFileSync: h.execFileSync,
}));

import { refreshKiteAccessToken } from '../../scripts/kite-session';

beforeEach(() => {
  Object.values(h).forEach((mock) => mock.mockReset());
  h.createKiteLoginUrl.mockReturnValue('https://kite.zerodha.com/connect/login?v=3&api_key=kite-key');
  h.exchangeKiteRequestToken.mockResolvedValue({ accessToken: 'new-access-token' });
  h.execFileSync.mockReturnValue(Buffer.from(''));
});

describe('refreshKiteAccessToken', () => {
  it('exchanges request_token and updates the GitHub Actions secret', async () => {
    const result = await refreshKiteAccessToken({
      requestToken: 'request-token',
      apiSecret: 'kite-secret',
    });

    expect(h.exchangeKiteRequestToken).toHaveBeenCalledWith('request-token', 'kite-secret');
    expect(h.execFileSync).toHaveBeenCalledWith(
      'gh',
      ['secret', 'set', 'KITE_ACCESS_TOKEN'],
      { input: 'new-access-token', stdio: ['pipe', 'inherit', 'inherit'] },
    );
    expect(result.loginUrl).toBe('https://kite.zerodha.com/connect/login?v=3&api_key=kite-key');
  });
});
