import { NextRequest, NextResponse } from 'next/server';
import { fetchNews } from '@/lib/alphaVantage';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tickersParam = searchParams.get('tickers') || 'AAPL,MSFT,GOOGL';
    const limit = Number(searchParams.get('limit') || '5');
    const tickers = tickersParam.split(',').map((s) => s.trim()).filter(Boolean);
    const items = await fetchNews({ tickers, limit });
    return NextResponse.json({ ok: true, count: items.length, sample: items.slice(0, 3) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

