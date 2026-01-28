# WatchMouse - Quick Reference: Critical Next Steps

**Last Updated**: January 2026  
**Status**: MVP Launched - Security & Testing Needed

> **TL;DR**: App works but has critical security gaps (API key storage) and no component tests. Fix these before wide release.

---

## 🚨 CRITICAL PRIORITIES (Fix This Week)

### P0: Security Vulnerabilities
**Status**: 🔴 CRITICAL - Must fix before production

1. **API Keys Stored in Plaintext**
   - **File**: `src/services/SettingsService.js:40`
   - **Issue**: AsyncStorage is NOT encrypted; API keys visible to anyone with device access
   - **Fix**: Use `expo-secure-store`
   ```bash
   npx expo install expo-secure-store
   ```
   - **Effort**: 1 day
   - **See**: [GAPS_AND_STATUS.md Section 1.1](GAPS_AND_STATUS.md#11-security-issues---critical)

2. **API Keys Logged in Console**
   - **File**: `src/services/SearchService.js:57-88`
   - **Issue**: Keys visible in crash logs and debug output
   - **Fix**: Redact keys before logging
   ```javascript
   console.log('API key:', apiKey.substring(0, 4) + '****');
   ```
   - **Effort**: 2 hours

### P0: Missing Error Boundaries
**Status**: 🔴 CRITICAL - App crashes on service errors

- **File**: `App.js` (no error boundary)
- **Issue**: Any service error crashes entire app
- **Fix**: Add `react-error-boundary`
```bash
npm install react-error-boundary
```
- **Effort**: 1 day
- **See**: [GAPS_AND_STATUS.md Section 1.3](GAPS_AND_STATUS.md#13-no-error-boundaries---critical)

### P0: Component Testing
**Status**: 🔴 CRITICAL - No UI tests

- **Coverage**: 0% for components (App.js, Settings.js untested)
- **Risk**: Every change could break UI
- **Fix**: Add `@testing-library/react-native` tests
- **Target**: 60% coverage
- **Effort**: 3-5 days
- **See**: [GAPS_AND_STATUS.md Section 1.2](GAPS_AND_STATUS.md#12-missing-test-coverage---critical)

---

## ⚠️ HIGH PRIORITIES (Fix This Month)

### P1: Code Quality in CI
- Add ESLint to `.github/workflows/ci.yml`
- Add coverage threshold check
- **Effort**: 0.5 days

### P1: Kleinanzeigen Documentation
- **Current**: Always returns mock data (not functional)
- **File**: `src/services/SearchService.js:189-219`
- **Action**: Document clearly in UI and README
- **Effort**: 0.5 days

### P1: Refactor App.js
- **Issue**: 820 lines - monolithic, hard to test
- **Fix**: Split into components + custom hooks
- **Effort**: 3-5 days
- **See**: [GAPS_AND_STATUS.md Section 2.3](GAPS_AND_STATUS.md#23-monolithic-appjs-component)

---

## 📋 MISSING FEATURES (From Roadmap)

### P1: Push Notifications
- **Complexity**: High (5-7 days)
- **Value**: High (key differentiator)
- **Dependencies**: `expo-notifications`, `expo-task-manager`

### P1: Background Scheduling
- **Complexity**: High (5-7 days)
- **Value**: High (enables automated monitoring)
- **Challenge**: Android battery restrictions

### P2: Price History Tracking
- **Complexity**: Medium (3-4 days)
- **Value**: Medium

### P2: More Platforms (Amazon, etc.)
- **Complexity**: High (varies by platform)
- **Value**: Medium

**See full roadmap**: [README.md Roadmap](README.md#roadmap)

---

## 📊 Current Metrics

| Metric | Current | Target | Priority |
|--------|---------|--------|----------|
| **Test Coverage** | ~30% | 80% | P0 |
| **Component Tests** | 0 | 50+ | P0 |
| **Security Vulns** | 2 critical | 0 | P0 |
| **Code Linting** | Not enforced | 0 errors | P1 |

---

## 🎯 Recommended Timeline

### Week 1-2: Security & Stability
- [ ] Encrypt API keys (1 day)
- [ ] Add error boundaries (1 day)
- [ ] Add component tests - 60% coverage (3-5 days)
- [ ] Add ESLint to CI (0.5 days)

### Week 3-4: Documentation & Quality
- [ ] Document Kleinanzeigen status (0.5 days)
- [ ] Add troubleshooting guide (1 day)
- [ ] Refactor App.js (3-5 days)
- [ ] Add monitoring/Sentry (1 day)

### Month 2+: Features
- [ ] Push notifications (5-7 days)
- [ ] Background scheduling (5-7 days)
- [ ] Price history (3-4 days)
- [ ] More platforms (varies)

---

## 🔗 Quick Links

- **Full Analysis**: [GAPS_AND_STATUS.md](GAPS_AND_STATUS.md)
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Implementation History**: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **User Guide**: [README.md](README.md)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 🚀 Launch Checklist

**Before MVP launch (now)**:
- [x] Core features working
- [x] Basic documentation
- [ ] ⚠️ Security warnings documented
- [ ] ⚠️ Limitations documented (Kleinanzeigen mock data)

**Before production release (1 month)**:
- [ ] 🔴 API keys encrypted
- [ ] 🔴 Error boundaries added
- [ ] 🔴 60%+ test coverage
- [ ] 🔴 ESLint in CI
- [ ] 🔴 All security gaps closed

**For competitive release (3-6 months)**:
- [ ] Push notifications working
- [ ] Background scheduling
- [ ] More platform support
- [ ] Price history tracking

---

## ❓ FAQ

**Q: Is the app safe to use now?**  
A: Yes for personal use, but keep API keys private. Don't share device with untrusted users (keys stored in plaintext).

**Q: Does Kleinanzeigen search actually work?**  
A: No - it returns mock data only in v1.0. Real implementation planned for future release.

**Q: Can I help fix these gaps?**  
A: Yes! See [CONTRIBUTING.md](CONTRIBUTING.md) and check [GitHub Issues](https://github.com/felix-dieterle/WatchMouse/issues).

**Q: When will push notifications be available?**  
A: Estimated 1-2 months after v1.0 launch. See [roadmap](README.md#roadmap).

---

**Need more details?** See the comprehensive [GAPS_AND_STATUS.md](GAPS_AND_STATUS.md) document.
