import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { MarketEvent, MarketOpportunity } from '../src/types/core';
import { generateOpportunities, analyzeEventImpact } from '../src/lib/eventCorrelation';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT || '{}'
);

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = getFirestore();

// Historical event scenarios to test
const testScenarios: MarketEvent[] = [
  {
    id: 'test_pandemic_2020',
    date: '2020-03-01',
    type: 'pandemic',
    category: 'environmental',
    title: 'COVID-19 Pandemic Declared',
    description: 'WHO declares COVID-19 a global pandemic',
    impactedSectors: ['Travel & Hospitality', 'Real Estate', 'Healthcare'],
    impactedSymbols: ['AAL', 'UAL', 'MAR', 'HLT', 'ZM', 'DOCU'],
    magnitude: 'critical',
    timeHorizon: 'immediate'
  },
  {
    id: 'test_ai_boom_2023',
    date: '2023-01-01',
    type: 'technology_shift',
    category: 'technological',
    title: 'AI Revolution with ChatGPT',
    description: 'Generative AI boom following ChatGPT release',
    impactedSectors: ['AI/ML', 'Semiconductors', 'Cloud Services'],
    impactedSymbols: ['NVDA', 'MSFT', 'GOOGL', 'AMD'],
    magnitude: 'high',
    timeHorizon: 'long_term'
  },
  {
    id: 'test_rate_hike_2022',
    date: '2022-06-01',
    type: 'economic_indicator',
    category: 'macro_economic',
    title: 'Fed Raises Interest Rates',
    description: 'Federal Reserve raises rates to combat inflation',
    impactedSectors: ['Technology', 'Financial Services', 'Real Estate'],
    impactedSymbols: ['AAPL', 'META', 'JPM', 'BAC'],
    magnitude: 'high',
    timeHorizon: 'short_term'
  },
  {
    id: 'test_supply_chain_2021',
    date: '2021-03-01',
    type: 'supply_chain',
    category: 'sector_wide',
    title: 'Global Supply Chain Crisis',
    description: 'Container ship blocks Suez Canal',
    impactedSectors: ['Supply Chain & Logistics', 'Manufacturing', 'Retail'],
    impactedSymbols: ['FDX', 'UPS', 'AMZN', 'WMT'],
    magnitude: 'high',
    timeHorizon: 'short_term'
  },
  {
    id: 'test_ev_shift_2021',
    date: '2021-01-01',
    type: 'consumer_trend',
    category: 'social',
    title: 'Electric Vehicle Adoption Accelerates',
    description: 'Consumer shift toward electric vehicles',
    impactedSectors: ['Electric Vehicles', 'Automotive', 'Battery Technology'],
    impactedSymbols: ['TSLA', 'RIVN', 'GM', 'F'],
    magnitude: 'medium',
    timeHorizon: 'long_term'
  }
];

async function testOpportunityGeneration() {
  console.log('Testing Opportunity Generation System\n');
  console.log('=' .repeat(60));
  
  for (const event of testScenarios) {
    console.log(`\nTesting Event: ${event.title}`);
    console.log('-'.repeat(40));
    
    // Analyze event impact
    const impact = analyzeEventImpact(event);
    console.log('\nEvent Impact Analysis:');
    console.log(`  Direct Sectors: ${impact.directImpact.sectors.join(', ')}`);
    console.log(`  Direct Symbols: ${impact.directImpact.symbols.slice(0, 5).join(', ')}...`);
    console.log(`  Indirect Sectors: ${impact.indirectImpact.sectors.slice(0, 5).join(', ')}...`);
    console.log(`  Correlated Sectors: ${impact.correlatedSectors.join(', ')}`);
    
    // Generate opportunities
    const opportunities = generateOpportunities([event]);
    console.log(`\nGenerated ${opportunities.length} opportunities:`);
    
    // Group by type
    const directOpps = opportunities.filter(o => o.type === 'direct');
    const indirectOpps = opportunities.filter(o => o.type === 'indirect');
    const correlationOpps = opportunities.filter(o => o.type === 'correlation');
    
    console.log(`  Direct: ${directOpps.length}`);
    console.log(`  Indirect: ${indirectOpps.length}`);
    console.log(`  Correlation: ${correlationOpps.length}`);
    
    // Show top opportunities
    const topOpps = opportunities
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
    
    console.log('\nTop 3 Opportunities:');
    for (const opp of topOpps) {
      console.log(`\n  ${opp.direction.toUpperCase()} - ${opp.symbols.slice(0, 3).join(', ')}`);
      console.log(`    Confidence: ${(opp.confidence * 100).toFixed(0)}%`);
      console.log(`    Expected Return: ${opp.expectedReturn ? 
        `${(opp.expectedReturn.expected * 100).toFixed(1)}%` : 'N/A'}`);
      console.log(`    Timeframe: ${opp.timeframe.horizon}`);
      console.log(`    Reasoning: ${opp.reasoning.slice(0, 80)}...`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Testing Multiple Correlated Events\n');
  
  // Test correlation between multiple events
  const correlatedEvents = [
    testScenarios[0], // Pandemic
    testScenarios[3], // Supply chain
  ];
  
  const correlatedOpps = generateOpportunities(correlatedEvents);
  const strongCorrelations = correlatedOpps.filter(
    o => o.type === 'correlation' && o.confidence > 0.7
  );
  
  console.log(`Found ${strongCorrelations.length} strong correlation opportunities`);
  
  for (const opp of strongCorrelations) {
    console.log(`\n  ${opp.direction.toUpperCase()} Correlation`);
    console.log(`    Symbols: ${opp.symbols.slice(0, 5).join(', ')}`);
    console.log(`    Confidence: ${(opp.confidence * 100).toFixed(0)}%`);
    console.log(`    Reasoning: ${opp.reasoning}`);
  }
  
  // Store test results in database
  console.log('\n' + '='.repeat(60));
  console.log('Storing test results in database...\n');
  
  const batch = db.batch();
  let stored = 0;
  
  // Store test events
  for (const event of testScenarios) {
    const eventRef = db.collection('market_events').doc(event.id);
    batch.set(eventRef, event, { merge: true });
    stored++;
  }
  
  // Store top opportunities
  const allOpps = generateOpportunities(testScenarios);
  const topTestOpps = allOpps
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 20);
  
  for (const opp of topTestOpps) {
    const oppRef = db.collection('opportunities').doc(`test_${opp.id}`);
    batch.set(oppRef, { ...opp, status: 'monitoring' }, { merge: true });
    stored++;
  }
  
  await batch.commit();
  console.log(`Stored ${stored} test records in database`);
  
  console.log('\nTest completed successfully!');
}

// Run the test
testOpportunityGeneration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });