# GitHub Copilot Instructions for WatchMouse

## Project Overview

WatchMouse is a React Native (Expo) mobile application that monitors shopping platforms (eBay, Kleinanzeigen) and finds deals matching saved searches using AI-powered matching. The app is designed for Android devices and uses local storage for data persistence.

## Core Architecture

### Technology Stack
- **Framework**: React Native with Expo SDK 52
- **Language**: JavaScript (ES2021+)
- **Storage**: AsyncStorage (general data) + SecureStore (API keys)
- **AI**: OpenRouter API (GPT-3.5-turbo) with keyword fallback
- **Platform APIs**: eBay Finding API, Kleinanzeigen (mock data)
- **Testing**: Jest with React Native Testing Library
- **Linting**: ESLint 9 with React/React Native plugins

### Project Structure
```
WatchMouse/
├── App.js                          # Main application component
├── src/
│   ├── components/                 # React components
│   │   └── Settings.js            # Settings screen
│   ├── services/                   # Business logic services
│   │   ├── AIService.js           # AI matching service
│   │   ├── SearchService.js       # Multi-platform search
│   │   └── SettingsService.js     # Settings persistence
│   ├── constants/                  # Constants and configuration
│   └── utils/                      # Shared utility functions
├── __tests__/                      # Root level tests
└── docs/                           # Documentation
```

## Coding Standards & Best Practices

### General Principles
1. **Simplicity First**: Write clear, readable code over clever code
2. **Security**: Never log API keys or sensitive data
3. **Performance**: Minimize re-renders and API calls
4. **Testability**: Write testable, pure functions when possible
5. **Documentation**: Use JSDoc for all public APIs and complex logic

### JavaScript Style Guide

#### Code Formatting
- Use **2 spaces** for indentation
- Use **single quotes** for strings (except in JSX)
- Use **semicolons** at the end of statements
- **Max line length**: 100 characters (prefer 80)
- Use **trailing commas** in multi-line arrays/objects

#### Naming Conventions
```javascript
// Components: PascalCase
function SearchList() { }

// Functions/variables: camelCase
const handleSubmit = () => { }
const searchResults = []

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com'
const MAX_RETRIES = 3

// Private/internal: prefix with underscore
const _internalHelper = () => { }

// Booleans: use is/has/should prefix
const isLoading = false
const hasError = true
const shouldRetry = false
```

#### Imports
```javascript
// Order: React -> React Native -> Third-party -> Local
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchService } from './services/SearchService';
import { STORAGE_KEYS } from './constants';
```

### React & React Native Patterns

#### Component Structure
```javascript
/**
 * Brief component description
 * @param {Object} props - Component props
 * @param {string} props.title - Title text
 */
function MyComponent({ title, onPress }) {
  // 1. Hooks (useState, useEffect, custom hooks)
  const [data, setData] = useState([]);
  
  // 2. Derived state and memoized values
  const filteredData = useMemo(() => {
    return data.filter(item => item.active);
  }, [data]);
  
  // 3. Event handlers
  const handlePress = useCallback(() => {
    onPress(data);
  }, [data, onPress]);
  
  // 4. Effects
  useEffect(() => {
    loadData();
  }, []);
  
  // 5. Helper functions
  const loadData = async () => {
    // implementation
  };
  
  // 6. Render
  return (
    <View style={styles.container}>
      <Text>{title}</Text>
    </View>
  );
}

// 7. Styles at bottom
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

#### Performance Optimization
```javascript
// Use React.memo for components that re-render frequently
const ExpensiveComponent = React.memo(({ data }) => {
  return <View>{/* render */}</View>;
});

// Use useMemo for expensive computations
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.price - b.price);
}, [data]);

// Use useCallback for event handlers passed to children
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Avoid inline functions in render
// Bad:
<Button onPress={() => handlePress(id)} />
// Good:
const onPress = useCallback(() => handlePress(id), [id]);
<Button onPress={onPress} />
```

### Service Layer Patterns

#### Service Structure
```javascript
/**
 * Service class for [purpose]
 * Handles [responsibility]
 */
