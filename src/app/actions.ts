"use server";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

type ActionState = { ok: boolean; message?: string; error?: string };

export async function runIngest(_prev: ActionState | null): Promise<ActionState> {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) throw new Error('CRON_SECRET not set');
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/cron/ingest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-cron-secret': secret },
      body: JSON.stringify({}),
    });
    const json = await res.json().catch(() => ({} as any));
    if (!res.ok || json?.ok === false) throw new Error(`Ingest failed: ${json?.error || `HTTP ${res.status}`}`);
    const sourceMsg = json?.sources ? ` [gdelt:${json.sources.gdelt ?? 0} rss:${json.sources.rss ?? 0}]` : '';
    const warnMsg = json?.warnings && json.warnings.length ? ` | warnings: ${json.warnings.join(' | ').slice(0, 160)}` : '';
    const msg = json?.news != null ? `Ingest completed (${json.news} news${json.from ? `, ${json.from}→${json.to || ''}` : ''})${sourceMsg}${warnMsg}` : 'Ingest completed';
    return { ok: true, message: msg };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function runEnrich(_prev: ActionState | null): Promise<ActionState> {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) throw new Error('CRON_SECRET not set');
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/cron/enrich`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-cron-secret': secret },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error(`Enrich failed: ${res.status}`);
    return { ok: true, message: 'Enrich completed' };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function runSignals(_prev: ActionState | null): Promise<ActionState> {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) throw new Error('CRON_SECRET not set');
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/cron/signals`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-cron-secret': secret },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error(`Signals failed: ${res.status}`);
    return { ok: true, message: 'Signals generated' };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function runEmail(_prev: ActionState | null): Promise<ActionState> {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) throw new Error('CRON_SECRET not set');
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/cron/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-cron-secret': secret },
      body: JSON.stringify({}),
    });
    const json = await res.json().catch(() => ({} as any));
    if (!res.ok || json?.ok === false) {
      const reason = json?.error || `HTTP ${res.status}`;
      throw new Error(`Email failed: ${reason}`);
    }
    const recipients = Array.isArray(json?.recipients) ? json.recipients.length : undefined;
    const countMsg = recipients ? ` to ${recipients} recipient${recipients > 1 ? 's' : ''}` : '';
    return { ok: true, message: `Email sent${countMsg}` };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function runBacktest(_prev: ActionState | null): Promise<ActionState> {
  try {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/backtest/run`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ windows: [20, 60], limit: 1000 }),
    });
    if (!res.ok) throw new Error(`Backtest failed: ${res.status}`);
    return { ok: true, message: 'Backtest completed' };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function runBackfill(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) throw new Error('CRON_SECRET not set');
    const base = getBaseUrl();
    const daysBackStr = String(formData.get('daysBack') || '').trim();
    const tickersStr = String(formData.get('tickers') || '').trim();
    const daysBack = Number(daysBackStr || 90);
    const body: any = { daysBack };
    if (tickersStr) body.tickers = tickersStr; // API accepts comma-separated
    const res = await fetch(`${base}/api/cron/ingest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-cron-secret': secret },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({} as any));
    if (!res.ok || json?.ok === false) throw new Error(`Backfill failed: ${json?.error || `HTTP ${res.status}`}`);
    const msg = `Backfilled ${json.news ?? '?'} news for ${json.tickers ?? '?'} tickers${json.from ? ` (${json.from}→${json.to || ''})` : ''}`;
    return { ok: true, message: msg };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
