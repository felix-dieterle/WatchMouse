# API Rate Limit Optimization - Implementation Summary

## Overview
This implementation adds intelligent mechanisms to minimize API rate limit usage in WatchMouse while maintaining or improving search quality. The system differentiates between AI mode and non-AI mode to optimize for different scenarios.

## Problem Statement (German)
> "Lass uns hier zwar primär auf APIs setzen um Suchmodule zu implementieren, lass uns aber die Such Anfragen so gestalten dass sie minimal die Rate Limits der APIs belasten. Welche intelligenten Mechanismen können wir hier verwenden und müssten wir dann zwischen AI Modus und ohne AI unterscheiden um das Optimum zu erreichen?"

**Translation**: "Let's primarily use APIs to implement search modules, but let's design the search requests to minimize the burden on API rate limits. What intelligent mechanisms can we use here, and should we differentiate between AI mode and without AI to achieve the optimum?"

## Solution Components

### 1. Query Optimization (`QueryOptimizer`)
**Problem**: Similar queries cause duplicate API calls.

**Solution**:
- Query normalization (lowercase, trim, remove special chars)
- Similarity detection (70% word overlap threshold)
- Keyword extraction for focused searches

**Benefits**:
- Maximizes cache hit rate
- Reduces duplicate API calls
- Works transparently

### 2. Batch Search Optimization (`BatchSearchOptimizer`)
**Problem**: Running multiple searches sequentially wastes API quota.

**Solution**:
- Groups similar searches together
- Makes one API call per group instead of per search
- Smart delays based on remaining quota

**Example**:
```
Input: 10 searches
- 5 iPhone variants
- 3 Samsung variants
- 2 diverse searches

Output: 4 API calls (instead of 10)
- 1 call for iPhone group
- 1 call for Samsung group
- 2 calls for diverse searches

Savings: 60% API call reduction
```

### 3. AI vs Non-AI Mode Optimization (`AIModeOptimizer`)

#### AI Mode Strategy
**When**: OpenRouter API key is configured

**Approach**: Fetch More, Filter Smart
- Fetch 30 results per API call (vs 10 in non-AI)
- Use loose API filters
- Sort by "StartTimeNewest" for fresh items
- Let AI do intelligent filtering

**Rationale**:
- 1 eBay call (30 results) + 1 AI call < 3 eBay calls (10 results each)
- OpenRouter has higher limits and lower costs than eBay
- AI can filter irrelevant results effectively

#### Non-AI Mode Strategy
**When**: No API key configured

**Approach**: Fetch Less, Filter Precise
- Fetch 10 results per API call
- Use strict API filters
- Sort by "BestMatch" for relevance
- Rely on eBay's filtering

**Rationale**:
- Without AI, depend on eBay's relevance algorithm
- Fetch fewer but more relevant results
- Minimize wasted API calls

### 4. Result Deduplication (`ResultDeduplicator`)
**Problem**: Same items appear multiple times.

**Solution**:
- Deduplicates by title similarity (70% Jaccard similarity)
- Filters out already saved matches
- Prefers cheaper items when deduplicating

**Benefits**:
- Better user experience
- Reduces storage
- Prevents duplicate notifications

### 5. Smart Scheduling
**Problem**: Burst API calls can trigger rate limits.

**Solution**: Dynamic delays based on quota:
- >50% quota: 1 second delay (normal)
- 20-50% quota: 2 second delay (cautious)
- <20% quota: 5 second delay (conservative)

**Benefits**:
- Prevents hitting rate limits
- Spreads load over time
- Reduces API errors

## Implementation Details

### New Files
1. **src/utils/searchOptimizer.js** (365 lines)
   - Core optimization utilities
   - 4 main classes with 20+ methods

2. **src/services/BatchSearchService.js** (180 lines)
   - Batch search coordination
   - Progress tracking
   - Automatic optimization

3. **docs/OPTIMIZATION_GUIDE.md** (400+ lines)
   - Complete documentation
   - Usage examples
   - Performance metrics
   - Troubleshooting guide

### Modified Files
1. **src/services/SearchService.js**
   - AI mode configuration
   - Query normalization
   - Result deduplication
   - Dynamic eBay API parameters

