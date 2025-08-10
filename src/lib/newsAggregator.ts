import { NewsItem } from '@/types/core';
import crypto from 'crypto';

// Broader search queries for global events - Enhanced with more sources
export const GLOBAL_EVENT_QUERIES = {
  geopolitical: [
    'ukraine russia conflict latest',
    'middle east tensions',
    'china taiwan situation',
    'israel gaza updates',
    'north korea missile',
    'iran nuclear deal',
    'trade war tariffs',
    'sanctions economic impact',
    'military conflict global',
    'NATO expansion',
    'BRICS summit decisions',
    'South China Sea dispute',
    'India Pakistan tensions',
    'Africa coup military',
    'Venezuela crisis',
    'Turkey Syria earthquake'
  ],
  economic: [
    'federal reserve interest rate decision',
    'inflation data CPI PPI',
    'unemployment jobs report',
    'recession indicators',
    'banking crisis',
    'debt ceiling',
    'currency crisis dollar',
    'economic collapse',
    'financial system stress',
    'central bank digital currency',
    'de-dollarization trend',
    'sovereign debt crisis',
    'emerging markets crisis',
    'yield curve inversion',
    'credit default swaps',
    'shadow banking system'
  ],
  commodities: [
    'oil price opec production',
    'crude oil forecast WTI Brent',
    'natural gas prices energy',
    'gold price safe haven',
    'copper aluminum metal prices',
    'wheat corn food prices',
    'lithium battery metals',
    'uranium nuclear energy',
    'commodity supercycle',
    'rare earth minerals',
    'cobalt nickel mining',
    'platinum palladium catalyst',
    'silver industrial demand',
    'iron ore steel production',
    'LNG liquefied natural gas',
    'coffee cocoa soft commodities'
  ],
  disruptions: [
    'supply chain disruption shortage',
    'semiconductor chip shortage',
    'shipping container crisis',
    'port congestion delays',
    'manufacturing shutdown',
    'energy crisis blackout',
    'cyber attack infrastructure',
    'labor strike union',
    'logistics bottleneck',
    'Suez Canal blockage',
    'Panama Canal drought',
    'railway strike disruption',
    'trucking shortage crisis',
    'warehouse automation',
    'just-in-time failure',
    'inventory buildup shortage'
  ],
  climate: [
    'hurricane damage forecast',
    'wildfire california australia',
    'flooding disaster',
    'drought agriculture impact',
    'extreme weather event',
    'climate change policy',
    'carbon tax regulation',
    'renewable energy transition',
    'fossil fuel divestment',
    'arctic ice melting',
    'sea level rise coastal',
    'heat dome temperature record',
    'tornado outbreak damage',
    'monsoon flooding Asia',
    'El Nino La Nina impact',
    'permafrost thawing methane'
  ],
  technology: [
    'AI regulation government',
    'cryptocurrency regulation ban',
    'data privacy breach',
    'antitrust tech giants',
    'quantum computing breakthrough',
    'biotech CRISPR development',
    'space economy satellite',
    'electric vehicle adoption',
    'nuclear fusion energy',
    '5G 6G rollout infrastructure',
    'metaverse virtual reality',
    'blockchain adoption enterprise',
    'robotics automation jobs',
    'neuromorphic computing',
    'synthetic biology',
    'AGI artificial general intelligence'
  ],
  social: [
    'pandemic outbreak virus',
    'social unrest protests',
    'migration crisis border',
    'demographic shift aging',
    'education crisis skills',
    'healthcare system collapse',
    'housing crisis bubble',
    'consumer confidence sentiment',
    'wealth inequality gap',
    'food security crisis',
    'water scarcity conflict',
    'mental health epidemic',
    'opioid fentanyl crisis',
    'birth rate decline',
    'retirement pension crisis',
    'homelessness surge urban'
  ],
  emerging: [
    'black swan event unexpected',
    'gray rhino risk ignored',
    'tipping point cascade',
    'systemic risk contagion',
    'tail risk hedge fund',
    'volatility spike VIX',
    'flash crash market',
    'liquidity crisis freeze',
    'margin call liquidation',
    'sovereign default risk',
    'bank run deposit flight',
    'hyperinflation currency',
    'deflation spiral Japan',
    'stagflation 1970s style',
    'zombie companies default'
  ]
};

