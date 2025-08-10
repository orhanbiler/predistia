import { NextRequest, NextResponse } from 'next/server';
import { verifyCron } from '@/lib/cron';
import { getDb } from '@/lib/firebaseAdmin';
import { fetchEODDailyAdjusted } from '@/lib/alphaVantage';
import { fetchGdeltDocs } from '@/lib/gdelt';
import { fetchGoogleNewsRss } from '@/lib/rss';
import { fetchGlobalNews, analyzeNewsRelevance } from '@/lib/newsAggregator';
import crypto from 'crypto';

export const runtime = 'nodejs';

const DEFAULT_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'];

export async function POST(req: NextRequest) {
  try {
    verifyCron(req);
    const db = getDb();

    const {
      tickers: rawTickers = DEFAULT_TICKERS,
      limit = 50,
      from,
      to,
      daysBack,
    }: { tickers?: string[] | string; limit?: number; from?: string; to?: string; daysBack?: number } = await req.json().catch(() => ({}));

    const tickers = Array.isArray(rawTickers)
      ? rawTickers
      : typeof rawTickers === 'string'
      ? rawTickers.split(',').map((s) => s.trim()).filter(Boolean)
      : DEFAULT_TICKERS;

    let fromStr = from;
    let toStr = to;
    if (daysBack && daysBack > 0 && !fromStr) {
      const now = new Date();
      const start = new Date(now);
      start.setUTCDate(now.getUTCDate() - daysBack);
      fromStr = start.toISOString().slice(0, 10);
      toStr = toStr || now.toISOString().slice(0, 10);
    }

    // Ingest news from multiple sources
    let gdelt: any[] = [];
    let rss: any[] = [];
    let globalNews: any[] = [];
    const warnings: string[] = [];
    
    // Fetch traditional stock news
    try {
      gdelt = await fetchGdeltDocs({ maxRecords: Math.floor(limit / 2), timespan: daysBack ? `${Math.max(daysBack, 1)}d` : '1d' });
    } catch (e: any) {
      warnings.push(`GDELT: ${e?.message || String(e)}`);
    }
    
    try {
      const queries = tickers.map((t: string) => `${t} stock`) as string[];
      rss = await fetchGoogleNewsRss({ queries, limit: Math.min(10, limit) });
    } catch (e: any) {
      warnings.push(`RSS: ${e?.message || String(e)}`);
    }
    
    // Fetch global event news
    try {
      globalNews = await fetchGlobalNews({ 
        maxRecords: Math.floor(limit / 2), 
        timespan: daysBack ? `${Math.max(daysBack, 1)}d` : '1d' 
      });
      
      // Filter for relevant global events
      globalNews = globalNews.filter(news => {
        const analysis = analyzeNewsRelevance(news);
        return analysis.isRelevant && analysis.impactLevel !== 'low';
      });
    } catch (e: any) {
      warnings.push(`GlobalNews: ${e?.message || String(e)}`);
    }
    
    const mergedNews = [...gdelt, ...rss, ...globalNews];
    if (mergedNews.length) {
      const newsBatch = db.batch();
      for (const n of mergedNews) {
        const baseId: string = n.id || `${n.date || ''}_${(n.title || 'untitled').slice(0, 48)}`;
        const hash = crypto.createHash('sha256').update(String(baseId)).digest('hex').slice(0, 40);
        const safeId = `${(n.date || '0000-00-00')}_${hash}`;
        const ref = db.collection('news').doc(safeId);
        newsBatch.set(ref, { ...n, id: safeId, originalId: baseId }, { merge: true });
      }
      await newsBatch.commit();
    }

    // Ingest EOD for tickers (compact window), but don't fail whole job on AV issues
    const eodWarnings: string[] = [];
    for (const symbol of tickers) {
      try {
        const bars = await fetchEODDailyAdjusted(symbol);
        const batch = db.batch();
        for (const b of bars) {
          const ref = db.collection('eod').doc(symbol).collection('bars').doc(b.date);
          batch.set(ref, b, { merge: true });
        }
        await batch.commit();
      } catch (e: any) {
        eodWarnings.push(`${symbol}: ${e?.message || String(e)}`);
      }
    }

    if (eodWarnings.length) warnings.push(`EOD: ${eodWarnings.join('; ').slice(0, 300)}`);
    return NextResponse.json({ 
      ok: true, 
      news: mergedNews.length, 
      tickers: tickers.length, 
      from: fromStr, 
      to: toStr, 
      sources: { 
        gdelt: gdelt.length, 
        rss: rss.length,
        global: globalNews.length 
      }, 
      warnings 
    });
  } catch (e: any) {
    const status = e?.status || 500;
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status });
  }
}
