# WatchMouse Development Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Testing](#testing)
4. [Code Quality](#code-quality)
5. [Performance Optimization](#performance-optimization)
6. [Security Guidelines](#security-guidelines)
7. [Common Tasks](#common-tasks)
8. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Android Studio (for Android development)
- Expo CLI
- Git

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/felix-dieterle/WatchMouse.git
cd WatchMouse

# Install dependencies
npm install

# Start development server
npm start
```

### Environment Setup

The app uses environment variables for API configuration:

```bash
# Optional: Create .env file (not committed to git)
OPENROUTER_API_KEY=your_openrouter_key_here
EBAY_API_KEY=your_ebay_key_here
```

**Note**: API keys can also be configured through the in-app Settings screen, which is the recommended approach for end users.

## Development Workflow

### Project Structure

```
WatchMouse/
├── App.js                          # Main application component
├── src/
│   ├── components/                 # React components
│   │   ├── Settings.js            # Settings screen
│   │   └── __tests__/             # Component tests
│   ├── services/                   # Business logic services
│   │   ├── AIService.js           # AI matching service
│   │   ├── SearchService.js       # Multi-platform search
│   │   ├── SettingsService.js     # Settings persistence
│   │   └── __tests__/             # Service tests
│   ├── constants/                  # Application constants
│   │   └── index.js               # Centralized constants
│   └── utils/                      # Utility functions
│       ├── security.js            # Security utilities
│       └── performance.js         # Performance utilities
├── __tests__/                      # Root level tests
├── docs/                           # Documentation
└── .github/                        # CI/CD and GitHub config
```

### Coding Standards

Follow the patterns defined in `.github/copilot-instructions.md`:

- Use 2 spaces for indentation
- Use single quotes for strings (except JSX)
- Add semicolons at end of statements
- Maximum line length: 100 characters
- Use JSDoc comments for public APIs
- Follow established naming conventions

### Branching Strategy

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature-name
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Writing Tests

#### Service Tests

```javascript
// src/services/__tests__/MyService.test.js
import { MyService } from '../MyService';

describe('MyService', () => {
  let service;
  
  beforeEach(() => {
    service = new MyService();
  });
  
  describe('search', () => {
    it('should return results for valid query', async () => {
      const results = await service.search('iPhone 13');
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
    });
    
    it('should return empty array for empty query', async () => {
      const results = await service.search('');
      expect(results).toEqual([]);
    });
    
    it('should handle errors gracefully', async () => {
      // Mock API error
      const results = await service.search('error-trigger');
      expect(results).toEqual([]);
    });
  });
});
```

#### Component Tests

```javascript
// src/components/__tests__/MyComponent.test.js
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<MyComponent title="Test" />);
    expect(getByText('Test')).toBeTruthy();
  });
  
  it('should handle button press', async () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <MyComponent onPress={onPress} />
    );
    
    fireEvent.press(getByText('Submit'));
    
    await waitFor(() => {
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });
});
```

### Test Coverage Goals

- **Services**: 80%+ coverage
- **Components**: 60%+ coverage
- **Overall**: 70%+ coverage

Check coverage with:
```bash
npm run test:coverage
```

## Code Quality

### Linting

```bash
# Run linter
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

### Pre-commit Checks

Before committing:
1. Run tests: `npm test`
2. Run linter: `npm run lint`
3. Check coverage: `npm run test:coverage`
4. Manual testing on device/emulator

### Code Review Checklist

- [ ] All tests pass
- [ ] Linter passes with no errors
- [ ] Coverage maintained or improved
- [ ] JSDoc comments added for public APIs
- [ ] Security considerations addressed
- [ ] Performance implications considered
- [ ] Error handling implemented
- [ ] Constants used instead of magic strings
- [ ] Code is readable and maintainable

## Performance Optimization

### Best Practices

1. **Use React.memo() for expensive components**
```javascript
const ExpensiveComponent = React.memo(({ data }) => {
  // Component implementation
});
```

2. **Use useMemo() for expensive computations**
```javascript
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.price - b.price);
}, [data]);
```

3. **Use useCallback() for event handlers**
```javascript
const handlePress = useCallback(() => {
  doSomething(id);
}, [id]);
```

4. **Implement caching for API calls**
```javascript
import { Cache } from '../utils/performance';

const cache = new Cache(50);
const cachedData = cache.get(cacheKey);
if (cachedData) {
  return cachedData;
}
```

5. **Use FlatList for long lists**
```javascript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={item => item.id}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
/>
```

### Performance Monitoring

Enable performance logging in development:
```javascript
// src/constants/index.js
export const FEATURE_FLAGS = {
  ENABLE_PERFORMANCE_LOGGING: true, // Enable in development
};
```

