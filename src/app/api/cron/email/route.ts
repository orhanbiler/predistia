import { NextRequest, NextResponse } from 'next/server';
import { verifyCron } from '@/lib/cron';
import { getDb } from '@/lib/firebaseAdmin';
import { sendEmail } from '@/lib/email';
import { summarizeNewsItems } from '@/lib/llm';
import { fetchGdeltDocs } from '@/lib/gdelt';
import { fetchGoogleNewsRss } from '@/lib/rss';
import { computeForwardReturnsForSignals, aggregateMetrics, confusionByIncident } from '@/lib/returns';
import { EODBar, Signal, MarketOpportunity, MarketEvent } from '@/types/core';
import { getCommodityOutlook, generateStrategicInsights } from '@/lib/newsAggregator';

export const runtime = 'nodejs';
const EMAIL_DEFAULT_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'];

export async function POST(req: NextRequest) {
  try {
    verifyCron(req);
    const db = getDb();
    const { to, windowDays = [20, 60], limit = 200 } = await req.json().catch(() => ({}));
    // Resolve recipients: prefer request body, else use EMAIL_RECIPIENTS env (comma-separated)
    const envRecipients = (process.env.EMAIL_RECIPIENTS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const recipients = (typeof to === 'string' && to.trim()) ? [to.trim()] : envRecipients;
    if (!recipients.length) throw new Error('Missing recipient: provide { to } or set EMAIL_RECIPIENTS');

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

    const eodBySymbol: Record<string, EODBar[]> = {};
    for (const sym of symbols) {
      const barsSnap = await db.collection('eod').doc(sym).collection('bars').orderBy('date', 'asc').get();
      eodBySymbol[sym] = barsSnap.docs.map((b) => b.data() as EODBar);
    }

    const forwards = computeForwardReturnsForSignals({ signals, eodBySymbol, windows: windowDays });
    // Pull recent news for context in the email
    const newsSnap = await db.collection('news').orderBy('date', 'desc').limit(10).get();
    let news = newsSnap.docs.map((d) => d.data() as any);
    let newsError: string | null = null;
    if (!news.length) {
      try {
        const gdelt = await fetchGdeltDocs({ timespan: '1d', maxRecords: 10 });
        const rss = await fetchGoogleNewsRss({ queries: EMAIL_DEFAULT_TICKERS.map((t) => `${t} stock`), limit: 10 });
        const fresh = [...gdelt, ...rss];
        news = fresh.map((n) => ({
          id: n.id,
          date: n.date,
          source: n.source,
          url: n.url,
          title: n.title,
          summary: n.summary,
          symbols: n.symbols,
        }));
      } catch (e: any) {
        newsError = e?.message || String(e);
      }
    }
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

    const newsListHtml = news
      .map((n: any) => `<li>${n.date} ${n.source} — ${n.title}${n.url ? ` — <a href="${n.url}">link</a>` : ''}</li>`)
      .join('');
    
    // Format opportunities HTML
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
    ` : '';
    
    // Format market events HTML with categories
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
      ` : ''}
      
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
      ` : ''}
      
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

    const html = `
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
        <pre style="white-space:pre-wrap;line-height:1.3;background:#f9fafb;padding:12px;border-radius:6px">${newsSummary}</pre>
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
        This report combines AI analysis with real-time global event monitoring. 
        Not investment advice - conduct your own due diligence.
      </p>
    `;

    const subject = opportunities.length > 0 
      ? `Predistia Alert: ${opportunities.length} Active Opportunities`
      : 'Predistia Daily Intelligence Report';
    
    await sendEmail({ to: recipients.join(','), subject, htmlBody: html });
    return NextResponse.json({ 
      ok: true, 
      signals: signals.length, 
      opportunities: opportunities.length,
      events: marketEvents.length,
      recipients 
    });
  } catch (e: any) {
    const status = e?.status || 500;
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status });
  }
}
