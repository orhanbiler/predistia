import { NextRequest, NextResponse } from 'next/server';
import { verifyCron } from '@/lib/cron';
import { getDb } from '@/lib/firebaseAdmin';
import { classifyIncident } from '@/lib/llm';
import { 
  generateOpportunities, 
  analyzeEventImpact,
  categorizeEvent 
} from '@/lib/eventCorrelation';
import { 
  MarketEvent, 
  MarketOpportunity, 
  NewsItem 
} from '@/types/core';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    verifyCron(req);
    const db = getDb();
    
    const {
      daysBack = 7,
      minConfidence = 0.6,
      includeIndirect = true
    }: { 
      daysBack?: number; 
      minConfidence?: number;
      includeIndirect?: boolean;
    } = await req.json().catch(() => ({}));
    
    // Get recent news items
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    const cutoffStr = cutoffDate.toISOString();
    
    const newsSnapshot = await db
      .collection('news')
      .where('date', '>=', cutoffStr)
      .orderBy('date', 'desc')
      .limit(500)
      .get();
    
    const newsItems: NewsItem[] = newsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as NewsItem));
    
    // Process news into market events
    const marketEvents: MarketEvent[] = [];
    const eventBatch = db.batch();
    
    for (const news of newsItems) {
      const classification = await classifyIncident(news);
      
      if (classification && classification.score >= minConfidence) {
        const event: MarketEvent = {
          id: `event_${news.id}`,
          date: news.date,
          type: classification.type,
          category: classification.category,
          title: news.title,
          description: news.summary,
          impactedSectors: [],
          impactedSymbols: news.symbols || [],
          magnitude: classification.magnitude || 'medium',
          timeHorizon: determineTimeHorizon(classification.type, classification.category)
        };
        
        // Analyze event impact
        const impact = analyzeEventImpact(event);
        event.impactedSectors = [
          ...impact.directImpact.sectors,
          ...(includeIndirect ? impact.indirectImpact.sectors : [])
        ];
        event.impactedSymbols = [
          ...impact.directImpact.symbols,
          ...(includeIndirect ? impact.indirectImpact.symbols.slice(0, 20) : [])
        ];
        
        marketEvents.push(event);
        
        // Store event
        const eventRef = db.collection('market_events').doc(event.id);
        eventBatch.set(eventRef, event, { merge: true });
      }
    }
    
    await eventBatch.commit();
    
    // Generate opportunities from events
    const opportunities = generateOpportunities(marketEvents);
    
    // Filter by confidence and store
    const qualifiedOpps = opportunities.filter(
      opp => opp.confidence >= minConfidence
    );
    
    const oppBatch = db.batch();
    for (const opp of qualifiedOpps) {
      const oppRef = db.collection('opportunities').doc(opp.id);
      oppBatch.set(oppRef, opp, { merge: true });
    }
    await oppBatch.commit();
    
    // Group opportunities by timeframe for summary
    const immediateOpps = qualifiedOpps.filter(
      o => o.timeframe.horizon === 'days'
    );
    const shortTermOpps = qualifiedOpps.filter(
      o => o.timeframe.horizon === 'weeks'
    );
    const longTermOpps = qualifiedOpps.filter(
      o => o.timeframe.horizon === 'months'
    );
    
    // Get top opportunities
    const topOpportunities = qualifiedOpps
      .sort((a, b) => {
        // Sort by expected return * confidence
        const aScore = (a.expectedReturn?.expected || 0) * a.confidence;
        const bScore = (b.expectedReturn?.expected || 0) * b.confidence;
        return bScore - aScore;
      })
      .slice(0, 10)
      .map(opp => ({
        symbols: opp.symbols.slice(0, 5),
        direction: opp.direction,
        confidence: opp.confidence,
        expectedReturn: opp.expectedReturn?.expected,
        reasoning: opp.reasoning,
        timeframe: opp.timeframe.horizon
      }));
    
    return NextResponse.json({
      ok: true,
      processed: {
        news: newsItems.length,
        events: marketEvents.length,
        opportunities: qualifiedOpps.length
      },
      summary: {
        immediate: immediateOpps.length,
        shortTerm: shortTermOpps.length,
        longTerm: longTermOpps.length
      },
      topOpportunities,
      eventTypes: marketEvents.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });
    
  } catch (e: any) {
    const status = e?.status || 500;
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status }
    );
  }
}

function determineTimeHorizon(
  type: string,
  category: string
): 'immediate' | 'short_term' | 'long_term' {
  // Immediate impact events
  const immediateTypes = [
    'earnings_miss', 'earnings_beat', 'guidance_cut', 'guidance_raise',
    'downgrade', 'upgrade', 'security_breach', 'product_recall'
  ];
  
  // Long-term impact events
  const longTermTypes = [
    'technology_shift', 'climate_event', 'regulation_change',
    'consumer_trend'
  ];
  
  if (immediateTypes.includes(type)) return 'immediate';
  if (longTermTypes.includes(type)) return 'long_term';
  
  // Category-based defaults
  if (category === 'macro_economic' || category === 'geopolitical') {
    return 'short_term';
  }
  
  return 'short_term';
}