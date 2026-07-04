import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const h = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({ emails: { send: h.sendMock } })),
}));

import { sendReportEmail } from '../../lib/email';
import { EMAIL_LOGO_CONTENT_ID } from '../../lib/email-assets';

beforeEach(() => {
  h.sendMock.mockReset();
  process.env.RESEND_API_KEY = 'test-key';
  process.env.EMAIL_TO = 'a@x.com, b@x.com';
  process.env.EMAIL_FROM = 'Kosh <k@x.com>';
  delete process.env.EMAIL_REPLY_TO;
});
afterEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_TO;
  delete process.env.EMAIL_FROM;
  delete process.env.EMAIL_REPLY_TO;
});

describe('sendReportEmail', () => {
  it('sends to the parsed recipient list', async () => {
    h.sendMock.mockResolvedValue({ data: { id: '1' }, error: null });
    await sendReportEmail('Subject', '<p>hi</p>');
    expect(h.sendMock).toHaveBeenCalledWith({
      from: 'Kosh <k@x.com>',
      to: ['a@x.com', 'b@x.com'],
      subject: 'Subject',
      html: '<p>hi</p>',
      attachments: [
        {
          content: expect.any(Buffer),
          filename: 'kosh-logo.png',
          contentType: 'image/png',
          inlineContentId: EMAIL_LOGO_CONTENT_ID,
        },
      ],
    });
  });

  it('sets replyTo when configured', async () => {
    process.env.EMAIL_REPLY_TO = 'Kosh <reply@x.com>';
    h.sendMock.mockResolvedValue({ data: { id: '1' }, error: null });

    await sendReportEmail('Subject', '<p>hi</p>');

    expect(h.sendMock).toHaveBeenCalledWith({
      from: 'Kosh <k@x.com>',
      to: ['a@x.com', 'b@x.com'],
      subject: 'Subject',
      html: '<p>hi</p>',
      attachments: [
        {
          content: expect.any(Buffer),
          filename: 'kosh-logo.png',
          contentType: 'image/png',
          inlineContentId: EMAIL_LOGO_CONTENT_ID,
        },
      ],
      replyTo: 'Kosh <reply@x.com>',
    });
  });

  it('throws when Resend returns an error', async () => {
    h.sendMock.mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(sendReportEmail('S', '<p>x</p>')).rejects.toThrow(/boom/);
  });

  it('throws when no recipients are configured', async () => {
    delete process.env.EMAIL_TO;
    await expect(sendReportEmail('S', '<p>x</p>')).rejects.toThrow(/EMAIL_TO/);
  });
});
