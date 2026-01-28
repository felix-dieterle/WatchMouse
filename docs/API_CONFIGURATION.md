# API Configuration Guide

## OpenRouter Setup

WatchMouse uses OpenRouter for AI-powered search matching. This allows the app to find relevant items even when they contain typos, variations, or extra features.

### Getting an API Key

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up for a free account
3. Navigate to the API Keys section
4. Create a new API key
5. Copy the key

### Using the API Key

**For Development:**
1. Copy `.env.example` to `.env`
2. Replace `your_openrouter_api_key_here` with your actual key
3. Restart the app

**For Production APK:**
The API key should be configured in the app after installation through a settings screen (future feature).

### Pricing

OpenRouter offers various models with different pricing:
- **GPT-3.5-turbo**: ~$0.0005 per 1K tokens (recommended for WatchMouse)
- **Free models**: Some models available for free with limitations

WatchMouse is configured to use GPT-3.5-turbo by default, which is very cost-effective for this use case.

## eBay API Setup

WatchMouse now supports real eBay search results using the eBay Finding API. The app automatically falls back to mock data when no API key is configured.

### Getting an eBay API Key

1. Visit [eBay Developers](https://developer.ebay.com/)
2. Create a free developer account
3. Create an application in the Developer Dashboard
4. Generate an Application ID (App ID)
5. Copy the Application ID

### Using the API Key

**For Development:**
1. Copy `.env.example` to `.env`
2. Replace `your_ebay_api_key_here` with your Application ID
3. Restart the app

**For Production APK:**
The API key should be configured through environment variables before building the APK.

### eBay Finding API

The app uses eBay's Finding API which is free to use with the following features:
- **findItemsByKeywords**: Search for items by keywords
- **Price filtering**: Filter results by maximum price
- **Sorting**: Results are sorted by newest listings first
- **Rate limits**: 5,000 calls per day (free tier)
- **Global sites**: Supports all eBay global sites (default: EBAY-DE for Germany)

### API Response Details

When the API is configured, the app retrieves real-time data including:
- Item title
- Current price and currency
- Item URL (direct link to eBay listing)
- Condition (New, Used, etc.)
- Location
- Timestamp

### Fallback Behavior

- **No API key**: Uses mock data for demonstration
- **API error**: Automatically falls back to mock data
- **No results**: Returns empty array

## Kleinanzeigen

Kleinanzeigen doesn't have a public API. The current implementation uses mock data. In production, you would need to:

1. Use web scraping (respecting robots.txt and terms of service)
2. Or implement through their unofficial APIs
3. Consider rate limiting and caching

## Future Integrations

Support for additional platforms can be added by:
1. Creating a new searcher class in `src/services/SearchService.js`
2. Implementing the `search(query, maxPrice)` method
3. Adding the searcher to the platforms list
