# Quick Start Guide

## For Users

### Installing the App

1. **Download the APK**
   - Go to [Releases](https://github.com/felix-dieterle/WatchMouse/releases)
   - Download the latest `watchmouse-*.apk` file

2. **Install on Android**
   - Open the downloaded APK file on your Android device
   - If prompted, enable "Install from unknown sources"
   - Follow the installation prompts

3. **Configure (Optional)**
   - For AI-powered matching, you'll need an OpenRouter API key
   - Get a free key at [OpenRouter](https://openrouter.ai/)
   - Currently configured via environment variables (future: in-app settings)

### Using the App

1. **Add a Search**
   - Tap "Add Search" button
   - Enter what you're looking for (e.g., "iPhone 13")
   - Optionally set a maximum price
   - Tap "Add"

2. **Run Searches**
   - Tap "Run" on any saved search
   - The app will search eBay and Kleinanzeigen
   - AI will filter results to find relevant matches
   - Results appear in "Recent Matches"

3. **Manage Searches**
   - Delete searches you no longer need
   - Run searches whenever you want to check for new deals

## For Developers

### Local Development

```bash
# Clone the repository
git clone https://github.com/felix-dieterle/WatchMouse.git
cd WatchMouse

# Install dependencies
npm install

# Start development server
npm start

# In another terminal, run on Android
npm run android
```

### Building APK Locally

```bash
# Prebuild native code
npx expo prebuild --platform android

# Navigate to android directory
cd android

# Build release APK
./gradlew assembleRelease

# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

### Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your API keys to `.env`:
   ```
   OPENROUTER_API_KEY=your_key_here
   EBAY_API_KEY=your_key_here
   ```

3. Restart the app to apply changes

### Running Tests

```bash
# Run tests (when implemented)
npm test
```

## CI/CD - Automated Releases

### Creating a Release

1. **Tag the release**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **GitHub Actions will automatically:**
   - Build the Android APK
   - Create a GitHub release
   - Upload the APK as a downloadable asset

3. **Users can download the APK from the Releases page**

### Manual Release (if needed)

You can also trigger the build manually:
1. Go to Actions tab in GitHub
2. Select "Build and Release Android APK" workflow
3. Click "Run workflow"

## Troubleshooting

### App won't install
- Make sure "Install from unknown sources" is enabled
- Check that your Android version is compatible (4.4+)

### No search results
- Mock data is used by default
- For real data, configure eBay API key
- Check your internet connection

### AI matching not working
- Ensure OpenRouter API key is configured
- The app will fall back to keyword matching without AI
- Check API key has credits/quota

### Build fails
- Ensure Java 17 is installed
- Ensure Android SDK is properly set up
- Try cleaning: `cd android && ./gradlew clean`

## Need Help?

- Check [Documentation](./docs/)
- Open an [Issue](https://github.com/felix-dieterle/WatchMouse/issues)
- Read [Contributing Guide](./CONTRIBUTING.md)

## What's Next?

After getting started:
- Explore the [Architecture](./docs/ARCHITECTURE.md)
- Read [API Configuration](./docs/API_CONFIGURATION.md)
- Consider [Contributing](./CONTRIBUTING.md)