export class MyService {
  constructor(config = {}) {
    this.config = config;
  }
  
  /**
   * Method description
   * @param {string} query - Search query
   * @param {number} maxPrice - Maximum price filter
   * @returns {Promise<Array>} Array of results
   * @throws {Error} When API call fails
   */
  async search(query, maxPrice) {
    // Validate inputs
    if (!query || query.trim() === '') {
      return [];
    }
    
    try {
      // Implementation
      const results = await this._fetchResults(query, maxPrice);
      return results;
    } catch (error) {
      console.error('Search error:', redactSensitiveData(error.message));
      throw error;
    }
  }
  
  // Private methods prefixed with underscore
  async _fetchResults(query, maxPrice) {
    // implementation
  }
}
```

#### Error Handling
```javascript
// Always catch and handle errors appropriately
try {
  const results = await apiCall();
  return results;
} catch (error) {
  // 1. Redact sensitive data from error messages
  console.error('API error:', redactSensitiveData(error.message));
  
  // 2. Provide fallback behavior
  return getFallbackData();
  
  // 3. Or re-throw with context
  throw new Error(`Failed to fetch data: ${error.message}`);
}

// User-facing errors should be friendly
Alert.alert(
  'Error',
  'Failed to run search. Please check your configuration.',
  [{ text: 'OK' }]
);
```

### Data Management

#### AsyncStorage Pattern
```javascript
// Use constants for storage keys
import { STORAGE_KEYS } from '../constants';

// Always handle errors
const loadData = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SEARCHES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading data:', error);
    return []; // Return sensible default
  }
};

const saveData = async (data) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SEARCHES, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
};
```

#### SecureStore for Sensitive Data
```javascript
// Use SecureStore for API keys and tokens
import * as SecureStore from 'expo-secure-store';

// Save
await SecureStore.setItemAsync('api_key', apiKey);

// Load
const apiKey = await SecureStore.getItemAsync('api_key');

// Delete
await SecureStore.deleteItemAsync('api_key');
```

### Security Best Practices

#### API Key Handling
```javascript
// ✅ GOOD: Never log full API keys
console.log('API key:', apiKey.substring(0, 4) + '****');

// ❌ BAD: Logging sensitive data
console.log('API key:', apiKey);

// ✅ GOOD: Use redaction utility
import { redactSensitiveData } from '../utils/security';
console.error('Error:', redactSensitiveData(error.message));

// ✅ GOOD: Store API keys in SecureStore
await SecureStore.setItemAsync('openrouter_key', apiKey);

// ❌ BAD: Store API keys in AsyncStorage
await AsyncStorage.setItem('api_key', apiKey);
```

#### Input Validation
```javascript
// Always validate user input
const addSearch = (query, maxPrice) => {
  // Validate required fields
  if (!query || query.trim() === '') {
    Alert.alert('Error', 'Please enter a search query');
    return;
  }
  
  // Validate types
  if (maxPrice && typeof maxPrice !== 'number') {
    Alert.alert('Error', 'Invalid price format');
    return;
  }
  
  // Sanitize input (if needed)
  const sanitizedQuery = query.trim();
  
  // Proceed with validated data
  performSearch(sanitizedQuery, maxPrice);
};
```

### Testing Guidelines

#### Test Structure
```javascript
describe('ServiceName', () => {
  // Group related tests
  describe('methodName', () => {
    // Test happy path
    it('should return results when given valid input', async () => {
      const result = await service.method('valid input');
      expect(result).toBeDefined();
    });
    
    // Test edge cases
    it('should return empty array when given empty input', async () => {
      const result = await service.method('');
      expect(result).toEqual([]);
    });
    
    // Test error cases
    it('should handle errors gracefully', async () => {
      const result = await service.method('invalid');
      expect(result).toEqual([]);
    });
  });
});
```

#### Writing Testable Code
```javascript
// ✅ GOOD: Pure functions are easy to test
function filterByPrice(items, maxPrice) {
  return items.filter(item => item.price <= maxPrice);
}

// ❌ BAD: Side effects make testing hard
function filterByPrice(items, maxPrice) {
  this.setState({ filtered: items.filter(item => item.price <= maxPrice) });
}

// ✅ GOOD: Dependency injection
class SearchService {
  constructor(apiClient = axios) {
    this.apiClient = apiClient; // Can mock in tests
  }
}
```

### Performance Guidelines

#### API Call Optimization
```javascript
// Implement caching to reduce API calls
const cache = new Map();

async function searchWithCache(query) {
  const cacheKey = `search:${query}`;
  
  // Check cache first
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 min TTL
      return cached.data;
    }
  }
  
  // Fetch from API
  const data = await fetchFromAPI(query);
  
  // Store in cache
  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
  
  return data;
}

// Implement throttling to prevent API spam
import { debounce } from './utils/performance';

const debouncedSearch = debounce(async (query) => {
  return await searchService.search(query);
}, 500); // Wait 500ms after last input
```

#### Component Rendering
```javascript
// Use FlatList for long lists (virtualization)
<FlatList
  data={items}
  renderItem={({ item }) => <ItemComponent item={item} />}
  keyExtractor={item => item.id}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
/>

// Avoid large objects in state
// ❌ BAD: Storing entire API response
const [data, setData] = useState(entireApiResponse);

// ✅ GOOD: Store only what you need
const [items, setItems] = useState(response.data.items);
```

### Documentation Standards

#### JSDoc Comments
```javascript
/**
 * Search for items across all enabled platforms
 * 
 * This method queries eBay and/or Kleinanzeigen based on platform settings,
 * combines results, and returns a standardized array of items.
 * 
 * @param {string} query - Search query string (min 1 character)
 * @param {number|null} [maxPrice=null] - Optional maximum price filter in EUR
 * @returns {Promise<Array<Object>>} Array of search results
 * @returns {string} return[].id - Unique item identifier
 * @returns {string} return[].title - Item title
 * @returns {number} return[].price - Item price in EUR
 * @returns {string} return[].platform - Platform name ('eBay' or 'Kleinanzeigen')
 * @returns {string} return[].url - Direct link to item
 * 
 * @throws {Error} When network request fails
 * 
 * @example
 * const results = await searchService.searchAllPlatforms('iPhone 13', 500);
 * // Returns: [{ id: 'eBay-123...', title: 'iPhone 13...', price: 450, ... }]
 */
async searchAllPlatforms(query, maxPrice = null) {
  // implementation
}
```

#### Inline Comments
```javascript
// Use comments for complex logic, not obvious code
// ✅ GOOD: Explains WHY
// Filter results to at least 50% keyword match to reduce false positives
const matchCount = keywords.filter(k => title.includes(k)).length;
return matchCount >= Math.ceil(keywords.length * 0.5);

// ❌ BAD: Explains WHAT (code already shows this)
// Loop through keywords
keywords.forEach(keyword => { ... });

// ✅ GOOD: Warning about edge cases
// Note: eBay API returns timestamps in PST, convert to local time
const localTime = convertToLocal(ebayTime);

// ✅ GOOD: TODO comments
// TODO: Implement Kleinanzeigen scraping when legal status is clarified
return getMockResults();
```

### Common Patterns in This Project

#### Search Flow
```javascript
// 1. User creates search with query + optional max price
const search = { query: 'iPhone 13', maxPrice: 500 };

// 2. SearchService queries all enabled platforms
const results = await searchService.searchAllPlatforms(query, maxPrice);

// 3. AIService filters results using AI or keyword matching
const matches = await aiService.filterMatches(query, results);

