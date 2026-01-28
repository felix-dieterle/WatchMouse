# eBay API Integration Guide

## Overview

WatchMouse now supports real-time eBay search results using the eBay Finding API. This provides live data from eBay instead of mock results.

## Why eBay Finding API Instead of HTML Parsing?

### Advantages of Using the API

1. **Legal & Compliant**: Using the official API complies with eBay's Terms of Service
2. **Reliable**: Structured JSON responses instead of fragile HTML parsing
3. **Fast**: Direct API access is faster than web scraping
4. **Maintainable**: API structure is stable, HTML can change frequently
5. **Free**: Finding API offers 5,000 calls per day for free
6. **Rich Data**: Access to structured data (price, condition, location, etc.)

### Problems with HTML Parsing

1. **Against ToS**: Web scraping may violate eBay's Terms of Service
2. **Fragile**: HTML structure changes break the scraper
3. **Slow**: Loading and parsing HTML is slower than API calls
4. **IP Blocking**: eBay may block IPs that scrape aggressively
5. **Limited Data**: Harder to extract structured data from HTML

## Getting Started

### 1. Create eBay Developer Account

1. Go to [eBay Developers Program](https://developer.ebay.com/)
2. Click "Register" and create an account
3. Complete the registration process (free)

### 2. Create an Application

1. Log in to the [Developer Portal](https://developer.ebay.com/my/keys)
2. Click on "Create Application" or "Get Keys"
3. Choose "Production" or "Sandbox" keys
   - **Sandbox**: For testing (fake data)
   - **Production**: For real eBay data (recommended)
4. Accept the API License Agreement
5. Your Application ID (App ID) will be generated

### 3. Configure Your App

**For Development:**

Create a `.env` file in the project root:

```bash
# Copy from .env.example
cp .env.example .env
```

Edit `.env` and add your App ID:

```bash
EBAY_API_KEY=YourAppID-YourName-PRD-1234567890-12345678
```

**For Production Build:**

Set the environment variable before building:

```bash
export EBAY_API_KEY=YourAppID-YourName-PRD-1234567890-12345678
npm run build
```

## How It Works

### Automatic Fallback

The app automatically detects if an API key is available:

- **With API key**: Uses real eBay Finding API
- **Without API key**: Falls back to mock data for demonstration

### API Request Flow

1. User initiates a search with a query (e.g., "iPhone 13")
2. App checks if eBay API key is configured
3. If yes, sends request to eBay Finding API:
   - Operation: `findItemsByKeywords`
   - Keywords: User's search query
   - Max items: 20 results
   - Sort order: Newest listings first
4. If max price is set, adds price filter to API request
5. Receives JSON response from eBay
6. Parses response and extracts:
   - Item ID
   - Title
   - Price and currency
   - Item URL
   - Condition (New, Used, etc.)
   - Location
7. Returns formatted results to the app

### Error Handling

- **API Error**: Falls back to mock data
- **Network Error**: Falls back to mock data
- **Invalid Response**: Returns empty array
- **No Results**: Returns empty array

## API Features

### Supported Operations

Currently implemented:
- ✅ `findItemsByKeywords` - Search by keywords

Future possibilities:
- ⬜ `findItemsByCategory` - Browse by category
- ⬜ `findItemsAdvanced` - Advanced search with multiple filters
- ⬜ `findItemsIneBayStores` - Search within eBay stores

### Search Filters

Currently supported:
- ✅ **Keywords**: Search term
- ✅ **Max Price**: Maximum price filter
- ✅ **Currency**: EUR (default)
- ✅ **Global Site**: EBAY-DE (German eBay)

Can be added:
- ⬜ Min Price
- ⬜ Condition (New, Used, etc.)
- ⬜ Seller Location
- ⬜ Shipping Options
- ⬜ Buy It Now only
- ⬜ Auction only

### Response Data

Each result includes:
- `id`: Unique identifier
- `title`: Item title
- `price`: Current price (number)
- `currency`: Currency code (e.g., "EUR")
- `platform`: "eBay"
- `url`: Direct link to eBay listing
- `condition`: Item condition (e.g., "New", "Used")
- `location`: Seller location
- `timestamp`: When the result was fetched

## Rate Limits

### Free Tier (Production Keys)

- **Daily limit**: 5,000 calls per day
- **Per second**: No official limit, but be reasonable
- **Recommendation**: Cache results to minimize API calls

### Best Practices

1. **Cache Results**: Store search results temporarily
2. **Batch Requests**: Combine multiple searches if possible
3. **Use Filters**: Reduce result size with price/condition filters
4. **Monitor Usage**: Track your API usage in the developer portal

## Testing the Integration

### Unit Tests

The implementation includes comprehensive unit tests:

```bash
npm test
```

Tests cover:
- ✅ Mock data fallback when no API key
- ✅ API call with valid API key
- ✅ Response parsing
- ✅ Error handling and fallback
- ✅ Empty response handling
- ✅ Price filter inclusion

### Manual Testing

1. **Without API Key**:
   ```bash
   # Remove or comment out EBAY_API_KEY in .env
   npm start
   # Search should return mock data
   ```

2. **With API Key**:
   ```bash
   # Add valid EBAY_API_KEY to .env
   npm start
   # Search should return real eBay results
   ```

3. **Verify Real Data**:
   - Search for a common item (e.g., "iPhone")
   - Check if results have realistic prices
   - Click on result URL to verify it's a real eBay listing
   - Check console logs for "eBay: Found X items"

## Changing eBay Global Site

The app defaults to German eBay (EBAY-DE). To change:

Edit `src/services/SearchService.js`:

```javascript
class EbaySearcher {
  constructor() {
    this.apiKey = process.env.EBAY_API_KEY || '';
    this.baseUrl = 'https://svcs.ebay.com/services/search/FindingService/v1';
    this.globalId = 'EBAY-US'; // Change to desired site
  }
}
```

Available Global IDs:
- `EBAY-US` - United States
- `EBAY-DE` - Germany
- `EBAY-GB` - United Kingdom
- `EBAY-FR` - France
- `EBAY-IT` - Italy
- `EBAY-ES` - Spain
- `EBAY-AU` - Australia
- `EBAY-AT` - Austria
- ... and more

## Troubleshooting

### Issue: "No API key configured, using mock data"

**Solution**: Make sure you have:
1. Created `.env` file in project root
2. Added `EBAY_API_KEY=your-key-here`
3. Restarted the app

### Issue: "eBay API error, falling back to mock data"

**Possible causes**:
1. Invalid API key
2. Network connectivity issue
3. Rate limit exceeded
4. eBay API is down

**Solution**:
1. Verify your API key is correct
2. Check internet connection
3. Check eBay Developer Portal for API status
4. Review error message in console logs

### Issue: No results returned

**Possible causes**:
1. Search query has no matches on eBay
2. Price filter is too restrictive
3. API response is empty

**Solution**:
1. Try a more common search term
2. Increase or remove max price filter
3. Check console logs for "Found X items"

## Security Best Practices

### Protecting Your API Key

1. **Never commit `.env` file**: It's in `.gitignore`
2. **Don't share API keys**: Each developer should have their own
3. **Regenerate if exposed**: If accidentally committed, regenerate in Developer Portal
4. **Use environment variables**: For production builds

### Production Deployment

For APK builds, set environment variable:

```bash
export EBAY_API_KEY=your-production-key
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

## API Documentation

Full eBay Finding API documentation:
- [Finding API Documentation](https://developer.ebay.com/DevZone/finding/Concepts/FindingAPIGuide.html)
- [findItemsByKeywords Reference](https://developer.ebay.com/DevZone/finding/CallRef/findItemsByKeywords.html)
- [API Console (Test API Calls)](https://developer.ebay.com/DevZone/finding/CallRef/findItemsByKeywords.html)

## Future Enhancements

Possible improvements to the eBay integration:

1. **Advanced Filters**:
   - Condition filter (New, Used, Refurbished)
   - Seller location
   - Shipping options
   - Listing type (Auction, Buy It Now)

2. **Multiple Operations**:
   - Browse by category
   - Find completed listings (price history)
   - Search in eBay stores

3. **Caching**:
   - Cache search results for X minutes
   - Reduce API calls
   - Improve performance

4. **User Preferences**:
   - Allow users to select eBay global site
   - Configure currency preference
   - Set default filters

5. **Rich Data**:
   - Show item images
   - Display shipping cost
   - Show seller rating
   - Include item gallery

## Conclusion

The eBay Finding API provides a robust, legal, and maintainable solution for integrating eBay search results. It's superior to HTML parsing in every way and comes with a generous free tier that's perfect for this application.

**Bottom line**: Use the API, not HTML parsing! 🎯
