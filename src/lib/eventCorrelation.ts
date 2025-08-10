import { 
  MarketEvent, 
  MarketOpportunity, 
  IncidentType, 
  EventCategory 
} from '@/types/core';
import { 
  getSectorsBySymbol, 
  getSupplyChainImpact, 
  findIndirectOpportunities 
} from './sectors';

interface EventPattern {
  eventTypes: IncidentType[];
  impactMap: {
    [key: string]: {
      sectors: string[];
      direction: 'long' | 'short';
      timeHorizon: 'immediate' | 'short_term' | 'long_term';
      confidence: number;
      reasoning: string;
    }[];
  };
}

// Define event patterns with enhanced historical analogies and complex correlations
const EVENT_PATTERNS: EventPattern[] = [
  {
    eventTypes: ['pandemic', 'climate_event'],
    impactMap: {
      pandemic: [
        {
          sectors: ['Remote Work', 'Cloud Services', 'E-commerce', 'Streaming Media'],
          direction: 'long',
          timeHorizon: 'short_term',
          confidence: 0.85,
          reasoning: 'COVID-19 pattern: Remote work adoption accelerates 5-10 years overnight'
        },
        {
          sectors: ['Travel & Hospitality', 'Real Estate', 'Supply Chain & Logistics'],
          direction: 'short',
          timeHorizon: 'immediate',
          confidence: 0.9,
          reasoning: 'Lockdown cascade: Travel -90%, Commercial RE vacancy +50%, Global trade disrupted'
        },
        {
          sectors: ['Healthcare', 'Pharmaceuticals', 'Biotech'],
          direction: 'long',
          timeHorizon: 'immediate',
          confidence: 0.85,
          reasoning: 'Healthcare surge: Hospital capacity crisis, vaccine race, biotech innovation boom'
        },
        {
          sectors: ['Food Delivery', 'Home Improvement', 'Gaming'],
          direction: 'long',
          timeHorizon: 'short_term',
          confidence: 0.8,
          reasoning: 'Stay-at-home economy: DoorDash +300%, Home Depot +30%, Gaming engagement +50%'
        }
      ],
      climate_event: [
        {
          sectors: ['Renewable Energy', 'Electric Vehicles', 'Battery Tech'],
          direction: 'long',
          timeHorizon: 'long_term',
          confidence: 0.8,
          reasoning: 'Climate catalyst: Policy acceleration, ESG mandates, green infrastructure spending'
        },
        {
          sectors: ['Insurance', 'Coastal Real Estate', 'Agriculture'],
          direction: 'short',
          timeHorizon: 'short_term',
          confidence: 0.75,
          reasoning: 'Physical risk materialization: Insurance retreat, property devaluation, crop failures'
        },
        {
          sectors: ['Water Infrastructure', 'Climate Tech', 'Carbon Credits'],
          direction: 'long',
          timeHorizon: 'long_term',
          confidence: 0.7,
          reasoning: 'Adaptation economy: Water scarcity solutions, carbon markets, resilience tech'
        }
      ]
    }
  },
  {
    eventTypes: ['technology_shift'],
    impactMap: {
      technology_shift: [
        {
          sectors: ['AI/ML', 'Semiconductors', 'Cloud Services'],
          direction: 'long',
          timeHorizon: 'long_term',
          confidence: 0.9,
          reasoning: 'AI revolution driving chip demand and cloud computing growth'
        },
        {
          sectors: ['Data Centers', 'Cybersecurity'],
          direction: 'long',
          timeHorizon: 'short_term',
          confidence: 0.85,
          reasoning: 'Increased infrastructure needs for AI workloads'
        }
      ]
    }
  },
  {
    eventTypes: ['regulation_change'],
    impactMap: {
      regulation_change: [
        {
          sectors: ['Fintech', 'Cryptocurrency'],
          direction: 'short',
          timeHorizon: 'immediate',
          confidence: 0.7,
          reasoning: 'Regulatory uncertainty typically impacts fintech negatively short-term'
        },
        {
          sectors: ['Healthcare', 'Pharmaceuticals'],
          direction: 'long',
          timeHorizon: 'long_term',
          confidence: 0.65,
          reasoning: 'Healthcare regulations often create barriers to entry'
        }
      ]
    }
  },
  {
    eventTypes: ['economic_indicator'],
    impactMap: {
      economic_indicator: [
        {
          sectors: ['Technology', 'Consumer Discretionary'],
          direction: 'short',
          timeHorizon: 'short_term',
          confidence: 0.75,
          reasoning: 'Rate hikes typically hurt growth stocks'
        },
        {
          sectors: ['Financial Services', 'Banking'],
          direction: 'long',
          timeHorizon: 'short_term',
          confidence: 0.8,
          reasoning: 'Banks benefit from higher interest rates'
        }
      ]
    }
  },
  {
    eventTypes: ['geopolitical'],
    impactMap: {
      geopolitical: [
        {
          sectors: ['Defense', 'Cybersecurity'],
          direction: 'long',
          timeHorizon: 'immediate',
          confidence: 0.85,
          reasoning: 'Geopolitical tensions increase defense and security spending'
        },
        {
          sectors: ['Supply Chain & Logistics', 'Semiconductors'],
          direction: 'short',
          timeHorizon: 'short_term',
          confidence: 0.7,
          reasoning: 'Supply chain disruptions from geopolitical events'
        },
        {
          sectors: ['Commodities', 'Energy'],
          direction: 'long',
          timeHorizon: 'immediate',
          confidence: 0.8,
          reasoning: 'Commodity prices typically spike during geopolitical tensions'
        }
      ]
    }
  },
  {
    eventTypes: ['supply_chain'],
    impactMap: {
      supply_chain: [
        {
          sectors: ['Supply Chain & Logistics'],
          direction: 'long',
          timeHorizon: 'short_term',
          confidence: 0.75,
          reasoning: 'Supply chain issues increase demand for logistics solutions'
        },
        {
          sectors: ['Manufacturing', 'Automotive'],
          direction: 'short',
          timeHorizon: 'immediate',
          confidence: 0.8,
          reasoning: 'Production disruptions from supply chain issues'
        }
      ]
    }
  },
  {
    eventTypes: ['consumer_trend'],
    impactMap: {
      consumer_trend: [
        {
          sectors: ['E-commerce', 'Fintech', 'Streaming Media'],
          direction: 'long',
          timeHorizon: 'long_term',
          confidence: 0.7,
          reasoning: 'Digital transformation and changing consumer preferences'
        },
        {
          sectors: ['Traditional Retail', 'Cable TV'],
          direction: 'short',
          timeHorizon: 'long_term',
          confidence: 0.75,
          reasoning: 'Disruption from digital alternatives'
        }
      ]
    }
  }
];

