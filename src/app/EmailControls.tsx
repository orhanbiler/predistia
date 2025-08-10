'use client';

import { useState } from 'react';

export default function EmailControls() {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);

  const handleSendEmail = async () => {
    if (sendingEmail) return;
    
    const confirmed = confirm('Send the intelligence report email now?');
    if (!confirmed) return;
    
    setSendingEmail(true);
    try {
      window.location.href = '/api/email/send';
    } catch (error) {
      console.error('Error sending email:', error);
      setSendingEmail(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (runningAnalysis) return;
    
    const confirmed = confirm('Run the full daily analysis? This may take a few minutes.');
    if (!confirmed) return;
    
    setRunningAnalysis(true);
    try {
      const res = await fetch('/api/cron/daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': 'dev' // This will only work in dev
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`Analysis complete! Processed ${data.summary?.processed?.news || 0} news items, generated ${data.summary?.processed?.opportunities || 0} opportunities.`);
        window.location.reload();
      } else {
        alert('Analysis failed. Check console for details.');
      }
    } catch (error) {
      console.error('Error running analysis:', error);
      alert('Error running analysis. Check console for details.');
    } finally {
      setRunningAnalysis(false);
    }
  };

  return (
    <div style={{ 
      marginBottom: 24, 
      padding: 16, 
      backgroundColor: '#f3f4f6', 
      borderRadius: 8,
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>
      <button
        onClick={handleSendEmail}
        disabled={sendingEmail}
        style={{
          padding: '8px 16px',
          backgroundColor: sendingEmail ? '#6b7280' : '#10b981',
          color: 'white',
          borderRadius: 6,
          border: 'none',
          fontWeight: 'bold',
          cursor: sendingEmail ? 'not-allowed' : 'pointer',
          opacity: sendingEmail ? 0.6 : 1
        }}
      >
        {sendingEmail ? '📧 Sending...' : '📧 Send Email Now'}
      </button>
      
      <a 
        href="/api/email/preview"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: '8px 16px',
          backgroundColor: '#3b82f6',
          color: 'white',
          borderRadius: 6,
          textDecoration: 'none',
          fontWeight: 'bold',
          display: 'inline-block'
        }}
      >
        👁️ Preview Email
      </a>
      
      <button
        onClick={handleRunAnalysis}
        disabled={runningAnalysis}
        style={{
          padding: '8px 16px',
          backgroundColor: runningAnalysis ? '#6b7280' : '#8b5cf6',
          color: 'white',
          borderRadius: 6,
          border: 'none',
          fontWeight: 'bold',
          cursor: runningAnalysis ? 'not-allowed' : 'pointer',
          opacity: runningAnalysis ? 0.6 : 1
        }}
      >
        {runningAnalysis ? '🔄 Running...' : '🔄 Run Full Analysis'}
      </button>
      
      <span style={{ 
        marginLeft: 'auto', 
        fontSize: 14, 
        color: '#6b7280',
        fontStyle: 'italic'
      }}>
        💡 Tip: Preview first to see what will be sent
      </span>
    </div>
  );
}