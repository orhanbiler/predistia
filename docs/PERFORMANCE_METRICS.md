# Understanding Historical Performance Metrics

## Why Your Metrics Show Zero

The Historical Performance section in your daily report shows:
```
Window 20d
Count: 0 | Hit-rate: 0.0% | Avg: 0.00% | Sharpe proxy: 0.00
```

This happens because the metrics need historical data to calculate. Here's why:

## How Performance Metrics Work

### 1. **Forward Returns**
When the system generates a trading signal (e.g., "Long AAPL due to AI announcement"), it needs to track what happens to that stock over the next 20 and 60 days.

**Example Timeline:**
- Day 0: Signal generated - "Long NVDA" (technology_shift event)
- Day 20: Check NVDA price → Calculate 20-day return
- Day 60: Check NVDA price → Calculate 60-day return

### 2. **Key Metrics Explained**

#### **Count**
Number of signals that have completed their evaluation period:
- For 20-day window: Signals older than 20 trading days
- For 60-day window: Signals older than 60 trading days

#### **Hit Rate**
Percentage of signals that were profitable:
- Long signal + positive return = Hit ✅
- Short signal + negative return = Hit ✅
- Otherwise = Miss ❌

Example: 7 hits out of 10 signals = 70% hit rate

#### **Average Return**
Mean return across all evaluated signals:
- If signals returned +5%, +10%, -3%, +2%
- Average = (5 + 10 - 3 + 2) / 4 = 3.5%

#### **Sharpe Proxy**
Risk-adjusted return (higher is better):
- Formula: Average Return / Standard Deviation
- Measures consistency of returns
- > 1.0 = Good
- > 2.0 = Excellent

### 3. **Confusion Matrix**
Shows performance by event type:
```
Incident Type     Positive  Negative
technology_shift     8         2
geopolitical        5         3
earnings_beat       6         1
```

This helps identify which events generate the best signals.

## Getting Historical Data

### Option 1: Backfill Historical Data (Recommended)
```bash
# This will fetch 90 days of historical data
pnpm backfill
```

This command will:
1. Fetch 90 days of news and price data
2. Generate signals from historical events
3. Calculate forward returns where possible
4. Populate your performance metrics

### Option 2: Wait for Natural Accumulation
- After 20 days: First 20-day metrics appear
- After 60 days: First 60-day metrics appear
- After 90 days: Robust statistical sample

### Option 3: Manual Test Data
```bash
# Run test with synthetic historical signals
pnpm test-opportunities
```

## Interpreting the Metrics

### Good Performance Indicators
- **Hit Rate > 55%**: Better than random
- **Hit Rate > 60%**: Good predictive power
- **Hit Rate > 65%**: Excellent system

- **Sharpe > 0.5**: Acceptable
- **Sharpe > 1.0**: Good risk-adjusted returns
- **Sharpe > 2.0**: Exceptional performance

### Red Flags
- Hit Rate < 50%: Worse than random
- Negative average return: System losing money
- Sharpe < 0: Poor risk-adjusted performance

## Real-World Example

After running for 90 days, you might see:
```
Window 20d
Count: 245 | Hit-rate: 62.4% | Avg: 2.31% | Sharpe proxy: 1.42

Incident Type       Positive  Negative
technology_shift      28        12
pandemic              15         5
geopolitical          18        14
earnings_beat         22         8
supply_chain          14        11
economic_indicator    20        15
```

This would indicate:
- ✅ 62.4% success rate (good)
- ✅ 2.31% average 20-day return (solid)
- ✅ 1.42 Sharpe (good risk-adjusted returns)
- ✅ Technology and earnings events most reliable

## Best Practices

1. **Minimum Data Requirements**
   - Need 100+ signals for statistical significance
   - At least 3 months of data recommended
   - Mix of different market conditions

2. **Regular Monitoring**
   - Check metrics weekly
   - Compare 20d vs 60d performance
   - Track which event types work best

3. **System Tuning**
   - If hit rate < 50%, adjust classification thresholds
   - If Sharpe < 0.5, reduce position sizes
   - Focus on high-performing event types

## Troubleshooting

**"No realized forward windows yet"**
- Solution: Run `pnpm backfill` to get historical data

**Metrics show but are all negative**
- Check if market has been declining
- Review signal generation logic
- May need to adjust for market regime

**Very low signal count**
- Increase news ingestion frequency
- Lower classification thresholds
- Add more ticker coverage

## Next Steps

1. Run backfill to populate historical data:
   ```bash
   pnpm backfill
   ```

2. Check metrics in tomorrow's email report

3. Monitor which event types perform best

4. Adjust strategy based on metrics

Remember: These metrics validate that the system's predictions actually work in real markets. Without them, you're flying blind!