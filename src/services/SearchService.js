import axios from 'axios';
import { API_CONFIG, PERFORMANCE_CONFIG, PLATFORMS, CACHE_CONFIG } from '../constants';
import { redactSensitiveData } from '../utils/security';
import { Cache } from '../utils/performance';
import { EbayRateLimiter } from '../utils/rateLimiter';

// Initialize cache for search results
const searchCache = new Cache(CACHE_CONFIG.MAX_CACHE_SIZE);

// Initialize eBay rate limiter
const ebayRateLimiter = new EbayRateLimiter();

/**
 * Service for searching across multiple shopping platforms
 */
export class SearchService {
  constructor(platformSettings = {}) {
    // Platform settings determine which platforms are enabled
    // Default to all enabled if not specified
    this.platformSettings = {
      ebayEnabled: platformSettings.ebayEnabled !== undefined ? platformSettings.ebayEnabled : true,
      kleinanzeigenEnabled: platformSettings.kleinanzeigenEnabled !== undefined ? platformSettings.kleinanzeigenEnabled : true,
    };
    
    this.platforms = {
      ebay: new EbaySearcher(),
      kleinanzeigen: new KleinanzeigenSearcher(),
    };
  }

  /**
   * Get eBay API rate limit statistics
   * @returns {Promise<Object>} Rate limit stats
   */
  async getEbayRateLimitStats() {
    return await ebayRateLimiter.getStats();
  }

  /**
   * Search all enabled platforms and combine results
   */
  async searchAllPlatforms(query, maxPrice = null) {
    const results = [];

    // Only search eBay if enabled
    if (this.platformSettings.ebayEnabled) {
      try {
        const ebayResults = await this.platforms.ebay.search(query, maxPrice);
        results.push(...ebayResults);
      } catch (error) {
        console.error('eBay search error:', redactSensitiveData(error.message || String(error)));
      }
    }

    // Only search Kleinanzeigen if enabled
    if (this.platformSettings.kleinanzeigenEnabled) {
      try {
        const kleinanzeigenResults = await this.platforms.kleinanzeigen.search(query, maxPrice);
        results.push(...kleinanzeigenResults);
      } catch (error) {
        console.error('Kleinanzeigen search error:', redactSensitiveData(error.message || String(error)));
      }
    }

    return results;
  }
}

/**
 * eBay platform searcher
 * Searches eBay using the Finding API with caching support
 */
class EbaySearcher {
  constructor() {
    // Using eBay Finding API (requires API key for production)
    this.apiKey = process.env.EBAY_API_KEY || '';
    this.baseUrl = API_CONFIG.EBAY.BASE_URL;
    this.globalId = API_CONFIG.EBAY.GLOBAL_ID;
  }

  async search(query, maxPrice) {
    // Generate cache key
    const cacheKey = `ebay:${query}:${maxPrice || 'no-max'}`;
    
    // Check cache first
    const cached = searchCache.get(cacheKey);
    if (cached) {
      console.log('eBay: Returning cached results');
      return cached;
    }
    
    // If no API key is configured, return empty results
    if (!this.apiKey) {
      console.warn('eBay: No API key configured. Please add EBAY_API_KEY to enable eBay search.');
      console.warn('eBay: Get your API key at https://developer.ebay.com/');
      return [];
    }

    // Check rate limits before making API call
    const limitCheck = await ebayRateLimiter.checkLimit();
    
    // Log warnings if approaching limit
    if (limitCheck.warning) {
      if (limitCheck.level === 'critical') {
        console.warn(`⚠️ CRITICAL: ${limitCheck.warning}`);
      } else if (limitCheck.level === 'warning') {
        console.warn(`⚠️ ${limitCheck.warning}`);
      }
    }
    
    // If limit exceeded, return empty results with error
    if (!limitCheck.canProceed) {
      console.error(`❌ ${limitCheck.warning}`);
      return [];
    }

    try {
      const results = await this.searchWithAPI(query, maxPrice);
      
      // Cache the results
      searchCache.set(cacheKey, results, CACHE_CONFIG.SEARCH_RESULTS_TTL);
      return results;
    } catch (error) {
      console.error('eBay API error:', redactSensitiveData(error.message || ''));
      console.error('eBay: Failed to fetch results. Please check your API key and network connection.');
      return [];
    }
  }

