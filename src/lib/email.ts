import { ServerClient } from 'postmark';

export function getEmailClient() {
  const token = process.env.EMAIL_PROVIDER_API_KEY;
  if (!token) throw new Error('Missing EMAIL_PROVIDER_API_KEY');
  return new ServerClient(token);
}

export async function sendEmail(opts: {
  to: string; // single or comma-separated multiple
  subject: string;
  htmlBody: string;
  from?: string;
}) {
  const client = getEmailClient();
  const envFrom = process.env.EMAIL_FROM;
  const from = opts.from || envFrom;
  if (!from) {
    throw new Error('Missing EMAIL_FROM: set a verified sender address in .env.local');
  }
  try {
    await client.sendEmail({
      From: from,
      To: opts.to,
      Subject: opts.subject,
      HtmlBody: opts.htmlBody,
      MessageStream: 'outbound',
    });
  } catch (e: any) {
    // Provide clearer error back to caller
    const msg = e?.message || String(e);
    throw new Error(`Postmark send failed: ${msg}`);
  }
}
