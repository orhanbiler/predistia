import { IncidentType, NewsItem, EventCategory } from '@/types/core';

// Enhanced rule-based classification for broader event types
const rules: { match: RegExp; type: IncidentType; category: EventCategory }[] = [
  // Company-specific events
  { match: /layoff|job cut|workforce reduction|downsizing/i, type: 'layoffs', category: 'company_specific' },
  { match: /lawsuit|sues|sued|settlement|litigation/i, type: 'lawsuit', category: 'company_specific' },
  { match: /sec|doj|ftc|regulat|fine|penalt|antitrust/i, type: 'regulatory', category: 'company_specific' },
  { match: /recall|product defect|safety issue/i, type: 'product_recall', category: 'company_specific' },
  { match: /guidance (cut|lower|reduce|down|slash)/i, type: 'guidance_cut', category: 'company_specific' },
  { match: /guidance (raise|increase|up|boost)/i, type: 'guidance_raise', category: 'company_specific' },
  { match: /beats? (expectations|estimates|earnings|revenue|eps)/i, type: 'earnings_beat', category: 'company_specific' },
  { match: /miss(es|ed)? (expectations|estimates|earnings|revenue|eps)/i, type: 'earnings_miss', category: 'company_specific' },
  { match: /acquire|acquisition|merger|m&a|buyout|takeover|deal/i, type: 'mna', category: 'company_specific' },
  { match: /appoints|steps down|resigns|ceo|cfo|executive|departure/i, type: 'exec_change', category: 'company_specific' },
  { match: /downgrade|cut rating|reduce target/i, type: 'downgrade', category: 'company_specific' },
  { match: /upgrade|raise rating|increase target/i, type: 'upgrade', category: 'company_specific' },
  { match: /breach|hack|cyber|ransomware|data leak/i, type: 'security_breach', category: 'company_specific' },
  
  // Macro/Environmental events
  { match: /pandemic|covid|virus|outbreak|epidemic|quarantine|lockdown/i, type: 'pandemic', category: 'environmental' },
  { match: /earthquake|hurricane|tornado|wildfire|flood|tsunami|disaster/i, type: 'climate_event', category: 'environmental' },
  { match: /climate change|global warming|carbon|emissions|renewable/i, type: 'climate_event', category: 'environmental' },
  
  // Economic indicators
  { match: /inflation|cpi|ppi|consumer price|producer price/i, type: 'economic_indicator', category: 'macro_economic' },
  { match: /rate hike|interest rate|federal reserve|fed|fomc|monetary policy/i, type: 'economic_indicator', category: 'macro_economic' },
  { match: /gdp|recession|economic growth|unemployment|jobs report/i, type: 'economic_indicator', category: 'macro_economic' },
  { match: /dollar|currency|forex|exchange rate/i, type: 'economic_indicator', category: 'macro_economic' },
  
  // Technology shifts
  { match: /artificial intelligence|ai boom|machine learning|chatgpt|generative ai/i, type: 'technology_shift', category: 'technological' },
  { match: /blockchain|crypto|bitcoin|ethereum|defi|web3/i, type: 'technology_shift', category: 'technological' },
  { match: /metaverse|virtual reality|vr|augmented reality|ar/i, type: 'technology_shift', category: 'technological' },
  { match: /quantum computing|5g|6g|edge computing/i, type: 'technology_shift', category: 'technological' },
  
  // Geopolitical events
  { match: /war|conflict|invasion|military|sanctions|embargo/i, type: 'geopolitical', category: 'geopolitical' },
  { match: /trade war|tariff|trade deal|export ban|import restriction/i, type: 'geopolitical', category: 'geopolitical' },
  { match: /election|political|government|policy change|legislation/i, type: 'geopolitical', category: 'geopolitical' },
  
  // Supply chain events
  { match: /supply chain|shortage|logistics|shipping|port|container/i, type: 'supply_chain', category: 'sector_wide' },
  { match: /chip shortage|semiconductor supply|component shortage/i, type: 'supply_chain', category: 'sector_wide' },
  
  // Commodity shifts
  { match: /oil price|crude|wti|brent|energy price/i, type: 'commodity_shift', category: 'macro_economic' },
  { match: /gold|silver|copper|metal price|commodity/i, type: 'commodity_shift', category: 'macro_economic' },
  { match: /wheat|corn|agriculture|food price/i, type: 'commodity_shift', category: 'macro_economic' },
  
  // Consumer trends
  { match: /consumer spending|retail sales|e-commerce growth|online shopping/i, type: 'consumer_trend', category: 'social' },
  { match: /work from home|remote work|hybrid work|return to office/i, type: 'consumer_trend', category: 'social' },
  { match: /sustainable|esg|green|eco-friendly|ethical/i, type: 'consumer_trend', category: 'social' },
  
  // Regulation changes
  { match: /new regulation|regulatory change|compliance|law change|bill passed/i, type: 'regulation_change', category: 'geopolitical' },
  { match: /tax reform|tax change|subsidy|incentive/i, type: 'regulation_change', category: 'geopolitical' },
];

