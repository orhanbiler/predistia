# Email Features Documentation

## 📧 Manual Email Controls

The dashboard now includes three powerful email control buttons for testing and manual operation:

### 1. Send Email Now
**Button**: Green "📧 Send Email Now" button  
**Function**: Immediately sends the intelligence report to configured recipients  
**Process**:
1. Click the button
2. Confirm the action in the popup
3. Email is generated with latest data
4. Sent to all recipients in EMAIL_RECIPIENTS
5. Page redirects with success/error message

### 2. Preview Email
**Button**: Blue "👁️ Preview Email" button  
**Function**: Shows exactly what the email will look like without sending  
**Features**:
- Opens in new tab
- Shows complete email HTML
- Includes all sections: opportunities, events, news, metrics
- Shows recipient list at bottom
- No email is actually sent

### 3. Run Full Analysis
**Button**: Purple "🔄 Run Full Analysis" button  
**Function**: Manually triggers the complete daily pipeline  
**Process**:
1. Fetches global news (wars, economic events, disasters)
2. Classifies events with AI
3. Generates opportunities
4. Updates all metrics
5. Shows completion popup with stats

## 📋 Email Content Sections

The intelligence report email includes:

### Executive Summary
- Market condition indicator (🔴 Risk / 🟡 Caution / 🟢 Normal)
- Number of opportunities and critical events
- Recommended focus areas

### Global Market Intelligence
- **Geopolitical Developments**: Wars, conflicts, political events
- **Economic Indicators**: Fed decisions, inflation, employment
- **Commodity Outlook**: Oil and gold prices with forecasts
- **Strategic Insights**: AI-generated actionable recommendations

### Investment Opportunities
- Top 5 opportunities with:
  - Symbols to trade
  - Direction (Long/Short)
  - Confidence percentage
  - Expected returns
  - Time horizon
  - Reasoning

### Market News Digest
- AI-summarized key news points
- Links to original sources

### Historical Performance
- 20-day and 60-day metrics
- Hit rates and returns
- Performance by event type

### Monitoring List
- What the system is watching
- Upcoming events of interest

## 🎯 Usage Scenarios

### Daily Testing
1. Click "Preview Email" to see current state
2. If satisfied, click "Send Email Now"
3. Check inbox for delivered report

### After Major Event
1. Click "Run Full Analysis" to refresh data
2. Wait for completion popup
3. Click "Preview Email" to review
4. Send if opportunities detected

### Debugging
- Use Preview to check formatting
- Verify data is populating correctly
- Test without sending actual emails

## ⚙️ Configuration

### Email Recipients
Set in `.env.local`:
```
EMAIL_RECIPIENTS=user1@example.com,user2@example.com
```

### Email Provider
Requires Postmark configuration:
```
POSTMARK_API_TOKEN=your_token_here
EMAIL_FROM=noreply@yourdomain.com
```

## 🔍 API Endpoints

### GET /api/email/send
- Generates and sends email immediately
- Redirects to dashboard with status
- Requires EMAIL_RECIPIENTS configured

### GET /api/email/preview
- Returns HTML preview of email
- No authentication required
- Shows exact email content

### POST /api/cron/daily
- Runs complete analysis pipeline
- Returns JSON with statistics
- Can be called programmatically

## 🚨 Troubleshooting

### "No recipients configured"
- Add EMAIL_RECIPIENTS to environment
- Restart the development server

### "Email failed to send"
- Check Postmark API token
- Verify sender domain is verified
- Check Postmark account status

### Preview shows no data
- Run "Full Analysis" first
- Check if database has data
- Verify Firebase connection

### Analysis takes too long
- Normal duration: 1-3 minutes
- Depends on news volume
- Check Alpha Vantage rate limits

## 💡 Best Practices

1. **Preview Before Sending**
   - Always preview to verify content
   - Check opportunity quality
   - Ensure news is relevant

2. **Run Analysis First**
   - If no recent data, run analysis
   - Wait for completion
   - Then preview/send

3. **Monitor Regularly**
   - Check dashboard daily
   - Send manual emails for major events
   - Keep recipients list updated

4. **Test in Development**
   - Use preview extensively
   - Test with single recipient first
   - Verify formatting across email clients

## 🎨 Customization

The email template can be customized in:
- `/api/email/send/route.ts` - Production email
- `/api/email/preview/route.ts` - Preview version

Key sections to modify:
- Executive Summary thresholds
- Number of opportunities shown
- Color schemes and styling
- Strategic insights logic

## 📊 Metrics Shown

The email automatically calculates:
- Market condition (based on event counts)
- Risk levels (geopolitical, economic)
- Opportunity confidence scores
- Historical performance metrics
- Sector impacts

All metrics update in real-time based on the latest data when the email is generated.