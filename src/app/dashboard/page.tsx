import { getDb } from '@/lib/firebaseAdmin';
import { Signal, MarketOpportunity, MarketEvent } from '@/types/core';
import EmailControls from '../EmailControls';
import RealTimeMonitor from '../RealTimeMonitor';

export const dynamic = 'force-dynamic';

async function getSignals(params: { symbol?: string; type?: string; limit?: number }) {
  const db = getDb();
  let q = db.collection('signals').orderBy('date', 'desc');
  if (params.limit) q = q.limit(params.limit);
  const snap = await q.get();
  let rows = snap.docs.map((d) => d.data() as Signal);
  if (params.symbol) rows = rows.filter((r) => r.symbol === params.symbol);
  if (params.type) rows = rows.filter((r) => r.incidentType === params.type);
  return rows;
}

async function getOpportunities(limit: number = 10) {
  const db = getDb();
  const now = new Date();
  const activeDate = now.toISOString().slice(0, 10);
  
  const snap = await db.collection('opportunities')
    .where('status', '==', 'active')
    .orderBy('confidence', 'desc')
    .limit(limit)
    .get();
  
  return snap.docs
    .map(d => d.data() as MarketOpportunity)
    .filter(opp => opp.timeframe.exit >= activeDate);
}

async function getRecentEvents(limit: number = 5) {
  const db = getDb();
  const snap = await db.collection('market_events')
    .orderBy('date', 'desc')
    .limit(limit)
    .get();
  
  return snap.docs.map(d => d.data() as MarketEvent);
}

export default async function DashboardPage({ searchParams }: { searchParams: { symbol?: string; type?: string; email?: string } }) {
  const symbol = searchParams.symbol || '';
  const type = searchParams.type || '';
  const emailStatus = searchParams.email || '';
  const [rows, opportunities, events] = await Promise.all([
    getSignals({ symbol: symbol || undefined, type: type || undefined, limit: 200 }),
    getOpportunities(5),
    getRecentEvents(5)
  ]);
  
  return (
    <main style={{ padding: 24 }}>
      <h1>Predistia Market Intelligence Dashboard</h1>
      
      {/* Email Status Notification */}
      {emailStatus === 'sent' && (
        <div style={{ 
          marginBottom: 24, 
          padding: 16, 
          backgroundColor: '#dcfce7', 
          borderRadius: 8,
          border: '2px solid #10b981'
        }}>
          <strong style={{ color: '#166534' }}>✅ Email sent successfully!</strong>
          <p style={{ margin: '8px 0 0 0', color: '#166534' }}>
            The intelligence report has been sent to: {process.env.EMAIL_RECIPIENTS || 'configured recipients'}
          </p>
        </div>
      )}
      
      {emailStatus === 'error' && (
        <div style={{ 
          marginBottom: 24, 
          padding: 16, 
          backgroundColor: '#fee2e2', 
          borderRadius: 8,
          border: '2px solid #ef4444'
        }}>
          <strong style={{ color: '#991b1b' }}>❌ Email failed to send</strong>
          <p style={{ margin: '8px 0 0 0', color: '#991b1b' }}>
            Please check your email configuration and try again.
          </p>
        </div>
      )}
      
      {/* Manual Controls */}
      <EmailControls />
      
      {/* Top Opportunities Section */}
      {opportunities.length > 0 && (
        <div style={{ marginBottom: 32, padding: 16, border: '2px solid #10b981', borderRadius: 8, backgroundColor: '#f0fdf4' }}>
          <h2 style={{ marginTop: 0 }}>🎯 Top Investment Opportunities</h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {opportunities.slice(0, 3).map((opp, idx) => (
              <div key={idx} style={{ 
                flex: '1 1 300px', 
                padding: 12, 
                border: '1px solid #d1d5db', 
                borderRadius: 6,
                backgroundColor: 'white' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong style={{ color: opp.direction === 'long' ? '#10b981' : '#ef4444' }}>
                    {opp.direction.toUpperCase()}
                  </strong>
                  <span style={{ color: '#6b7280', fontSize: 14 }}>
                    {(opp.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <div style={{ fontSize: 14, marginBottom: 4 }}>
                  {opp.symbols.slice(0, 4).join(', ')}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  Expected: {opp.expectedReturn ? `${(opp.expectedReturn.expected * 100).toFixed(1)}%` : 'N/A'}
                  {' | '}{opp.timeframe.horizon}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <a href="/opportunities" style={{ color: '#2563eb', textDecoration: 'underline' }}>
              View all opportunities →
            </a>
          </div>
        </div>
      )}
      
      {/* Recent Events Section */}
      {events.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2>Recent Market Events</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {events.map((event, idx) => (
              <div key={idx} style={{ 
                padding: '4px 12px', 
                backgroundColor: event.magnitude === 'critical' ? '#fef2f2' :
                                 event.magnitude === 'high' ? '#fef3c7' :
                                 event.magnitude === 'medium' ? '#fefce8' : '#f3f4f6',
                borderRadius: 4,
                fontSize: 14
              }}>
                <strong>{event.title}</strong>
                <span style={{ marginLeft: 8, color: '#6b7280', fontSize: 12 }}>
                  ({event.category})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Automated Signals - No Input Needed */}
      <h2>🤖 AI-Generated Trading Signals</h2>
      <p style={{ marginBottom: 16, color: '#6b7280' }}>
        System automatically monitors global events and generates signals. No input required.
      </p>
      <table cellPadding={6} cellSpacing={0} border={1}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Symbol</th>
            <th>Type</th>
            <th>Direction</th>
            <th>Strength</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.date}</td>
              <td><a href={`/assets/${r.symbol}`}>{r.symbol}</a></td>
              <td>{r.incidentType}</td>
              <td style={{ color: r.direction === 'long' ? '#10b981' : '#ef4444' }}>
                {r.direction}
              </td>
              <td>{(r.strength ?? 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Real-time monitoring widget */}
      <RealTimeMonitor />
    </main>
  );
}

