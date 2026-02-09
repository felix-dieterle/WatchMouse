# Module Orchestration Pattern

## Overview

WatchMouse uses a modular architecture that allows for easy addition of new search platforms. Each platform is implemented as a separate searcher class that follows a standard interface.

## Current Module Structure

### Platform Modules

1. **EbaySearcher** - Searches eBay using eBay Finding API or Google Custom Search
2. **KleinanzeigenSearcher** - Searches Kleinanzeigen (currently mock data)
3. **UsedCarSearcher** - Searches mobile.de and AutoScout24 via Google Custom Search

### Module Registration

Modules are registered in the `SearchService` constructor:

```javascript
class SearchService {
  constructor(platformSettings = {}) {
    this.platformSettings = {
      ebayEnabled: platformSettings.ebayEnabled !== undefined ? platformSettings.ebayEnabled : true,
      kleinanzeigenEnabled: platformSettings.kleinanzeigenEnabled !== undefined ? platformSettings.kleinanzeigenEnabled : true,
      usedCarsEnabled: platformSettings.usedCarsEnabled === true,
    };
    
    this.platforms = {
      ebay: new EbaySearcher(...),
      kleinanzeigen: new KleinanzeigenSearcher(),
      usedCars: new UsedCarSearcher(...),
    };
  }
}
```

## Module Interface

### Required Methods

Each platform searcher must implement:

```javascript
class PlatformSearcher {
  /**
   * Search the platform
   * @param {string} query - Search query
   * @param {number|null} maxPrice - Maximum price filter (optional)
   * @returns {Promise<Array>} Array of search results
   */
  async search(query, maxPrice) {
    // Implementation
  }
}
```

### Result Format

All modules must return results in this standardized format:

```javascript
{
  id: string,              // Unique identifier (platform-specific)
  title: string,           // Item title
  price: number,           // Price in EUR
  currency: string,        // Currency code (default: 'EUR')
  platform: string,        // Platform identifier from PLATFORMS constant
  url: string,             // Direct link to item
  timestamp: string,       // ISO timestamp
  // Optional fields
  condition?: string,      // Item condition
  location?: string,       // Item location
  snippet?: string,        // Search snippet
  year?: string,           // For vehicles
  mileage?: string,        // For vehicles
}
```

## Adding a New Module

### Step 1: Define Platform Constants

Add new platform identifiers to `src/constants/index.js`:

```javascript
export const PLATFORMS = {
  EBAY: 'eBay',
  KLEINANZEIGEN: 'Kleinanzeigen',
  MOBILE_DE: 'mobile.de',
  AUTOSCOUT24: 'AutoScout24',
  NEW_PLATFORM: 'NewPlatform',  // Add your platform here
};
```

Add API configuration if needed:

```javascript
export const API_CONFIG = {
  // ... existing config
  NEW_PLATFORM: {
    BASE_URL: 'https://api.newplatform.com',
    RESULTS_PER_PAGE: 20,
  },
};
```

### Step 2: Create Searcher Class

Create a new class in `src/services/SearchService.js`:

```javascript
class NewPlatformSearcher {
  constructor(apiKey = '') {
    this.apiKey = apiKey || process.env.NEW_PLATFORM_API_KEY || '';
    this.baseUrl = API_CONFIG.NEW_PLATFORM.BASE_URL;
  }

  async search(query, maxPrice) {
    // Validate inputs
    if (!query || query.trim() === '') {
      return [];
    }

    // Check credentials
    if (!this.apiKey) {
      console.warn('NewPlatform: API key not configured');
      return [];
    }

    try {
      // Make API call
      const results = await this.fetchResults(query, maxPrice);
      return results;
    } catch (error) {
      console.error('NewPlatform search error:', error.message);
      return [];
    }
  }

  async fetchResults(query, maxPrice) {
    // Implementation specific to the platform
  }

  parseResponse(data) {
    // Parse API response to standardized format
    return data.items.map(item => ({
      id: `${PLATFORMS.NEW_PLATFORM}-${item.id}`,
      title: item.title,
      price: item.price,
      currency: 'EUR',
      platform: PLATFORMS.NEW_PLATFORM,
      url: item.url,
      timestamp: new Date().toISOString(),
    }));
  }
}
```

### Step 3: Register Module

Add the module to `SearchService`:

```javascript
class SearchService {
  constructor(platformSettings = {}) {
    this.platformSettings = {
      // ... existing settings
      newPlatformEnabled: platformSettings.newPlatformEnabled === true,
    };
    
    this.platforms = {
      // ... existing platforms
      newPlatform: new NewPlatformSearcher(
        platformSettings.newPlatformApiKey
      ),
    };
  }
}
```

