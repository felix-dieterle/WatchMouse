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

## eBay API Setup (Optional)

Currently, WatchMouse uses mock data for demonstration. To integrate with real eBay data:

1. Visit [eBay Developers](https://developer.ebay.com/)
2. Create a developer account
3. Generate an API key (Application ID)
4. Add the key to your `.env` file

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
