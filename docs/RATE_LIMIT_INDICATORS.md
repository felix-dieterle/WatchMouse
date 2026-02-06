# API Rate Limit Indicators

## Overview

WatchMouse now includes visual rate limit indicators in the Settings screen that show the current usage status of each API. The indicators use color-coding to help users monitor their API consumption and avoid hitting rate limits.

## Features

### Color-Coded Status Indicators

The indicators use intuitive color coding:

- **🟢 Green (OK)**: 0-69% usage - Safe, normal operation
- **🟡 Yellow (Warning)**: 70-89% usage - Approaching limit, consider monitoring
- **🔴 Red (Critical)**: 90%+ usage - Nearly at limit, use cautiously
- **⚫ Gray (Disabled)**: API is not enabled or no API key configured

### APIs Tracked

1. **eBay API**
   - Daily limit: 5,000 calls (free tier)
   - Hard limit enforced
   - Resets at midnight server time
   - Displays: `[count] / 5000 calls ([percentage]%)`

2. **OpenRouter AI**
   - No hard daily limit (pay-per-use model)
   - Tracks usage for cost awareness
   - Resets at midnight
   - Displays: `[count] / N/A`

## Location

The rate limit indicators are displayed in the **Settings screen** (⚙️ icon) under the new section **"API Rate Limits"**.

## Implementation Details

### Components

#### RateLimitIndicator
Location: `src/components/RateLimitIndicator.js`

A reusable component that displays the rate limit status for a single API.

**Props:**
- `apiName` (string): Name of the API (e.g., "eBay API")
- `usagePercent` (number): Usage as decimal 0-1 (e.g., 0.75 = 75%)
- `count` (number): Number of API calls made today
- `limit` (number|string): Daily limit or "N/A" for unlimited
- `enabled` (boolean): Whether the API is enabled

**Example Usage:**
```jsx
<RateLimitIndicator
  apiName="eBay API"
  usagePercent={0.75}
  count={3750}
  limit={5000}
  enabled={true}
/>
```

### Services

#### OpenRouterRateLimiter
Location: `src/utils/openRouterRateLimiter.js`

Tracks OpenRouter API usage similar to the existing eBay rate limiter.

**Key Methods:**
- `async load()`: Load rate limit data from storage
- `async incrementCount()`: Increment the API call counter
- `async getStats()`: Get current usage statistics
- `async reset()`: Reset the counter (for testing or manual reset)

**Storage:**
- Uses AsyncStorage
- Key: `STORAGE_KEYS.OPENROUTER_RATE_LIMIT`
- Automatically resets at midnight

### Integration

#### AIService Updates
Location: `src/services/AIService.js`

The AIService has been updated to:
1. Import and initialize the OpenRouterRateLimiter
2. Increment the counter after each successful API call
3. Provide a static method `getOpenRouterRateLimitStats()` to retrieve stats

**Changes:**
```javascript
// Import rate limiter
import { OpenRouterRateLimiter } from '../utils/openRouterRateLimiter';

// Initialize global instance
const openRouterRateLimiter = new OpenRouterRateLimiter();

// Increment after successful API call
await openRouterRateLimiter.incrementCount();

// Static method to get stats
static async getOpenRouterRateLimitStats() {
  return await openRouterRateLimiter.getStats();
}
```

#### Settings Component Updates
Location: `src/components/Settings.js`

The Settings component has been updated to:
1. Import the necessary services and RateLimitIndicator component
2. Add state for rate limit data
3. Load rate limit stats when the component mounts
4. Display the "API Rate Limits" section with indicators

## Testing

### Unit Tests

All components and services have comprehensive test coverage:

1. **RateLimitIndicator.test.js** - Tests all color states and edge cases
2. **openRouterRateLimiter.test.js** - Tests rate limiting logic
3. **Settings.test.js** - Updated to test rate limit display

Run tests:
```bash
npm test -- --testPathPattern=RateLimitIndicator
npm test -- --testPathPattern=openRouterRateLimiter
npm test -- --testPathPattern=Settings
```

### Visual Test

A visual test file demonstrates all indicator states:
```bash
npm test -- --testPathPattern=visual
```

## User Guide

### How to View Rate Limits

1. Open the WatchMouse app
2. Tap the Settings icon (⚙️) in the top-right corner
3. Scroll down to the "API Rate Limits" section
4. View current usage for each API

### Understanding the Indicators

**eBay API:**
- Shows calls made today vs. daily limit (5,000)
- Green = plenty of calls remaining
- Yellow = 70%+ used, monitor usage
- Red = 90%+ used, close to limit
- Gray = eBay is disabled in settings

**OpenRouter AI:**
- Shows calls made today (no hard limit)
- Tracked for cost awareness
- Gray = No API key configured

### What Happens When Limits Are Reached

**eBay API:**
- At 100% usage, the app will show an error when trying to search
- Limit resets at midnight server time
- Consider enabling AI mode to reduce eBay API usage

**OpenRouter AI:**
- No hard limit (pay-per-use)
- Monitor usage to manage costs
- Can continue using as long as credits are available

## Development Notes

### Adding New API Rate Limiters

To add rate limiting for additional APIs:

1. Create a new rate limiter class (follow `OpenRouterRateLimiter.js` pattern)
2. Add storage key to `src/constants/index.js`
3. Initialize rate limiter in the service that makes API calls
4. Increment counter after successful API calls
5. Add static method to get stats
6. Update Settings component to display new indicator

### Modifying Color Thresholds

The color thresholds are defined in `RateLimitIndicator.js`:

```javascript
const getIndicatorColor = () => {
  if (usagePercent >= 0.9) return '#f44336';  // Red at 90%
  if (usagePercent >= 0.7) return '#ff9800';  // Yellow at 70%
  return '#4caf50';                           // Green below 70%
};
```

To change the yellow threshold from 70% to another value, modify the `0.7` value.

## Performance Considerations

- Rate limit data is stored locally in AsyncStorage
- No network calls required to display indicators
- Stats are loaded once when Settings screen opens
- Minimal impact on app performance

## Future Enhancements

Potential improvements:
- Push notifications when approaching limits
- Historical usage graphs
- Rate limit reset countdown timer
- Per-search API cost estimates
- Export usage data for analysis

## Changelog

### Version 1.0 (Current)
- ✅ RateLimitIndicator component
- ✅ OpenRouter API tracking
- ✅ eBay API tracking (already existed, now displayed)
- ✅ Color-coded visual indicators
- ✅ Settings screen integration
- ✅ Comprehensive test coverage
- ✅ Daily reset functionality
