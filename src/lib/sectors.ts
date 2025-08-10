import { SectorMapping } from '@/types/core';

export const SECTOR_MAPPINGS: SectorMapping[] = [
  {
    sector: 'Technology',
    symbols: ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE'],
    relatedSectors: ['Semiconductors', 'Cloud Services', 'Consumer Electronics', 'Software'],
    supplyChain: {
      upstream: ['Semiconductors', 'Raw Materials', 'Manufacturing'],
      downstream: ['Retail', 'Enterprise', 'Consumer Services']
    }
  },
  {
    sector: 'Semiconductors',
    symbols: ['NVDA', 'AMD', 'INTC', 'TSM', 'AVGO', 'QCOM', 'TXN', 'MU', 'AMAT', 'LRCX'],
    relatedSectors: ['Technology', 'AI/ML', 'Data Centers', 'Automotive'],
    supplyChain: {
      upstream: ['Raw Materials', 'Rare Earth Metals', 'Manufacturing Equipment'],
      downstream: ['Technology', 'Automotive', 'Consumer Electronics', 'Data Centers']
    }
  },
  {
    sector: 'Remote Work',
    symbols: ['ZM', 'MSFT', 'CRM', 'TEAM', 'DOCU', 'NET', 'OKTA', 'CRWD', 'ZS'],
    relatedSectors: ['Technology', 'Cloud Services', 'Cybersecurity'],
    supplyChain: {
      upstream: ['Cloud Infrastructure', 'Software Development'],
      downstream: ['Enterprise', 'Education', 'Healthcare']
    }
  },
  {
    sector: 'E-commerce',
    symbols: ['AMZN', 'SHOP', 'EBAY', 'ETSY', 'MELI', 'SE', 'WMT', 'TGT', 'CPNG'],
    relatedSectors: ['Logistics', 'Payments', 'Cloud Services', 'Retail'],
    supplyChain: {
      upstream: ['Manufacturing', 'Logistics', 'Technology'],
      downstream: ['Consumer', 'Last-Mile Delivery', 'Payments']
    }
  },
  {
    sector: 'Electric Vehicles',
    symbols: ['TSLA', 'RIVN', 'LCID', 'NIO', 'XPEV', 'LI', 'GM', 'F', 'STLA'],
    relatedSectors: ['Battery Technology', 'Semiconductors', 'Renewable Energy', 'Automotive'],
    supplyChain: {
      upstream: ['Battery Technology', 'Semiconductors', 'Raw Materials', 'Lithium Mining'],
      downstream: ['Charging Infrastructure', 'Energy Grid', 'Consumer']
    }
  },
  {
    sector: 'Renewable Energy',
    symbols: ['ENPH', 'SEDG', 'RUN', 'NEE', 'BEP', 'AES', 'PLUG', 'FSLR', 'SPWR'],
    relatedSectors: ['Electric Vehicles', 'Energy Storage', 'Utilities', 'Infrastructure'],
    supplyChain: {
      upstream: ['Solar Panels', 'Wind Turbines', 'Raw Materials'],
      downstream: ['Utilities', 'Electric Vehicles', 'Energy Grid']
    }
  },
  {
    sector: 'Healthcare',
    symbols: ['JNJ', 'PFE', 'UNH', 'CVS', 'ABBV', 'MRK', 'TMO', 'DHR', 'LLY', 'AMGN'],
    relatedSectors: ['Biotech', 'Pharmaceuticals', 'Medical Devices', 'Healthcare Services'],
    supplyChain: {
      upstream: ['Research', 'Clinical Trials', 'Manufacturing'],
      downstream: ['Hospitals', 'Pharmacies', 'Patients']
    }
  },
  {
    sector: 'Streaming Media',
    symbols: ['NFLX', 'DIS', 'WBD', 'PARA', 'ROKU', 'SPOT', 'AAPL', 'AMZN', 'GOOGL'],
    relatedSectors: ['Entertainment', 'Technology', 'Telecommunications'],
    supplyChain: {
      upstream: ['Content Creation', 'Production Studios', 'Technology Infrastructure'],
      downstream: ['Consumer', 'Advertising', 'Telecommunications']
    }
  },
  {
    sector: 'Fintech',
    symbols: ['PYPL', 'SQ', 'COIN', 'SOFI', 'AFRM', 'UPST', 'V', 'MA', 'AXP'],
    relatedSectors: ['Banking', 'Technology', 'E-commerce', 'Cryptocurrency'],
    supplyChain: {
      upstream: ['Banking Infrastructure', 'Technology', 'Regulatory'],
      downstream: ['Consumer', 'Merchants', 'E-commerce']
    }
  },
  {
    sector: 'Cloud Services',
    symbols: ['AMZN', 'MSFT', 'GOOGL', 'ORCL', 'CRM', 'NOW', 'SNOW', 'MDB', 'DDOG'],
    relatedSectors: ['Technology', 'Enterprise Software', 'Data Centers', 'AI/ML'],
    supplyChain: {
      upstream: ['Data Centers', 'Semiconductors', 'Networking Equipment'],
      downstream: ['Enterprise', 'Startups', 'Government']
    }
  },
  {
    sector: 'Cybersecurity',
    symbols: ['CRWD', 'PANW', 'ZS', 'OKTA', 'S', 'NET', 'FTNT', 'CYBR', 'RPD'],
    relatedSectors: ['Technology', 'Cloud Services', 'Enterprise Software'],
    supplyChain: {
      upstream: ['Software Development', 'Threat Intelligence'],
      downstream: ['Enterprise', 'Government', 'Financial Services']
    }
  },
  {
    sector: 'Real Estate',
    symbols: ['AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'SPG', 'O', 'AVB', 'EQR'],
    relatedSectors: ['Construction', 'Financial Services', 'Retail', 'Hospitality'],
    supplyChain: {
      upstream: ['Construction', 'Materials', 'Architecture'],
      downstream: ['Retail', 'Residential', 'Commercial Tenants']
    }
  },
  {
    sector: 'Supply Chain & Logistics',
    symbols: ['FDX', 'UPS', 'XPO', 'CHRW', 'JBHT', 'EXPD', 'ZIM', 'MATX'],
    relatedSectors: ['E-commerce', 'Manufacturing', 'Retail', 'Transportation'],
    supplyChain: {
      upstream: ['Transportation', 'Warehousing', 'Technology'],
      downstream: ['E-commerce', 'Retail', 'Manufacturing']
    }
  },
  {
    sector: 'AI/ML',
    symbols: ['NVDA', 'MSFT', 'GOOGL', 'META', 'PLTR', 'AI', 'SNOW', 'PATH', 'DDOG'],
    relatedSectors: ['Semiconductors', 'Cloud Services', 'Technology', 'Data Centers'],
    supplyChain: {
      upstream: ['Semiconductors', 'Cloud Infrastructure', 'Data'],
      downstream: ['Enterprise', 'Consumer Apps', 'Healthcare', 'Finance']
    }
  },
  {
    sector: 'Travel & Hospitality',
    symbols: ['ABNB', 'BKNG', 'EXPE', 'MAR', 'HLT', 'UAL', 'DAL', 'LUV', 'AAL'],
    relatedSectors: ['Airlines', 'Hotels', 'Real Estate', 'Entertainment'],
    supplyChain: {
      upstream: ['Aviation', 'Real Estate', 'Technology Platforms'],
      downstream: ['Tourism', 'Business Travel', 'Consumer']
    }
  }
];

export function getSectorsBySymbol(symbol: string): string[] {
  return SECTOR_MAPPINGS
    .filter(sector => sector.symbols.includes(symbol))
    .map(sector => sector.sector);
}

export function getRelatedSymbols(symbol: string): string[] {
  const sectors = getSectorsBySymbol(symbol);
  const relatedSymbols = new Set<string>();
  
  for (const sector of sectors) {
    const mapping = SECTOR_MAPPINGS.find(m => m.sector === sector);
    if (mapping) {
      mapping.symbols.forEach(s => relatedSymbols.add(s));
      
      // Add symbols from related sectors
      for (const relatedSector of mapping.relatedSectors) {
        const related = SECTOR_MAPPINGS.find(m => m.sector === relatedSector);
        if (related) {
          related.symbols.forEach(s => relatedSymbols.add(s));
        }
      }
    }
  }
  
  relatedSymbols.delete(symbol); // Remove the original symbol
  return Array.from(relatedSymbols);
}

export function getSupplyChainImpact(sector: string): {
  upstream: string[];
  downstream: string[];
  symbols: string[];
} {
  const mapping = SECTOR_MAPPINGS.find(m => m.sector === sector);
  if (!mapping) return { upstream: [], downstream: [], symbols: [] };
  
  const impactedSymbols = new Set<string>();
  
  // Add direct sector symbols
  mapping.symbols.forEach(s => impactedSymbols.add(s));
  
  // Add upstream symbols
  if (mapping.supplyChain?.upstream) {
    for (const upstreamSector of mapping.supplyChain.upstream) {
      const upstream = SECTOR_MAPPINGS.find(m => m.sector === upstreamSector);
      if (upstream) {
        upstream.symbols.forEach(s => impactedSymbols.add(s));
      }
    }
  }
  
  // Add downstream symbols
  if (mapping.supplyChain?.downstream) {
    for (const downstreamSector of mapping.supplyChain.downstream) {
      const downstream = SECTOR_MAPPINGS.find(m => m.sector === downstreamSector);
      if (downstream) {
        downstream.symbols.forEach(s => impactedSymbols.add(s));
      }
    }
  }
  
  return {
    upstream: mapping.supplyChain?.upstream || [],
    downstream: mapping.supplyChain?.downstream || [],
    symbols: Array.from(impactedSymbols)
  };
}

export function findIndirectOpportunities(
  eventType: string,
  directSector: string
): { sector: string; symbols: string[]; relationship: string }[] {
  const opportunities: { sector: string; symbols: string[]; relationship: string }[] = [];
  const sectorMapping = SECTOR_MAPPINGS.find(m => m.sector === directSector);
  
  if (!sectorMapping) return opportunities;
  
  // Check upstream impacts
  if (sectorMapping.supplyChain?.upstream) {
    for (const upstreamSector of sectorMapping.supplyChain.upstream) {
      const upstream = SECTOR_MAPPINGS.find(m => m.sector === upstreamSector);
      if (upstream) {
        opportunities.push({
          sector: upstreamSector,
          symbols: upstream.symbols,
          relationship: 'upstream_supplier'
        });
      }
    }
  }
  
  // Check downstream impacts
  if (sectorMapping.supplyChain?.downstream) {
    for (const downstreamSector of sectorMapping.supplyChain.downstream) {
      const downstream = SECTOR_MAPPINGS.find(m => m.sector === downstreamSector);
      if (downstream) {
        opportunities.push({
          sector: downstreamSector,
          symbols: downstream.symbols,
          relationship: 'downstream_customer'
        });
      }
    }
  }
  
  // Check related sectors
  for (const relatedSector of sectorMapping.relatedSectors) {
    const related = SECTOR_MAPPINGS.find(m => m.sector === relatedSector);
    if (related && !opportunities.some(o => o.sector === relatedSector)) {
      opportunities.push({
        sector: relatedSector,
        symbols: related.symbols,
        relationship: 'related_sector'
      });
    }
  }
  
  return opportunities;
}