  async searchWithAPI(query, maxPrice) {
    // Validate query
    if (!query || query.trim() === '') {
      console.log('eBay: Empty query, skipping API call');
      return [];
    }

    // Build eBay Finding API request
    const params = {
      'OPERATION-NAME': API_CONFIG.EBAY.OPERATION,
      'SERVICE-VERSION': API_CONFIG.EBAY.SERVICE_VERSION,
      'SECURITY-APPNAME': this.apiKey,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'keywords': query,
      'paginationInput.entriesPerPage': API_CONFIG.EBAY.RESULTS_PER_PAGE.toString(),
      'sortOrder': 'StartTimeNewest',
      'GLOBAL-ID': this.globalId,
    };

    // Add price filter if specified
    if (maxPrice) {
      params['itemFilter(0).name'] = 'MaxPrice';
      params['itemFilter(0).value'] = maxPrice.toString();
      params['itemFilter(0).paramName'] = 'Currency';
      params['itemFilter(0).paramValue'] = 'EUR';
    }

    // Build query string
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}?${queryString}`;

    // Make API request with timeout
    const response = await axios.get(url, {
      timeout: PERFORMANCE_CONFIG.API_TIMEOUT,
    });
    
    // Increment rate limit counter after successful HTTP request to eBay
    await ebayRateLimiter.incrementCount();
    
    // Parse response
    return this.parseAPIResponse(response.data, query);
  }

  parseAPIResponse(data, query) {
    try {
      // eBay API returns data in a specific structure
      const searchResult = data.findItemsByKeywordsResponse?.[0]?.searchResult?.[0];
      
      if (!searchResult || !searchResult.item) {
        console.log('eBay: No items found in response');
        return [];
      }

      const items = searchResult.item;
      const count = searchResult['@count'];
      
      console.log(`eBay: Found ${count} items for query "${query}"`);

      // Generate timestamp once for all items in this batch
      const batchTimestamp = Date.now();

      // Transform eBay items to our format
      return items.map(item => {
        const itemId = item.itemId?.[0] || '';
        const title = item.title?.[0] || 'No title';
        const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || 0);
        const currency = item.sellingStatus?.[0]?.currentPrice?.[0]?.['@currencyId'] || 'EUR';
        const url = item.viewItemURL?.[0] || `https://www.ebay.de/itm/${itemId}`;
        const condition = item.condition?.[0]?.conditionDisplayName?.[0] || '';
        const location = item.location?.[0] || '';

        return {
          // Use eBay item ID as base for uniqueness
          id: `${PLATFORMS.EBAY}-${itemId}-${Math.random().toString(36).slice(2, 11)}`,
          title: title,
          price: price,
          currency: currency,
          platform: PLATFORMS.EBAY,
          url: url,
          condition: condition,
          location: location,
          timestamp: new Date(batchTimestamp).toISOString(),
        };
      });
    } catch (error) {
      console.error('Error parsing eBay API response:', redactSensitiveData(error.message || String(error)));
      return [];
    }
  }


}

/**
 * Kleinanzeigen platform searcher
 * Currently returns mock data - real implementation requires web scraping
 */
class KleinanzeigenSearcher {
  constructor() {
    this.baseUrl = API_CONFIG.KLEINANZEIGEN.BASE_URL;
  }

  async search(query, maxPrice) {
    // Mock implementation - in production, scrape or use API if available
    // For now, return mock data for demonstration
    return this.getMockResults(query, maxPrice, PLATFORMS.KLEINANZEIGEN);
  }

  getMockResults(query, maxPrice, platform) {
    // Generate mock results for demonstration
    const mockItems = [
      { title: `${query} neuwertig`, price: 120 },
      { title: `${query} günstig abzugeben`, price: 90 },
      { title: `Verkaufe ${query}`, price: 140 },
    ];

    const timestamp = Date.now();
    return mockItems
      .filter(item => !maxPrice || item.price <= maxPrice)
      .map((item, idx) => ({
        id: `${platform}-${timestamp}-${idx}-${Math.random().toString(36).slice(2, 11)}`,
        title: item.title,
        price: item.price,
        platform: platform,
        url: `https://www.kleinanzeigen.de/s-anzeige/mock${timestamp}${idx}`,
      }));
  }
}
