import { NewsItem } from '@/types/core';

const GDELT_DOC_API = 'https://api.gdeltproject.org/api/v2/doc/doc';

export async function fetchGdeltDocs(params: { query?: string; timespan?: string; maxRecords?: number }): Promise<NewsItem[]> {
  const query = params.query || 'economy OR inflation OR interest rates OR war OR earthquake OR pandemic OR AI OR semiconductor OR housing OR supply chain';
  const timespan = params.timespan || '1d';
  const maxRecords = params.maxRecords || 25;
  const search = new URLSearchParams({
    format: 'json',
    sort: 'DateDesc',
    maxrecords: String(maxRecords),
    timespan,
    query,
  });
  const url = `${GDELT_DOC_API}?${search.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`GDELT docs error: ${res.status}`);
  let json: any;
  try {
    json = await res.json();
  } catch (e: any) {
    const text = await res.text().catch(() => '');
    throw new Error(`GDELT parse failed: ${String(e?.message || e)} ${text?.slice(0, 80)}`.trim());
  }
  const arts: any[] = json?.articles || [];
  const items: NewsItem[] = arts.map((a) => {
    const dateMs = a.seendate ? Date.parse(a.seendate) : Date.now();
    const d = new Date(dateMs);
    const date = d.toISOString().slice(0, 10);
    const title: string = a.title || a.sourceCommonName || 'Untitled';
    const source: string = a.sourceCommonName || 'gdelt';
    const url: string | undefined = a.url;
    return {
      id: url || `${date}_${title.slice(0, 24)}`,
      date,
      source,
      url,
      title,
      summary: a.lang || undefined,
      symbols: [],
    } as NewsItem;
  });
  return items;
}
