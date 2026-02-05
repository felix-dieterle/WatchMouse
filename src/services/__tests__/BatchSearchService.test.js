/**
 * Tests for BatchSearchService
 */

import { BatchSearchService } from '../BatchSearchService';
import { SearchService } from '../SearchService';
import { AIService } from '../AIService';

// Mock dependencies
jest.mock('../SearchService');
jest.mock('../AIService');

describe('BatchSearchService', () => {
  let batchService;
  let mockSettings;

  beforeEach(() => {
    mockSettings = {
      ebayEnabled: true,
      kleinanzeigenEnabled: true,
      openrouterApiKey: 'test-key',
    };

    batchService = new BatchSearchService(mockSettings);

    // Mock SearchService methods
    SearchService.prototype.searchAllPlatforms = jest.fn().mockResolvedValue([
      { id: '1', title: 'iPhone 13', price: 500 },
      { id: '2', title: 'iPhone 13 Pro', price: 700 },
    ]);
    SearchService.prototype.setAIMode = jest.fn();
    SearchService.prototype.getEbayRateLimitStats = jest.fn().mockResolvedValue({
      remaining: 4000,
      limit: 5000,
    });

    // Mock AIService methods
    AIService.prototype.hasValidApiKey = jest.fn().mockReturnValue(true);
    AIService.prototype.filterMatches = jest.fn().mockResolvedValue([
      { id: '1', title: 'iPhone 13', price: 500 },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('runSingleSearch', () => {
    it('should run a single search and return matches', async () => {
      const search = {
        id: 'search-1',
        query: 'iPhone 13',
        maxPrice: 600,
      };

      const matches = await batchService.runSingleSearch(search);

      expect(matches).toHaveLength(1);
      expect(matches[0].searchId).toBe('search-1');
      expect(matches[0].isRead).toBe(false);
    });

    it('should pass existing matches to avoid duplicates', async () => {
      const search = {
        id: 'search-1',
        query: 'iPhone 13',
        maxPrice: 600,
      };

      const existingMatches = [
        { id: 'match-1', title: 'Old match', url: 'http://example.com/1' },
      ];

      await batchService.runSingleSearch(search, existingMatches);

      expect(SearchService.prototype.searchAllPlatforms).toHaveBeenCalledWith(
        'iphone 13',
        600,
        existingMatches
      );
    });
  });

  describe('runBatchSearch', () => {
    it('should run multiple searches', async () => {
      const searches = [
        { id: 'search-1', query: 'iPhone 13', maxPrice: 600 },
        { id: 'search-2', query: 'Samsung Galaxy', maxPrice: 500 },
      ];

      const result = await batchService.runBatchSearch(searches);

      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.stats.total).toBe(2);
      expect(result.stats.successful).toBeGreaterThan(0);
    });

    it('should group similar searches to save API calls', async () => {
      const searches = [
        { id: 'search-1', query: 'iPhone 13', maxPrice: null },
        { id: 'search-2', query: 'iphone 13', maxPrice: null },
        { id: 'search-3', query: 'Samsung', maxPrice: null },
      ];

      const result = await batchService.runBatchSearch(searches);

      // Should save at least 1 API call by grouping similar searches
      expect(result.stats.apiCallsSaved).toBeGreaterThanOrEqual(1);
    });

    it('should call progress callback for each search', async () => {
      const searches = [
        { id: 'search-1', query: 'iPhone 13', maxPrice: null },
        { id: 'search-2', query: 'Samsung', maxPrice: null },
      ];

      const progressCallback = jest.fn();
      await batchService.runBatchSearch(searches, [], progressCallback);

      expect(progressCallback).toHaveBeenCalledTimes(2);
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          searchId: 'search-1',
          query: 'iPhone 13',
          matchCount: expect.any(Number),
          progress: expect.any(Number),
        })
      );
    });

    it('should handle empty search list', async () => {
      const result = await batchService.runBatchSearch([]);

      expect(result.matches).toEqual([]);
      expect(result.stats.total).toBe(0);
    });

    it('should handle search errors gracefully', async () => {
      SearchService.prototype.searchAllPlatforms = jest.fn()
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce([{ id: '1', title: 'Test', price: 100 }]);

      const searches = [
        { id: 'search-1', query: 'iPhone', maxPrice: null },
        { id: 'search-2', query: 'Samsung', maxPrice: null },
      ];

      const result = await batchService.runBatchSearch(searches);

      expect(result.stats.failed).toBeGreaterThan(0);
    });

    it('should set AI mode based on API key availability', async () => {
      AIService.prototype.hasValidApiKey = jest.fn().mockReturnValue(true);

      const searches = [
        { id: 'search-1', query: 'iPhone', maxPrice: null },
      ];

      await batchService.runBatchSearch(searches);

      expect(SearchService.prototype.setAIMode).toHaveBeenCalledWith(true);
    });

    it('should set non-AI mode when no API key', async () => {
      batchService = new BatchSearchService({
        ...mockSettings,
        openrouterApiKey: '',
      });

      AIService.prototype.hasValidApiKey = jest.fn().mockReturnValue(false);

      const searches = [
        { id: 'search-1', query: 'iPhone', maxPrice: null },
      ];

      await batchService.runBatchSearch(searches);

      expect(SearchService.prototype.setAIMode).toHaveBeenCalledWith(false);
    });
  });
});