export function categorizeEvent(event: Partial<MarketEvent>): EventCategory {
  const type = event.type;
  
  const companySpecific: IncidentType[] = [
    'layoffs', 'lawsuit', 'regulatory', 'product_recall', 
    'guidance_cut', 'guidance_raise', 'earnings_beat', 'earnings_miss',
    'mna', 'exec_change', 'downgrade', 'upgrade', 'security_breach'
  ];
  
  const macroEconomic: IncidentType[] = [
    'economic_indicator', 'commodity_shift'
  ];
  
  const environmental: IncidentType[] = [
    'climate_event', 'pandemic'
  ];
  
  const technological: IncidentType[] = [
    'technology_shift'
  ];
  
  const geopolitical: IncidentType[] = [
    'geopolitical', 'regulation_change'
  ];
  
  const social: IncidentType[] = [
    'consumer_trend'
  ];
  
  const sectorWide: IncidentType[] = [
    'supply_chain'
  ];
  
  if (type && companySpecific.includes(type)) return 'company_specific';
  if (type && macroEconomic.includes(type)) return 'macro_economic';
  if (type && environmental.includes(type)) return 'environmental';
  if (type && technological.includes(type)) return 'technological';
  if (type && geopolitical.includes(type)) return 'geopolitical';
  if (type && social.includes(type)) return 'social';
  if (type && sectorWide.includes(type)) return 'sector_wide';
  
  return 'company_specific';
}

