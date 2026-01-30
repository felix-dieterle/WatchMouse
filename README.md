# WatchMouse 🐭

A smart Android app that monitors shopping platforms (eBay, Kleinanzeigen) and finds deals matching your saved searches using AI-powered matching.

## Features

- 🔍 **Smart Search Monitoring**: Save your search queries and let WatchMouse monitor multiple platforms
- 🤖 **AI-Powered Matching**: Uses AI (via OpenRouter) to find relevant items even with typos or variations
  - Automatically falls back to keyword matching when no API key is configured
- ⚙️ **Configurable Settings**: Easy-to-use settings screen to manage API keys and platform preferences
- 🔧 **Module System**: Enable/disable individual platforms (eBay, Kleinanzeigen) as needed
- 💰 **Price Filtering**: Set maximum price limits for your searches
- 📱 **Android App**: Native mobile experience built with React Native/Expo
- 🔗 **Easy Navigation**: One-tap access to open offer pages directly in your browser
- 🔔 **Deal Notifications**: Get notified when new matching items are found
- 🏷️ **Multi-Platform Support**: Currently supports eBay and Kleinanzeigen
- 🔎 **Advanced Search & Filter**: Filter and sort your saved searches and matches
  - Search/filter saved searches by query text
  - Search/filter matches by title
  - Sort searches by date or name
  - Sort matches by date, price, or title
  - Filter matches by platform (eBay, Kleinanzeigen)
  - Filter matches by read/unread status
  - Mark matches as read/unread to track what you've reviewed
  - Mark all matches as read with one tap
  - View search and match counts (including unread count)
  - Clear all matches with one tap

## Installation

### Download APK
1. Go to [Releases](https://github.com/felix-dieterle/WatchMouse/releases)
2. Download the latest APK file
3. Enable "Install from unknown sources" in your Android settings
4. Install the APK

### Build from Source

```bash
# Clone the repository
git clone https://github.com/felix-dieterle/WatchMouse.git
cd WatchMouse

# Install dependencies
npm install

# Run on Android
npm run android

# Or build APK
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

## Configuration

### Settings Screen

The app includes a settings screen accessible via the gear icon (⚙️) in the top-right corner of the home screen. Here you can configure:

#### AI Configuration
- **OpenRouter API Key**: Enter your API key from [OpenRouter](https://openrouter.ai/)
  - With a valid API key: AI-powered matching for better search results
  - Without an API key: Falls back to basic keyword matching
  - The app displays a warning banner when no API key is configured

#### Platform Modules
- **eBay**: Enable/disable searching on eBay platform
- **Kleinanzeigen**: Enable/disable searching on Kleinanzeigen platform
- At least one platform must be enabled

All settings are saved locally on your device using AsyncStorage.

### API Keys (Legacy Configuration)

For advanced users, API keys can also be set via environment variables:

The app uses OpenRouter for AI-powered search matching. To use the AI features:

1. Get an API key from [OpenRouter](https://openrouter.ai/)
2. Set the environment variable: `OPENROUTER_API_KEY=your_key_here`

For eBay integration:
- Get an API key from [eBay Developers](https://developer.ebay.com/)
- Set `EBAY_API_KEY=your_key_here`
- Without an API key, eBay searches fall back to mock data

## Usage

1. **Configure Settings**: Tap the gear icon (⚙️) to open settings
   - Add your OpenRouter API key for AI-powered matching (optional but recommended)
   - Enable/disable platforms (eBay, Kleinanzeigen) as needed
2. **Add a Search**: Tap "Add Search" and enter your search query and optional max price
3. **Run Search**: Tap "Run" on any saved search to check for new matches
4. **View Matches**: See recent matches in the "Recent Matches" section
5. **Open Offer Pages**: Tap "🔗 Open Link" on any match to view the item on eBay or Kleinanzeigen
6. **Track What You've Seen**: Tap "Mark Read" on individual matches or "Mark All Read" to track reviewed items
7. **Manage Searches**: Delete searches you no longer need
8. **Filter & Sort**: 
   - Use the filter box to search within saved searches or matches
   - Tap sort buttons to organize by date, name, or price
   - Filter matches by platform (eBay or Kleinanzeigen)
   - Filter matches by read/unread status to focus on new items
   - Clear all matches when needed

## Architecture

```
WatchMouse/
├── App.js                 # Main app component
├── src/
│   ├── components/
│   │   └── Settings.js          # Settings screen component
│   └── services/
│       ├── AIService.js         # AI matching logic
│       ├── SearchService.js     # Platform search integration
│       └── SettingsService.js   # Settings persistence
├── .github/
│   └── workflows/
│       └── build-apk.yml        # CI/CD for APK builds
├── package.json
└── app.json
```

## Development

```bash
# Start development server
npm start

# Run on Android emulator
npm run android

# Run tests (when available)
npm test
```

## CI/CD

The project includes automated CI/CD with the following workflows:

### Automated Builds
- **On merge to main**: Automatically builds APK and uploads as workflow artifact
  - Artifacts are available in the Actions tab for 30 days
  - Build name includes timestamp and commit SHA
- **On tag push**: Creates official GitHub release with downloadable APK
  - Releases are permanent and publicly available

### Creating a Release

For an official release:
```bash
git tag v1.0.0
git push origin v1.0.0
```

For development builds, simply merge to main - the APK will be built automatically and available as a workflow artifact.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

For more information, see:
- [docs/EBAY_API_GUIDE.md](docs/EBAY_API_GUIDE.md) - Complete eBay API integration guide
- [docs/API_CONFIGURATION.md](docs/API_CONFIGURATION.md) - API setup and configuration
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Technical architecture overview

## License

MIT License - see LICENSE file for details

## Roadmap

### Implemented ✅
- [x] Mark matches as read/seen to track reviewed items
- [x] Filter matches by read/unread status
- [x] Advanced search and filter features

### Planned
- [ ] Push notifications for new matches
- [ ] Background search scheduling
- [ ] More platform support (Amazon, etc.)
- [ ] Advanced filters (condition, location, etc.)
- [ ] User authentication and cloud sync
- [ ] Price history tracking

## Project Status

For a comprehensive analysis of current state, known gaps, and critical next steps, see [GAPS_AND_STATUS.md](GAPS_AND_STATUS.md).

**Quick Status** (v1.0.0):
- ✅ MVP functional - Core features working
- ⚠️ Security gaps - API key handling needs improvement (see GAPS_AND_STATUS.md)
- ⚠️ Kleinanzeigen uses mock data only
- ⚠️ No background monitoring yet (manual searches only)

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/felix-dieterle/WatchMouse/issues) page.