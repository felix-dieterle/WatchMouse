/**
 * Tests for Search Optimizer utilities
 */

import {
  QueryOptimizer,
  BatchSearchOptimizer,
  AIModeOptimizer,
  ResultDeduplicator,
} from '../searchOptimizer';

describe('QueryOptimizer', () => {
  describe('normalizeQuery', () => {
    it('should convert to lowercase', () => {
      expect(QueryOptimizer.normalizeQuery('iPhone 13')).toBe('iphone 13');
    });

    it('should trim whitespace', () => {
      expect(QueryOptimizer.normalizeQuery('  iPhone 13  ')).toBe('iphone 13');
    });

    it('should remove multiple spaces', () => {
      expect(QueryOptimizer.normalizeQuery('iPhone    13')).toBe('iphone 13');
    });

    it('should remove special characters like commas and semicolons', () => {
      expect(QueryOptimizer.normalizeQuery('iPhone, 13; Pro')).toBe('iphone 13 pro');
    });

    it('should handle empty query', () => {
      expect(QueryOptimizer.normalizeQuery('')).toBe('');
      expect(QueryOptimizer.normalizeQuery(null)).toBe('');
      expect(QueryOptimizer.normalizeQuery(undefined)).toBe('');
    });
  });

  describe('areSimilarQueries', () => {
    it('should match exact queries after normalization', () => {
      expect(QueryOptimizer.areSimilarQueries('iPhone 13', 'iphone 13')).toBe(true);
      expect(QueryOptimizer.areSimilarQueries('iPhone  13', 'iPhone 13')).toBe(true);
    });

    it('should match queries with subset relationship', () => {
      expect(QueryOptimizer.areSimilarQueries('iPhone', 'iPhone 13')).toBe(true);
      expect(QueryOptimizer.areSimilarQueries('iPhone 13', 'iPhone')).toBe(true);
    });

    it('should match queries with high word overlap', () => {
      // 2 out of 2 words match (100% overlap) - subset case
      expect(QueryOptimizer.areSimilarQueries('iPhone 13', 'iPhone 13 Pro')).toBe(true);
      // 3 out of 3 words match when one has more words
      expect(QueryOptimizer.areSimilarQueries('iPhone 13 Pro Max', 'iPhone 13 Pro')).toBe(true);
    });

    it('should not match completely different queries', () => {
      expect(QueryOptimizer.areSimilarQueries('iPhone', 'Samsung Galaxy')).toBe(false);
    });

    it('should not match queries with low word overlap', () => {
      expect(QueryOptimizer.areSimilarQueries('iPhone 13', 'Samsung Galaxy S21')).toBe(false);
    });
  });

  describe('extractKeywords', () => {
    it('should extract meaningful keywords', () => {
      const keywords = QueryOptimizer.extractKeywords('iPhone 13 Pro');
      expect(keywords).toContain('iphone');
      expect(keywords).toContain('pro');
    });

    it('should filter out stop words', () => {
      const keywords = QueryOptimizer.extractKeywords('ein iPhone und ein Samsung');
      expect(keywords).not.toContain('ein');
      expect(keywords).not.toContain('und');
      expect(keywords).toContain('iphone');
      expect(keywords).toContain('samsung');
    });

    it('should filter out very short words', () => {
      const keywords = QueryOptimizer.extractKeywords('a b cd iPhone');
      expect(keywords).not.toContain('a');
      expect(keywords).not.toContain('b');
      expect(keywords).toContain('iphone');
    });
  });
});

describe('BatchSearchOptimizer', () => {
  describe('groupSimilarSearches', () => {
    it('should group similar searches', () => {
      const searches = [
        { id: '1', query: 'iPhone 13', maxPrice: null },
        { id: '2', query: 'iphone 13', maxPrice: null },
        { id: '3', query: 'Samsung Galaxy', maxPrice: null },
      ];

      const groups = BatchSearchOptimizer.groupSimilarSearches(searches);
      
      expect(groups.length).toBe(2);
      expect(groups[0].members.length).toBe(2);
      expect(groups[1].members.length).toBe(1);
    });

    it('should not group searches with incompatible prices', () => {
      const searches = [
        { id: '1', query: 'iPhone 13', maxPrice: 500 },
        { id: '2', query: 'iPhone 13', maxPrice: 1000 },
      ];

      const groups = BatchSearchOptimizer.groupSimilarSearches(searches);
      
      // Should not group because price difference is >20%
      expect(groups.length).toBe(2);
    });

    it('should group searches with compatible prices', () => {
      const searches = [
        { id: '1', query: 'iPhone 13', maxPrice: 500 },
        { id: '2', query: 'iPhone 13', maxPrice: 550 },
      ];

      const groups = BatchSearchOptimizer.groupSimilarSearches(searches);
      
      // Should group because price difference is <20%
      expect(groups.length).toBe(1);
      expect(groups[0].members.length).toBe(2);
    });

    it('should keep each search in only one group', () => {
      const searches = [
        { id: '1', query: 'iPhone', maxPrice: null },
        { id: '2', query: 'iPhone 13', maxPrice: null },
        { id: '3', query: 'iPhone 13 Pro', maxPrice: null },
      ];

      const groups = BatchSearchOptimizer.groupSimilarSearches(searches);
      
      const allMembers = groups.flatMap(g => g.members);
      const memberIds = allMembers.map(m => m.id);
      const uniqueIds = new Set(memberIds);
      
      expect(memberIds.length).toBe(uniqueIds.size);
    });
  });

  describe('calculateOptimalDelay', () => {
    it('should use minimal delay when quota is plentiful', () => {
      const delay = BatchSearchOptimizer.calculateOptimalDelay(10, 4000, 5000);
      expect(delay).toBe(1000);
    });

    it('should use moderate delay when quota is limited', () => {
      const delay = BatchSearchOptimizer.calculateOptimalDelay(10, 1500, 5000);
      expect(delay).toBe(2000);
    });

    it('should use significant delay when quota is very limited', () => {
      const delay = BatchSearchOptimizer.calculateOptimalDelay(10, 500, 5000);
      expect(delay).toBe(5000);
    });
  });
});

