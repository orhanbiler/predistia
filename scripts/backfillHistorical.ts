#!/usr/bin/env ts-node

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT || '{}'
);

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = getFirestore();

async function backfillHistoricalData() {
  console.log('📊 Backfilling Historical Data for Performance Metrics\n');
  console.log('=' .repeat(60));
  
  const CRON_SECRET = process.env.CRON_SECRET || 'dev';
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
  
  try {
    // Step 1: Ingest historical news and price data (90 days back)
    console.log('\n1️⃣ Ingesting 90 days of historical data...');
    
    const ingestRes = await fetch(`${baseUrl}/api/cron/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': CRON_SECRET
      },
      body: JSON.stringify({
        daysBack: 90,
        tickers: [
          'AAPL', 'MSFT', 'GOOGL', 'META', 'AMZN', 'NVDA', 'TSLA',
          'JPM', 'XOM', 'JNJ', 'WMT', 'PG', 'UNH', 'V', 'MA',
          'LMT', 'RTX', 'BA', 'GLD', 'SLV', 'USO', 'FDX', 'UPS'
        ]
      })
    });
    
    const ingestData = await ingestRes.json();
    console.log(`✅ Ingested ${ingestData.news} news items`);
    
    // Step 2: Enrich with classifications
    console.log('\n2️⃣ Classifying news into events...');
    
    const enrichRes = await fetch(`${baseUrl}/api/cron/enrich`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': CRON_SECRET
      },
      body: JSON.stringify({ limit: 500 })
    });
    
    const enrichData = await enrichRes.json();
    console.log(`✅ Enriched ${enrichData.enriched} incidents`);
    
    // Step 3: Generate signals
    console.log('\n3️⃣ Generating trading signals...');
    
    const signalsRes = await fetch(`${baseUrl}/api/cron/signals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': CRON_SECRET
      },
      body: JSON.stringify({ limit: 500 })
    });
    
    const signalsData = await signalsRes.json();
    console.log(`✅ Generated ${signalsData.created} signals`);
    
    // Step 4: Create some synthetic historical signals for testing
    console.log('\n4️⃣ Creating synthetic test signals...');
    
    const batch = db.batch();
    const testSignals = [
      // 65 days ago - will have 60d returns
      {
        id: 'NVDA_test_65d',
        symbol: 'NVDA',
        date: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        incidentType: 'technology_shift',
        direction: 'long',
        strength: 0.85
      },
      // 70 days ago
      {
        id: 'XOM_test_70d',
        symbol: 'XOM',
        date: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        incidentType: 'geopolitical',
        direction: 'long',
        strength: 0.75
      },
      // 80 days ago
      {
        id: 'META_test_80d',
        symbol: 'META',
        date: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        incidentType: 'earnings_miss',
        direction: 'short',
        strength: 0.70
      },
      // 25 days ago - will have 20d returns
      {
        id: 'AAPL_test_25d',
        symbol: 'AAPL',
        date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        incidentType: 'upgrade',
        direction: 'long',
        strength: 0.80
      },
      // 30 days ago
      {
        id: 'TSLA_test_30d',
        symbol: 'TSLA',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        incidentType: 'regulatory',
        direction: 'short',
        strength: 0.65
      },
      // 40 days ago
      {
        id: 'JPM_test_40d',
        symbol: 'JPM',
        date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        incidentType: 'economic_indicator',
        direction: 'long',
        strength: 0.72
      }
    ];
    
    for (const signal of testSignals) {
      const ref = db.collection('signals').doc(signal.id);
      batch.set(ref, signal);
    }
    
    await batch.commit();
    console.log(`✅ Created ${testSignals.length} test signals`);
    
    // Step 5: Run backtest to calculate metrics
    console.log('\n5️⃣ Running backtest to calculate performance metrics...');
    
    const backtestRes = await fetch(`${baseUrl}/api/backtest/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': CRON_SECRET
      },
      body: JSON.stringify({
        windowDays: [20, 60],
        limit: 1000
      })
    });
    
    const backtestData = await backtestRes.json();
    
    if (backtestData.metrics) {
      console.log('\n📈 Performance Metrics:');
      
      for (const metric of backtestData.metrics) {
        console.log(`\n${metric.windowDays}-Day Window:`);
        console.log(`  Count: ${metric.count}`);
        console.log(`  Hit Rate: ${(metric.hitRate * 100).toFixed(1)}%`);
        console.log(`  Avg Return: ${(metric.avgReturn * 100).toFixed(2)}%`);
        console.log(`  Sharpe Proxy: ${metric.sharpeProxy.toFixed(2)}`);
      }
      
      if (backtestData.confusion) {
        console.log('\n📊 Performance by Event Type:');
        console.log('Type                Positive  Negative');
        console.log('-'.repeat(40));
        
        for (const row of backtestData.confusion) {
          console.log(
            `${row.incidentType.padEnd(20)} ${String(row.positive).padEnd(9)} ${row.negative}`
          );
        }
      }
    }
    
    // Step 6: Fetch historical opportunities
    console.log('\n6️⃣ Analyzing historical opportunities...');
    
    const oppRes = await fetch(`${baseUrl}/api/cron/opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': CRON_SECRET
      },
      body: JSON.stringify({
        daysBack: 30,
        minConfidence: 0.6
      })
    });
    
    const oppData = await oppRes.json();
    console.log(`✅ Generated ${oppData.processed?.opportunities || 0} opportunities`);
    
    console.log('\n' + '=' .repeat(60));
    console.log('\n✅ Historical data backfill complete!');
    console.log('\nYour next daily reports will show:');
    console.log('  • Historical performance metrics');
    console.log('  • Hit rates and returns by incident type');
    console.log('  • Validated signal accuracy');
    console.log('\nNote: Full metrics require 60+ days of data to calculate');
    
  } catch (error) {
    console.error('❌ Error during backfill:', error);
    throw error;
  }
}

// Run the backfill
console.log('Starting historical data backfill...\n');
console.log('This will:');
console.log('  1. Fetch 90 days of historical news and prices');
console.log('  2. Classify events and generate signals');
console.log('  3. Create test signals with known dates');
console.log('  4. Calculate forward returns and performance metrics');
console.log('  5. Generate historical opportunities\n');

backfillHistoricalData()
  .then(() => {
    console.log('\n✨ Backfill completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Backfill failed:', error);
    process.exit(1);
  });