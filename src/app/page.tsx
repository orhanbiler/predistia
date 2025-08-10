export default function HomePage() {
  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 48, marginBottom: 16 }}>🌍 Predistia Global Intelligence</h1>
      <p style={{ fontSize: 20, color: '#6b7280', marginBottom: 32 }}>
        AI-powered system that predicts market impacts from world events - before they fully materialize.
      </p>
      
      <div style={{ 
        backgroundColor: '#f0fdf4', 
        padding: 24, 
        borderRadius: 12, 
        border: '2px solid #10b981',
        marginBottom: 32 
      }}>
        <h2 style={{ marginTop: 0, color: '#065f46' }}>🤖 How It Works - Fully Automated</h2>
        <p style={{ fontSize: 16, lineHeight: 1.6 }}>
          <strong>No input required!</strong> Our AI continuously monitors:
        </p>
        <ul style={{ fontSize: 16, lineHeight: 1.8 }}>
          <li>🌐 Global conflicts and geopolitical tensions</li>
          <li>🦠 Pandemic outbreaks and health crises</li>
          <li>🛢️ Oil/commodity price movements and OPEC decisions</li>
          <li>📊 Economic indicators and central bank policies</li>
          <li>🚢 Supply chain disruptions and shortages</li>
          <li>🌪️ Climate disasters and extreme weather</li>
          <li>🤖 Technology shifts and regulatory changes</li>
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 32 }}>
        <div style={{ padding: 20, backgroundColor: '#fef3c7', borderRadius: 8 }}>
          <h3>🎯 Pattern Recognition</h3>
          <p>Just like COVID-19 led to:</p>
          <ul style={{ fontSize: 14 }}>
            <li>✅ Zoom/Remote work boom</li>
            <li>✅ Hand sanitizer shortage</li>
            <li>✅ Oil price collapse</li>
            <li>✅ E-commerce explosion</li>
          </ul>
          <p style={{ fontSize: 14, marginTop: 12 }}>
            We identify these patterns <strong>as they emerge</strong>, not after.
          </p>
        </div>
        
        <div style={{ padding: 20, backgroundColor: '#dbeafe', borderRadius: 8 }}>
          <h3>🔗 Correlation Analysis</h3>
          <p>Tracks indirect impacts:</p>
          <ul style={{ fontSize: 14 }}>
            <li>Ukraine conflict → Wheat prices</li>
            <li>China lockdown → Apple supply</li>
            <li>Bank crisis → Gold surge</li>
            <li>AI boom → Chip shortage</li>
          </ul>
          <p style={{ fontSize: 14, marginTop: 12 }}>
            Finds <strong>non-obvious opportunities</strong> others miss.
          </p>
        </div>
        
        <div style={{ padding: 20, backgroundColor: '#fce7f3', borderRadius: 8 }}>
          <h3>📈 Daily Intelligence</h3>
          <p>Every morning you receive:</p>
          <ul style={{ fontSize: 14 }}>
            <li>🔴 Critical global events</li>
            <li>💡 Investment opportunities</li>
            <li>🛢️ Commodity forecasts</li>
            <li>⚠️ Risk warnings</li>
          </ul>
          <p style={{ fontSize: 14, marginTop: 12 }}>
            <strong>Actionable insights</strong>, not just news.
          </p>
        </div>
      </div>

      <div style={{ backgroundColor: '#f9fafb', padding: 24, borderRadius: 12, marginBottom: 32 }}>
        <h2>🚀 Current System Status</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 16 }}>
          <div>
            <h4>What We're Tracking Right Now:</h4>
            <ul style={{ fontSize: 14 }}>
              <li>🇺🇦 Ukraine-Russia escalation</li>
              <li>🇮🇱 Middle East tensions</li>
              <li>🏦 US debt ceiling crisis</li>
              <li>🇨🇳 China economic stimulus</li>
              <li>💵 Fed rate decisions</li>
              <li>🤖 AI regulation impacts</li>
            </ul>
          </div>
          <div>
            <h4>Recent Predictions:</h4>
            <ul style={{ fontSize: 14 }}>
              <li>✅ Oil → $90 (OPEC cuts)</li>
              <li>✅ Defense stocks ↑ (conflicts)</li>
              <li>✅ Tech rotation (rates)</li>
              <li>✅ Gold support (uncertainty)</li>
              <li>⏳ Chip shortage 2025</li>
              <li>⏳ Energy crisis Europe</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: 24 }}>
        <h2>📊 Access Your Intelligence</h2>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/dashboard" style={{ 
            padding: '12px 24px', 
            backgroundColor: '#10b981', 
            color: 'white', 
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 18,
            fontWeight: 'bold'
          }}>
            View Live Dashboard →
          </a>
          <a href="/opportunities" style={{ 
            padding: '12px 24px', 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 18,
            fontWeight: 'bold'
          }}>
            Current Opportunities →
          </a>
        </div>
        
        <p style={{ marginTop: 24, color: '#6b7280', fontSize: 14 }}>
          💡 Tip: Check your email daily for the intelligence report with specific buy/sell recommendations
        </p>
      </div>

      <div style={{ 
        marginTop: 48, 
        padding: 16, 
        backgroundColor: '#fef2f2', 
        borderRadius: 8,
        border: '1px solid #fca5a5'
      }}>
        <p style={{ fontSize: 12, color: '#7f1d1d', margin: 0 }}>
          <strong>Disclaimer:</strong> This system provides AI-generated analysis based on global events. 
          Not financial advice. Past pattern recognition does not guarantee future results. 
          Always conduct your own research before making investment decisions.
        </p>
      </div>
    </main>
  );
}
