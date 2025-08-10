# Predistia - Advanced Market Intelligence Platform

## Overview

Predistia is a comprehensive market intelligence platform that monitors global news and events to identify investment opportunities. Unlike traditional stock market analysis tools, Predistia focuses on understanding the broader impact of world events on markets - similar to how COVID-19 affected remote work stocks or how AI advancement drives semiconductor demand.

### Key Capabilities
- **Global Event Monitoring**: Tracks pandemic, supply chain, geopolitical, climate, technology shifts, regulatory changes, and economic indicators
- **Correlation Analysis**: Identifies indirect market impacts through supply chain mapping and sector relationships
- **Opportunity Generation**: Creates actionable investment opportunities with confidence scores and expected returns
- **Historical Backtesting**: Validates strategies using forward returns at t+20 and t+60 trading days

Environment Variables
---------------------
- `FIREBASE_PROJECT_ID`: GCP project ID.
- `FIREBASE_CLIENT_EMAIL`: Firebase service account client email.
- `FIREBASE_PRIVATE_KEY`: Firebase service account private key (surround with quotes; replace literal \n with actual newlines if needed).
- `NEWS_ALPHA_VANTAGE_KEY`: Alpha Vantage API key for news and EOD.
- `EMAIL_PROVIDER_API_KEY`: Postmark Server Token for transactional email.
- `EMAIL_FROM`: Verified sender address in Postmark (individual signature or domain). Required to send.
- `EMAIL_RECIPIENTS`: Comma-separated list of daily email recipients (used by `/api/cron/email` when no body `to` is provided).
- `LLM_PROVIDER_API_KEY`: Gemini (or other) API key for incident classification.
- News summarization: If `LLM_PROVIDER_API_KEY` is set, the daily email includes a Gemini 2.5 Flash-Lite summary of recent news; otherwise it falls back to headline bullets.
- `CRON_SECRET`: Shared secret for cron endpoints (`x-cron-secret` header).

Quick Start
-----------
1. Copy `.env.example` to `.env.local` and fill values.
2. Install deps: `pnpm i`.
3. Type-check: `pnpm typecheck` (or `pnpm type-script`).
4. Dev server: `pnpm dev`.
5. Vercel Cron: add jobs hitting `/api/cron/ingest`, `/api/cron/enrich`, `/api/cron/signals`, `/api/cron/email` with header `x-cron-secret: $CRON_SECRET`.

## New Features

### 🔗 Supply Chain & Sector Mapping
- 15+ major sectors with cross-relationships
- Upstream/downstream supply chain tracking
- Automated impact propagation analysis

### 💡 Enhanced Opportunity Types
- **Direct**: Immediate impact on mentioned companies
- **Indirect**: Secondary effects through supply chains
- **Correlation**: Multiple events reinforcing same direction

### 📊 Market Event Classification
- 20+ event types (pandemic, technology_shift, supply_chain, etc.)
- Event categories (company_specific, macro_economic, geopolitical, etc.)
- Magnitude assessment (low/medium/high/critical)

Data Model (Firestore)
----------------------
- `assets/{symbol}`: metadata per asset
- `news/{yyyymmdd}_{sourceId}`: normalized news items
- `eod/{symbol}/{date}`: EOD bars by symbol
- `incidents/{newsId}`: classified incidents
- `signals/{symbol}_{date}`: generated signals per asset/day
- `market_events/{eventId}`: enhanced event classification with impacts
- `opportunities/{oppId}`: investment opportunities with scoring
- `metrics/{runId}`: backtest outputs and aggregates

APIs
----
- `POST /api/cron/ingest`: Fetch news + EOD; idempotent upserts. Supports historical backfill with either `daysBack?: number` or `from?: 'YYYY-MM-DD'`, `to?: 'YYYY-MM-DD'`.
  - News sources: GDELT Doc API (global) and Google News RSS per ticker. Alpha Vantage NEWS is premium and not used.
- `POST /api/cron/enrich`: Classify news into incidents and market events with broader categorization
- `POST /api/cron/signals`: Generate signals from incidents
- `POST /api/cron/opportunities`: Analyze events and generate investment opportunities with confidence scoring
- `POST /api/cron/email`: Send enhanced daily intelligence report with opportunities
- `POST /api/cron/daily`: Orchestrates complete daily pipeline (ingest → enrich → signals → opportunities → email)
- `POST /api/backtest/run`: Compute forward returns and metrics for stored signals
  
Debug
-----
- `GET /api/debug/news?tickers=AAPL,MSFT&timespan=1d&limit=25&rssLimit=10`: Check news availability from GDELT and Google News RSS.
- `GET /api/debug/alpha?tickers=AAPL,MSFT&limit=5`: Check Alpha Vantage NEWS (may be premium-limited).

Backtest Metrics
----------------
- Forward windows: 20 and 60 trading days.
- Hit-rate: fraction of signals with positive forward return.
- Average return: mean forward return.
- Sharpe proxy: mean/standard deviation (unannualized, per-forward-window), reported for 20d and 60d.
- Confusion matrix: per incident type, counts of positive/negative forward returns.

## Usage Examples

### Web Interface
- `/dashboard` - Main dashboard with opportunities, events, and signals
- `/opportunities` - Detailed opportunity analysis with filtering
- `/assets/[symbol]` - Individual stock analysis

### Testing
```bash
# Test opportunity generation with historical events
pnpm test-opportunities

# Run backtest on existing signals
pnpm backtest
```

## How It Works

1. **Event Detection**: System monitors news from multiple sources and classifies them into market events
2. **Impact Analysis**: Each event is analyzed for direct and indirect impacts across sectors
3. **Opportunity Generation**: Based on historical patterns and correlations, opportunities are created
4. **Scoring & Ranking**: Opportunities are scored by confidence, expected return, and risk
5. **Daily Reports**: Top opportunities are sent via email with supporting analysis

### Example Opportunity Flow

**Event**: "Microsoft announces major AI partnership with OpenAI"
- **Classification**: technology_shift, magnitude: high
- **Direct Impact**: Long MSFT, AI/ML sector
- **Indirect Impact**: Long cloud providers (AWS, GCP), semiconductors (NVDA, AMD)
- **Supply Chain**: Upstream - chip manufacturers, Downstream - enterprise software
- **Generated Opportunities**: 
  - Direct: Long MSFT (85% confidence)
  - Indirect: Long NVDA (75% confidence)
  - Correlation: Long AI sector basket (70% confidence)

Notes & ToS
-----------
- Alpha Vantage has rate limits; batch your requests and cache results in Firestore
- Email via Postmark requires verified sender domain
- LLM classification is optional; enhanced rule-based classification included
- Client-side Firebase Web SDK + Analytics are initialized in `src/lib/firebaseClient.ts` and `src/app/FirebaseAnalytics.tsx`
- System designed for educational/research purposes - always do your own due diligence before investing
