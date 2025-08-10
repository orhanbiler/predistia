import { NewsItem } from '@/types/core';

function googleNewsUrl(query: string) {
  const q = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
}

function extractTag(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, 'i');
  const m = block.match(re);
  if (!m) return null;
  // Decode basic HTML entities in titles
  return m[1]
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseRssItems(xml: string) {
  const items: { title: string; link?: string; isoDate?: string; description?: string }[] = [];
  const blocks = xml.split(/<item[\s>]/i).slice(1).map(b => '<item ' + b); // re-add tag
  for (const b of blocks) {
    const title = extractTag(b, 'title') || 'Untitled';
    const link = extractTag(b, 'link') || undefined;
    const pubDate = extractTag(b, 'pubDate') || undefined;
    const desc = extractTag(b, 'description') || undefined;
    items.push({ title, link, isoDate: pubDate ? new Date(pubDate).toISOString() : undefined, description: desc });
  }
  return items;
}

export async function fetchGoogleNewsRss(params: { queries: string[]; limit?: number }): Promise<NewsItem[]> {
  const limit = params.limit || 20;
  const out: NewsItem[] = [];
  for (const q of params.queries) {
    const url = googleNewsUrl(q);
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) continue;
    const xml = await res.text();
    const feedItems = parseRssItemsSafe(xml).slice(0, limit);
    for (const item of feedItems) {
      const date = item.isoDate ? item.isoDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
      const title = item.title || 'Untitled';
      const link = item.link || undefined;
      out.push({
        id: link || `${date}_${title.slice(0, 24)}`,
        date,
        source: 'google_news',
        url: link,
        title,
        summary: item.description || undefined,
        symbols: [],
      });
    }
  }
  return out;
}

// Safer parser that handles CDATA and <content:encoded>
function stripCdata(s: string) {
  return s.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '');
}

function extractTagSafe(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i');
  const m = block.match(re);
  if (!m) return null;
  return stripCdata(m[1])
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseRssItemsSafe(xml: string) {
  const items: { title: string; link?: string; isoDate?: string; description?: string }[] = [];
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  for (const b of blocks) {
    const title = extractTagSafe(b, 'title') || 'Untitled';
    const link = extractTagSafe(b, 'link') || undefined;
    const pubDate = extractTagSafe(b, 'pubDate') || undefined;
    const desc = extractTagSafe(b, 'description') || extractTagSafe(b, 'content:encoded') || undefined;
    items.push({ title, link, isoDate: pubDate ? new Date(pubDate).toISOString() : undefined, description: desc });
  }
  return items;
}