describe('AIModeOptimizer', () => {
  describe('getOptimalResultsPerPage', () => {
    it('should fetch more results in AI mode', () => {
      const aiResults = AIModeOptimizer.getOptimalResultsPerPage(true, 20);
      const nonAiResults = AIModeOptimizer.getOptimalResultsPerPage(false, 20);
      
      expect(aiResults).toBeGreaterThan(nonAiResults);
    });

    it('should respect maximum limit', () => {
      const results = AIModeOptimizer.getOptimalResultsPerPage(true, 20);
      expect(results).toBeLessThanOrEqual(50);
    });

    it('should respect minimum limit', () => {
      const results = AIModeOptimizer.getOptimalResultsPerPage(false, 20);
      expect(results).toBeGreaterThanOrEqual(10);
    });
  });

  describe('getFilterStrategy', () => {
    it('should return loose for AI mode', () => {
      expect(AIModeOptimizer.getFilterStrategy(true)).toBe('loose');
    });

    it('should return strict for non-AI mode', () => {
      expect(AIModeOptimizer.getFilterStrategy(false)).toBe('strict');
    });
  });

  describe('getOptimalSortOrder', () => {
    it('should prefer newest in AI mode', () => {
      expect(AIModeOptimizer.getOptimalSortOrder(true)).toBe('StartTimeNewest');
    });

    it('should prefer best match in non-AI mode', () => {
      expect(AIModeOptimizer.getOptimalSortOrder(false)).toBe('BestMatch');
    });
  });

  describe('shouldPreFilter', () => {
    it('should not pre-filter small result sets in AI mode', () => {
      expect(AIModeOptimizer.shouldPreFilter(30, true)).toBe(false);
    });

    it('should pre-filter large result sets in AI mode', () => {
      expect(AIModeOptimizer.shouldPreFilter(60, true)).toBe(true);
    });

    it('should always pre-filter in non-AI mode', () => {
      expect(AIModeOptimizer.shouldPreFilter(10, false)).toBe(true);
      expect(AIModeOptimizer.shouldPreFilter(100, false)).toBe(true);
    });
  });
});

describe('ResultDeduplicator', () => {
  describe('deduplicateByTitle', () => {
    it('should remove exact duplicate titles', () => {
      const results = [
        { id: '1', title: 'iPhone 13 Pro', price: 500 },
        { id: '2', title: 'iPhone 13 Pro', price: 600 },
      ];

      const deduplicated = ResultDeduplicator.deduplicateByTitle(results);
      
      expect(deduplicated.length).toBe(1);
      expect(deduplicated[0].price).toBe(500); // Keeps cheaper one
    });

    it('should remove similar titles', () => {
      const results = [
        { id: '1', title: 'iPhone 13 Pro Max 256GB', price: 500 },
        { id: '2', title: 'iPhone 13 Pro Max, 256GB', price: 600 },
      ];

      const deduplicated = ResultDeduplicator.deduplicateByTitle(results);
      
      expect(deduplicated.length).toBe(1);
    });

    it('should keep different titles', () => {
      const results = [
        { id: '1', title: 'iPhone 13 Pro', price: 500 },
        { id: '2', title: 'Samsung Galaxy S21', price: 600 },
      ];

      const deduplicated = ResultDeduplicator.deduplicateByTitle(results);
      
      expect(deduplicated.length).toBe(2);
    });

    it('should prefer cheaper items when deduplicating', () => {
      const results = [
        { id: '1', title: 'iPhone 13', price: 600 },
        { id: '2', title: 'iPhone 13', price: 500 },
        { id: '3', title: 'iPhone 13', price: 550 },
      ];

      const deduplicated = ResultDeduplicator.deduplicateByTitle(results);
      
      expect(deduplicated.length).toBe(1);
      expect(deduplicated[0].price).toBe(500);
    });
  });

  describe('filterOutExisting', () => {
    it('should filter out results with same URL', () => {
      const newResults = [
        { id: '1', title: 'iPhone 13', url: 'http://example.com/1' },
        { id: '2', title: 'Samsung', url: 'http://example.com/2' },
      ];

      const existingMatches = [
        { id: '3', title: 'iPhone 13', url: 'http://example.com/1' },
      ];

      const filtered = ResultDeduplicator.filterOutExisting(newResults, existingMatches);
      
      expect(filtered.length).toBe(1);
      expect(filtered[0].title).toBe('Samsung');
    });

    it('should filter out results with similar title', () => {
      const newResults = [
        { id: '1', title: 'iPhone 13 Pro Max 256GB', url: 'http://example.com/1' },
        { id: '2', title: 'Samsung', url: 'http://example.com/2' },
      ];

      const existingMatches = [
        { id: '3', title: 'iPhone 13 Pro Max, 256GB', url: 'http://example.com/3' },
      ];

      const filtered = ResultDeduplicator.filterOutExisting(newResults, existingMatches);
      
      expect(filtered.length).toBe(1);
      expect(filtered[0].title).toBe('Samsung');
    });

    it('should keep truly new results', () => {
      const newResults = [
        { id: '1', title: 'New iPhone 14', url: 'http://example.com/1' },
      ];

      const existingMatches = [
        { id: '2', title: 'Old iPhone 13', url: 'http://example.com/2' },
      ];

      const filtered = ResultDeduplicator.filterOutExisting(newResults, existingMatches);
      
      expect(filtered.length).toBe(1);
    });
  });
});
