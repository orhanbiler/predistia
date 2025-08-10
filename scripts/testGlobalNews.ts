#!/usr/bin/env ts-node

import { 
  fetchGlobalNews, 
  analyzeNewsRelevance, 
  getCommodityOutlook,
  generateStrategicInsights,
  GLOBAL_EVENT_QUERIES 
} from '../src/lib/newsAggregator';

async function testGlobalNewsAggregation() {
  console.log('🌍 Testing Global News Aggregation System\n');
  console.log('=' .repeat(60));
  
  // Show categories being monitored
  console.log('\n📋 Monitoring Categories:');
  Object.entries(GLOBAL_EVENT_QUERIES).forEach(([category, queries]) => {
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`  ${queries.slice(0, 3).join('\n  ')}...`);
  });
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n🔍 Fetching Global News...\n');
  
  try {
    // Fetch global news
    const news = await fetchGlobalNews({
      maxRecords: 50,
      timespan: '1d'
    });
    
    console.log(`✅ Fetched ${news.length} news items\n`);
    
    // Analyze each news item
    const categorizedNews: Record<string, any[]> = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };
    
    for (const item of news) {
      const analysis = analyzeNewsRelevance(item);
      if (analysis.isRelevant) {
        categorizedNews[analysis.impactLevel].push({
          ...item,
          analysis
        });
      }
    }
    
    // Display results by impact level
    console.log('📊 News Analysis Results:\n');
    
    if (categorizedNews.critical.length > 0) {
      console.log('🔴 CRITICAL IMPACT:');
      categorizedNews.critical.forEach(item => {
        console.log(`  - ${item.title}`);
        console.log(`    Category: ${item.analysis.category} | Tags: ${item.analysis.tags.join(', ')}`);
      });
    }
    
    if (categorizedNews.high.length > 0) {
      console.log('\n🟠 HIGH IMPACT:');
      categorizedNews.high.slice(0, 5).forEach(item => {
        console.log(`  - ${item.title}`);
        console.log(`    Category: ${item.analysis.category} | Tags: ${item.analysis.tags.join(', ')}`);
      });
    }
    
    if (categorizedNews.medium.length > 0) {
      console.log('\n🟡 MEDIUM IMPACT:');
      categorizedNews.medium.slice(0, 5).forEach(item => {
        console.log(`  - ${item.title}`);
        console.log(`    Category: ${item.analysis.category}`);
      });
    }
    
    // Get commodity outlook
    console.log('\n' + '=' .repeat(60));
    console.log('\n💰 Commodity Market Outlook:\n');
    
    const commodityOutlook = await getCommodityOutlook();
    
    console.log('🛢️ OIL (WTI):');
    console.log(`  Current: $${commodityOutlook.oil.current}`);
    console.log(`  Forecast: ${commodityOutlook.oil.forecast}`);
    console.log('  Factors:');
    commodityOutlook.oil.factors.forEach(factor => {
      console.log(`    • ${factor}`);
    });
    
    console.log('\n🥇 GOLD:');
    console.log(`  Current: $${commodityOutlook.gold.current}`);
    console.log(`  Forecast: ${commodityOutlook.gold.forecast}`);
    console.log('  Factors:');
    commodityOutlook.gold.factors.forEach(factor => {
      console.log(`    • ${factor}`);
    });
    
    // Generate strategic insights
    console.log('\n' + '=' .repeat(60));
    console.log('\n🎯 Strategic Insights:\n');
    
    const mockEvents = [
      ...categorizedNews.critical.map(n => ({ 
        ...n, 
        category: n.analysis.category,
        type: n.analysis.category,
        magnitude: 'critical'
      })),
      ...categorizedNews.high.map(n => ({ 
        ...n, 
        category: n.analysis.category,
        type: n.analysis.category,
        magnitude: 'high'
      }))
    ];
    
    const insights = generateStrategicInsights(mockEvents, commodityOutlook);
    
    insights.forEach(insight => {
      console.log(insight);
      console.log();
    });
    
    // Summary statistics
    console.log('=' .repeat(60));
    console.log('\n📈 Summary Statistics:\n');
    console.log(`Total News Analyzed: ${news.length}`);
    console.log(`Critical Events: ${categorizedNews.critical.length}`);
    console.log(`High Impact Events: ${categorizedNews.high.length}`);
    console.log(`Medium Impact Events: ${categorizedNews.medium.length}`);
    
    const categoryCount: Record<string, number> = {};
    [...categorizedNews.critical, ...categorizedNews.high, ...categorizedNews.medium].forEach(item => {
      categoryCount[item.analysis.category] = (categoryCount[item.analysis.category] || 0) + 1;
    });
    
    console.log('\nEvents by Category:');
    Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count}`);
      });
    
    // Investment implications
    console.log('\n' + '=' .repeat(60));
    console.log('\n💡 Investment Implications:\n');
    
    const hasGeopolitical = categorizedNews.critical.some(n => 
      n.analysis.category === 'geopolitical'
    );
    const hasEconomic = categorizedNews.high.some(n => 
      n.analysis.category === 'economic'
    );
    const hasSupplyChain = categorizedNews.high.some(n => 
      n.analysis.category === 'disruptions'
    );
    
    if (hasGeopolitical) {
      console.log('⚠️ GEOPOLITICAL RISK ELEVATED:');
      console.log('  • Consider: Defense stocks (LMT, RTX, BA)');
      console.log('  • Hedge with: Gold (GLD), Energy (XLE)');
      console.log('  • Avoid: European equities, Travel sector');
    }
    
    if (hasEconomic) {
      console.log('\n📊 ECONOMIC UNCERTAINTY:');
      console.log('  • Monitor: Fed policy, Bond yields');
      console.log('  • Rotate to: Quality, Dividend stocks');
      console.log('  • Reduce: High P/E growth stocks');
    }
    
    if (hasSupplyChain) {
      console.log('\n🚢 SUPPLY CHAIN STRESS:');
      console.log('  • Long: Logistics (FDX, UPS)');
      console.log('  • Short: Just-in-time manufacturers');
      console.log('  • Watch: Inventory builders (WMT, TGT)');
    }
    
    if (!hasGeopolitical && !hasEconomic && !hasSupplyChain) {
      console.log('✅ NORMAL MARKET CONDITIONS:');
      console.log('  • Focus on: Fundamentals and earnings');
      console.log('  • Opportunities in: Growth stocks, Tech');
      console.log('  • Consider: Increasing risk exposure');
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('\n✅ Test completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Run the test
testGlobalNewsAggregation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });