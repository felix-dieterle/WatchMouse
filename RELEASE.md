# Release Guide

This document explains how to create a release for WatchMouse.

## Current Version

- **Version**: 1.0.0
- **Status**: Ready for first release

## Creating a Release

The project is configured with automated CI/CD workflows that build and publish releases automatically.

### Automated Release Process

When you push a tag starting with `v` (e.g., `v1.0.0`), the GitHub Actions workflow will:

1. ✅ Build the Android APK
2. ✅ Create a GitHub Release
3. ✅ Upload the APK as a release asset
4. ✅ Add release notes

### How to Create a Release

```bash
# 1. Make sure you're on the main branch with latest changes
git checkout main
git pull

# 2. Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

That's it! The GitHub Actions workflow will automatically:
- Build the APK
- Create the release at: https://github.com/felix-dieterle/WatchMouse/releases
- Upload `watchmouse-v1.0.0.apk` for download

### Release Workflow Details

The release workflow (`.github/workflows/build-apk.yml`) triggers on:
- **Tags matching `v*`**: Creates official releases
- **Pushes to main**: Creates development builds (artifacts only)
- **Manual trigger**: Can be run manually via GitHub Actions UI

### Version Numbering

- Follow semantic versioning: `vMAJOR.MINOR.PATCH`
- Examples:
  - `v1.0.0` - First stable release
  - `v1.0.1` - Bug fix
  - `v1.1.0` - New features
  - `v2.0.0` - Breaking changes

### Before Creating a Release

1. ✅ Test the app thoroughly
2. ✅ Update version in `package.json` and `app.json` if needed
3. ✅ Update `README.md` with any new features
4. ✅ Update `CHANGELOG.md` or release notes if you have them
5. ✅ Ensure all tests pass
6. ✅ Merge all PRs into main

### Development Builds

For testing without creating a public release:

```bash
# Just push to main - artifacts will be created automatically
git push origin main
```

Artifacts are available in the Actions tab for 30 days.

### Manual Build (Local)

If you need to build locally:

```bash
# Install dependencies
npm install

# Build APK
npx expo prebuild --platform android
cd android
./gradlew assembleRelease

# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

## Release Checklist

- [ ] All features tested and working
- [ ] Version numbers updated in package.json and app.json
- [ ] README.md updated with new features
- [ ] All code merged to main branch
- [ ] Tag created and pushed
- [ ] Release appears on GitHub
- [ ] APK downloadable and installable
- [ ] Release notes are accurate

## Troubleshooting

### Build fails
- Check the GitHub Actions logs
- Ensure all dependencies are properly declared
- Verify Java/Android SDK versions match workflow (see `.github/workflows/build-apk.yml` for required versions: Java 17, Node 20)

### Release not created
- Ensure tag starts with `v` (e.g., `v1.0.0`, not `1.0.0`)
- Check GitHub Actions has write permissions
- Verify workflow file is correct

### APK not uploaded
- Check workflow logs for errors
- Ensure APK was built successfully
- Verify softprops/action-gh-release action succeeded
