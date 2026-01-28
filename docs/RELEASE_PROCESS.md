# Release Process

This document describes how the automated build and release process works for WatchMouse.

## Overview

WatchMouse uses GitHub Actions to automatically build and distribute Android APKs. There are two types of builds:

1. **Development Builds** - Created automatically on every merge to main
2. **Release Builds** - Created manually by pushing a version tag

## Development Builds

### When They're Created
- Automatically triggered when code is merged to the `main` branch
- Also can be triggered manually via workflow dispatch

### Characteristics
- Named with timestamp: `watchmouse-dev-YYYYMMDD-HHMMSS.apk`
- Uploaded as GitHub Actions artifacts
- Available for 30 days
- Not publicly listed in releases

### How to Access
1. Go to the [Actions tab](https://github.com/felix-dieterle/WatchMouse/actions)
2. Click on the latest "Build and Release Android APK" workflow run
3. Scroll down to "Artifacts" section
4. Download the APK

## Release Builds

### When They're Created
Release builds are created when you push a version tag to the repository.

### Creating a Release

1. **Ensure code is ready**
   ```bash
   # Make sure you're on main branch with latest code
   git checkout main
   git pull origin main
   ```

2. **Create and push a tag**
   ```bash
   # Create a tag with semantic versioning
   git tag v1.0.0
   
   # Push the tag to GitHub
   git push origin v1.0.0
   ```

3. **Wait for build to complete**
   - GitHub Actions will automatically build the APK
   - A new release will be created in the [Releases](https://github.com/felix-dieterle/WatchMouse/releases) page

### Characteristics
- Named with version tag: `watchmouse-v1.0.0.apk`
- Creates a permanent GitHub Release
- Publicly available for download
- Also uploaded as workflow artifact

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):
- **Major version** (v1.0.0 → v2.0.0): Breaking changes
- **Minor version** (v1.0.0 → v1.1.0): New features, backwards compatible
- **Patch version** (v1.0.0 → v1.0.1): Bug fixes, backwards compatible

Examples:
- `v1.0.0` - First stable release
- `v1.1.0` - Added new feature (e.g., price history)
- `v1.0.1` - Fixed a bug in search
- `v2.0.0` - Major rewrite or breaking API change

## Build Process

Both types of builds follow the same process:

1. **Setup Environment**
   - Node.js 20
   - Java 17 (Temurin)
   - Android SDK

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build APK**
   ```bash
   npx expo prebuild --platform android
   cd android
   ./gradlew assembleRelease
   ```

4. **Package & Upload**
   - APK is renamed with appropriate version
   - Uploaded to GitHub (as artifact and/or release)

## Troubleshooting

### Build Failed
1. Check the [Actions tab](https://github.com/felix-dieterle/WatchMouse/actions) for error details
2. Common issues:
   - Dependency installation failed → Check package.json
   - Gradle build failed → Check Android configuration
   - Out of disk space → Usually resolves on retry

### Release Not Created
- Make sure you pushed a tag starting with `v` (e.g., `v1.0.0`)
- Check that the tag was pushed to the remote: `git ls-remote --tags origin`
- Verify workflow completed successfully in Actions tab

### APK Not Working
- Ensure "Install from unknown sources" is enabled on Android device
- Check minimum Android version requirements
- Try uninstalling previous version before installing new one

## Manual Build (Local)

If you need to build locally for testing:

```bash
# Install dependencies
npm install

# Build APK
npx expo prebuild --platform android
cd android
./gradlew assembleRelease

# APK will be at:
# android/app/build/outputs/apk/release/app-release.apk
```

## Future Improvements

Potential enhancements to the release process:
- [ ] Code signing with release keystore
- [ ] Automated changelog generation from commits
- [ ] Beta/alpha release channels
- [ ] Play Store automated upload
- [ ] Version auto-increment on merge
