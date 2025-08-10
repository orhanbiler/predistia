export type IncidentType =
  | 'layoffs'
  | 'lawsuit'
  | 'regulatory'
  | 'product_recall'
  | 'guidance_cut'
  | 'guidance_raise'
  | 'earnings_beat'
  | 'earnings_miss'
  | 'mna'
  | 'exec_change'
  | 'downgrade'
  | 'upgrade'
  | 'security_breach'
  | 'pandemic'
  | 'supply_chain'
  | 'geopolitical'
  | 'climate_event'
  | 'technology_shift'
  | 'regulation_change'
  | 'economic_indicator'
  | 'commodity_shift'
  | 'consumer_trend'
  | 'other';

export type EventCategory = 
  | 'company_specific'
  | 'sector_wide'
  | 'macro_economic'
  | 'geopolitical'
  | 'technological'
  | 'environmental'
  | 'social';

export interface NewsItem {
  id: string; // yyyy-mm-dd_source_id or provider id
  date: string; // ISO date
  source: string;
  url?: string;
  title: string;
  summary?: string;
  symbols: string[];
}

export interface EODBar {
  symbol: string;
  date: string; // yyyy-mm-dd
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose?: number;
  volume?: number;
}

export interface Incident {
  id: string; // news id
  date: string;
  symbols: string[];
  type: IncidentType;
  score?: number; // confidence 0-1
}

export interface Signal {
  id: string; // symbol_date
  symbol: string;
  date: string; // yyyy-mm-dd
  incidentType: IncidentType;
  direction: 'long' | 'short';
  strength?: number; // 0..1
}

export interface ForwardReturn {
  symbol: string;
  signalDate: string; // yyyy-mm-dd
  fwdDays: number; // 20 or 60
  return: number; // pct (e.g. 0.05 for +5%)
  incidentType: IncidentType;
}

export interface BacktestMetrics {
  windowDays: number; // 20 or 60
  count: number;
  hitRate: number; // fraction > 0
  avgReturn: number;
  stdReturn: number;
  sharpeProxy: number; // avg/std
}

export interface ConfusionRow {
  incidentType: IncidentType;
  positive: number;
  negative: number;
}

export interface SectorMapping {
  sector: string;
  symbols: string[];
  relatedSectors: string[];
  supplyChain?: {
    upstream: string[];
    downstream: string[];
  };
}

export interface MarketEvent {
  id: string;
  date: string;
  type: IncidentType;
  category: EventCategory;
  title: string;
  description?: string;
  impactedSectors: string[];
  impactedSymbols: string[];
  correlatedEvents?: string[];
  magnitude: 'low' | 'medium' | 'high' | 'critical';
  timeHorizon: 'immediate' | 'short_term' | 'long_term';
}

export interface MarketOpportunity {
  id: string;
  createdAt: string;
  eventIds: string[];
  symbols: string[];
  sectors: string[];
  type: 'direct' | 'indirect' | 'correlation';
  direction: 'long' | 'short';
  timeframe: {
    entry: string;
    exit: string;
    horizon: 'days' | 'weeks' | 'months';
  };
  confidence: number;
  reasoning: string;
  expectedReturn?: {
    min: number;
    max: number;
    expected: number;
  };
  riskScore: number;
  status: 'active' | 'monitoring' | 'expired' | 'realized';
}