export function analyzeEventImpact(event: MarketEvent): {
  directImpact: { sectors: string[]; symbols: string[] };
  indirectImpact: { sectors: string[]; symbols: string[] };
  correlatedSectors: string[];
} {
  const directSectors = new Set<string>(event.impactedSectors);
  const directSymbols = new Set<string>(event.impactedSymbols);
  const indirectSectors = new Set<string>();
  const indirectSymbols = new Set<string>();
  const correlatedSectors = new Set<string>();
  
  // Find patterns that match this event type
  const relevantPatterns = EVENT_PATTERNS.filter(
    pattern => pattern.eventTypes.includes(event.type)
  );
  
  for (const pattern of relevantPatterns) {
    const impacts = pattern.impactMap[event.type] || [];
    for (const impact of impacts) {
      impact.sectors.forEach(sector => {
        correlatedSectors.add(sector);
        
        // Get supply chain impacts
        const chainImpact = getSupplyChainImpact(sector);
        chainImpact.upstream.forEach(s => indirectSectors.add(s));
        chainImpact.downstream.forEach(s => indirectSectors.add(s));
        chainImpact.symbols.forEach(s => indirectSymbols.add(s));
      });
    }
  }
  
  // For each directly impacted sector, find indirect opportunities
  for (const sector of event.impactedSectors) {
    const opportunities = findIndirectOpportunities(event.type, sector);
    for (const opp of opportunities) {
      indirectSectors.add(opp.sector);
      opp.symbols.forEach(s => indirectSymbols.add(s));
    }
  }
  
  return {
    directImpact: {
      sectors: Array.from(directSectors),
      symbols: Array.from(directSymbols)
    },
    indirectImpact: {
      sectors: Array.from(indirectSectors),
      symbols: Array.from(indirectSymbols)
    },
    correlatedSectors: Array.from(correlatedSectors)
  };
}