2. **src/services/AIService.js**
   - Pre-filtering for large result sets (>50 items)
   - Integration with AIModeOptimizer

3. **App.js**
   - BatchSearchService integration
   - "Run All Searches" button
   - Pass existing matches for deduplication
   - Display optimization statistics

### Tests
- **125 tests total, all passing ✅**
- 37 tests for searchOptimizer utilities
- 8 tests for BatchSearchService
- Full coverage of optimization logic

## Performance Metrics

### Expected API Call Reduction

| Scenario | Before | After | Savings |
|----------|--------|-------|---------|
| 10 similar searches | 10 calls | 3-5 calls | **50-70%** |
| Repeated searches (cached) | 10 calls | 0-2 calls | **80-100%** |
| AI mode (30 results) | 3 calls | 1 call | **66%** |
| Batch of 15 searches | 15 calls | 7-10 calls | **33-53%** |

### Real-World Example

**Scenario**: User has 15 saved searches
- 5 searches for "iPhone 13" variants
- 5 searches for "Samsung Galaxy" variants
- 5 diverse searches

**Without Optimization**:
- 15 API calls
- No deduplication
- Possible rate limit issues
- No progress tracking

**With Optimization**:
- 7 API calls (53% reduction)
- Duplicates filtered out
- Smart delays between groups
- Progress tracking
- Statistics displayed

## User-Facing Features

### 1. "Run All Searches" Button
- Executes all saved searches in batch
- Shows progress during execution
- Displays detailed statistics on completion:
  - New matches found
  - Successful/failed searches
  - API calls saved through grouping
  - Mode used (AI or keyword)

### 2. Automatic Deduplication
- Filters out items already in saved matches
- Prevents duplicate notifications
- Keeps cheaper items when duplicates found

### 3. Smart Mode Selection
- Automatically detects AI availability
- Optimizes API parameters accordingly
- Transparent to user

## Code Quality

### Linting
- ✅ All ESLint rules passing
- ✅ No warnings or errors
- ✅ Consistent code style

### Testing
- ✅ 125/125 tests passing
- ✅ Comprehensive test coverage
- ✅ Edge cases handled

### Documentation
- ✅ JSDoc comments on all public APIs
- ✅ Detailed optimization guide
- ✅ Usage examples
- ✅ Troubleshooting section

## Integration Guide

### For Single Search
```javascript
const batchService = new BatchSearchService(settings);
const matches = await batchService.runSingleSearch(search, existingMatches);
```

### For Multiple Searches
```javascript
const result = await batchService.runBatchSearch(
  searches,
  existingMatches,
  progressCallback
);
console.log(`API calls saved: ${result.stats.apiCallsSaved}`);
```

## Configuration

### Default Settings
- Cache TTL: 5 minutes
- Max cache size: 50 entries
- Similarity threshold: 70%
- Pre-filter threshold: 50 results
- AI mode results: 30 per page
- Non-AI mode results: 10 per page

### Customization
All thresholds can be adjusted in:
- `src/constants/index.js` (cache, timeouts)
- `src/utils/searchOptimizer.js` (similarity, deduplication)

## Future Enhancements

Potential improvements:
1. Machine learning for optimal grouping
2. Predictive caching
3. Query expansion
4. Result ranking by user preferences
5. Distributed rate limiting

## Conclusion

This implementation successfully addresses the requirement to minimize API rate limit usage through:

1. **Intelligent query optimization** - Normalization and similarity detection
2. **Batch processing** - Grouping similar searches (20-50% savings)
3. **AI/non-AI differentiation** - Optimized strategies for each mode
4. **Smart caching** - Maximized cache hit rate
5. **Result deduplication** - Prevented redundant data
6. **Smart scheduling** - Prevented rate limit errors

The system is fully tested (125 tests passing), well-documented, and ready for production use.

### Key Metrics
- **API Call Reduction**: 30-70% depending on search patterns
- **Code Quality**: All linting rules passing
- **Test Coverage**: 125/125 tests passing
- **Documentation**: 400+ lines of detailed guides
- **User Experience**: Seamless integration with progress tracking

The implementation maintains code quality standards, follows project conventions, and provides significant value through API quota savings while improving user experience.