export async function classifyIncident(news: NewsItem): Promise<{ 
  type: IncidentType; 
  category: EventCategory;
  score: number;
  magnitude?: 'low' | 'medium' | 'high' | 'critical';
} | null> {
  const text = `${news.title} ${news.summary || ''}`;
  
  // Check all rules and pick the best match
  const matches: Array<{ rule: typeof rules[0]; score: number }> = [];
  
  for (const r of rules) {
    const match = text.match(r.match);
    if (match) {
      // Score based on match quality and position
      const score = match[0].length / text.length + (match.index === 0 ? 0.1 : 0);
      matches.push({ rule: r, score });
    }
  }
  
  if (matches.length > 0) {
    // Sort by score and pick the best match
    matches.sort((a, b) => b.score - a.score);
    const bestMatch = matches[0].rule;
    
    // Determine magnitude based on keywords
    let magnitude: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (/massive|major|significant|crisis|crash|surge|plunge/i.test(text)) {
      magnitude = 'high';
    } else if (/critical|emergency|catastrophic|collapse/i.test(text)) {
      magnitude = 'critical';
    } else if (/minor|small|slight|modest/i.test(text)) {
      magnitude = 'low';
    }
    
    return { 
      type: bestMatch.type, 
      category: bestMatch.category,
      score: Math.min(0.6 + matches[0].score, 0.9),
      magnitude
    };
  }
  
  // Enhanced LLM classification if API key present
  if (process.env.LLM_PROVIDER_API_KEY) {
    return await classifyWithLLM(news);
  }
  
  return { 
    type: 'other', 
    category: 'company_specific',
    score: 0.3,
    magnitude: 'low'
  };
}

async function classifyWithLLM(news: NewsItem): Promise<{
  type: IncidentType;
  category: EventCategory;
  score: number;
  magnitude?: 'low' | 'medium' | 'high' | 'critical';
} | null> {
  const key = process.env.LLM_PROVIDER_API_KEY;
  const model = 'models/gemini-2.5-flash-lite';
  
  const prompt = `Classify this news into one of these event types and categories:

Event Types: layoffs, lawsuit, regulatory, product_recall, guidance_cut, guidance_raise, earnings_beat, earnings_miss, mna, exec_change, downgrade, upgrade, security_breach, pandemic, supply_chain, geopolitical, climate_event, technology_shift, regulation_change, economic_indicator, commodity_shift, consumer_trend, other

Categories: company_specific, sector_wide, macro_economic, geopolitical, technological, environmental, social

Also assess magnitude: low, medium, high, critical

News: ${news.title} ${news.summary || ''}

Return JSON only: { "type": "", "category": "", "magnitude": "", "confidence": 0.0 }`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${encodeURIComponent(key!)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 128 }
        })
      }
    );
    
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    
    const json: any = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (text) {
      try {
        const parsed = JSON.parse(text);
        return {
          type: parsed.type || 'other',
          category: parsed.category || 'company_specific',
          score: parsed.confidence || 0.5,
          magnitude: parsed.magnitude || 'medium'
        };
      } catch (e) {
        // JSON parse failed, fall back to rules
      }
    }
  } catch (e) {
    // LLM failed, fall back to rules
  }
  
  return { 
    type: 'other', 
    category: 'company_specific',
    score: 0.3,
    magnitude: 'low'
  };
}

export async function summarizeNewsItems(news: NewsItem[]): Promise<string | null> {
  if (!news.length) return null;
  const key = process.env.LLM_PROVIDER_API_KEY;
  const model = 'models/gemini-2.5-flash-lite';
  const prompt = `Summarize the following market news into 3-7 concise bullets suitable for an investor daily email. Focus on company-specific events (earnings, guidance, legal/regulatory, M&A, product recalls, exec changes) and noteworthy macro. Prefer specificity even if headlines are short.

Return plain text bullets. Avoid speculation.

News:
${news
  .map((n, i) => `${i + 1}. ${n.date} ${n.source}${n.symbols?.length ? ` [${n.symbols.join(',')}]` : ''} — ${n.title}${n.summary ? ` — ${n.summary}` : ''}`)
  .join('\n')}`;

  if (!key) {
    // Simple fallback: return top N headlines
    const top = news.slice(0, 5).map((n) => `• ${n.title}`).join('\n');
    return `Headlines:\n${top}`;
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${encodeURIComponent(key!)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 512,
          },
        }),
      }
    );
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const json: any = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text || text.length < 30 || /I need more information/i.test(text)) {
      const top = news.slice(0, 7).map((n) => `• ${n.title}`).join('\n');
      return `Headlines:\n${top}`;
    }
    return text;
  } catch (e) {
    // On failure, degrade gracefully to headlines
    const top = news.slice(0, 5).map((n) => `• ${n.title}`).join('\n');
    return `Headlines:\n${top}`;
  }
}
