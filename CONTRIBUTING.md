# Contributing to WatchMouse

Thank you for your interest in contributing to WatchMouse! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/WatchMouse.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit your changes: `git commit -m "Description of changes"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Create a Pull Request

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android
```

## Code Style

- Use ES6+ JavaScript features
- Follow existing code formatting
- Add comments for complex logic
- Keep functions focused and single-purpose

## Pull Request Guidelines

- Provide a clear description of the changes
- Reference any related issues
- Include screenshots for UI changes
- Ensure code is tested
- Update documentation if needed

## Adding New Platforms

To add support for a new shopping platform:

1. Create a new searcher class in `src/services/SearchService.js`
2. Implement the `search(query, maxPrice)` method
3. Add the searcher to the platforms list
4. Update documentation

Example:
```javascript
class NewPlatformSearcher {
  async search(query, maxPrice) {
    // Implementation
    return results;
  }
}
```

## Reporting Issues

When reporting issues, please include:
- Device and OS version
- App version
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable

## Feature Requests

Feature requests are welcome! Please:
- Check existing issues first
- Provide a clear use case
- Explain the expected behavior
- Consider implementation complexity

## Questions?

Feel free to open an issue for questions or discussion.

Thank you for contributing! 🎉