// 4. Matches are saved with metadata
const match = {
  ...result,
  searchId: search.id,
  foundAt: new Date().toISOString(),
  isRead: false,
};
```

#### State Management Pattern
```javascript
// Load from storage on mount
useEffect(() => {
  loadSearches();
  loadMatches();
}, []);

// Save to storage when state changes
const saveSearches = async (newSearches) => {
  await AsyncStorage.setItem('searches', JSON.stringify(newSearches));
  setSearches(newSearches);
};

// Always update both storage and state together
```

### AI Integration Guidelines

#### OpenRouter API Usage
```javascript
// Always check for API key before making calls
if (!this.hasValidApiKey()) {
  return this.fallbackFilter(query, results);
}

// Include proper headers
headers: {
  'Authorization': `Bearer ${this.apiKey}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': 'https://github.com/felix-dieterle/WatchMouse',
  'X-Title': 'WatchMouse',
}

// Use cost-effective models
model: 'openai/gpt-3.5-turbo' // Cheaper than GPT-4

// Limit token usage
max_tokens: 100, // Only need indices, not prose
temperature: 0.3, // Low randomness for consistency
```

#### Fallback Pattern
```javascript
// Always provide fallback when AI is unavailable
async filterMatches(query, results) {
  if (!this.hasValidApiKey()) {
    return this.fallbackFilter(query, results);
  }
  
  try {
    return await this.aiFilter(query, results);
  } catch (error) {
    console.error('AI error:', error);
    return this.fallbackFilter(query, results);
  }
}
```

### Platform-Specific Notes

#### eBay API
- Uses Finding API v1.0.0
- Requires `EBAY_API_KEY` environment variable
- Default to German eBay (`EBAY-DE`)
- Falls back to mock data when no API key
- Rate limit: 5,000 calls/day on free tier

#### Kleinanzeigen
- Currently returns mock data only
- No official API available
- Future implementation requires web scraping or unofficial API
- Legal/ToS considerations need review

### Migration & Refactoring Guidelines

When refactoring code:
1. **Test first**: Ensure tests pass before refactoring
2. **Small steps**: Make small, incremental changes
3. **Test after**: Verify tests still pass after each change
4. **Document**: Update comments and docs as you go
5. **Backwards compatible**: Don't break existing APIs unless necessary

When adding new features:
1. **Constants first**: Add any new constants to `constants/`
2. **Services**: Add business logic to services, not components
3. **Tests**: Write tests alongside code, not after
4. **Documentation**: Update README and architecture docs
5. **Error handling**: Always handle errors gracefully

### Common Pitfalls to Avoid

❌ **Don't**:
- Store API keys in AsyncStorage (use SecureStore)
- Log sensitive data to console
- Make API calls without timeout
- Modify state directly (use setState/setters)
- Create inline functions in render
- Ignore error cases
- Write tests after code
- Skip input validation
- Use magic strings/numbers
- Mix business logic in UI components

✅ **Do**:
- Use SecureStore for sensitive data
- Redact sensitive data before logging
- Set timeouts on API calls
- Use immutable state updates
- Memoize callbacks and computed values
- Handle all error cases gracefully
- Write tests alongside code
- Validate all user input
- Use constants for config values
- Keep UI components presentational

### Questions & Support

For questions about:
- **Architecture**: See `docs/ARCHITECTURE.md`
- **eBay API**: See `docs/EBAY_API_GUIDE.md`
- **Testing**: See `docs/DEVELOPMENT.md`
- **Contributing**: See `CONTRIBUTING.md`
- **Known Issues**: See `GAPS_AND_STATUS.md`

When suggesting code:
1. Follow the patterns already established in the codebase
2. Maintain consistency with surrounding code
3. Add proper error handling
4. Include JSDoc comments for public APIs
5. Consider performance implications
6. Think about edge cases
7. Write testable code
8. Keep it simple and readable

Remember: **Code is read more than written. Optimize for readability and maintainability.**
