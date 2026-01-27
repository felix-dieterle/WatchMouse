# WatchMouse Architecture

## Overview

WatchMouse is a React Native (Expo) mobile application that monitors shopping platforms for deals matching user-defined searches, using AI to intelligently match results.

## Technology Stack

- **Frontend**: React Native with Expo
- **Storage**: AsyncStorage (local device storage)
- **AI Integration**: OpenRouter API (GPT-3.5-turbo)
- **Platform APIs**: eBay API, Kleinanzeigen (web scraping)
- **CI/CD**: GitHub Actions

## Project Structure

```
WatchMouse/
├── App.js                      # Main application component
├── src/
│   └── services/
│       ├── AIService.js        # AI matching and filtering logic
│       └── SearchService.js    # Platform search integrations
├── assets/                     # App icons and images
├── .github/
│   └── workflows/
│       └── build-apk.yml       # CI/CD pipeline
├── docs/                       # Documentation
├── package.json                # Dependencies
├── app.json                    # Expo configuration
└── babel.config.js             # Babel configuration
```

## Component Architecture

### App.js (Main Component)

The main app component manages:
- **State Management**: Searches, matches, UI state
- **Storage Integration**: Load/save data to AsyncStorage
- **UI Rendering**: Search list, match list, forms

Key states:
- `searches`: Array of saved search queries
- `matches`: Array of found matching items
- `showAddSearch`: UI state for add search form
- `isLoading`: Loading state during searches

### Services

#### SearchService

Handles searching across multiple platforms:

```javascript
searchAllPlatforms(query, maxPrice) -> results[]
```

**Platform Searchers:**
- `EbaySearcher`: eBay integration
- `KleinanzeigenSearcher`: Kleinanzeigen integration

Each searcher implements:
```javascript
search(query, maxPrice) -> results[]
```

Returns standardized result objects:
```javascript
{
  id: string,
  title: string,
  price: number,
  platform: string,
  url: string
}
```

#### AIService

Handles AI-powered result filtering:

```javascript
filterMatches(searchQuery, results) -> filteredResults[]
```

**Features:**
- Uses OpenRouter API for GPT-3.5-turbo
- Builds intelligent prompts for filtering
- Handles typos and variations
- Falls back to keyword matching if AI unavailable

**Flow:**
1. Build prompt with search query and results
2. Send to OpenRouter API
3. Parse AI response (indices of matches)
4. Return filtered results

## Data Flow

1. **User adds search** → Save to AsyncStorage
2. **User runs search** → SearchService queries platforms
3. **Results returned** → AIService filters matches
4. **Matches found** → Save to AsyncStorage, display to user

## Storage Schema

### Searches
```javascript
{
  id: string,              // Unique identifier
  query: string,           // Search query
  maxPrice: number|null,   // Maximum price filter
  createdAt: string        // ISO timestamp
}
```

### Matches
```javascript
{
  id: string,              // From platform
  title: string,           // Item title
  price: number,           // Item price
  platform: string,        // 'eBay' or 'Kleinanzeigen'
  url: string,             // Item URL
  searchId: string,        // Reference to search
  foundAt: string          // ISO timestamp
}
```

## CI/CD Pipeline

### Workflow Triggers
- Tag push: `v*` (e.g., v1.0.0)
- Manual trigger: workflow_dispatch

### Build Steps
1. Checkout code
2. Setup Node.js, Java, Android SDK
3. Install dependencies
4. Build APK with Expo
5. Create GitHub release
6. Upload APK artifact

### Release Process

```bash
# Create and push a tag
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions automatically:
# 1. Builds the APK
# 2. Creates a release
# 3. Uploads the APK
```

## Future Enhancements

### Planned Features
1. **Background Sync**: Periodic search updates
2. **Push Notifications**: Alert users of new matches
3. **User Authentication**: Cloud sync across devices
4. **Advanced Filters**: Location, condition, seller rating
5. **Price History**: Track price changes over time
6. **More Platforms**: Amazon, Facebook Marketplace, etc.

### Technical Improvements
1. **Caching**: Reduce API calls and improve performance
2. **Rate Limiting**: Respect platform API limits
3. **Error Handling**: Better error messages and recovery
4. **Testing**: Unit and integration tests
5. **Offline Support**: Queue searches when offline

## Development Guidelines

### Adding a New Platform

1. Create a new searcher class in `SearchService.js`:
```javascript
class NewPlatformSearcher {
  async search(query, maxPrice) {
    // Implement platform-specific search
    return results;
  }
}
```

2. Add to SearchService platforms:
```javascript
this.platforms = {
  ebay: new EbaySearcher(),
  kleinanzeigen: new KleinanzeigenSearcher(),
  newplatform: new NewPlatformSearcher(),
};
```

### Modifying AI Behavior

Edit `AIService.js`:
- `buildFilterPrompt()`: Modify the prompt sent to AI
- `model`: Change AI model (e.g., to gpt-4 for better accuracy)
- `fallbackFilter()`: Improve keyword matching fallback

### UI Customization

Edit `App.js` styles:
- Color scheme in `styles` object
- Layout in component render methods
- Add new screens by extending the component structure