Use the `measurePerformance` utility:
```javascript
import { measurePerformance } from '../utils/performance';

const measuredSearch = measurePerformance(searchFunction, 'Search');
const results = await measuredSearch(query);
// Logs: "[Performance] Search took 245ms"
```

## Security Guidelines

### API Key Handling

**Always use SecureStore for API keys:**
```javascript
import * as SecureStore from 'expo-secure-store';

// Save
await SecureStore.setItemAsync('api_key', apiKey);

// Load
const apiKey = await SecureStore.getItemAsync('api_key');
```

**Never log sensitive data:**
```javascript
import { redactSensitiveData } from '../utils/security';

// ❌ BAD
console.log('API key:', apiKey);

// ✅ GOOD
console.log('API key:', apiKey.substring(0, 4) + '****');

// ✅ BETTER - Use utility
console.error('Error:', redactSensitiveData(error.message));
```

### Input Validation

Always validate user input:
```javascript
import { sanitizeInput } from '../utils/security';
import { VALIDATION } from '../constants';

const validateSearchQuery = (query) => {
  const sanitized = sanitizeInput(query);
  
  if (sanitized.length < VALIDATION.MIN_SEARCH_QUERY_LENGTH) {
    throw new Error(ERROR_MESSAGES.EMPTY_QUERY);
  }
  
  if (sanitized.length > VALIDATION.MAX_SEARCH_QUERY_LENGTH) {
    throw new Error('Query too long');
  }
  
  return sanitized;
};
```

### Security Checklist

- [ ] API keys stored in SecureStore
- [ ] Sensitive data redacted from logs
- [ ] User input validated and sanitized
- [ ] HTTPS used for all API calls
- [ ] Timeout set on API requests
- [ ] Error messages don't expose internals
- [ ] No secrets in code or git history

## Common Tasks

### Adding a New Platform

1. Create platform searcher class in `SearchService.js`:
```javascript
class NewPlatformSearcher {
  async search(query, maxPrice) {
    // Implementation
  }
}
```

2. Register platform in SearchService:
```javascript
this.platforms = {
  ebay: new EbaySearcher(),
  kleinanzeigen: new KleinanzeigenSearcher(),
  newplatform: new NewPlatformSearcher(), // Add here
};
```

3. Add platform constant:
```javascript
// src/constants/index.js
export const PLATFORMS = {
  EBAY: 'eBay',
  KLEINANZEIGEN: 'Kleinanzeigen',
  NEWPLATFORM: 'NewPlatform', // Add here
};
```

4. Update Settings component to include toggle

5. Write tests for new platform searcher

### Adding a New Feature

1. Check if feature flag needed in `constants/index.js`
2. Implement business logic in appropriate service
3. Add UI components if needed
4. Write tests for new functionality
5. Update documentation (README, ARCHITECTURE)
6. Add to GAPS_AND_STATUS if incomplete

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update specific package
npm update package-name

# Update all packages (be cautious)
npm update

# After updating, test thoroughly
npm test
npm run lint
```

### Building for Production

```bash
# Android APK
npm run build:android

# Using EAS Build (recommended)
eas build --platform android --profile production
```

## Troubleshooting

### Common Issues

#### Tests Failing

```bash
# Clear Jest cache
npx jest --clearCache

# Reinstall dependencies
rm -rf node_modules
npm install

# Check node version
node --version  # Should be 18+
```

#### Expo/Metro Issues

```bash
# Clear Metro bundler cache
npx expo start --clear

# Reset Expo cache
npx expo start -c
```

#### Android Build Issues

```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Rebuild
npm run android
```

#### Linter Errors

```bash
# Auto-fix most issues
npm run lint:fix

# Check ESLint config
npx eslint --print-config App.js
```

### Getting Help

1. Check existing documentation:
   - README.md
   - ARCHITECTURE.md
   - GAPS_AND_STATUS.md
   - .github/copilot-instructions.md

2. Search existing issues on GitHub

3. Create new issue with:
   - Description of problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node version, OS, etc.)

## Best Practices Summary

### Do ✅
- Write tests for all new code
- Use constants instead of magic strings
- Add JSDoc comments for public APIs
- Handle errors gracefully
- Validate user input
- Use SecureStore for sensitive data
- Optimize for performance
- Keep components small and focused
- Use meaningful variable names
- Follow established patterns

### Don't ❌
- Commit API keys or secrets
- Log sensitive data
- Skip input validation
- Ignore error cases
- Mix business logic in UI components
- Use magic strings/numbers
- Create inline functions in render
- Mutate state directly
- Skip tests
- Leave console.logs in production code

## Resources

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Jest Testing](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react-native)
- [ESLint Rules](https://eslint.org/docs/rules/)

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

---

**Happy Coding! 🚀**

For questions or suggestions about this guide, please open an issue on GitHub.
