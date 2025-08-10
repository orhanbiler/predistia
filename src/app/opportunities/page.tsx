import { getDb } from '@/lib/firebaseAdmin';
import { MarketOpportunity, MarketEvent } from '@/types/core';

export const dynamic = 'force-dynamic';

async function getOpportunities() {
  const db = getDb();
  const now = new Date();
  const activeDate = now.toISOString().slice(0, 10);
  
  const snap = await db.collection('opportunities')
    .where('status', '==', 'active')
    .orderBy('confidence', 'desc')
    .limit(50)
    .get();
  
  return snap.docs
    .map(d => d.data() as MarketOpportunity)
    .filter(opp => opp.timeframe.exit >= activeDate);
}

async function getMarketEvents() {
  const db = getDb();
  const snap = await db.collection('market_events')
    .orderBy('date', 'desc')
    .limit(20)
    .get();
  
  return snap.docs.map(d => d.data() as MarketEvent);
}

export default async function OpportunitiesPage() {
  const [opportunities, events] = await Promise.all([
    getOpportunities(),
    getMarketEvents()
  ]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#16a34a';
    if (confidence >= 0.6) return '#ca8a04';
    return '#6b7280';
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 0.7) return '#dc2626';
    if (risk >= 0.4) return '#ca8a04';
    return '#16a34a';
  };

  const formatReturn = (ret?: { min: number; max: number; expected: number }) => {
    if (!ret) return 'N/A';
    return `${(ret.expected * 100).toFixed(1)}% (${(ret.min * 100).toFixed(1)}% - ${(ret.max * 100).toFixed(1)}%)`;
  };

  // Group opportunities by timeframe
  const immediateOpps = opportunities.filter(o => o.timeframe.horizon === 'days');
  const shortTermOpps = opportunities.filter(o => o.timeframe.horizon === 'weeks');
  const longTermOpps = opportunities.filter(o => o.timeframe.horizon === 'months');

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 36, fontWeight: 'bold', marginBottom: 24 }}>
        🎯 Market Opportunities
      </h1>
      
      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ backgroundColor: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Total Opportunities</div>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>{opportunities.length}</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 14, color: '#6b7280' }}>High Confidence</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#16a34a' }}>
            {opportunities.filter(o => o.confidence >= 0.8).length}
          </div>
        </div>
        <div style={{ backgroundColor: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Long Positions</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#2563eb' }}>
            {opportunities.filter(o => o.direction === 'long').length}
          </div>
        </div>
        <div style={{ backgroundColor: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Short Positions</div>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#dc2626' }}>
            {opportunities.filter(o => o.direction === 'short').length}
          </div>
        </div>
      </div>

      {/* Opportunities by Timeframe */}
      {immediateOpps.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
            ⚡ Immediate Opportunities (Days)
          </h2>
          <div style={{ backgroundColor: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {immediateOpps.map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} />
            ))}
          </div>
        </div>
      )}

      {shortTermOpps.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
            📅 Short Term Opportunities (Weeks)
          </h2>
          <div style={{ backgroundColor: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {shortTermOpps.map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} />
            ))}
          </div>
        </div>
      )}

      {longTermOpps.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
            📈 Long Term Opportunities (Months)
          </h2>
          <div style={{ backgroundColor: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {longTermOpps.map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} />
            ))}
          </div>
        </div>
      )}

      {opportunities.length === 0 && (
        <div style={{ 
          backgroundColor: '#fef3c7', 
          padding: 32, 
          borderRadius: 8, 
          textAlign: 'center',
          border: '2px solid #f59e0b'
        }}>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>No Active Opportunities</h3>
          <p style={{ color: '#92400e' }}>
            The system is monitoring global events. Opportunities will appear when significant patterns are detected.
          </p>
          <p style={{ marginTop: 16, fontSize: 14, color: '#78350f' }}>
            Check back after the next daily analysis run or check your email for updates.
          </p>
        </div>
      )}

      {/* Recent Events */}
      <div style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
          🌍 Recent Market Events
        </h2>
        <div style={{ backgroundColor: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: 16 }}>
            {events.slice(0, 10).map((event) => (
              <div key={event.id} style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 'bold',
                        backgroundColor: event.magnitude === 'critical' ? '#fef2f2' :
                                       event.magnitude === 'high' ? '#fef3c7' :
                                       event.magnitude === 'medium' ? '#fefce8' : '#f3f4f6',
                        color: event.magnitude === 'critical' ? '#991b1b' :
                               event.magnitude === 'high' ? '#92400e' :
                               event.magnitude === 'medium' ? '#854d0e' : '#374151'
                      }}>
                        {event.magnitude?.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        {event.category}
                      </span>
                    </div>
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{event.title}</div>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>
                      Impacts: {event.impactedSectors.slice(0, 3).join(', ')}
                      {event.impactedSectors.length > 3 && ` +${event.impactedSectors.length - 3} more`}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: '#6b7280' }}>
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OpportunityCard({ opp }: { opp: MarketOpportunity }) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#16a34a';
    if (confidence >= 0.6) return '#ca8a04';
    return '#6b7280';
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 0.7) return '#dc2626';
    if (risk >= 0.4) return '#ca8a04';
    return '#16a34a';
  };

  const formatReturn = (ret?: { min: number; max: number; expected: number }) => {
    if (!ret) return 'N/A';
    return `${(ret.expected * 100).toFixed(1)}% (${(ret.min * 100).toFixed(1)}% - ${(ret.max * 100).toFixed(1)}%)`;
  };

  return (
    <div style={{ padding: 20, borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{
              padding: '4px 12px',
              borderRadius: 9999,
              fontSize: 14,
              fontWeight: 'bold',
              backgroundColor: opp.direction === 'long' ? '#dcfce7' : '#fee2e2',
              color: opp.direction === 'long' ? '#166534' : '#991b1b'
            }}>
              {opp.direction.toUpperCase()}
            </span>
            <span style={{
              padding: '4px 12px',
              borderRadius: 9999,
              fontSize: 14,
              backgroundColor: opp.type === 'direct' ? '#dbeafe' :
                             opp.type === 'indirect' ? '#e9d5ff' : '#fef3c7',
              color: opp.type === 'direct' ? '#1e40af' :
                     opp.type === 'indirect' ? '#6b21a8' : '#713f12'
            }}>
              {opp.type}
            </span>
            <span style={{ fontSize: 14, color: '#6b7280' }}>
              {opp.timeframe.horizon}
            </span>
          </div>
          
          <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
            {opp.symbols.slice(0, 5).join(', ')}
            {opp.symbols.length > 5 && ` +${opp.symbols.length - 5} more`}
          </div>
          
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
            Sectors: {opp.sectors.slice(0, 3).join(', ')}
          </div>
          
          <div style={{ fontSize: 14, color: '#374151' }}>
            {opp.reasoning}
          </div>
        </div>
        
        <div style={{ textAlign: 'right', minWidth: 200 }}>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Confidence</div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: getConfidenceColor(opp.confidence) }}>
              {(opp.confidence * 100).toFixed(0)}%
            </div>
          </div>
          
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Expected Return</div>
            <div style={{ fontSize: 14, fontWeight: 'medium' }}>
              {formatReturn(opp.expectedReturn)}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Risk Score</div>
            <div style={{ fontSize: 14, fontWeight: 'medium', color: getRiskColor(opp.riskScore) }}>
              {(opp.riskScore * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTop: '1px solid #f3f4f6',
        fontSize: 14
      }}>
        <div style={{ color: '#6b7280' }}>
          Entry: {opp.timeframe.entry} → Exit: {opp.timeframe.exit}
        </div>
        <div style={{ color: '#6b7280' }}>
          Events: {opp.eventIds.length}
        </div>
      </div>
    </div>
  );
}