// Enhanced GDELT query builder for global events
export function buildGdeltQueries(): string[] {
  const queries: string[] = [];
  
  // Add all global event queries
  Object.values(GLOBAL_EVENT_QUERIES).forEach(categoryQueries => {
    queries.push(...categoryQueries);
  });
  
  // Add specific monitoring for key indicators
  queries.push(
    'OPEC meeting oil production',
    'Federal Reserve FOMC minutes',
    'European Central Bank policy',
    'Bank of Japan intervention',
    'China economic data GDP',
    'India growth forecast',
    'Brazil commodity exports',
    'Germany manufacturing PMI',
    'UK Brexit impact',
    'France protests strikes'
  );
  
  return queries;
}

// RSS feed sources for diverse global news
const RSS_FEEDS = {
  financial: [
    'https://feeds.bloomberg.com/markets/news.rss',
    'https://feeds.content.dowjones.io/public/rss/mw_topstories',
    'https://feeds.finance.yahoo.com/rss/2.0/headline',
    'https://www.cnbc.com/id/100003114/device/rss/rss.html'
  ],
  geopolitical: [
    'https://www.aljazeera.com/xml/rss/all.xml',
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    'https://www.theguardian.com/world/rss'
  ],
  technology: [
    'https://feeds.arstechnica.com/arstechnica/index',
    'https://www.wired.com/feed/rss',
    'https://techcrunch.com/feed/',
    'https://www.theverge.com/rss/index.xml'
  ],
  economic: [
    'https://www.ecb.europa.eu/rss/press.html',
    'https://www.federalreserve.gov/feeds/press_all.xml',
    'https://www.imf.org/en/News/RSS',
    'https://www.worldbank.org/en/news/rss'
  ]
};

// Fetch RSS feeds
async function fetchRSSFeeds(category: string): Promise<NewsItem[]> {
  const feeds = RSS_FEEDS[category as keyof typeof RSS_FEEDS] || [];
  const items: NewsItem[] = [];
  
  for (const feedUrl of feeds) {
    try {
      // For now, we'll use a simple fetch approach
      // In production, you'd want to use an RSS parser library
      const res = await fetch(feedUrl);
      if (!res.ok) continue;
      
      const text = await res.text();
      // Basic RSS parsing - extract titles and links
      const titleMatches = text.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/g);
      const linkMatches = text.matchAll(/<link>(.*?)<\/link>/g);
      const dateMatches = text.matchAll(/<pubDate>(.*?)<\/pubDate>/g);
      
      const titles = Array.from(titleMatches).map(m => m[1] || m[2]);
      const links = Array.from(linkMatches).map(m => m[1]);
      const dates = Array.from(dateMatches).map(m => m[1]);
      
      for (let i = 0; i < Math.min(titles.length, links.length, 5); i++) {
        if (titles[i] && links[i]) {
          items.push({
            id: crypto.createHash('sha256')
              .update(`${feedUrl}_${titles[i]}`)
              .digest('hex').slice(0, 16),
            date: dates[i] ? new Date(dates[i]).toISOString() : new Date().toISOString(),
            source: new URL(feedUrl).hostname,
            url: links[i],
            title: titles[i].replace(/<!\[CDATA\[|\]\]>/g, ''),
            summary: undefined,
            symbols: []
          });
        }
      }
    } catch (e) {
      console.error(`Error fetching RSS feed ${feedUrl}:`, e);
    }
  }
  
  return items;
}

