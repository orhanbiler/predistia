import { NextRequest, NextResponse } from 'next/server';
import { fetchGdeltDocs } from '@/lib/gdelt';
import { fetchGoogleNewsRss } from '@/lib/rss';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tickers = (searchParams.get('tickers') || 'AAPL,MSFT,GOOGL,AMZN,META')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const gdelt = await fetchGdeltDocs({ timespan: searchParams.get('timespan') || '1d', maxRecords: Number(searchParams.get('limit') || '25') });
    const rss = await fetchGoogleNewsRss({ queries: tickers.map((t) => `${t} stock`), limit: Number(searchParams.get('rssLimit') || '10') });
    return NextResponse.json({ ok: true, counts: { gdelt: gdelt.length, rss: rss.length }, sample: { gdelt: gdelt.slice(0, 2), rss: rss.slice(0, 2) } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

