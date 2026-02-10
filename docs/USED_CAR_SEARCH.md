# Used Car Search Module

## Overview

The Used Car Search Module enables WatchMouse to search German used car platforms (mobile.de and AutoScout24) using Google Custom Search API. This module follows the same architecture pattern as the eBay and Kleinanzeigen modules.

## Supported Platforms

### mobile.de
- Germany's largest used car marketplace
- Searched via Google Custom Search API
- No official public API available

### AutoScout24
- Second-largest used car platform in Germany
- Searched via Google Custom Search API
- No official public API available

## How It Works

### 1. Google Custom Search Integration

The module uses Google Custom Search API with `site:` operators to search specific platforms:
```javascript
// Example: Search mobile.de for "BMW 320d"
const searchQuery = "site:https://www.mobile.de BMW 320d";
```

### 2. Price Extraction

The module intelligently parses prices from search result snippets, handling various German price formats:
- `EUR 18.990` → 18990
- `19.999 €` → 19999
- `€ 9.900,-` → 9900
- Handles thousand separators (dots) and decimal commas

### 3. Metadata Extraction

Additional information is extracted when available:
- **Year**: Extracted from patterns like "Bj. 2018" or "EZ 2019"
- **Mileage**: Extracted from patterns like "50.000 km"
- **Price**: Parsed from various currency formats

### 4. Deduplication

Results are deduplicated with other platform results to avoid showing the same car multiple times.

## Configuration

### Enable Used Car Search

1. **Configure Google Custom Search API** (required):
   - Get API key from: https://console.cloud.google.com/
   - Create search engine at: https://programmablesearchengine.google.com/
   - Add API key and CX in Settings

2. **Enable Used Cars Toggle** in Settings:
   - Navigate to Settings → Platform Modules
   - Toggle "Used Cars" on
   - Note: Toggle is disabled until Google API credentials are configured

### API Rate Limits

The module shares the Google Custom Search API rate limit with eBay Google fallback:
- **Free tier**: 100 queries per day
- **Rate limit tracking**: Displayed in Settings screen
- **Warning thresholds**: 
  - Warning at 80% (80 queries)
  - Critical at 95% (95 queries)

## Architecture

### Class Structure

```javascript
class UsedCarSearcher {
  constructor(googleApiKey, googleCx)
  
  async search(query, maxPrice)
  // Searches both mobile.de and AutoScout24
  // Returns combined, deduplicated results
  
  async searchPlatform(query, maxPrice, platformName, siteUrl)
  // Searches a specific platform via Google
  
  parseGoogleResponse(data, query, maxPrice, platformName)
  // Parses Google API response into standardized format
}
```

### Result Format

Each used car result includes:
```javascript
{
  id: string,              // Unique identifier
  title: string,           // Car title
  price: number,           // Price in EUR (0 if not extracted)
  currency: 'EUR',         // Currency
  platform: string,        // 'mobile.de' or 'AutoScout24'
  url: string,             // Direct link to listing
  year: string,            // Year (if extracted)
  mileage: string,         // Mileage in km (if extracted)
  timestamp: string,       // ISO timestamp
  snippet: string          // Search result snippet
}
```

### Integration with SearchService

The `UsedCarSearcher` is integrated into `SearchService` alongside other platform searchers:

```javascript
class SearchService {
  constructor(platformSettings) {
    this.platforms = {
      ebay: new EbaySearcher(...),
      kleinanzeigen: new KleinanzeigenSearcher(),
      usedCars: new UsedCarSearcher(googleApiKey, googleCx),
    };
  }
  
  async searchAllPlatforms(query, maxPrice) {
    // Searches all enabled platforms
    // Used cars are included if usedCarsEnabled === true
  }
}
```

## Error Handling

### Missing Credentials
- Returns empty array with console warning
- User-friendly message in Settings UI

### Platform Search Failures
- Uses `Promise.allSettled()` to handle individual platform failures
- One platform failure doesn't affect the other
- Errors are logged but don't crash the app

### Rate Limit Exceeded
- Checks rate limit before making API call
- Returns empty array if limit exceeded
- Shows critical warning in console

## Testing

The module includes comprehensive tests covering:
- Initialization with/without credentials
- Parallel platform searches
- Error handling
- Price parsing (multiple formats)
- Year and mileage extraction
- Max price filtering
- Integration with SearchService

Run tests:
```bash
npm test -- --testPathPattern=UsedCarSearcher
```

## Performance

### Caching
- Search results are cached for 5 minutes
- Cache key includes query and maxPrice
- Shared cache with other search results

### Parallel Execution
- mobile.de and AutoScout24 are searched in parallel
- Uses `Promise.allSettled()` for concurrent requests
- Typical response time: 1-3 seconds for both platforms

### Rate Limit Awareness
- Pre-flight rate limit check
- Counter incremented only after successful HTTP request
- Prevents unnecessary API calls when limit exceeded

## Limitations

### Price Extraction
- Best-effort parsing from snippets
- Some listings may have `price: 0` if format is unusual
- Items with no price are included in results

### Result Quality
- Quality depends on Google's indexing
- May not be as fresh as official API would be
- Limited to Google's snippet information

### API Quota
- Shared 100 queries/day limit with eBay Google fallback
- Plan searches carefully to stay within limit
- Consider upgrading to paid tier for higher limits

## Future Enhancements

### Possible Improvements
1. **Direct API Integration**: If mobile.de/AutoScout24 release public APIs
2. **Better Price Parsing**: Machine learning for price extraction
3. **Image Support**: Extract car images from snippets
4. **Filter Options**: Add filters for fuel type, transmission, etc.
5. **Dealership Detection**: Identify dealer vs. private listings

### Module Orchestration
The used car module demonstrates a pattern that can be extended:
- Each platform implements a standard `search(query, maxPrice)` interface
- Platforms are registered in `SearchService.platforms`
- Settings control which platforms are enabled
- Results are standardized before being returned

This pattern allows for easy addition of new platforms in the future (e.g., Autohero, Carwow, etc.).

## See Also

- [Google Custom Search Guide](GOOGLE_CUSTOM_SEARCH_GUIDE.md)
- [API Configuration](API_CONFIGURATION.md)
- [Architecture](ARCHITECTURE.md)
