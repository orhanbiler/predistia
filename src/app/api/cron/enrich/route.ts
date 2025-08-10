import { NextRequest, NextResponse } from 'next/server';
import { verifyCron } from '@/lib/cron';
import { getDb } from '@/lib/firebaseAdmin';
import { classifyIncident } from '@/lib/llm';
import { extractSymbolsFromText } from '@/lib/symbols';
import { MarketEvent } from '@/types/core';
import { analyzeEventImpact } from '@/lib/eventCorrelation';
import { getSectorsBySymbol } from '@/lib/sectors';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    verifyCron(req);
    const db = getDb();
    const { limit = 100 } = await req.json().catch(() => ({}));

    // Fetch recent news not yet classified
    const snap = await db.collection('news').orderBy('date', 'desc').limit(limit).get();
    const batch = db.batch();
    let enriched = 0;
    let eventCount = 0;
    
    for (const doc of snap.docs) {
      const data = doc.data() as any;
      const incRef = db.collection('incidents').doc(doc.id);
      const incDoc = await incRef.get();
      if (incDoc.exists) continue; // idempotent
      
      const symbols = data.symbols || extractSymbolsFromText(`${data.title} ${data.summary || ''}`);
      const result = await classifyIncident({
        id: doc.id,
        date: data.date,
        source: data.source,
        url: data.url,
        title: data.title,
        summary: data.summary,
        symbols,
      });
      
      if (!result) continue;
      
      // Store traditional incident
      batch.set(incRef, {
        id: doc.id,
        date: data.date,
        symbols: symbols || [],
        type: result.type,
        score: result.score,
      });
      
      // Create and store market event if classification is strong
      if (result.score > 0.6) {
        const event: MarketEvent = {
          id: `event_${doc.id}`,
          date: data.date,
          type: result.type,
          category: result.category,
          title: data.title,
          description: data.summary,
          impactedSectors: symbols ? 
            Array.from(new Set(symbols.flatMap((s: string) => getSectorsBySymbol(s)))) : [],
          impactedSymbols: symbols || [],
          magnitude: result.magnitude || 'medium',
          timeHorizon: determineTimeHorizon(result.type, result.category)
        };
        
        // Analyze broader impact
        const impact = analyzeEventImpact(event);
        event.impactedSectors = Array.from(new Set([
          ...event.impactedSectors,
          ...impact.correlatedSectors
        ]));
        
        const eventRef = db.collection('market_events').doc(event.id);
        batch.set(eventRef, event, { merge: true });
        eventCount++;
      }
      
      enriched += 1;
    }
    
    await batch.commit();
    return NextResponse.json({ 
      ok: true, 
      enriched,
      marketEvents: eventCount 
    });
  } catch (e: any) {
    const status = e?.status || 500;
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status });
  }
}

function determineTimeHorizon(
  type: string,
  category: string
): 'immediate' | 'short_term' | 'long_term' {
  const immediateTypes = [
    'earnings_miss', 'earnings_beat', 'guidance_cut', 'guidance_raise',
    'downgrade', 'upgrade', 'security_breach', 'product_recall'
  ];
  
  const longTermTypes = [
    'technology_shift', 'climate_event', 'regulation_change',
    'consumer_trend'
  ];
  
  if (immediateTypes.includes(type)) return 'immediate';
  if (longTermTypes.includes(type)) return 'long_term';
  
  return 'short_term';
}
