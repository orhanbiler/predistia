'use client';

import { useState, useEffect, useRef } from 'react';

interface RealtimeEvent {
  type: string;
  events?: any[];
  opportunities?: any[];
  message?: string;
  timestamp: string;
}

export default function RealTimeMonitor() {
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState<RealtimeEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  
  const startMonitoring = () => {
    if (eventSourceRef.current) return;
    
    const eventSource = new EventSource('/api/realtime');
    eventSourceRef.current = eventSource;
    
    eventSource.onopen = () => {
      setIsConnected(true);
      setIsMonitoring(true);
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data: RealtimeEvent = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          console.log('Connected to real-time monitoring');
        } else if (data.type === 'critical_events') {
          setAlerts(prev => [{
            ...data,
            timestamp: new Date().toISOString()
          }, ...prev].slice(0, 10));
          
          // Show browser notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🚨 Critical Market Event', {
              body: `${data.events?.length} critical events detected`,
              icon: '/favicon.ico'
            });
          }
        } else if (data.type === 'new_opportunities') {
          setAlerts(prev => [{
            ...data,
            timestamp: new Date().toISOString()
          }, ...prev].slice(0, 10));
          
          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('💰 New Trading Opportunity', {
              body: `${data.opportunities?.length} high-confidence opportunities found`,
              icon: '/favicon.ico'
            });
          }
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };
    
    eventSource.onerror = () => {
      setIsConnected(false);
      console.error('SSE connection error');
    };
  };
  
  const stopMonitoring = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      setIsMonitoring(false);
    }
  };
  
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };
  
  useEffect(() => {
    requestNotificationPermission();
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);
  
  const clearAlerts = () => {
    setAlerts([]);
  };
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      width: 350,
      maxHeight: 400,
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      padding: 16,
      color: 'white',
      zIndex: 1000
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottom: '1px solid #333'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: isConnected ? '#10b981' : '#ef4444',
            animation: isConnected ? 'pulse 2s infinite' : 'none'
          }} />
          <strong>Real-Time Monitor</strong>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isMonitoring ? (
            <button
              onClick={startMonitoring}
              style={{
                padding: '4px 12px',
                backgroundColor: '#10b981',
                color: 'white',
                borderRadius: 6,
                border: 'none',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Start
            </button>
          ) : (
            <button
              onClick={stopMonitoring}
              style={{
                padding: '4px 12px',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: 6,
                border: 'none',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Stop
            </button>
          )}
          <button
            onClick={clearAlerts}
            style={{
              padding: '4px 12px',
              backgroundColor: '#6b7280',
              color: 'white',
              borderRadius: 6,
              border: 'none',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        </div>
      </div>
      
      <div style={{
        maxHeight: 320,
        overflowY: 'auto',
        fontSize: 13
      }}>
        {alerts.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#6b7280',
            padding: '20px 0'
          }}>
            {isMonitoring ? 'Monitoring for critical events...' : 'Click Start to begin monitoring'}
          </div>
        ) : (
          alerts.map((alert, idx) => (
            <div key={idx} style={{
              marginBottom: 12,
              padding: 10,
              backgroundColor: '#2a2a2a',
              borderRadius: 8,
              borderLeft: `3px solid ${
                alert.type === 'critical_events' ? '#ef4444' :
                alert.type === 'new_opportunities' ? '#10b981' : '#6b7280'
              }`
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: 4
              }}>
                <strong style={{ fontSize: 12 }}>
                  {alert.type === 'critical_events' ? '🚨 Critical Event' :
                   alert.type === 'new_opportunities' ? '💰 Opportunity' :
                   '📢 Alert'}
                </strong>
                <span style={{ fontSize: 10, color: '#6b7280' }}>
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              {alert.events && alert.events.length > 0 && (
                <div style={{ fontSize: 11, color: '#d1d5db' }}>
                  {alert.events[0].title}
                  {alert.events.length > 1 && ` (+${alert.events.length - 1} more)`}
                </div>
              )}
              
              {alert.opportunities && alert.opportunities.length > 0 && (
                <div style={{ fontSize: 11, color: '#d1d5db' }}>
                  {alert.opportunities[0].symbols?.slice(0, 3).join(', ')} - 
                  {' '}{(alert.opportunities[0].confidence * 100).toFixed(0)}% confidence
                </div>
              )}
              
              {alert.message && (
                <div style={{ fontSize: 11, color: '#d1d5db' }}>
                  {alert.message}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}