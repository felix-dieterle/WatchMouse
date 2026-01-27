# WatchMouse 🐭

A smart Android app that monitors shopping platforms (eBay, Kleinanzeigen) and finds deals matching your saved searches using AI-powered matching.

## Features

- 🔍 **Smart Search Monitoring**: Save your search queries and let WatchMouse monitor multiple platforms
- 🤖 **AI-Powered Matching**: Uses AI (via OpenRouter) to find relevant items even with typos or variations
- 💰 **Price Filtering**: Set maximum price limits for your searches
- 📱 **Android App**: Native mobile experience built with React Native/Expo
- 🔔 **Deal Notifications**: Get notified when new matching items are found
- 🏷️ **Multi-Platform Support**: Currently supports eBay and Kleinanzeigen

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

### API Keys

The app uses OpenRouter for AI-powered search matching. To use the AI features:

1. Get an API key from [OpenRouter](https://openrouter.ai/)
2. Set the environment variable: `OPENROUTER_API_KEY=your_key_here`

For eBay integration (future):
- Get an API key from [eBay Developers](https://developer.ebay.com/)
- Set `EBAY_API_KEY=your_key_here`

## Usage

1. **Add a Search**: Tap "Add Search" and enter your search query and optional max price
2. **Run Search**: Tap "Run" on any saved search to check for new matches
3. **View Matches**: See recent matches in the "Recent Matches" section
4. **Manage Searches**: Delete searches you no longer need

## Architecture

```
WatchMouse/
├── App.js                 # Main app component
├── src/
│   └── services/
│       ├── AIService.js        # AI matching logic
│       └── SearchService.js    # Platform search integration
├── .github/
│   └── workflows/
│       └── build-apk.yml       # CI/CD for APK builds
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

The project includes automated CI/CD that:
- Builds APK on every tag push
- Creates GitHub releases with downloadable APKs
- Uploads build artifacts

To create a release:
```bash
git tag v1.0.0
git push origin v1.0.0
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Roadmap

- [ ] Push notifications for new matches
- [ ] Background search scheduling
- [ ] More platform support (Amazon, etc.)
- [ ] Advanced filters (condition, location, etc.)
- [ ] User authentication and cloud sync
- [ ] Price history tracking

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/felix-dieterle/WatchMouse/issues) page.