export function generateOpportunities(
  events: MarketEvent[]
): MarketOpportunity[] {
  const opportunities: MarketOpportunity[] = [];
  const now = new Date().toISOString();
  
  for (const event of events) {
    const impact = analyzeEventImpact(event);
    const patterns = EVENT_PATTERNS.filter(
      p => p.eventTypes.includes(event.type)
    );
    
    for (const pattern of patterns) {
      const impacts = pattern.impactMap[event.type] || [];
      
      for (const impactConfig of impacts) {
        // Direct opportunities
        const directSymbols = impact.directImpact.symbols.filter(
          s => impactConfig.sectors.some(sector => 
            getSectorsBySymbol(s).includes(sector)
          )
        );
        
        if (directSymbols.length > 0) {
          const opportunity: MarketOpportunity = {
            id: `opp_${event.id}_direct_${Date.now()}`,
            createdAt: now,
            eventIds: [event.id],
            symbols: directSymbols.slice(0, 10), // Top 10 symbols
            sectors: impactConfig.sectors,
            type: 'direct',
            direction: impactConfig.direction,
            timeframe: getTimeframe(impactConfig.timeHorizon),
            confidence: impactConfig.confidence * (event.magnitude === 'critical' ? 1.2 : 
                        event.magnitude === 'high' ? 1.1 : 
                        event.magnitude === 'medium' ? 1.0 : 0.9),
            reasoning: `${impactConfig.reasoning}. Event: ${event.title}`,
            expectedReturn: calculateExpectedReturn(
              impactConfig.direction,
              impactConfig.confidence,
              event.magnitude
            ),
            riskScore: calculateRiskScore(event.magnitude, impactConfig.timeHorizon),
            status: 'active'
          };
          
          opportunities.push(opportunity);
        }
        
        // Indirect opportunities (with lower confidence)
        const indirectSymbols = impact.indirectImpact.symbols.filter(
          s => impactConfig.sectors.some(sector => {
            const symbolSectors = getSectorsBySymbol(s);
            const chainImpact = getSupplyChainImpact(sector);
            return chainImpact.upstream.some(up => symbolSectors.includes(up)) ||
                   chainImpact.downstream.some(down => symbolSectors.includes(down));
          })
        );
        
        if (indirectSymbols.length > 0) {
          const opportunity: MarketOpportunity = {
            id: `opp_${event.id}_indirect_${Date.now()}`,
            createdAt: now,
            eventIds: [event.id],
            symbols: indirectSymbols.slice(0, 10),
            sectors: Array.from(new Set(
              indirectSymbols.flatMap(s => getSectorsBySymbol(s))
            )),
            type: 'indirect',
            direction: impactConfig.direction,
            timeframe: getTimeframe(impactConfig.timeHorizon),
            confidence: impactConfig.confidence * 0.7, // Lower confidence for indirect
            reasoning: `Indirect impact from ${impactConfig.reasoning}. Event: ${event.title}`,
            expectedReturn: calculateExpectedReturn(
              impactConfig.direction,
              impactConfig.confidence * 0.7,
              event.magnitude
            ),
            riskScore: calculateRiskScore(event.magnitude, impactConfig.timeHorizon) * 1.3,
            status: 'active'
          };
          
          opportunities.push(opportunity);
        }
      }
    }
  }
  
  // Find correlation opportunities (multiple events reinforcing same direction)
  const correlatedOpps = findCorrelatedOpportunities(events, opportunities);
  opportunities.push(...correlatedOpps);
  
  return opportunities;
}

function getTimeframe(horizon: 'immediate' | 'short_term' | 'long_term'): {
  entry: string;
  exit: string;
  horizon: 'days' | 'weeks' | 'months';
} {
  const now = new Date();
  const entry = now.toISOString().slice(0, 10);
  
  switch (horizon) {
    case 'immediate':
      const immExit = new Date(now);
      immExit.setDate(immExit.getDate() + 7);
      return {
        entry,
        exit: immExit.toISOString().slice(0, 10),
        horizon: 'days'
      };
    case 'short_term':
      const shortExit = new Date(now);
      shortExit.setDate(shortExit.getDate() + 30);
      return {
        entry,
        exit: shortExit.toISOString().slice(0, 10),
        horizon: 'weeks'
      };
    case 'long_term':
      const longExit = new Date(now);
      longExit.setMonth(longExit.getMonth() + 6);
      return {
        entry,
        exit: longExit.toISOString().slice(0, 10),
        horizon: 'months'
      };
  }
}

function calculateExpectedReturn(
  direction: 'long' | 'short',
  confidence: number,
  magnitude: 'low' | 'medium' | 'high' | 'critical'
): { min: number; max: number; expected: number } {
  const magnitudeMultiplier = 
    magnitude === 'critical' ? 3 :
    magnitude === 'high' ? 2 :
    magnitude === 'medium' ? 1.5 : 1;
  
  const baseReturn = confidence * magnitudeMultiplier * 0.05; // 5% base
  
  return {
    min: baseReturn * 0.5,
    max: baseReturn * 2,
    expected: baseReturn
  };
}

function calculateRiskScore(
  magnitude: 'low' | 'medium' | 'high' | 'critical',
  horizon: 'immediate' | 'short_term' | 'long_term'
): number {
  const magnitudeRisk = 
    magnitude === 'critical' ? 0.8 :
    magnitude === 'high' ? 0.6 :
    magnitude === 'medium' ? 0.4 : 0.2;
  
  const horizonRisk = 
    horizon === 'immediate' ? 0.3 :
    horizon === 'short_term' ? 0.5 : 0.7;
  
  return (magnitudeRisk + horizonRisk) / 2;
}