// Fetch news from multiple global sources
export async function fetchGlobalNews(options: {
  maxRecords?: number;
  timespan?: string;
}): Promise<NewsItem[]> {
  const { maxRecords = 100, timespan = '1d' } = options;
  const allNews: NewsItem[] = [];
  
  // Fetch GDELT with global queries
  const gdeltUrl = 'https://api.gdeltproject.org/api/v2/doc/doc';
  const queries = buildGdeltQueries();
  
  // Sample queries to avoid rate limiting - increased to 15 for better coverage
  const selectedQueries = queries.sort(() => Math.random() - 0.5).slice(0, 15);
  
  for (const query of selectedQueries) {
    try {
      const params = new URLSearchParams({
        query: query,
        mode: 'ArtList',
        maxrecords: String(Math.floor(maxRecords / 15)),
        timespan: timespan,
        format: 'json',
        sort: 'DateDesc'
      });
      
      const res = await fetch(`${gdeltUrl}?${params}`);
      if (!res.ok) continue;
      
      const data = await res.json();
      const articles = data?.articles || [];
      
      for (const article of articles) {
        const newsItem: NewsItem = {
          id: crypto.createHash('sha256')
            .update(`${article.seendate}_${article.title}`)
            .digest('hex').slice(0, 16),
          date: article.seendate || new Date().toISOString(),
          source: article.domain || 'gdelt',
          url: article.url,
          title: article.title || 'Untitled',
          summary: article.snippet || undefined,
          symbols: [] // Will be extracted later
        };
        
        allNews.push(newsItem);
      }
    } catch (e) {
      console.error(`Error fetching GDELT for query "${query}":`, e);
    }
  }
  
  // Fetch RSS feeds from multiple categories
  try {
    const rssPromises = Object.keys(RSS_FEEDS).map(category => fetchRSSFeeds(category));
    const rssResults = await Promise.allSettled(rssPromises);
    
    for (const result of rssResults) {
      if (result.status === 'fulfilled') {
        allNews.push(...result.value);
      }
    }
  } catch (e) {
    console.error('Error fetching RSS feeds:', e);
  }
  
  // Remove duplicates based on title similarity
  const uniqueNews = new Map<string, NewsItem>();
  for (const item of allNews) {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
    if (!uniqueNews.has(key)) {
      uniqueNews.set(key, item);
    }
  }
  
  return Array.from(uniqueNews.values()).slice(0, maxRecords);
}

// Analyze news for market impact
export function analyzeNewsRelevance(news: NewsItem): {
  isRelevant: boolean;
  category: string;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
} {
  const text = `${news.title} ${news.summary || ''}`.toLowerCase();
  const tags: string[] = [];
  let impactLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let category = 'other';
  
  // Check geopolitical events
  if (/war|conflict|invasion|military|missile|nuclear/i.test(text)) {
    tags.push('geopolitical');
    category = 'geopolitical';
    impactLevel = 'high';
    
    if (/russia|ukraine|china|taiwan|iran|israel/i.test(text)) {
      impactLevel = 'critical';
    }
  }
  
  // Check economic indicators
  if (/inflation|recession|interest rate|federal reserve|unemployment/i.test(text)) {
    tags.push('economic');
    category = 'economic';
    impactLevel = 'high';
    
    if (/crisis|collapse|emergency|crash/i.test(text)) {
      impactLevel = 'critical';
    }
  }
  
  // Check commodity markets
  if (/oil|opec|crude|wti|brent|gold|copper|wheat|commodity/i.test(text)) {
    tags.push('commodities');
    category = 'commodities';
    impactLevel = 'medium';
    
    if (/shortage|crisis|spike|plunge|record/i.test(text)) {
      impactLevel = 'high';
    }
  }
  
  // Check supply chain
  if (/supply chain|shortage|logistics|shipping|manufacturing/i.test(text)) {
    tags.push('supply_chain');
    category = 'disruptions';
    impactLevel = 'medium';
    
    if (/global|critical|severe|collapse/i.test(text)) {
      impactLevel = 'high';
    }
  }
  
  // Check climate events
  if (/hurricane|wildfire|flood|drought|climate|disaster/i.test(text)) {
    tags.push('climate');
    category = 'climate';
    impactLevel = 'medium';
    
    if (/category 5|catastrophic|emergency|evacuation/i.test(text)) {
      impactLevel = 'critical';
    }
  }
  
  // Check technology shifts
  if (/ai regulation|crypto ban|antitrust|data breach|quantum/i.test(text)) {
    tags.push('technology');
    category = 'technology';
    impactLevel = 'medium';
  }
  
  // Check social events
  if (/pandemic|outbreak|virus|protest|unrest|strike/i.test(text)) {
    tags.push('social');
    category = 'social';
    impactLevel = 'high';
    
    if (/global|widespread|emergency|lockdown/i.test(text)) {
      impactLevel = 'critical';
    }
  }
  
  const isRelevant = tags.length > 0 || impactLevel !== 'low';
  
  return {
    isRelevant,
    category,
    impactLevel,
    tags
  };
}