### Step 4: Update searchAllPlatforms

Add the new platform to the search orchestration:

```javascript
async searchAllPlatforms(query, maxPrice, existingMatches = []) {
  const results = [];

  // ... existing platform searches

  // Search new platform if enabled
  if (this.platformSettings.newPlatformEnabled) {
    try {
      const newPlatformResults = await this.platforms.newPlatform.search(query, maxPrice);
      results.push(...newPlatformResults);
    } catch (error) {
      console.error('NewPlatform search error:', error.message);
    }
  }

  // Deduplicate and filter
  const deduplicated = ResultDeduplicator.deduplicateByTitle(results);
  const newResults = ResultDeduplicator.filterOutExisting(deduplicated, existingMatches);

  return newResults;
}
```

### Step 5: Add Settings Support

Update `src/constants/index.js`:

```javascript
export const DEFAULT_SETTINGS = {
  // ... existing settings
  newPlatformEnabled: false,
};
```

Add UI toggle in `src/components/Settings.js`:

```javascript
const [newPlatformEnabled, setNewPlatformEnabled] = useState(false);

// In render:
<View style={styles.switchContainer}>
  <View style={styles.switchLabel}>
    <Text style={styles.label}>New Platform</Text>
    <Text style={styles.helperText}>Search on NewPlatform</Text>
  </View>
  <Switch
    value={newPlatformEnabled}
    onValueChange={setNewPlatformEnabled}
    // ... styling
  />
</View>
```

### Step 6: Add Tests

Create tests in `src/services/__tests__/NewPlatformSearcher.test.js`:

```javascript
describe('NewPlatformSearcher', () => {
  it('should search and return results', async () => {
    // Test implementation
  });

  it('should handle errors gracefully', async () => {
    // Test error handling
  });

  it('should parse response correctly', async () => {
    // Test response parsing
  });
});
```

### Step 7: Update Documentation

- Add platform description to README.md
- Create platform-specific guide in `docs/`
- Update ARCHITECTURE.md

## Module Best Practices

### Error Handling
- Never throw errors that crash the app
- Log errors with `console.error()`
- Return empty array on errors
- Use `redactSensitiveData()` for error messages

### API Keys
- Accept API key in constructor
- Fall back to environment variables
- Store sensitive keys in SecureStore
- Never log API keys

### Rate Limiting
- Implement rate limiting for external APIs
- Check limits before making calls
- Provide user feedback when limits exceeded
- Share rate limiters when appropriate (e.g., Google API)

### Caching
- Use shared cache from `performance.js`
- Generate unique cache keys
- Set appropriate TTL values
- Clear cache on errors

### Validation
- Validate query before API calls
- Handle empty/null queries gracefully
- Validate API credentials
- Sanitize user input

### Performance
- Use parallel requests when possible (`Promise.allSettled()`)
- Implement timeouts for API calls
- Minimize unnecessary API calls
- Cache aggressively

## Future Enhancements

### Plugin System

A future enhancement could make modules even more modular:

```javascript
// Plugin registration
class ModuleRegistry {
  static modules = new Map();

  static register(name, ModuleClass, config) {
    this.modules.set(name, { ModuleClass, config });
  }

  static getModule(name) {
    return this.modules.get(name);
  }

  static getAllModules() {
    return Array.from(this.modules.values());
  }
}

// Usage
ModuleRegistry.register('ebay', EbaySearcher, {
  requiresApiKey: true,
  requiresGoogleFallback: true,
  category: 'general',
});

ModuleRegistry.register('usedCars', UsedCarSearcher, {
  requiresApiKey: false,
  requiresGoogle: true,
  category: 'automotive',
});
```

### Dynamic Loading

Future versions could support dynamic module loading:

```javascript
// Load modules from separate files
const modules = await Promise.all([
  import('./modules/EbayModule'),
  import('./modules/UsedCarModule'),
  import('./modules/NewModule'),
]);

modules.forEach(module => {
  ModuleRegistry.register(module.name, module.SearcherClass, module.config);
});
```

### Configuration Schema

Future modules could use a standardized configuration:

```javascript
export const MODULE_CONFIG = {
  name: 'NewPlatform',
  displayName: 'New Platform',
  icon: 'platform-icon.png',
  category: 'general',
  requirements: {
    apiKey: true,
    googleApi: false,
  },
  settings: {
    enabledByDefault: false,
    rateLimits: {
      daily: 5000,
      warningThreshold: 0.8,
    },
  },
};
```

## See Also

- [Architecture Documentation](ARCHITECTURE.md)
- [Used Car Search Module](USED_CAR_SEARCH.md)
- [API Configuration](API_CONFIGURATION.md)
