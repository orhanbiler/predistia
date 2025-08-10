# Deployment & Setup Instructions

## Fix Firebase Permission Errors

### 1. Deploy Firestore Security Rules

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init firestore

# When prompted:
# - Select your existing Firebase project (predistia)
# - Use the firestore.rules file we created
# - Use default firestore.indexes.json

# Deploy the rules
firebase deploy --only firestore:rules
```

### 2. Populate Initial Data

The system needs data to work. Run these commands:

```bash
# Populate historical data (90 days)
pnpm backfill

# Or run a quick test ingestion
curl -X POST http://localhost:3000/api/cron/ingest \
  -H "x-cron-secret: dev" \
  -H "Content-Type: application/json" \
  -d '{"daysBack": 30, "tickers": ["NVDA", "AAPL", "MSFT", "GOOGL", "META"]}'

# Then enrich the data
curl -X POST http://localhost:3000/api/cron/enrich \
  -H "x-cron-secret: dev" \
  -H "Content-Type: application/json"

# Generate opportunities
curl -X POST http://localhost:3000/api/cron/opportunities \
  -H "x-cron-secret: dev" \
  -H "Content-Type: application/json"
```

## Understanding the System Flow

### Why You Don't Need to Input Stock Tickers

The system works in reverse of traditional stock scanners:

**Traditional Scanner:**
```
User inputs: "AAPL" → 
System checks: "Any news about AAPL?" → 
Shows: "AAPL earnings report"
```

**Predistia Intelligence:**
```
System monitors: "Russia mobilizes troops" → 
AI analyzes: "This will impact energy, defense, wheat" → 
Generates: "Long XOM, LMT, Short airlines" → 
You receive: Complete opportunity list
```

### The Daily Automated Pipeline

Every morning at 6 AM (or when you run it manually):

1. **Global News Scan**
   - Fetches from GDELT, news sources
   - Searches for: wars, disasters, economic events, tech shifts
   - NO STOCK TICKERS NEEDED

2. **Event Classification**
   - AI categorizes: "Ukraine conflict" → Type: Geopolitical
   - Determines magnitude: Critical/High/Medium/Low
   - Maps to sectors: Energy, Defense, Agriculture

3. **Impact Analysis**
   - Direct: "Oil companies benefit from supply squeeze"
   - Indirect: "Airlines hurt by fuel costs"
   - Correlation: "Gold rises as safe haven"

4. **Opportunity Generation**
   - Creates specific trades with confidence scores
   - Calculates expected returns
   - Sets time horizons

5. **Email Report**
   - Sends complete analysis to your inbox
   - No action required from you

## Production Setup (Vercel)

### 1. Environment Variables

In Vercel dashboard, add:

```
FIREBASE_ADMIN_SERVICE_ACCOUNT={your_service_account_json}
ALPHA_VANTAGE_API_KEY=your_key
EMAIL_RECIPIENTS=your@email.com
POSTMARK_API_TOKEN=your_token
CRON_SECRET=strong_random_secret
LLM_PROVIDER_API_KEY=gemini_key_optional
```

### 2. Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 11 * * *"
    }
  ]
}
```

Or use GitHub Actions:

```yaml
name: Daily Intelligence Run
on:
  schedule:
    - cron: '0 11 * * *'
  workflow_dispatch:

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Daily Analysis
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/cron/daily \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

## Quick Test

To verify everything works:

```bash
# 1. Test news aggregation
pnpm test-global-news

# 2. Test opportunity generation
pnpm test-opportunities

# 3. Run full pipeline
curl -X POST http://localhost:3000/api/cron/daily \
  -H "x-cron-secret: dev"

# 4. Check the dashboard
open http://localhost:3000
```

## Troubleshooting

### "No opportunities found"
- Run `pnpm backfill` to populate historical data
- Wait for significant global events
- Check if news sources are accessible

### "Permission denied" errors
- Deploy Firestore rules: `firebase deploy --only firestore:rules`
- Check Firebase project configuration
- Verify service account has proper permissions

### "No EOD data"
- Check Alpha Vantage API key is valid
- Run ingestion: `curl -X POST .../api/cron/ingest`
- Alpha Vantage has rate limits (5 calls/minute free tier)

### Email not received
- Verify Postmark API token
- Check EMAIL_RECIPIENTS in .env.local
- Ensure sender domain is verified in Postmark

## Remember

**This is NOT a stock scanner!** It's a global intelligence system that:
- Monitors world events automatically
- Predicts market impacts before they're obvious
- Finds opportunities you wouldn't think of
- Runs completely hands-free

You don't search for stocks - the system tells you what to buy/sell based on world events!