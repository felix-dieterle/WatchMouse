/**
 * Search Optimizer
 * 
 * Intelligent mechanisms to minimize API rate limit usage while maintaining
 * search quality. Differentiates between AI and non-AI modes for optimal efficiency.
 */

import { PERFORMANCE_CONFIG } from '../constants';

/**
 * Query Optimizer
 * Normalizes and optimizes search queries to maximize cache hits
 */
export class QueryOptimizer {
  /**
   * Normalize a search query for consistent caching
   * @param {string} query - Raw search query
   * @returns {string} Normalized query
   */
  static normalizeQuery(query) {
    if (!query) return '';
    
    return query
      .toLowerCase()
      .trim()
      // Remove multiple spaces
      .replace(/\s+/g, ' ')
      // Remove special characters that don't affect search
      .replace(/[,;]/g, ' ')
      .trim();
  }

  /**
   * Check if two queries are semantically similar enough to share results
   * @param {string} query1 - First query
   * @param {string} query2 - Second query
   * @returns {boolean} True if queries are similar
   */
  static areSimilarQueries(query1, query2) {
    const norm1 = this.normalizeQuery(query1);
    const norm2 = this.normalizeQuery(query2);
    
    // Exact match after normalization
    if (norm1 === norm2) {
      return true;
    }
    
    // Check if one query contains the other (e.g., "iPhone" and "iPhone 13")
    const words1 = new Set(norm1.split(' '));
    const words2 = new Set(norm2.split(' '));
    
    // If one is a subset of the other, they're similar
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const minSize = Math.min(words1.size, words2.size);
    
    // At least 80% word overlap
    return intersection.size >= minSize * 0.8;
  }

  /**
   * Extract search keywords for more focused API queries
   * @param {string} query - Search query
   * @returns {string[]} Array of important keywords
   */
  static extractKeywords(query) {
    const normalized = this.normalizeQuery(query);
    
    // Common words to filter out (German and English)
    const stopWords = new Set([
      'der', 'die', 'das', 'ein', 'eine', 'und', 'oder', 'mit', 'ohne',
      'the', 'a', 'an', 'and', 'or', 'with', 'without', 'for', 'in', 'on'
    ]);
    
    return normalized
      .split(' ')
      .filter(word => word.length > 2 && !stopWords.has(word));
  }
}

/**
 * Batch Search Optimizer
 * Groups and optimizes multiple searches to minimize API calls
 */
export class BatchSearchOptimizer {
  /**
   * Group similar searches to reduce API calls
   * @param {Array} searches - Array of search objects with {query, maxPrice}
   * @returns {Array} Array of batches
   */
  static groupSimilarSearches(searches) {
    const groups = [];
    const processed = new Set();
    
    for (const search of searches) {
      if (processed.has(search.id)) continue;
      
      const group = {
        representative: search,
        members: [search],
      };
      
      // Find similar searches
      for (const otherSearch of searches) {
        if (otherSearch.id === search.id || processed.has(otherSearch.id)) {
          continue;
        }
        
        if (QueryOptimizer.areSimilarQueries(search.query, otherSearch.query)) {
          // Only group if price constraints are compatible
          if (this._arePriceCompatible(search.maxPrice, otherSearch.maxPrice)) {
            group.members.push(otherSearch);
            processed.add(otherSearch.id);
          }
        }
      }
      
      processed.add(search.id);
      groups.push(group);
    }
    
    return groups;
  }

  /**
   * Check if price constraints are compatible for batching
   * @private
   */
  static _arePriceCompatible(price1, price2) {
    // If both are null, they're compatible
    if (price1 === null && price2 === null) return true;
    
    // If only one is null, not compatible
    if (price1 === null || price2 === null) return false;
    
    // If prices are similar (within 20%), they're compatible
    const ratio = Math.max(price1, price2) / Math.min(price1, price2);
    return ratio <= 1.2;
  }

  /**
   * Calculate optimal delay between searches to spread load
   * @param {number} searchCount - Number of searches to execute
   * @param {number} rateLimitRemaining - Remaining API calls
   * @param {number} rateLimitTotal - Total daily limit
   * @returns {number} Delay in milliseconds
   */
  static calculateOptimalDelay(searchCount, rateLimitRemaining, rateLimitTotal) {
    // If we have plenty of quota (>50%), use minimal delay
    if (rateLimitRemaining > rateLimitTotal * 0.5) {
      return PERFORMANCE_CONFIG.THROTTLE_API_CALLS_MS;
    }
    
    // If quota is limited (20-50%), add moderate delay
    if (rateLimitRemaining > rateLimitTotal * 0.2) {
      return PERFORMANCE_CONFIG.THROTTLE_API_CALLS_MS * 2;
    }
    
    // If quota is very limited (<20%), add significant delay
    return PERFORMANCE_CONFIG.THROTTLE_API_CALLS_MS * 5;
  }
}

/**
 * AI Mode Optimizer
 * Optimizes search strategy based on AI availability
 */
