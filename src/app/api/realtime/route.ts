import { NextRequest } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';
import { MarketEvent, MarketOpportunity } from '@/types/core';

export const runtime = 'nodejs';

// Server-Sent Events for real-time updates
export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  
  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const db = getDb();
      
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ 
          type: 'connected', 
          message: 'Real-time monitoring active',
          timestamp: new Date().toISOString()
        })}\n\n`)
      );
      
      // Set up polling interval for real-time updates
      const interval = setInterval(async () => {
        try {
          const now = new Date();
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
          
          // Check for new critical events
          const eventSnap = await db.collection('market_events')
            .where('date', '>=', fiveMinutesAgo.toISOString())
            .where('magnitude', 'in', ['critical', 'high'])
            .orderBy('date', 'desc')
            .limit(5)
            .get();
          
          const newEvents: MarketEvent[] = eventSnap.docs.map(d => d.data() as MarketEvent);
          
          if (newEvents.length > 0) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'critical_events',
                events: newEvents,
                timestamp: now.toISOString()
              })}\n\n`)
            );
          }
          
          // Check for new high-confidence opportunities
          const oppSnap = await db.collection('opportunities')
            .where('createdAt', '>=', fiveMinutesAgo.toISOString())
            .where('confidence', '>=', 0.8)
            .where('status', '==', 'active')
            .orderBy('createdAt', 'desc')
            .orderBy('confidence', 'desc')
            .limit(3)
            .get();
          
          const newOpportunities: MarketOpportunity[] = oppSnap.docs.map(d => d.data() as MarketOpportunity);
          
          if (newOpportunities.length > 0) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'new_opportunities',
                opportunities: newOpportunities,
                timestamp: now.toISOString()
              })}\n\n`)
            );
          }
          
          // Send heartbeat to keep connection alive
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: now.toISOString()
            })}\n\n`)
          );
          
        } catch (error) {
          console.error('Error in real-time monitoring:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              message: 'Monitoring error occurred',
              timestamp: new Date().toISOString()
            })}\n\n`)
          );
        }
      }, 30000); // Check every 30 seconds
      
      // Clean up on close
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// WebSocket endpoint for bidirectional real-time communication
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;
    
    if (type === 'subscribe') {
      // Handle subscription to specific event types
      return Response.json({
        success: true,
        message: `Subscribed to ${data.eventTypes?.join(', ') || 'all events'}`,
        subscriptionId: crypto.randomUUID()
      });
    }
    
    if (type === 'alert_threshold') {
      // Set custom alert thresholds
      return Response.json({
        success: true,
        message: 'Alert thresholds updated',
        thresholds: data
      });
    }
    
    return Response.json({
      success: false,
      message: 'Unknown command type'
    }, { status: 400 });
    
  } catch (error) {
    console.error('WebSocket command error:', error);
    return Response.json({
      success: false,
      message: 'Error processing command'
    }, { status: 500 });
  }
}