import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';
import { summarizeNewsItems } from '@/lib/llm';
import { computeForwardReturnsForSignals, aggregateMetrics, confusionByIncident } from '@/lib/returns';
import { EODBar, Signal, MarketOpportunity, MarketEvent } from '@/types/core';
import { getCommodityOutlook, generateStrategicInsights } from '@/lib/newsAggregator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const windowDays = [20, 60];
    const limit = 200;
    
    // Gather all data for email preview
    const sigSnap = await db.collection('signals').orderBy('date', 'desc').limit(limit).get();
    const signals: Signal[] = sigSnap.docs.map((d) => d.data() as Signal);
    const symbols = Array.from(new Set(signals.map((s) => s.symbol)));
    
    // Get active opportunities
    const now = new Date();
    const activeDate = now.toISOString().slice(0, 10);
    const oppSnap = await db.collection('opportunities')
      .where('status', '==', 'active')
      .orderBy('confidence', 'desc')
      .limit(10)
      .get();
    const opportunities: MarketOpportunity[] = oppSnap.docs
      .map(d => d.data() as MarketOpportunity)
      .filter(opp => opp.timeframe.exit >= activeDate);
    
    // Get recent market events
    const eventSnap = await db.collection('market_events')
      .orderBy('date', 'desc')
      .limit(10)
      .get();
    const marketEvents: MarketEvent[] = eventSnap.docs.map(d => d.data() as MarketEvent);
    
    // Get commodity outlook and strategic insights
    const commodityOutlook = await getCommodityOutlook();
    const strategicInsights = generateStrategicInsights(marketEvents, commodityOutlook);
    
    // Get EOD data for metrics
    const eodBySymbol: Record<string, EODBar[]> = {};
    for (const sym of symbols.slice(0, 20)) { // Limit to avoid timeout
      try {
        const barsSnap = await db.collection('eod').doc(sym).collection('bars').orderBy('date', 'asc').get();
        eodBySymbol[sym] = barsSnap.docs.map((b) => b.data() as EODBar);
      } catch (e) {
        // Skip if no data
      }
    }
    
    const forwards = computeForwardReturnsForSignals({ signals, eodBySymbol, windows: windowDays });
    
    // Get recent news
    const newsSnap = await db.collection('news').orderBy('date', 'desc').limit(10).get();
    const news = newsSnap.docs.map((d) => d.data() as any);
    
    const newsSummary = await summarizeNewsItems(
      news.map((n) => ({
        id: n.id || '',
        date: n.date,
        source: n.source,
        url: n.url,
        title: n.title,
        summary: n.summary,
        symbols: n.symbols || [],
      }))
    );
    
    // Build metrics HTML
    const metricsHtml = windowDays
      .map((w: number) => {
        const m = aggregateMetrics(forwards, w);
        const conf = confusionByIncident(forwards, w);
        const confRows = conf.map((c) => `<tr><td>${c.incidentType}</td><td>${c.positive}</td><td>${c.negative}</td></tr>`).join('');
        const emptyNote = m.count === 0 ? '<p style="color:#666">No realized forward windows yet for this horizon. Try backfilling older signals.</p>' : '';
        return `
          <h3>Window ${w}d</h3>
          <p>Count: ${m.count} | Hit-rate: ${(m.hitRate * 100).toFixed(1)}% | Avg: ${(m.avgReturn * 100).toFixed(2)}% | Sharpe proxy: ${m.sharpeProxy.toFixed(2)}</p>
          ${emptyNote}
          <table border="1" cellpadding="6" cellspacing="0">
            <thead><tr><th>Incident</th><th>Positive</th><th>Negative</th></tr></thead>
            <tbody>${confRows}</tbody>
          </table>
        `;
      })
      .join('');
    
    // Build opportunities HTML
    const opportunitiesHtml = opportunities.length > 0 ? `
      <h3>Top Investment Opportunities</h3>
      <table border="1" cellpadding="8" cellspacing="0" style="width:100%;margin:10px 0">
        <thead>
          <tr style="background:#f3f4f6">
            <th>Symbols</th>
            <th>Direction</th>
            <th>Confidence</th>
            <th>Expected Return</th>
            <th>Timeframe</th>
            <th>Reasoning</th>
          </tr>
        </thead>
        <tbody>
          ${opportunities.slice(0, 5).map(opp => `
            <tr>
              <td>${opp.symbols.slice(0, 3).join(', ')}${opp.symbols.length > 3 ? '...' : ''}</td>
              <td style="color:${opp.direction === 'long' ? '#10b981' : '#ef4444'}">
                <strong>${opp.direction.toUpperCase()}</strong>
              </td>
              <td>${(opp.confidence * 100).toFixed(0)}%</td>
              <td>${opp.expectedReturn ? `${(opp.expectedReturn.expected * 100).toFixed(1)}%` : 'N/A'}</td>
              <td>${opp.timeframe.horizon}</td>
              <td style="font-size:13px">${opp.reasoning.slice(0, 100)}${opp.reasoning.length > 100 ? '...' : ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p style="color:#666">No active opportunities at this time. The system is monitoring global events for patterns.</p>';
    
    // Build events HTML
    const geopoliticalEvents = marketEvents.filter(e => e.category === 'geopolitical');
    const economicEvents = marketEvents.filter(e => e.category === 'macro_economic');
    const otherEvents = marketEvents.filter(e => 
      e.category !== 'geopolitical' && e.category !== 'macro_economic'
    );
    
    const eventsHtml = `
      <h3>🌍 Global Market Intelligence</h3>
      
      ${geopoliticalEvents.length > 0 ? `
        <h4 style="color:#dc2626">⚠️ Geopolitical Developments</h4>
        <ul style="margin:10px 0">
          ${geopoliticalEvents.slice(0, 3).map(evt => `
            <li>
              <strong>${evt.title}</strong>
              <br/>
              <span style="font-size:13px;color:#666">
                Impact: ${evt.impactedSectors.slice(0, 3).join(', ') || 'Broad market'}
              </span>
            </li>
          `).join('')}
        </ul>
      ` : '<p style="color:#666">No significant geopolitical events detected.</p>'}
      
      ${economicEvents.length > 0 ? `
        <h4 style="color:#0891b2">📊 Economic Indicators</h4>
        <ul style="margin:10px 0">
          ${economicEvents.slice(0, 3).map(evt => `
            <li>
              <strong>${evt.title}</strong>
              <br/>
              <span style="font-size:13px;color:#666">
                Impact: ${evt.impactedSectors.slice(0, 3).join(', ') || 'Broad market'}
              </span>
            </li>
          `).join('')}
        </ul>
      ` : '<p style="color:#666">No major economic indicators reported.</p>'}
      
      <h4 style="color:#7c3aed">🛢️ Commodity Outlook</h4>
      <table border="1" cellpadding="6" cellspacing="0" style="margin:10px 0">
        <tr>
          <td><strong>Oil (WTI)</strong></td>
          <td>$${commodityOutlook.oil.current}</td>
          <td>${commodityOutlook.oil.forecast}</td>
        </tr>
        <tr>
          <td><strong>Gold</strong></td>
          <td>$${commodityOutlook.gold.current}</td>
          <td>${commodityOutlook.gold.forecast}</td>
        </tr>
      </table>
      
      <h4 style="color:#059669">💡 Strategic Insights</h4>
      <div style="background:#f0fdf4;padding:12px;border-radius:6px;margin:10px 0">
        ${strategicInsights.map(insight => `
          <p style="margin:8px 0;font-size:14px">${insight}</p>
        `).join('')}
      </div>
    `;
    
    // Build complete HTML with preview header
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Preview - Predistia</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          table { border-collapse: collapse; }
          th, td { text-align: left; padding: 8px; }
          pre { 
            background: #f9fafb; 
            padding: 12px; 
            border-radius: 6px;
            overflow-x: auto;
          }
        </style>
      </head>
      <body>
        <div style="background:#dbeafe;padding:16px;border-radius:8px;margin-bottom:24px;border:2px solid #3b82f6">
          <h2 style="margin:0;color:#1e40af">📧 Email Preview Mode</h2>
          <p style="margin:8px 0 0 0;color:#1e40af">
            This is how your email will look. To send it, click "Send Email Now" on the dashboard.
          </p>
        </div>
        
        <h2>🎯 Predistia Global Market Intelligence Report</h2>
        
        <div style="background:#fef3c7;padding:12px;border-radius:6px;margin:16px 0;border:2px solid #f59e0b">
          <h3 style="margin-top:0;color:#92400e">⚡ Executive Summary</h3>
          <p style="margin:8px 0">
            <strong>Market Conditions:</strong> 
            ${geopoliticalEvents.length > 2 ? '🔴 Elevated geopolitical risk' : 
              economicEvents.length > 2 ? '🟡 Economic uncertainty' : '🟢 Normal conditions'}
          </p>
          <p style="margin:8px 0">
            <strong>Top Opportunities:</strong> ${opportunities.length} identified | 
            <strong>Critical Events:</strong> ${marketEvents.filter(e => e.magnitude === 'critical' || e.magnitude === 'high').length}
          </p>
          <p style="margin:8px 0">
            <strong>Recommended Focus:</strong> 
            ${geopoliticalEvents.length > 0 ? 'Defense, Energy, Gold' : 
              economicEvents.some(e => e.type === 'economic_indicator') ? 'Financials, Value stocks' : 
              'Technology, Growth stocks'}
          </p>
        </div>
        
        ${eventsHtml}
        ${opportunitiesHtml}
        
        ${newsSummary ? `
          <h3>📰 Market News Digest</h3>
          <pre style="white-space:pre-wrap;line-height:1.3">${newsSummary}</pre>
        ` : ''}
        
        <h3>📈 Historical Performance</h3>
        ${metricsHtml}
        
        <hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb"/>
        
        <div style="background:#f0f9ff;padding:12px;border-radius:6px;margin:16px 0">
          <h4 style="margin-top:0;color:#075985">🔍 What We're Monitoring</h4>
          <ul style="margin:8px 0;font-size:13px">
            <li>Ukraine-Russia conflict escalation potential</li>
            <li>Federal Reserve policy meeting (next week)</li>
            <li>China economic stimulus measures</li>
            <li>OPEC+ production decision impact</li>
            <li>US debt ceiling negotiations</li>
            <li>AI regulation developments in EU/US</li>
          </ul>
        </div>
        
        <p style="font-size:12px;color:#666">
          <strong>Coverage:</strong> 
          ${opportunities.length} opportunities | 
          ${marketEvents.length} events analyzed | 
          ${signals.length} signals generated | 
          Global news from ${news.length} sources
        </p>
        <p style="font-size:11px;color:#999">
          This is a preview. The actual email will be sent to: ${process.env.EMAIL_RECIPIENTS || 'No recipients configured'}
        </p>
      </body>
      </html>
    `;
    
    // Return HTML preview
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
    
  } catch (e: any) {
    console.error('Email preview error:', e);
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head><title>Error - Email Preview</title></head>
      <body style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h1 style="color: #dc2626;">Error Generating Preview</h1>
        <p>${e.message || 'An unexpected error occurred'}</p>
        <p><a href="/dashboard" style="color: #3b82f6;">← Back to Dashboard</a></p>
      </body>
      </html>
      `,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}