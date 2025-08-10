import { NewsItem, EODBar } from '@/types/core';

const AV_BASE = 'https://www.alphavantage.co/query';

function requireKey(): string {
  const key = process.env.NEWS_ALPHA_VANTAGE_KEY;
  if (!key) throw new Error('Missing NEWS_ALPHA_VANTAGE_KEY');
  return key;
}

export async function fetchNews(params: { tickers?: string[]; from?: string; to?: string; limit?: number; }): Promise<NewsItem[]> {
  const key = requireKey();
  const tickers = params.tickers?.join(',');
  const search = new URLSearchParams({
    function: 'NEWS_SENTIMENT',
    apikey: String(key),
  });
  if (tickers) search.set('tickers', tickers);
  if (params.limit) search.set('limit', String(params.limit));
  // Support optional time range. Alpha Vantage expects YYYYMMDDThhmm format.
  const toParam = params.to ? new Date(params.to) : undefined;
  const fromParam = params.from ? new Date(params.from) : undefined;
  const fmt = (d: Date, end = false) => {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const hm = end ? '2359' : '0000';
    return `${yyyy}${mm}${dd}T${hm}`;
  };
  if (fromParam) search.set('time_from', fmt(fromParam, false));
  if (toParam) search.set('time_to', fmt(toParam, true));

  const url = `${AV_BASE}?${search.toString()}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Alpha Vantage news error: ${res.status}`);
  const json = await res.json();
  if (json?.Note) throw new Error(`Alpha Vantage note: ${json.Note}`);
  if (json?.Information) throw new Error(`Alpha Vantage info: ${json.Information}`);
  if (json?.["Error Message"]) throw new Error(`Alpha Vantage error: ${json["Error Message"]}`);
  const feed: any[] = json?.feed || [];
  const items: NewsItem[] = feed.map((n) => {
    const date = n.time_published?.slice(0, 8) || '';
    const yyyy = date.slice(0, 4);
    const mm = date.slice(4, 6);
    const dd = date.slice(6, 8);
    const isoDate = yyyy && mm && dd ? `${yyyy}-${mm}-${dd}` : new Date().toISOString().slice(0, 10);
    const symbols: string[] = (n.ticker_sentiment || []).map((t: any) => t.ticker).filter(Boolean);
    return {
      id: n.url || `${isoDate}_${n.title?.slice(0, 24)}`,
      date: isoDate,
      source: n.source || 'alpha_vantage',
      url: n.url,
      title: n.title || 'Untitled',
      summary: n.summary || n.overall_sentiment_label,
      symbols,
    } as NewsItem;
  });
  return items;
}

export async function fetchEODDailyAdjusted(symbol: string): Promise<EODBar[]> {
  const key = requireKey();
  const search = new URLSearchParams({
    function: 'TIME_SERIES_DAILY_ADJUSTED',
    symbol,
    apikey: key,
    outputsize: 'compact',
  });
  const url = `${AV_BASE}?${search.toString()}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Alpha Vantage EOD error: ${symbol} ${res.status}`);
  const json = await res.json();
  if (json?.Note) throw new Error(`Alpha Vantage note: ${json.Note}`);
  if (json?.Information) throw new Error(`Alpha Vantage info: ${json.Information}`);
  if (json?.["Error Message"]) throw new Error(`Alpha Vantage error: ${json["Error Message"]}`);
  const series = json['Time Series (Daily)'] || {};
  const bars: EODBar[] = Object.entries(series).map(([date, v]: [string, any]) => ({
    symbol,
    date,
    open: Number(v['1. open']),
    high: Number(v['2. high']),
    low: Number(v['3. low']),
    close: Number(v['4. close']),
    adjClose: Number(v['5. adjusted close']),
    volume: Number(v['6. volume']),
  }));
  bars.sort((a, b) => (a.date < b.date ? -1 : 1));
  return bars;
}