function findCorrelatedOpportunities(
  events: MarketEvent[],
  existingOpps: MarketOpportunity[]
): MarketOpportunity[] {
  const correlatedOpps: MarketOpportunity[] = [];
  const symbolDirectionMap = new Map<string, { long: number; short: number }>();
  
  // Count directions for each symbol across opportunities
  for (const opp of existingOpps) {
    for (const symbol of opp.symbols) {
      if (!symbolDirectionMap.has(symbol)) {
        symbolDirectionMap.set(symbol, { long: 0, short: 0 });
      }
      const counts = symbolDirectionMap.get(symbol)!;
      counts[opp.direction] += opp.confidence;
    }
  }
  
  // Find symbols with strong directional consensus
  const consensusSymbols: { symbol: string; direction: 'long' | 'short'; strength: number }[] = [];
  
  for (const [symbol, counts] of symbolDirectionMap.entries()) {
    const totalSignal = counts.long + counts.short;
    if (totalSignal > 1.5) { // Multiple signals
      if (counts.long > counts.short * 2) {
        consensusSymbols.push({ 
          symbol, 
          direction: 'long', 
          strength: counts.long / totalSignal 
        });
      } else if (counts.short > counts.long * 2) {
        consensusSymbols.push({ 
          symbol, 
          direction: 'short', 
          strength: counts.short / totalSignal 
        });
      }
    }
  }
  
  // Group by direction and create correlation opportunities
  const longSymbols = consensusSymbols.filter(c => c.direction === 'long');
  const shortSymbols = consensusSymbols.filter(c => c.direction === 'short');
  
  if (longSymbols.length >= 3) {
    const avgStrength = longSymbols.reduce((sum, s) => sum + s.strength, 0) / longSymbols.length;
    correlatedOpps.push({
      id: `opp_corr_long_${Date.now()}`,
      createdAt: new Date().toISOString(),
      eventIds: events.map(e => e.id),
      symbols: longSymbols.slice(0, 10).map(s => s.symbol),
      sectors: Array.from(new Set(
        longSymbols.flatMap(s => getSectorsBySymbol(s.symbol))
      )),
      type: 'correlation',
      direction: 'long',
      timeframe: getTimeframe('short_term'),
      confidence: Math.min(avgStrength * 1.2, 0.95),
      reasoning: 'Multiple correlated events suggesting bullish momentum across related sectors',
      expectedReturn: {
        min: avgStrength * 0.03,
        max: avgStrength * 0.15,
        expected: avgStrength * 0.08
      },
      riskScore: 0.4,
      status: 'active'
    });
  }
  
  if (shortSymbols.length >= 3) {
    const avgStrength = shortSymbols.reduce((sum, s) => sum + s.strength, 0) / shortSymbols.length;
    correlatedOpps.push({
      id: `opp_corr_short_${Date.now()}`,
      createdAt: new Date().toISOString(),
      eventIds: events.map(e => e.id),
      symbols: shortSymbols.slice(0, 10).map(s => s.symbol),
      sectors: Array.from(new Set(
        shortSymbols.flatMap(s => getSectorsBySymbol(s.symbol))
      )),
      type: 'correlation',
      direction: 'short',
      timeframe: getTimeframe('short_term'),
      confidence: Math.min(avgStrength * 1.2, 0.95),
      reasoning: 'Multiple correlated events suggesting bearish pressure across related sectors',
      expectedReturn: {
        min: avgStrength * 0.03,
        max: avgStrength * 0.15,
        expected: avgStrength * 0.08
      },
      riskScore: 0.4,
      status: 'active'
    });
  }
  
  return correlatedOpps;
}