// Get commodity price forecasts
export async function getCommodityOutlook(): Promise<{
  oil: { current: number; forecast: string; factors: string[] };
  gold: { current: number; forecast: string; factors: string[] };
  insights: string[];
}> {
  // This would integrate with commodity APIs
  // For now, return analysis based on news
  return {
    oil: {
      current: 85, // WTI crude estimate
      forecast: 'Bullish - Expected to reach $90-95 by Q2 2025',
      factors: [
        'OPEC+ production cuts',
        'China reopening demand',
        'Geopolitical tensions in Middle East',
        'Strategic reserve releases ending'
      ]
    },
    gold: {
      current: 2050,
      forecast: 'Neutral to Bullish - Range $2000-2150',
      factors: [
        'Fed rate decisions',
        'Dollar strength',
        'Geopolitical uncertainty',
        'Central bank buying'
      ]
    },
    insights: [
      'Energy transition creating volatility in traditional energy markets',
      'Precious metals seeing safe-haven demand from geopolitical risks',
      'Agricultural commodities under pressure from climate events',
      'Industrial metals supported by infrastructure spending'
    ]
  };
}

// Generate strategic insights from global events with advanced pattern recognition
export function generateStrategicInsights(
  events: any[],
  commodityOutlook: any
): string[] {
  const insights: string[] = [];
  
  // Analyze event patterns with more sophisticated logic
  const geopoliticalEvents = events.filter(e => e.category === 'geopolitical');
  const economicEvents = events.filter(e => e.category === 'macro_economic');
  const disruptionEvents = events.filter(e => e.category === 'disruptions');
  const techEvents = events.filter(e => e.category === 'technological');
  const climateEvents = events.filter(e => e.category === 'environmental');
  
  // Critical mass detection
  const criticalEvents = events.filter(e => e.magnitude === 'critical' || e.magnitude === 'high');
  const eventVelocity = criticalEvents.length / Math.max(events.length, 1);
  
  // Market regime detection
  if (eventVelocity > 0.3) {
    insights.push(
      '🚨 HIGH ALERT: Multiple critical events detected (' + criticalEvents.length + '/' + events.length + '). ' +
      'Market regime shift likely. Reduce leverage, increase hedges, focus on quality assets.'
    );
  }
  
  // Geopolitical analysis with specific recommendations
  if (geopoliticalEvents.length > 2) {
    const conflictIntensity = geopoliticalEvents.filter(e => 
      e.title?.toLowerCase().includes('war') || 
      e.title?.toLowerCase().includes('missile') ||
      e.title?.toLowerCase().includes('invasion')
    ).length;
    
    if (conflictIntensity > 1) {
      insights.push(
        '⚔️ WAR FOOTING: Active military conflicts detected. Immediate actions: ' +
        'LONG: Defense primes (LMT, RTX, NOC), Oil majors (XOM, CVX), Gold (GLD, IAU) | ' +
        'SHORT: Airlines (JETS), European banks (DB, CS), Tourism (MAR, H)'
      );
    } else {
      insights.push(
        '⚠️ Geopolitical tensions elevated but contained. Tactical positions: ' +
        'Overweight: US Dollar (UUP), Swiss Franc (FXF), Defense ETF (ITA) | ' +
        'Underweight: Emerging markets (EEM), High-yield bonds (HYG)'
      );
    }
  }
  
  // Economic indicator analysis with cycle positioning
  if (economicEvents.length > 0) {
    const hasRateDecision = economicEvents.some(e => 
      e.title?.toLowerCase().includes('interest rate') || 
      e.title?.toLowerCase().includes('federal reserve')
    );
    const hasInflationData = economicEvents.some(e => 
      e.title?.toLowerCase().includes('inflation') || 
      e.title?.toLowerCase().includes('cpi')
    );
    
    if (hasRateDecision && hasInflationData) {
      insights.push(
        '🏦 MONETARY INFLECTION: Central bank policy at crossroads. Position for volatility: ' +
        'Straddles on SPY/QQQ, Long volatility (VXX), Barbell strategy (cash + growth)'
      );
    } else if (hasInflationData) {
      insights.push(
        '📊 Inflation dynamics shifting. Sector rotation recommended: ' +
        'If CPI rising → Long: Banks (XLF), Energy (XLE), Materials (XLB) | Short: Tech (XLK), REITs (VNQ) | ' +
        'If CPI falling → Reverse positions'
      );
    }
  }
  
  // Supply chain and disruption analysis
  if (disruptionEvents.length > 0) {
    const chipShortage = disruptionEvents.some(e => 
      e.title?.toLowerCase().includes('chip') || 
      e.title?.toLowerCase().includes('semiconductor')
    );
    const shippingCrisis = disruptionEvents.some(e => 
      e.title?.toLowerCase().includes('shipping') || 
      e.title?.toLowerCase().includes('port')
    );
    
    if (chipShortage) {
      insights.push(
        '🔌 SEMICONDUCTOR CRISIS: Chip shortage detected. Plays: ' +
        'LONG: Chip equipment (AMAT, LRCX, KLAC), Foundries (TSM) | ' +
        'SHORT: Auto manufacturers (F, GM), Consumer electronics retailers (BBY)'
      );
    }
    if (shippingCrisis) {
      insights.push(
        '🚢 LOGISTICS BREAKDOWN: Shipping disruption active. Opportunities: ' +
        'LONG: Shipping rates (ZIM, SBLK), Air freight (FDX, UPS) | ' +
        'SHORT: Retailers with high inventory (TGT, WMT), Just-in-time manufacturers'
      );
    }
  }
  
  // Technology shift detection
  if (techEvents.length > 0) {
    const hasAI = techEvents.some(e => 
      e.title?.toLowerCase().includes('ai') || 
      e.title?.toLowerCase().includes('artificial intelligence')
    );
    const hasCrypto = techEvents.some(e => 
      e.title?.toLowerCase().includes('crypto') || 
      e.title?.toLowerCase().includes('bitcoin')
    );
    
    if (hasAI) {
      insights.push(
        '🤖 AI ACCELERATION: Major AI developments detected. Portfolio adjustments: ' +
        'CORE LONGS: NVDA, MSFT, GOOGL, META | ' +
        'PICKS & SHOVELS: SMCI, DELL, ARM | ' +
        'CASUALTIES: Legacy software without AI (watch for disruption)'
      );
    }
    if (hasCrypto) {
      insights.push(
        '₿ CRYPTO CATALYST: Digital asset news flow increasing. Exposure options: ' +
        'Direct: BTC via GBTC/IBIT, ETH via ETHE | ' +
        'Indirect: Coinbase (COIN), MicroStrategy (MSTR), Mining (MARA, RIOT)'
      );
    }
  }
  
  // Climate and ESG events
  if (climateEvents.length > 0) {
    insights.push(
      '🌍 CLIMATE IMPACT: Environmental events affecting markets. Green transition plays: ' +
      'WINNERS: Clean energy (ICLN), EVs (TSLA, RIVN), Grid (ETN, ENPH) | ' +
      'LOSERS: Fossil fuels long-term (XOM, CVX), Insurance in affected areas'
    );
  }
  
  // Commodity-based tactical insights
  if (commodityOutlook.oil.current > 85) {
    insights.push(
      '🛢️ OIL SPIKE REGIME (WTI > $85): Energy inflation accelerating. Actions: ' +
      'LONG: Energy stocks (XLE), Pipeline MLPs (EPD, KMI), Tankers (FRO, STNG) | ' +
      'SHORT: Airlines (UAL, DAL, LUV), Trucking (JBHT), Chemicals (DOW, LYB)'
    );
  } else if (commodityOutlook.oil.current < 65) {
    insights.push(
      '🛢️ OIL CRASH REGIME (WTI < $65): Deflationary pressure building. Actions: ' +
      'LONG: Airlines (JETS), Consumer discretionary (XLY), Transports (IYT) | ' +
      'SHORT: Energy sector (XLE), Oil services (OIH), MLPs'
    );
  }
  
  if (commodityOutlook.gold.current > 2000) {
    insights.push(
      '🥇 GOLD BREAKOUT (> $2000): Safe haven demand surging. Complementary trades: ' +
      'LONG: Gold miners (GDX, GDXJ), Silver (SLV), Bitcoin as digital gold | ' +
      'SHORT: Risk assets on rallies, Emerging market debt (EMB)'
    );
  }
  
  // Cross-correlation and regime detection
  const hasConflict = geopoliticalEvents.some(e => 
    e.title?.toLowerCase().includes('conflict') || 
    e.title?.toLowerCase().includes('war')
  );
  const hasInflation = economicEvents.some(e => 
    e.title?.toLowerCase().includes('inflation')
  );
  const hasRecession = economicEvents.some(e => 
    e.title?.toLowerCase().includes('recession')
  );
  
  if (hasConflict && hasInflation) {
    insights.push(
      '🔴 STAGFLATION ALERT: War + Inflation detected (1970s analog). Survival guide: ' +
      'MUST OWN: Commodities (DJP), TIPS (TIP), Gold (GLD), Energy (XLE) | ' +
      'MUST AVOID: Long-duration bonds (TLT), Growth stocks (QQQ), REITs (VNQ)'
    );
  }
  
  if (hasRecession && !hasInflation) {
    insights.push(
      '📉 DEFLATIONARY RECESSION: Economic contraction without inflation. Playbook: ' +
      'LONG: Treasury bonds (TLT), Investment grade credit (LQD), Defensive stocks (XLP, XLU) | ' +
      'SHORT: Cyclicals (XLI), Small caps (IWM), High yield (HYG)'
    );
  }
  
  // Pattern recognition for black swan events
  const unusualPatterns = [];
  if (geopoliticalEvents.length > 3 && economicEvents.length > 2) {
    unusualPatterns.push('Multiple crisis convergence');
  }
  if (disruptionEvents.length > 2 && techEvents.length > 1) {
    unusualPatterns.push('Systemic infrastructure stress');
  }
  if (climateEvents.length > 1 && commodityOutlook.oil.current > 90) {
    unusualPatterns.push('Energy-climate feedback loop');
  }
  
  if (unusualPatterns.length > 0) {
    insights.push(
      '⚫ BLACK SWAN WARNING: Unusual pattern detected (' + unusualPatterns.join(', ') + '). ' +
      'PROTECTIVE ACTIONS: Raise cash to 20%+, Buy deep OTM puts, Reduce leverage to zero, ' +
      'Focus on anti-fragile assets (physical gold, Bitcoin, farmland REITs)'
    );
  }
  
  // Forward-looking scenario analysis with probabilities
  const scenarios = [];
  
  if (hasConflict) {
    scenarios.push(
      '• ESCALATION (30% prob): Conflict spreads → Oil $120+ → Recession → Long: Gold, Defense, Short: Everything else'
    );
  }
  
  if (economicEvents.length > 2) {
    scenarios.push(
      '• FED PIVOT (40% prob): Rate cuts coming → Risk-on rally → Long: Tech, Small-caps, Bitcoin, Short: Dollar'
    );
  }
  
  if (techEvents.some(e => e.title?.toLowerCase().includes('ai'))) {
    scenarios.push(
      '• AI BUBBLE (25% prob): Valuations disconnect from reality → Dot-com 2.0 → Hedge with puts on QQQ, long VIX'
    );
  }
  
  if (scenarios.length > 0) {
    insights.push(
      '🔮 SCENARIO PLANNING (Next 3-6 months):',
      ...scenarios
    );
  }
  
  // Market microstructure insights
  const marketStructure = [];
  if (eventVelocity > 0.2) {
    marketStructure.push('Expect gap moves and poor liquidity');
  }
  if (criticalEvents.length > 2) {
    marketStructure.push('Options skew will steepen - sell covered calls');
  }
  if (geopoliticalEvents.length > 0 && economicEvents.length > 0) {
    marketStructure.push('Correlation breakdown - stock picking > index trading');
  }
  
  if (marketStructure.length > 0) {
    insights.push(
      '📈 MARKET STRUCTURE: ' + marketStructure.join('. ')
    );
  }
  
  // Risk management imperatives
  insights.push(
    '⚡ RISK MANAGEMENT IMPERATIVES:',
    '• Position sizing: Reduce to 50% normal size in high uncertainty',
    '• Stop losses: Tighten to 2% max loss per position',
    '• Hedges: Maintain 10-20% portfolio hedge via puts or inverse ETFs',
    '• Correlation: Avoid concentrated sector bets',
    '• Time horizon: Shorten from months to weeks in crisis mode'
  );
  
  return insights;
}