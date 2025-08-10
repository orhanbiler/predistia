import { NextRequest, NextResponse } from 'next/server';
import { verifyCron } from '@/lib/cron';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

const CRON_SECRET = process.env.CRON_SECRET || 'dev';

async function runCronJob(endpoint: string, body: any = {}): Promise<any> {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
    
  const res = await fetch(`${baseUrl}/api/cron/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cron-secret': CRON_SECRET
    },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`${endpoint} failed: ${error}`);
  }
  
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    verifyCron(req);
    
    const results: Record<string, any> = {};
    const errors: Record<string, string> = {};
    
    // 1. Ingest news and EOD data with broader coverage
    try {
      results.ingest = await runCronJob('ingest', {
        daysBack: 3,
        tickers: [
          // Tech giants
          'AAPL', 'MSFT', 'GOOGL', 'META', 'AMZN',
          // Semiconductors (AI plays)
          'NVDA', 'AMD', 'INTC', 'TSM', 'AVGO', 'QCOM',
          // Cloud/SaaS
          'CRM', 'NOW', 'SNOW', 'DDOG', 'NET',
          // Defense (geopolitical hedge)
          'LMT', 'RTX', 'BA', 'NOC', 'GD',
          // Energy (oil/gas)
          'XOM', 'CVX', 'COP', 'SLB', 'HAL',
          // Commodities/Materials
          'FCX', 'NEM', 'GOLD', 'CLF', 'X',
          // Banks (rate sensitive)
          'JPM', 'BAC', 'GS', 'MS', 'WFC',
          // EVs & Clean Energy
          'TSLA', 'RIVN', 'NEE', 'ENPH', 'SEDG',
          // Healthcare/Pharma
          'JNJ', 'PFE', 'UNH', 'LLY', 'MRNA',
          // Consumer defensive
          'WMT', 'PG', 'KO', 'PEP', 'COST',
          // REITs (rate sensitive)
          'SPG', 'O', 'AMT', 'PLD',
          // Logistics/Supply Chain
          'FDX', 'UPS', 'UBER', 'DASH'
        ]
      });
    } catch (e: any) {
      errors.ingest = e.message;
    }
    
    // 2. Enrich news with classifications
    try {
      results.enrich = await runCronJob('enrich', { limit: 200 });
    } catch (e: any) {
      errors.enrich = e.message;
    }
    
    // 3. Generate trading signals
    try {
      results.signals = await runCronJob('signals', { limit: 100 });
    } catch (e: any) {
      errors.signals = e.message;
    }
    
    // 4. Analyze opportunities
    try {
      results.opportunities = await runCronJob('opportunities', {
        daysBack: 7,
        minConfidence: 0.65,
        includeIndirect: true
      });
    } catch (e: any) {
      errors.opportunities = e.message;
    }
    
    // 5. Send daily email report (if configured)
    if (process.env.EMAIL_RECIPIENTS) {
      try {
        results.email = await runCronJob('email', {
          windowDays: [20, 60],
          limit: 200
        });
      } catch (e: any) {
        errors.email = e.message;
      }
    }
    
    const summary = {
      timestamp: new Date().toISOString(),
      success: Object.keys(errors).length === 0,
      processed: {
        news: results.ingest?.news || 0,
        incidents: results.enrich?.enriched || 0,
        signals: results.signals?.created || 0,
        opportunities: results.opportunities?.processed?.opportunities || 0,
        emails: results.email?.recipients?.length || 0
      },
      topOpportunities: results.opportunities?.topOpportunities || [],
      errors: Object.keys(errors).length > 0 ? errors : undefined
    };
    
    return NextResponse.json({
      ok: true,
      summary,
      details: results
    });
    
  } catch (e: any) {
    const status = e?.status || 500;
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status }
    );
  }
}