// Advanced pattern detection with machine learning-like scoring
export function detectComplexPatterns(
  events: MarketEvent[],
  historicalPerformance?: any
): {
  pattern: string;
  confidence: number;
  predictedImpact: 'bullish' | 'bearish' | 'volatile';
  affectedSectors: string[];
  timeHorizon: string;
  historicalAnalogy?: string;
}[] {
  const patterns: any[] = [];
  
  // Pattern 1: Contagion Risk Detection
  const financialStressEvents = events.filter(e => 
    e.type === 'economic_indicator' || 
    e.title?.toLowerCase().includes('bank') ||
    e.title?.toLowerCase().includes('default') ||
    e.title?.toLowerCase().includes('credit')
  );
  
  if (financialStressEvents.length >= 2) {
    const contagionRisk = financialStressEvents.filter(e =>
      e.title?.toLowerCase().includes('contagion') ||
      e.title?.toLowerCase().includes('systemic')
    ).length > 0;
    
    patterns.push({
      pattern: 'Financial Contagion Risk',
      confidence: contagionRisk ? 0.85 : 0.65,
      predictedImpact: 'bearish',
      affectedSectors: ['Banking', 'Financial Services', 'Real Estate', 'Insurance'],
      timeHorizon: '1-3 weeks',
      historicalAnalogy: '2008 Financial Crisis / 2023 Regional Bank Crisis'
    });
  }
  
  // Pattern 2: Commodity Supercycle Detection
  const commodityEvents = events.filter(e =>
    e.type === 'commodity_shift' ||
    e.title?.toLowerCase().includes('commodity') ||
    e.title?.toLowerCase().includes('oil') ||
    e.title?.toLowerCase().includes('gold')
  );
  
  const supplyChainEvents = events.filter(e => e.type === 'supply_chain');
  
  if (commodityEvents.length >= 2 && supplyChainEvents.length >= 1) {
    patterns.push({
      pattern: 'Commodity Supercycle Initiation',
      confidence: 0.75,
      predictedImpact: 'bullish',
      affectedSectors: ['Commodities', 'Mining', 'Energy', 'Agriculture', 'Materials'],
      timeHorizon: '6-12 months',
      historicalAnalogy: '2000s China-driven commodity boom'
    });
  }
  
  // Pattern 3: Tech Bubble Formation
  const techEvents = events.filter(e =>
    e.type === 'technology_shift' ||
    e.category === 'technological'
  );
  
  const aiMentions = events.filter(e =>
    e.title?.toLowerCase().includes('ai') ||
    e.title?.toLowerCase().includes('artificial intelligence')
  ).length;
  
  if (techEvents.length >= 3 && aiMentions >= 2) {
    patterns.push({
      pattern: 'Technology Bubble Formation',
      confidence: 0.7,
      predictedImpact: 'volatile',
      affectedSectors: ['AI/ML', 'Semiconductors', 'Cloud Services', 'Software'],
      timeHorizon: '3-6 months',
      historicalAnalogy: '1999 Dot-com bubble / 2021 SPAC bubble'
    });
  }
  
  // Pattern 4: Geopolitical Cascade
  const geoEvents = events.filter(e => e.category === 'geopolitical');
  const militaryActions = geoEvents.filter(e =>
    e.title?.toLowerCase().includes('military') ||
    e.title?.toLowerCase().includes('missile') ||
    e.title?.toLowerCase().includes('attack')
  );
  
  if (geoEvents.length >= 3 && militaryActions.length >= 1) {
    patterns.push({
      pattern: 'Geopolitical Escalation Cascade',
      confidence: 0.8,
      predictedImpact: 'bearish',
      affectedSectors: ['Defense', 'Energy', 'Commodities', 'Safe Havens'],
      timeHorizon: 'Immediate',
      historicalAnalogy: '1973 Oil Crisis / 1990 Gulf War'
    });
  }
  
  // Pattern 5: Deflationary Spiral
  const deflationarySignals = events.filter(e =>
    e.title?.toLowerCase().includes('deflation') ||
    e.title?.toLowerCase().includes('demand destruction') ||
    e.title?.toLowerCase().includes('recession')
  );
  
  const creditEvents = events.filter(e =>
    e.title?.toLowerCase().includes('credit') ||
    e.title?.toLowerCase().includes('liquidity')
  );
  
  if (deflationarySignals.length >= 2 && creditEvents.length >= 1) {
    patterns.push({
      pattern: 'Deflationary Spiral Risk',
      confidence: 0.65,
      predictedImpact: 'bearish',
      affectedSectors: ['Consumer Discretionary', 'Real Estate', 'Commodities', 'Small Caps'],
      timeHorizon: '3-6 months',
      historicalAnalogy: 'Japan 1990s / Europe 2010s'
    });
  }
  
  // Pattern 6: Emerging Market Crisis
  const emEvents = events.filter(e =>
    e.title?.toLowerCase().includes('emerging market') ||
    e.title?.toLowerCase().includes('currency crisis') ||
    e.title?.toLowerCase().includes('capital flight')
  );
  
  const dollarStrength = events.filter(e =>
    e.title?.toLowerCase().includes('dollar') &&
    e.title?.toLowerCase().includes('strong')
  );
  
  if (emEvents.length >= 1 && dollarStrength.length >= 1) {
    patterns.push({
      pattern: 'Emerging Market Crisis',
      confidence: 0.7,
      predictedImpact: 'bearish',
      affectedSectors: ['Emerging Markets', 'Commodities', 'International Banks'],
      timeHorizon: '1-3 months',
      historicalAnalogy: '1997 Asian Financial Crisis / 2013 Taper Tantrum'
    });
  }
  
  // Pattern 7: Innovation Disruption Wave
  const disruptiveEvents = events.filter(e =>
    e.title?.toLowerCase().includes('disruption') ||
    e.title?.toLowerCase().includes('breakthrough') ||
    e.title?.toLowerCase().includes('revolution')
  );
  
  if (disruptiveEvents.length >= 3) {
    patterns.push({
      pattern: 'Innovation Disruption Wave',
      confidence: 0.6,
      predictedImpact: 'volatile',
      affectedSectors: ['Technology', 'Healthcare', 'Financial Services', 'Retail'],
      timeHorizon: '6-18 months',
      historicalAnalogy: 'Internet Revolution 1995-2000 / Mobile Revolution 2007-2012'
    });
  }
  
  // Pattern 8: Black Swan Convergence
  const unusualEventCount = events.filter(e => 
    e.magnitude === 'critical' && 
    e.category !== 'company_specific'
  ).length;
  
  const multiCategoryEvents = new Set(events.map(e => e.category)).size;
  
  if (unusualEventCount >= 4 && multiCategoryEvents >= 5) {
    patterns.push({
      pattern: 'Black Swan Convergence',
      confidence: 0.9,
      predictedImpact: 'volatile',
      affectedSectors: ['All Sectors'],
      timeHorizon: 'Immediate',
      historicalAnalogy: 'March 2020 COVID Crash / September 2008 Lehman Collapse'
    });
  }
  
  // Add correlation strength based on event clustering
  patterns.forEach(pattern => {
    const relatedEvents = events.filter(e => 
      pattern.affectedSectors.some((sector: string) => 
        e.impactedSectors?.includes(sector)
      )
    );
    
    // Boost confidence if events are clustered in time
    const timeCluster = relatedEvents.filter(e => {
      const eventDate = new Date(e.date);
      const now = new Date();
      const daysDiff = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });
    
    if (timeCluster.length > relatedEvents.length * 0.6) {
      pattern.confidence = Math.min(pattern.confidence * 1.2, 0.95);
    }
  });
  
  return patterns.sort((a, b) => b.confidence - a.confidence);
}