export class AIModeOptimizer {
  /**
   * Determine optimal results per page based on AI mode
   * 
   * AI Mode Strategy:
   * - Fetch more results (20-30) since AI can intelligently filter
   * - Use broader search parameters
   * - Let AI do the heavy filtering work
   * - Fewer API calls, more AI processing
   * 
   * Non-AI Mode Strategy:
   * - Fetch fewer results (10-15) with stricter filters
   * - Use more precise API parameters
   * - Rely on API-side filtering
   * - More precise API calls, less post-processing
   * 
   * @param {boolean} hasAI - Whether AI is available
   * @param {number} defaultResultsPerPage - Default results per page
   * @returns {number} Optimal results per page
   */
  static getOptimalResultsPerPage(hasAI, defaultResultsPerPage = 20) {
    if (hasAI) {
      // AI mode: Fetch more results, let AI filter intelligently
      // This reduces total API calls by getting more results per call
      return Math.min(defaultResultsPerPage + 10, 50); // Max 50 for eBay API
    } else {
      // Non-AI mode: Fetch fewer but more relevant results
      // Rely on API filters to get precise matches
      return Math.max(defaultResultsPerPage - 10, 10); // Min 10
    }
  }

  /**
   * Determine if API-side filtering should be strict or loose
   * @param {boolean} hasAI - Whether AI is available
   * @returns {string} Filter strategy: 'strict' or 'loose'
   */
  static getFilterStrategy(hasAI) {
    // AI mode: Use loose filters, let AI do smart filtering
    // Non-AI mode: Use strict filters to reduce irrelevant results
    return hasAI ? 'loose' : 'strict';
  }

  /**
   * Get optimal eBay sort order based on AI availability
   * @param {boolean} hasAI - Whether AI is available
   * @returns {string} eBay API sort order
   */
  static getOptimalSortOrder(hasAI) {
    if (hasAI) {
      // AI mode: Get newest items for freshness
      // AI will sort by relevance anyway
      return 'StartTimeNewest';
    } else {
      // Non-AI mode: Get best matches first
      // Rely on eBay's relevance algorithm
      return 'BestMatch';
    }
  }

  /**
   * Determine if we should pre-filter results before AI processing
   * @param {number} resultCount - Number of results
   * @param {boolean} hasAI - Whether AI is available
   * @returns {boolean} True if pre-filtering recommended
   */
  static shouldPreFilter(resultCount, hasAI) {
    if (!hasAI) {
      // Always pre-filter in non-AI mode
      return true;
    }
    
    // In AI mode, pre-filter only if too many results (>50)
    // to reduce AI API costs
    return resultCount > 50;
  }
}

/**
 * Result Deduplicator
 * Removes duplicate results across searches and platforms
 */
export class ResultDeduplicator {
  /**
   * Deduplicate results by title similarity
   * @param {Array} results - Array of search results
   * @returns {Array} Deduplicated results
   */
  static deduplicateByTitle(results) {
    const seen = new Map();
    const deduplicated = [];
    
    for (const result of results) {
      const normalizedTitle = this._normalizeTitle(result.title);
      
      // Check if we've seen a very similar title
      let isDuplicate = false;
      for (const [seenTitle, seenResult] of seen) {
        if (this._areTitlesSimilar(normalizedTitle, seenTitle)) {
          // Keep the cheaper one if prices differ
          if (result.price < seenResult.price) {
            // Replace with cheaper option
            const index = deduplicated.indexOf(seenResult);
            if (index > -1) {
              deduplicated[index] = result;
              seen.set(normalizedTitle, result);
            }
          }
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        seen.set(normalizedTitle, result);
        deduplicated.push(result);
      }
    }
    
    return deduplicated;
  }

  /**
   * Normalize title for comparison
   * @private
   */
  static _normalizeTitle(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if two titles are similar enough to be duplicates
   * @private
   */
  static _areTitlesSimilar(title1, title2) {
    // Exact match
    if (title1 === title2) return true;
    
    // Calculate word overlap
    const words1 = new Set(title1.split(' '));
    const words2 = new Set(title2.split(' '));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    // Jaccard similarity > 0.7 means likely duplicate
    const similarity = intersection.size / union.size;
    return similarity > 0.7;
  }

  /**
   * Remove results that already exist in saved matches
   * @param {Array} newResults - New search results
   * @param {Array} existingMatches - Already saved matches
   * @returns {Array} Only truly new results
   */
  static filterOutExisting(newResults, existingMatches) {
    const existingUrls = new Set(existingMatches.map(m => m.url));
    const existingTitles = new Set(existingMatches.map(m => this._normalizeTitle(m.title)));
    
    return newResults.filter(result => {
      // Filter by URL (most reliable)
      if (existingUrls.has(result.url)) {
        return false;
      }
      
      // Filter by title similarity
      const normalizedTitle = this._normalizeTitle(result.title);
      for (const existingTitle of existingTitles) {
        if (this._areTitlesSimilar(normalizedTitle, existingTitle)) {
          return false;
        }
      }
      
      return true;
    });
  }
}
