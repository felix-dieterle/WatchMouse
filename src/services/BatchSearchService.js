/**
 * Batch Search Service
 * 
 * Efficiently executes multiple searches while minimizing API rate limit usage.
 * Implements intelligent batching, scheduling, and optimization strategies.
 */

import { SearchService } from './SearchService';
import { AIService } from './AIService';
import { BatchSearchOptimizer } from '../utils/searchOptimizer';

/**
 * BatchSearchService
 * Coordinates multiple searches with intelligent optimization
 */
export class BatchSearchService {
  constructor(settings = {}) {
    this.settings = settings;
    this.searchService = null;
    this.aiService = null;
  }

  /**
   * Run multiple searches efficiently with optimization
   * 
   * @param {Array} searches - Array of search objects with {id, query, maxPrice}
   * @param {Array} existingMatches - Existing matches to avoid duplicates
   * @param {Function} progressCallback - Called after each search completes
   * @returns {Promise<Object>} Results with {matches, stats}
   */
  async runBatchSearch(searches, existingMatches = [], progressCallback = null) {
    if (!searches || searches.length === 0) {
      return { matches: [], stats: { total: 0, successful: 0, failed: 0 } };
    }

    // Initialize services
    this.searchService = new SearchService({
      ebayEnabled: this.settings.ebayEnabled,
      kleinanzeigenEnabled: this.settings.kleinanzeigenEnabled,
      aiModeEnabled: this.settings.openrouterApiKey ? true : false,
      ebayApiKey: this.settings.ebayApiKey,
      googleApiKey: this.settings.googleApiKey,
      googleCx: this.settings.googleCx,
      useGoogleForEbay: this.settings.useGoogleForEbay,
      serpApiKey: this.settings.serpApiKey,
      primarySearchEngine: this.settings.primarySearchEngine,
      usedCarsEnabled: this.settings.usedCarsEnabled,
    });

    this.aiService = new AIService(this.settings.openrouterApiKey);
    
    // Set AI mode based on API key availability
    const hasAI = this.aiService.hasValidApiKey();
    this.searchService.setAIMode(hasAI);

    // Group similar searches to optimize API usage
    const searchGroups = BatchSearchOptimizer.groupSimilarSearches(searches);
    
    console.log(`Batch Search: Processing ${searches.length} searches in ${searchGroups.length} groups`);
    if (hasAI) {
      console.log('Batch Search: AI mode enabled - fetching more results per call');
    } else {
      console.log('Batch Search: Keyword mode - using precise API filters');
    }

    // Get rate limit info to calculate optimal delays
    let rateLimitStats = { remaining: 5000, limit: 5000 };
    try {
      rateLimitStats = await this.searchService.getEbayRateLimitStats();
    } catch (error) {
      console.error('Failed to get rate limit stats:', error);
    }

    const stats = {
      total: searches.length,
      successful: 0,
      failed: 0,
      apiCallsSaved: searches.length - searchGroups.length,
    };

    const allMatches = [];

    // Process each group
    for (let i = 0; i < searchGroups.length; i++) {
      const group = searchGroups[i];
      
      try {
        // Use representative search for the API call
        const representative = group.representative;
        
        console.log(`Processing group ${i + 1}/${searchGroups.length}: "${representative.query}"`);
        
        // Search all platforms
        const results = await this.searchService.searchAllPlatforms(
          representative.query,
          representative.maxPrice,
          existingMatches
        );

        console.log(`Found ${results.length} results for group ${i + 1}`);

        // Filter results for each search in the group
        for (const search of group.members) {
          try {
            // Filter matches using AI or keyword matching
            const matchedResults = await this.aiService.filterMatches(search.query, results);
            
            // Create match objects
            const newMatches = matchedResults.map(result => ({
              ...result,
              searchId: search.id,
              foundAt: new Date().toISOString(),
              isRead: false,
            }));

            allMatches.push(...newMatches);
            stats.successful++;

            console.log(`Search "${search.query}": ${matchedResults.length} matches`);

            // Call progress callback if provided
            if (progressCallback) {
              progressCallback({
                searchId: search.id,
                query: search.query,
                matchCount: matchedResults.length,
                progress: stats.successful / stats.total,
              });
            }
          } catch (error) {
            console.error(`Error filtering results for "${search.query}":`, error);
            stats.failed++;
          }
        }

        // Add delay between groups to respect rate limits
        if (i < searchGroups.length - 1) {
          const delay = BatchSearchOptimizer.calculateOptimalDelay(
            searchGroups.length,
            rateLimitStats.remaining,
            rateLimitStats.limit
          );
          
          console.log(`Waiting ${delay}ms before next group...`);
          await this._delay(delay);
        }

      } catch (error) {
        console.error(`Error processing group ${i + 1}:`, error);
        // Mark all searches in this group as failed
        for (const _search of group.members) {
          stats.failed++;
        }
      }
    }

    console.log(`Batch Search Complete: ${stats.successful} successful, ${stats.failed} failed`);
    console.log(`API Calls Saved: ${stats.apiCallsSaved} (through grouping)`);

    return {
      matches: allMatches,
      stats,
    };
  }

  /**
   * Run a single search with optimization
   * 
   * @param {Object} search - Search object with {id, query, maxPrice}
   * @param {Array} existingMatches - Existing matches to avoid duplicates
   * @returns {Promise<Array>} Array of new matches
   */
  async runSingleSearch(search, existingMatches = []) {
    const result = await this.runBatchSearch([search], existingMatches);
    return result.matches;
  }

  /**
   * Helper to delay execution
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
