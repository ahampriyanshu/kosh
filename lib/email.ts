import { Resend } from 'resend';

export async function sendReportEmail(subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not set');

  const from = process.env.KOSH_EMAIL_FROM ?? 'Kosh <onboarding@resend.dev>';
  const replyTo = process.env.KOSH_EMAIL_REPLY_TO?.trim();
  const recipients = (process.env.KOSH_EMAIL_TO ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (recipients.length === 0) throw new Error('KOSH_EMAIL_TO not set');

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: recipients,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });
  if (error) throw new Error(`Email failed: ${(error as { message?: string }).message ?? String(error)}`);
}
