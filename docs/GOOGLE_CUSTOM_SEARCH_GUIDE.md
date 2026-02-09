# Google Custom Search API Integration Guide

## Overview

WatchMouse supports using Google Custom Search API as a fallback option when the eBay API key is not available. This allows you to start searching eBay listings immediately without waiting for eBay API approval.

## Why Use Google Custom Search?

- **Immediate Access**: No approval process required, get started instantly
- **Free Tier Available**: 100 searches per day for free
- **Easy Setup**: Simple configuration process
- **Reliable Fallback**: Automatically used when eBay API is unavailable

## Limitations

- **Rate Limits**: Free tier limited to 100 queries/day (vs. 5,000 for eBay API)
- **Price Extraction**: Prices are parsed from search snippets (less reliable than direct API)
- **Results Format**: Limited to 10 results per search (vs. 20 for eBay API)
- **No Advanced Filters**: Cannot filter by condition, location, etc. like the eBay API
- **Platform Label**: Results show as "eBay (Google)" to distinguish from direct eBay API results

## Setup Instructions

### Step 1: Get a Google API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "API Key"
5. Copy your API key
6. **Recommended**: Restrict the API key to only the "Custom Search API" for security

### Step 2: Create a Custom Search Engine

1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click "Get Started" or "Add"
3. Configure your search engine:
   - **Sites to search**: Enter `www.ebay.de`
   - **Language**: German
   - **Name**: "eBay Search" (or any name you prefer)
4. Click "Create"
5. On the next page, find your **Search Engine ID (cx)**
6. Copy this ID

### Step 3: Configure WatchMouse

#### Option A: Via Settings Screen (Recommended)

1. Open WatchMouse app
2. Tap the settings icon (⚙️) in the top-right corner
3. Scroll to "Google Custom Search (eBay Fallback)" section
4. Enter your Google API Key
5. Enter your Custom Search Engine ID (CX)
6. Toggle "Use Google as eBay Fallback" to ON
7. Tap "Save Settings"

#### Option B: Via Environment Variables

Add to your `.env` file:
```bash
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_CX=your_custom_search_engine_id_here
```

Then in Settings, toggle "Use Google as eBay Fallback" to ON.

## How It Works

### Automatic Fallback

When you run a search:

1. **eBay API Key Present**: Uses direct eBay Finding API
2. **No eBay API Key + Google Configured**: Uses Google Custom Search
3. **Neither Configured**: Returns empty results with a warning

### Search Process

1. Query is sent to Google Custom Search API with `site:ebay.de` filter
2. Google returns general web search results from eBay.de
3. WatchMouse extracts:
   - Title
   - URL (direct link to eBay listing)
   - Price (parsed from search snippet when available)
4. Results are filtered by your max price setting (if specified)
5. Results are displayed as "eBay (Google)" platform

### Price Extraction

Prices are extracted from Google's search snippets using pattern matching:
- Supported formats: `EUR 99,99`, `99,99 €`, `$99.99`
- If price cannot be extracted, item is shown with price = 0
- Items with price = 0 are not filtered out by max price setting

## Rate Limits

### Free Tier
- **Limit**: 100 queries per day
- **Cost**: Free
- **Throttling**: App warns at 80% usage (80 queries), critical at 95% (95 queries)
- **Reset**: Midnight daily

### Paid Tier
- **Cost**: $5 per 1,000 queries
- **Max**: 10,000 queries per day
- **Billing**: Automatically charged to your Google Cloud account

### Monitoring Usage

1. Open Settings in WatchMouse
2. Scroll to "API Rate Limits" section
3. View "Google Custom Search" indicator showing:
   - Current usage (e.g., "42/100")
   - Usage percentage bar
   - Status (green/yellow/red)

## Best Practices

### 1. Use As Temporary Solution
Google Custom Search is best used as a temporary solution while waiting for eBay API approval or to test the app.

### 2. Monitor Your Usage
- Free tier provides 100 searches/day
- With 5 saved searches running hourly, you'll use 120 queries/day
- Consider reducing search frequency or number of searches

### 3. Transition to eBay API
For production use, we recommend getting an eBay API key:
- Higher rate limit (5,000 vs. 100 queries/day)
- More reliable price extraction
- Better filtering options
- Official API support

### 4. Verify Prices
Since prices are extracted from snippets, always verify the actual price on the eBay listing before purchasing.

## Troubleshooting

### "Google API not fully configured" Warning

**Cause**: Missing either API key or CX  
**Solution**: Ensure both Google API Key and Custom Search Engine ID are entered in Settings

### "Google API daily limit reached"

**Cause**: Exceeded 100 queries (free tier)  
**Solution**: Wait until midnight for reset, or upgrade to paid tier in Google Cloud Console

### No Results Returned

**Possible causes**:
1. "Use Google as eBay Fallback" toggle is OFF → Turn it ON
2. Invalid API credentials → Verify API key and CX are correct
3. API quota exceeded → Check rate limit in Settings
4. Network issues → Check internet connection

### Prices Not Showing

**Cause**: Price format not recognized in Google snippet  
**Impact**: Item shows with price = 0  
**Solution**: Prices are best-effort from Google. For accurate pricing, use eBay API or verify on eBay website

## Comparing Options

| Feature | eBay API | Google Custom Search |
|---------|----------|---------------------|
| Setup Time | 1-2 days approval | Instant |
| Rate Limit (Free) | 5,000/day | 100/day |
| Results per Search | Up to 100 | Up to 10 |
| Price Accuracy | 100% | ~90% (parsed) |
| Advanced Filters | ✅ Yes | ❌ No |
| Cost (Free Tier) | Free | Free |
| Official Support | ✅ Yes | ⚠️ Indirect |
| Recommended For | Production | Testing/Temporary |

## Example Configuration

Complete example for `.env` file:

```bash
# AI Matching (optional)
OPENROUTER_API_KEY=sk-or-v1-abc123...

# eBay Search (recommended for production)
EBAY_API_KEY=YourEbay-AppID-PRD-123...

# Google Custom Search (fallback option)
GOOGLE_API_KEY=AIzaSyC_123...
GOOGLE_CX=a1b2c3d4e5f6g7h8
```

Then in app Settings, enable "Use Google as eBay Fallback".

## Security Notes

### API Key Storage
- API keys are stored securely using Expo SecureStore
- Never logged to console
- Never committed to git
- Encrypted on device

### API Key Restrictions
Google Cloud Console allows restricting API keys:
1. **Application restrictions**: Restrict to Android app
2. **API restrictions**: Restrict to "Custom Search API" only
3. **Usage limits**: Set daily quotas

We recommend applying these restrictions for security.

## Support

For issues related to:
- **Google API setup**: See [Google Custom Search documentation](https://developers.google.com/custom-search/v1/overview)
- **eBay API setup**: See [eBay API Guide](EBAY_API_GUIDE.md)
- **WatchMouse features**: See [README](../README.md)
- **General help**: Open an issue on GitHub

## Migration Path

### From Google to eBay API

When your eBay API key is approved:

1. Add eBay API key in Settings
2. Save Settings
3. App automatically switches to eBay API
4. Google API is no longer used (unless eBay API fails)
5. You can disable "Use Google as eBay Fallback" or leave it as backup

### Keeping Both

You can configure both APIs:
- **Primary**: eBay API (higher limits, better data)
- **Fallback**: Google API (used if eBay API unavailable)

This provides redundancy and failover capability.