// Cross-asset correlation detection
export function detectCrossAssetCorrelations(
  events: MarketEvent[],
  commodityData: any
): {
  correlation: string;
  strength: number;
  assets: string[];
  direction: 'positive' | 'negative' | 'diverging';
  tradingStrategy: string;
}[] {
  const correlations: any[] = [];
  
  // Dollar-Commodity Inverse Correlation
  const dollarEvents = events.filter(e => 
    e.title?.toLowerCase().includes('dollar') || 
    e.title?.toLowerCase().includes('dxy')
  );
  
  if (dollarEvents.length > 0 && commodityData) {
    const dollarStrengthening = dollarEvents.some(e => 
      e.title?.toLowerCase().includes('strong') || 
      e.title?.toLowerCase().includes('rally')
    );
    
    correlations.push({
      correlation: 'Dollar-Commodity Inverse',
      strength: 0.75,
      assets: ['DXY', 'Gold', 'Oil', 'Copper'],
      direction: dollarStrengthening ? 'negative' : 'positive',
      tradingStrategy: dollarStrengthening 
        ? 'Short commodities (DJP), Long USD (UUP)'
        : 'Long commodities (DJP), Short USD (UUP)'
    });
  }
  
  // Equity-Bond Correlation Regime
  const equityEvents = events.filter(e => 
    e.impactedSectors?.includes('Technology') || 
    e.impactedSectors?.includes('Financial Services')
  );
  
  const bondEvents = events.filter(e => 
    e.title?.toLowerCase().includes('yield') || 
    e.title?.toLowerCase().includes('treasury')
  );
  
  if (equityEvents.length > 0 && bondEvents.length > 0) {
    const riskOn = equityEvents.some(e => e.type === 'earnings_beat');
    
    correlations.push({
      correlation: 'Stock-Bond Correlation',
      strength: 0.65,
      assets: ['SPY', 'QQQ', 'TLT', 'AGG'],
      direction: riskOn ? 'diverging' : 'positive',
      tradingStrategy: riskOn 
        ? 'Risk-on: Long equities, Short bonds'
        : 'Risk-off: Long bonds, reduce equity exposure'
    });
  }
  
  // Crypto-Tech Correlation
  const cryptoEvents = events.filter(e => 
    e.title?.toLowerCase().includes('bitcoin') || 
    e.title?.toLowerCase().includes('crypto')
  );
  
  const techStockEvents = events.filter(e => 
    e.category === 'technological' || 
    e.impactedSymbols?.some(s => ['NVDA', 'TSLA', 'SQ'].includes(s))
  );
  
  if (cryptoEvents.length > 0 && techStockEvents.length > 0) {
    correlations.push({
      correlation: 'Crypto-Tech Correlation',
      strength: 0.7,
      assets: ['BTC', 'ETH', 'ARKK', 'QQQ'],
      direction: 'positive',
      tradingStrategy: 'Correlated risk assets: Trade together or hedge one with the other'
    });
  }
  
  // Gold-Real Rates Correlation
  const realRateEvents = events.filter(e => 
    e.title?.toLowerCase().includes('inflation') || 
    e.title?.toLowerCase().includes('tips')
  );
  
  if (realRateEvents.length > 0 && commodityData?.gold) {
    const inflationRising = realRateEvents.some(e => 
      e.title?.toLowerCase().includes('rising') || 
      e.title?.toLowerCase().includes('surge')
    );
    
    correlations.push({
      correlation: 'Gold-Real Rates',
      strength: 0.8,
      assets: ['GLD', 'TIP', 'STIP'],
      direction: inflationRising ? 'negative' : 'positive',
      tradingStrategy: inflationRising 
        ? 'Negative real rates favor gold: Long GLD, Short TLT'
        : 'Rising real rates hurt gold: Short GLD, Long TIPS'
    });
  }
  
  return correlations;
}