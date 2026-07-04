import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Attachment } from 'resend';

export const EMAIL_LOGO_CONTENT_ID = 'kosh-logo';

const EMAIL_LOGO_PATH = path.join(process.cwd(), 'public', 'apple-touch-icon.png');
let cachedLogo: Buffer | null = null;

export function emailLogoAttachment(): Attachment {
  cachedLogo ??= readFileSync(EMAIL_LOGO_PATH);
  return {
    content: cachedLogo,
    filename: 'kosh-logo.png',
    contentType: 'image/png',
    inlineContentId: EMAIL_LOGO_CONTENT_ID,
  };
}
