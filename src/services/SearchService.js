import axios from 'axios';
import { API_CONFIG, PERFORMANCE_CONFIG, PLATFORMS, CACHE_CONFIG, SEARCH_ENGINE_OPTIONS } from '../constants';
import { redactSensitiveData } from '../utils/security';
import { Cache } from '../utils/performance';
import { EbayRateLimiter, GoogleRateLimiter, SerpApiRateLimiter } from '../utils/rateLimiter';
import { 
  QueryOptimizer, 
  AIModeOptimizer, 
  ResultDeduplicator 
} from '../utils/searchOptimizer';

// Initialize cache for search results
const searchCache = new Cache(CACHE_CONFIG.MAX_CACHE_SIZE);

// Initialize rate limiters
const ebayRateLimiter = new EbayRateLimiter();
const googleRateLimiter = new GoogleRateLimiter();
const serpApiRateLimiter = new SerpApiRateLimiter();

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
      useGoogleForEbay: platformSettings.useGoogleForEbay === true,
      usedCarsEnabled: platformSettings.usedCarsEnabled === true,
      primarySearchEngine: platformSettings.primarySearchEngine || SEARCH_ENGINE_OPTIONS.EBAY_API,
    };
    
    // AI mode affects search optimization strategy
    // Only enable if explicitly set to true
    this.aiModeEnabled = platformSettings.aiModeEnabled === true;
    
    this.platforms = {
      ebay: new EbaySearcher(
        this.aiModeEnabled, 
        platformSettings.ebayApiKey,
        platformSettings.googleApiKey,
        platformSettings.googleCx,
        this.platformSettings.useGoogleForEbay,
        platformSettings.serpApiKey,
        this.platformSettings.primarySearchEngine
      ),
      kleinanzeigen: new KleinanzeigenSearcher(
        platformSettings.googleApiKey,
        platformSettings.googleCx,
        platformSettings.serpApiKey,
        this.platformSettings.primarySearchEngine
      ),
      usedCars: new UsedCarSearcher(
        platformSettings.googleApiKey,
        platformSettings.googleCx,
        platformSettings.serpApiKey,
        this.platformSettings.primarySearchEngine
      ),
    };
  }

  /**
   * Set AI mode for optimization strategy
   * @param {boolean} enabled - Whether AI mode is enabled
   */
  setAIMode(enabled) {
    this.aiModeEnabled = enabled;
    this.platforms.ebay.setAIMode(enabled);
  }

  /**
   * Update eBay API key
   * @param {string} apiKey - eBay API key
   */
  setEbayApiKey(apiKey) {
    this.platforms.ebay.setApiKey(apiKey);
  }

  /**
   * Get eBay API rate limit statistics
   * @returns {Promise<Object>} Rate limit stats
   */
  async getEbayRateLimitStats() {
    return await ebayRateLimiter.getStats();
  }

  /**
   * Get Google API rate limit statistics
   * @returns {Promise<Object>} Rate limit stats
   */
  async getGoogleRateLimitStats() {
    return await googleRateLimiter.getStats();
  }

  /**
   * Get SerpAPI rate limit statistics
   * @returns {Promise<Object>} Rate limit stats
   */
  async getSerpApiRateLimitStats() {
    return await serpApiRateLimiter.getStats();
  }

  /**
   * Search all enabled platforms and combine results
   * @param {string} query - Search query
   * @param {number|null} maxPrice - Maximum price filter
   * @param {Array} existingMatches - Existing matches to filter out duplicates
   * @returns {Promise<Array>} Array of search results
   */
  async searchAllPlatforms(query, maxPrice = null, existingMatches = []) {
    const results = [];

    // Normalize query for better cache hits
    const normalizedQuery = QueryOptimizer.normalizeQuery(query);

    // Only search eBay if enabled
    if (this.platformSettings.ebayEnabled) {
      try {
        const ebayResults = await this.platforms.ebay.search(normalizedQuery, maxPrice);
        results.push(...ebayResults);
      } catch (error) {
        console.error('eBay search error:', redactSensitiveData(error.message || String(error)));
      }
    }

    // Only search Kleinanzeigen if enabled
    if (this.platformSettings.kleinanzeigenEnabled) {
      try {
        const kleinanzeigenResults = await this.platforms.kleinanzeigen.search(normalizedQuery, maxPrice);
        results.push(...kleinanzeigenResults);
      } catch (error) {
        console.error('Kleinanzeigen search error:', redactSensitiveData(error.message || String(error)));
      }
    }

    // Only search Used Cars platforms if enabled
    if (this.platformSettings.usedCarsEnabled) {
      try {
        const usedCarResults = await this.platforms.usedCars.search(normalizedQuery, maxPrice);
        results.push(...usedCarResults);
      } catch (error) {
        console.error('Used Cars search error:', redactSensitiveData(error.message || String(error)));
      }
    }

    // Deduplicate results by title similarity
    const deduplicated = ResultDeduplicator.deduplicateByTitle(results);

    // Filter out results that already exist in saved matches
    const newResults = ResultDeduplicator.filterOutExisting(deduplicated, existingMatches);

    return newResults;
  }
}

/**
 * eBay platform searcher
 * Searches eBay using the Finding API with caching support
 */
class EbaySearcher {
  constructor(aiModeEnabled = false, apiKey = '', googleApiKey = '', googleCx = '', useGoogleForEbay = false, serpApiKey = '', primarySearchEngine = SEARCH_ENGINE_OPTIONS.EBAY_API) {
    // Using eBay Finding API (requires API key for production)
    // Prioritize passed apiKey, fallback to environment variable
    this.apiKey = apiKey || process.env.EBAY_API_KEY || '';
    this.baseUrl = API_CONFIG.EBAY.BASE_URL;
    this.globalId = API_CONFIG.EBAY.GLOBAL_ID;
    this.aiModeEnabled = aiModeEnabled;
    
    // Google Custom Search credentials for fallback
    this.googleApiKey = googleApiKey || process.env.GOOGLE_API_KEY || '';
    this.googleCx = googleCx || process.env.GOOGLE_CX || '';
    this.useGoogleForEbay = useGoogleForEbay;

    // SerpAPI credentials
    this.serpApiKey = serpApiKey || process.env.SERP_API_KEY || '';
    this.primarySearchEngine = primarySearchEngine;
  }

  /**
   * Set AI mode for optimization strategy
   * @param {boolean} enabled - Whether AI mode is enabled
   */
  setAIMode(enabled) {
    this.aiModeEnabled = enabled;
  }

  /**
   * Update eBay API key
   * @param {string} apiKey - eBay API key
   */
  setApiKey(apiKey) {
    if (typeof apiKey !== 'string' && apiKey !== null && apiKey !== undefined) {
      console.warn('eBay API key must be a string, received:', typeof apiKey);
      this.apiKey = '';
      return;
    }
    this.apiKey = apiKey || '';
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

    // Route to the configured primary search engine
    if (this.primarySearchEngine === SEARCH_ENGINE_OPTIONS.SERP_API) {
      if (this.serpApiKey) {
        try {
          const results = await this.searchWithSerpAPI(query, maxPrice);
          searchCache.set(cacheKey, results, CACHE_CONFIG.SEARCH_RESULTS_TTL);
          return results;
        } catch (error) {
          console.error('SerpAPI error:', redactSensitiveData(error.message || ''));
          return [];
        }
      }
      console.warn('eBay: SerpAPI key not configured. Please add it in Settings.');
      return [];
    }

    if (this.primarySearchEngine === SEARCH_ENGINE_OPTIONS.GOOGLE_CSE) {
      if (this.googleApiKey && this.googleCx) {
        try {
          const results = await this.searchWithGoogle(query, maxPrice);
          searchCache.set(cacheKey, results, CACHE_CONFIG.SEARCH_RESULTS_TTL);
          return results;
        } catch (error) {
          console.error('Google CSE error:', redactSensitiveData(error.message || ''));
          return [];
        }
      }
      console.warn('eBay: Google Custom Search credentials not configured. Please add them in Settings.');
      return [];
    }
    
    // Primary = eBay API (default behavior)
    // Priority 1: Try eBay API if key is available
    if (this.apiKey) {
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
      
      // If limit exceeded, fallback to Google if available
      if (!limitCheck.canProceed) {
        console.error(`❌ ${limitCheck.warning}`);
        if (this.googleApiKey && this.googleCx) {
          console.log('eBay: Rate limit exceeded. Falling back to Google Custom Search...');
          try {
            const results = await this.searchWithGoogle(query, maxPrice);
            searchCache.set(cacheKey, results, CACHE_CONFIG.SEARCH_RESULTS_TTL);
            return results;
          } catch (error) {
            console.error('Google Custom Search error:', redactSensitiveData(error.message || ''));
            return [];
          }
        }
        return [];
      }

      // Try eBay API
      try {
        const results = await this.searchWithAPI(query, maxPrice);
        
        // Cache the results
        searchCache.set(cacheKey, results, CACHE_CONFIG.SEARCH_RESULTS_TTL);
        return results;
      } catch (error) {
        console.error('eBay API error:', redactSensitiveData(error.message || ''));
        console.warn('eBay: Failed to fetch results. Trying Google Custom Search fallback...');
        
        // Priority 2: Fallback to Google Custom Search on eBay API error
        if (this.googleApiKey && this.googleCx) {
          try {
            const results = await this.searchWithGoogle(query, maxPrice);
            searchCache.set(cacheKey, results, CACHE_CONFIG.SEARCH_RESULTS_TTL);
            return results;
          } catch (googleError) {
            console.error('Google Custom Search error:', redactSensitiveData(googleError.message || ''));
            return [];
          }
        }
        return [];
      }
    }
    
    // Priority 2: If no eBay API key, try Google Custom Search as fallback
    if (this.googleApiKey && this.googleCx) {
      console.log('eBay: No eBay API key. Using Google Custom Search as fallback...');
      try {
        const results = await this.searchWithGoogle(query, maxPrice);
        searchCache.set(cacheKey, results, CACHE_CONFIG.SEARCH_RESULTS_TTL);
        return results;
      } catch (error) {
        console.error('Google Custom Search error:', redactSensitiveData(error.message || ''));
        return [];
      }
    }
    
    // No API keys configured
    console.warn('eBay: No API key configured. Please add eBay API key or Google Custom Search credentials.');
    console.warn('eBay: Get your eBay API key at https://developer.ebay.com/');
    console.warn('eBay: Or setup Google Custom Search at https://console.cloud.google.com/');
    return [];
  }

  async searchWithAPI(query, maxPrice) {
    // Validate query
    if (!query || query.trim() === '') {
      console.log('eBay: Empty query, skipping API call');
      return [];
    }

    // Optimize results per page based on AI mode
    const resultsPerPage = AIModeOptimizer.getOptimalResultsPerPage(
      this.aiModeEnabled, 
      API_CONFIG.EBAY.RESULTS_PER_PAGE
    );

    // Get optimal sort order based on AI mode
    const sortOrder = AIModeOptimizer.getOptimalSortOrder(this.aiModeEnabled);

    console.log(`eBay: Using ${this.aiModeEnabled ? 'AI' : 'non-AI'} mode optimization`);
    console.log(`eBay: Fetching ${resultsPerPage} results with ${sortOrder} sort`);

    // Build eBay Finding API request
    const params = {
      'OPERATION-NAME': API_CONFIG.EBAY.OPERATION,
      'SERVICE-VERSION': API_CONFIG.EBAY.SERVICE_VERSION,
      'SECURITY-APPNAME': this.apiKey,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'keywords': query,
      'paginationInput.entriesPerPage': resultsPerPage.toString(),
      'sortOrder': sortOrder,
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
          searchEngine: 'eBay API',
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

  /**
   * Search using Google Custom Search API
   * @param {string} query - Search query
   * @param {number|null} maxPrice - Maximum price filter
   * @returns {Promise<Array>} Array of search results
   */
  async searchWithGoogle(query, maxPrice) {
    // Validate query
    if (!query || query.trim() === '') {
      console.log('Google: Empty query, skipping API call');
      return [];
    }

    // Check rate limits before making API call
    const limitCheck = await googleRateLimiter.checkLimit();
    
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
      // Build Google Custom Search API request
      // Search specifically on eBay.de using site: operator
      const searchQuery = `site:ebay.de ${query}`;
      const params = {
        key: this.googleApiKey,
        cx: this.googleCx,
        q: searchQuery,
        num: API_CONFIG.GOOGLE_CUSTOM_SEARCH.RESULTS_PER_PAGE,
      };

      // Build query string
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_CONFIG.GOOGLE_CUSTOM_SEARCH.BASE_URL}?${queryString}`;

      console.log(`Google: Searching for "${query}" on eBay.de`);

      // Make API request with timeout
      const response = await axios.get(url, {
        timeout: PERFORMANCE_CONFIG.API_TIMEOUT,
      });
      
      // Increment rate limit counter after successful HTTP request
      await googleRateLimiter.incrementCount();
      
      // Parse response
      return this.parseGoogleResponse(response.data, query, maxPrice);
    } catch (error) {
      console.error('Google Custom Search error:', redactSensitiveData(error.message || ''));
      throw error;
    }
  }

  /**
   * Parse Google Custom Search API response
   * @param {Object} data - Google API response data
   * @param {string} query - Original search query
   * @param {number|null} maxPrice - Maximum price filter
   * @returns {Array} Array of standardized search results
   */
  parseGoogleResponse(data, query, maxPrice) {
    try {
      if (!data.items || data.items.length === 0) {
        console.log('Google: No items found in response');
        return [];
      }

      console.log(`Google: Found ${data.items.length} items for query "${query}"`);

      // Generate timestamp once for all items in this batch
      const batchTimestamp = Date.now();

      // Transform Google results to our format
      const results = data.items
        .map(item => {
          // Extract eBay item ID from URL
          const urlMatch = item.link?.match(/\/itm\/(\d+)/);
          const itemId = urlMatch ? urlMatch[1] : '';
          
          const title = item.title || 'No title';
          const snippet = item.snippet || '';
          
          // Try to extract price from snippet or title
          // Look for patterns like "EUR 99,99" or "99,99 €" or "$99.99"
          const priceMatch = snippet.match(/(?:EUR|€|\$)\s*(\d+[.,]\d{2})|(\d+[.,]\d{2})\s*(?:EUR|€)/);
          let price = 0;
          if (priceMatch) {
            const priceStr = (priceMatch[1] || priceMatch[2]).replace(',', '.');
            price = parseFloat(priceStr);
          }

          return {
            id: `${PLATFORMS.GOOGLE_EBAY}-${itemId || batchTimestamp}-${Math.random().toString(36).slice(2, 11)}`,
            title: title,
            price: price,
            currency: 'EUR',
            platform: PLATFORMS.GOOGLE_EBAY,
            searchEngine: 'Google Custom Search',
            url: item.link || '',
            condition: '',
            location: '',
            timestamp: new Date(batchTimestamp).toISOString(),
            snippet: snippet,
          };
        })
        // Filter by max price if specified (only if price was extracted)
        .filter(item => {
          if (!maxPrice) {
            return true;
          }
          if (item.price === 0) {
            return true; // Include items where price couldn't be extracted
          }
          return item.price <= maxPrice;
        });

      return results;
    } catch (error) {
      console.error('Error parsing Google API response:', redactSensitiveData(error.message || String(error)));
      return [];
    }
  }

  /**
   * Search eBay.de using SerpAPI (Google search results for site:ebay.de)
   * @param {string} query - Search query
   * @param {number|null} maxPrice - Maximum price filter
   * @returns {Promise<Array>} Array of search results
   */
  async searchWithSerpAPI(query, maxPrice) {
    if (!query || query.trim() === '') {
      console.log('SerpAPI (eBay): Empty query, skipping API call');
      return [];
    }

    // Check rate limits before making API call
    const limitCheck = await serpApiRateLimiter.checkLimit();
    if (limitCheck.warning) {
      if (limitCheck.level === 'critical') {
        console.warn(`⚠️ CRITICAL: ${limitCheck.warning}`);
      } else if (limitCheck.level === 'warning') {
        console.warn(`⚠️ ${limitCheck.warning}`);
      }
    }
    if (!limitCheck.canProceed) {
      console.error(`❌ ${limitCheck.warning}`);
      return [];
    }

    try {
      const params = {
        engine: 'google',
        q: `site:ebay.de ${query}`,
        api_key: this.serpApiKey,
        num: API_CONFIG.SERP_API.RESULTS_PER_PAGE,
      };

      const queryString = new URLSearchParams(params).toString();
      const url = `${API_CONFIG.SERP_API.BASE_URL}?${queryString}`;

      console.log(`SerpAPI (eBay): Searching for "${query}" on eBay.de`);

      const response = await axios.get(url, {
        timeout: PERFORMANCE_CONFIG.API_TIMEOUT,
      });

      await serpApiRateLimiter.incrementCount();

      return this.parseSerpAPIResponse(response.data, query, maxPrice);
    } catch (error) {
      console.error('SerpAPI (eBay) error:', redactSensitiveData(error.message || ''));
      throw error;
    }
  }

  /**
   * Parse SerpAPI response for eBay results
   * @param {Object} data - SerpAPI response data
   * @param {string} query - Original search query
   * @param {number|null} maxPrice - Maximum price filter
   * @returns {Array} Array of standardized search results
   */
  parseSerpAPIResponse(data, query, maxPrice) {
    try {
      const items = data.organic_results;
      if (!items || items.length === 0) {
        console.log('SerpAPI (eBay): No items found in response');
        return [];
      }

      console.log(`SerpAPI (eBay): Found ${items.length} items for query "${query}"`);

      const batchTimestamp = Date.now();

      return items
        .map(item => {
          const urlMatch = item.link?.match(/\/itm\/(\d+)/);
          const itemId = urlMatch ? urlMatch[1] : '';

          const title = item.title || 'No title';
          const snippet = item.snippet || '';

          const priceMatch = snippet.match(/(?:EUR|€|\$)\s*(\d+[.,]\d{2})|(\d+[.,]\d{2})\s*(?:EUR|€)/);
          let price = 0;
          if (priceMatch) {
            const priceStr = (priceMatch[1] || priceMatch[2]).replace(',', '.');
            price = parseFloat(priceStr);
          }

          return {
            id: `${PLATFORMS.SERP_EBAY}-${itemId || batchTimestamp}-${Math.random().toString(36).slice(2, 11)}`,
            title: title,
            price: price,
            currency: 'EUR',
            platform: PLATFORMS.SERP_EBAY,
            searchEngine: 'SerpAPI',
            url: item.link || '',
            condition: '',
            location: '',
            timestamp: new Date(batchTimestamp).toISOString(),
            snippet: snippet,
          };
        })
        .filter(item => {
          if (!maxPrice) { return true; }
          if (item.price === 0) { return true; }
          return item.price <= maxPrice;
        });
    } catch (error) {
      console.error('Error parsing SerpAPI response:', redactSensitiveData(error.message || String(error)));
      return [];
    }
  }

}

/**
 * Kleinanzeigen platform searcher
 * Searches kleinanzeigen.de via Google Custom Search API using the site: operator.
 * Requires Google API key and Custom Search Engine ID to be configured.
 */
class KleinanzeigenSearcher {
  /**
   * @param {string} [googleApiKey=''] - Google Custom Search API key
   * @param {string} [googleCx=''] - Google Custom Search Engine ID
   * @param {string} [serpApiKey=''] - SerpAPI API key
   * @param {string} [primarySearchEngine='ebay_api'] - Primary search engine setting
   */
  constructor(googleApiKey = '', googleCx = '', serpApiKey = '', primarySearchEngine = SEARCH_ENGINE_OPTIONS.EBAY_API) {
    this.googleApiKey = googleApiKey || process.env.GOOGLE_API_KEY || '';
    this.googleCx = googleCx || process.env.GOOGLE_CX || '';
    this.serpApiKey = serpApiKey || process.env.SERP_API_KEY || '';
    this.primarySearchEngine = primarySearchEngine;
  }

  /**
   * Search kleinanzeigen.de for matching listings
   * @param {string} query - Search query
   * @param {number|null} maxPrice - Maximum price filter in EUR (optional)
   * @returns {Promise<Array>} Array of standardized search results
   */
  async search(query, maxPrice) {
    // Validate query
    if (!query || query.trim() === '') {
      console.log('Kleinanzeigen: Empty query, skipping API call');
      return [];
    }

    // Generate cache key
    const cacheKey = `kleinanzeigen:${query}:${maxPrice || 'no-max'}`;

    // Check cache first
    const cached = searchCache.get(cacheKey);
    if (cached) {
      console.log('Kleinanzeigen: Returning cached results');
      return cached;
    }

    // Use SerpAPI if configured as primary
    if (this.primarySearchEngine === SEARCH_ENGINE_OPTIONS.SERP_API) {
      if (this.serpApiKey) {
        try {
          const results = await this.searchWithSerpAPI(query, maxPrice);
          searchCache.set(cacheKey, results, CACHE_CONFIG.SEARCH_RESULTS_TTL);
          return results;
        } catch (error) {
          console.error('Kleinanzeigen SerpAPI error:', redactSensitiveData(error.message || ''));
          return [];
        }
      }
      console.warn('Kleinanzeigen: SerpAPI key not configured. Please add it in Settings.');
      return [];
    }

    // Default: use Google Custom Search
    if (!this.googleApiKey || !this.googleCx) {
      console.warn('Kleinanzeigen: Google API credentials not configured. Please add Google API Key and CX in settings.');
      return [];
    }

    // Check rate limits before making API call
    const limitCheck = await googleRateLimiter.checkLimit();

    if (limitCheck.warning) {
      if (limitCheck.level === 'critical') {
        console.warn(`⚠️ CRITICAL: ${limitCheck.warning}`);
      } else if (limitCheck.level === 'warning') {
        console.warn(`⚠️ ${limitCheck.warning}`);
      }
    }

    if (!limitCheck.canProceed) {
      console.error(`❌ ${limitCheck.warning}`);
      return [];
    }

    try {
      // Search specifically on kleinanzeigen.de using site: operator
      const searchQuery = `site:kleinanzeigen.de ${query}`;
      const params = {
        key: this.googleApiKey,
        cx: this.googleCx,
        q: searchQuery,
        num: API_CONFIG.GOOGLE_CUSTOM_SEARCH.RESULTS_PER_PAGE,
      };

      const queryString = new URLSearchParams(params).toString();
      const url = `${API_CONFIG.GOOGLE_CUSTOM_SEARCH.BASE_URL}?${queryString}`;

      console.log(`Kleinanzeigen: Searching for "${query}" on kleinanzeigen.de`);

      const response = await axios.get(url, {
        timeout: PERFORMANCE_CONFIG.API_TIMEOUT,
      });

      // Increment rate limit counter after successful HTTP request
      await googleRateLimiter.incrementCount();

      const results = this.parseGoogleResponse(response.data, query, maxPrice);
      searchCache.set(cacheKey, results, CACHE_CONFIG.SEARCH_RESULTS_TTL);
      return results;
    } catch (error) {
      console.error('Kleinanzeigen search error:', redactSensitiveData(error.message || ''));
      return [];
    }
  }

  /**
   * Search kleinanzeigen.de using SerpAPI
   * @param {string} query - Search query
   * @param {number|null} maxPrice - Maximum price filter
   * @returns {Promise<Array>} Array of search results
   */
  async searchWithSerpAPI(query, maxPrice) {
    // Check rate limits before making API call
    const limitCheck = await serpApiRateLimiter.checkLimit();
    if (limitCheck.warning) {
      if (limitCheck.level === 'critical') {
        console.warn(`⚠️ CRITICAL: ${limitCheck.warning}`);
      } else if (limitCheck.level === 'warning') {
        console.warn(`⚠️ ${limitCheck.warning}`);
      }
    }
    if (!limitCheck.canProceed) {
      console.error(`❌ ${limitCheck.warning}`);
      return [];
    }

    const params = {
      engine: 'google',
      q: `site:kleinanzeigen.de ${query}`,
      api_key: this.serpApiKey,
      num: API_CONFIG.SERP_API.RESULTS_PER_PAGE,
    };

    const queryString = new URLSearchParams(params).toString();
    const url = `${API_CONFIG.SERP_API.BASE_URL}?${queryString}`;

    console.log(`Kleinanzeigen (SerpAPI): Searching for "${query}"`);

    const response = await axios.get(url, {
      timeout: PERFORMANCE_CONFIG.API_TIMEOUT,
    });

    await serpApiRateLimiter.incrementCount();

    return this.parseSerpAPIResponse(response.data, query, maxPrice);
  }

  /**
   * Parse SerpAPI response for Kleinanzeigen results
   * @param {Object} data - SerpAPI response data
   * @param {string} query - Original search query
   * @param {number|null} maxPrice - Maximum price filter
   * @returns {Array} Array of standardized search results
   */
  parseSerpAPIResponse(data, query, maxPrice) {
    try {
      const items = data.organic_results;
      if (!items || items.length === 0) {
        console.log('Kleinanzeigen (SerpAPI): No items found in response');
        return [];
      }

      console.log(`Kleinanzeigen (SerpAPI): Found ${items.length} items for query "${query}"`);

      const batchTimestamp = Date.now();

      return items
        .map(item => {
          const urlMatch = item.link?.match(/\/(\d+)(?:-\d+-\d+)?(?:$|\/)/);
          const itemId = urlMatch ? urlMatch[1] : '';

          const title = item.title || 'No title';
          const snippet = item.snippet || '';

          const priceMatch = snippet.match(/(?:EUR|€|\$)\s*(\d[\d.,]*)/i) ||
                             snippet.match(/(\d[\d.,]*)\s*(?:EUR|€)/i);
          let price = 0;
          if (priceMatch) {
            const priceStr = priceMatch[1]
              .replace(/,[-\s]?$/, '')
              .replace(/\./g, '')
              .replace(',', '.');
            price = parseFloat(priceStr);
          }

          return {
            id: `${PLATFORMS.SERP_KLEINANZEIGEN}-${itemId || batchTimestamp}-${Math.random().toString(36).slice(2, 11)}`,
            title: title,
            price: price,
            currency: 'EUR',
            platform: PLATFORMS.SERP_KLEINANZEIGEN,
            searchEngine: 'SerpAPI',
            url: item.link || '',
            condition: '',
            location: '',
            timestamp: new Date(batchTimestamp).toISOString(),
            snippet: snippet,
          };
        })
        .filter(item => {
          if (!maxPrice) { return true; }
          if (item.price === 0) { return true; }
          return item.price <= maxPrice;
        });
    } catch (error) {
      console.error('Error parsing Kleinanzeigen SerpAPI response:', redactSensitiveData(error.message || String(error)));
      return [];
    }
  }

  /**
   * Parse Google Custom Search API response for kleinanzeigen.de results
   * @param {Object} data - Google API response data
   * @param {string} query - Original search query
   * @param {number|null} maxPrice - Maximum price filter
   * @returns {Array} Array of standardized search results
   */
  parseGoogleResponse(data, query, maxPrice) {
    try {
      if (!data.items || data.items.length === 0) {
        console.log('Kleinanzeigen: No items found in response');
        return [];
      }

      console.log(`Kleinanzeigen: Found ${data.items.length} items for query "${query}"`);

      // Generate timestamp once for all items in this batch
      const batchTimestamp = Date.now();

      return data.items
        .map(item => {
          // Extract Kleinanzeigen item ID from URL
          // URL pattern: https://www.kleinanzeigen.de/s-anzeige/title/123456789-cat-loc
          const urlMatch = item.link?.match(/\/(\d+)(?:-\d+-\d+)?(?:$|\/)/);
          const itemId = urlMatch ? urlMatch[1] : '';

          const title = item.title || 'No title';
          const snippet = item.snippet || '';

          // Try to extract price from snippet
          // Patterns: "99,- €", "99 €", "EUR 99,99", "9.999 €"
          const priceMatch = snippet.match(/(?:EUR|€|\$)\s*(\d[\d.,]*)/i) ||
                             snippet.match(/(\d[\d.,]*)\s*(?:EUR|€)/i);
          let price = 0;
          if (priceMatch) {
            const priceStr = priceMatch[1]
              .replace(/,[-\s]?$/, '') // Remove trailing German price notation (e.g. "80," or "80,-")
              .replace(/\./g, '') // Remove thousand separators (German: 9.999)
              .replace(',', '.'); // Replace decimal comma with dot
            price = parseFloat(priceStr);
          }

          return {
            id: `${PLATFORMS.KLEINANZEIGEN}-${itemId || batchTimestamp}-${Math.random().toString(36).slice(2, 11)}`,
            title: title,
            price: price,
            currency: 'EUR',
            platform: PLATFORMS.KLEINANZEIGEN,
            searchEngine: 'Google Custom Search',
            url: item.link || '',
            condition: '',
            location: '',
            timestamp: new Date(batchTimestamp).toISOString(),
            snippet: snippet,
          };
        })
        // Filter by max price if specified (only if price was extracted)
        .filter(item => {
          if (!maxPrice) { return true; }
          if (item.price === 0) { return true; } // Include items where price couldn't be extracted
          return item.price <= maxPrice;
        });
    } catch (error) {
      console.error('Error parsing Kleinanzeigen response:', redactSensitiveData(error.message || String(error)));
      return [];
    }
  }
}

/**
 * Used Car platform searcher
 * Searches mobile.de and AutoScout24 using Google Custom Search API
 * 
 * This class provides access to German used car platforms via Google's Custom Search API,
 * searching both mobile.de and AutoScout24 in parallel for better coverage.
 * 
 * @example
 * const searcher = new UsedCarSearcher('google-api-key', 'search-cx-id');
 * const results = await searcher.search('BMW 320d', 25000);
 */
class UsedCarSearcher {
  /**
   * Create a UsedCarSearcher instance
   * @param {string} [googleApiKey=''] - Google Custom Search API key
   * @param {string} [googleCx=''] - Google Custom Search Engine ID
   * @param {string} [serpApiKey=''] - SerpAPI API key
   * @param {string} [primarySearchEngine='ebay_api'] - Primary search engine setting
   */
  constructor(googleApiKey = '', googleCx = '', serpApiKey = '', primarySearchEngine = SEARCH_ENGINE_OPTIONS.EBAY_API) {
    this.googleApiKey = googleApiKey || process.env.GOOGLE_API_KEY || '';
    this.googleCx = googleCx || process.env.GOOGLE_CX || '';
    this.serpApiKey = serpApiKey || process.env.SERP_API_KEY || '';
    this.primarySearchEngine = primarySearchEngine;
  }

  /**
   * Search used car platforms for matching vehicles
   * @param {string} query - Search query (e.g., "BMW 320d")
   * @param {number|null} maxPrice - Maximum price filter in EUR (optional)
   * @returns {Promise<Array>} Array of standardized search results from mobile.de and AutoScout24
   */
  async search(query, maxPrice) {
    // Generate cache key
    const cacheKey = `usedcars:${query}:${maxPrice || 'no-max'}`;

    // Check cache first
    const cached = searchCache.get(cacheKey);
    if (cached) {
      console.log('Used Cars: Returning cached results');
      return cached;
    }

    // Use SerpAPI if configured as primary
    if (this.primarySearchEngine === SEARCH_ENGINE_OPTIONS.SERP_API) {
      if (this.serpApiKey) {
        try {
          const [mobileResults, autoScoutResults] = await Promise.allSettled([
            this.searchPlatformWithSerpAPI(query, maxPrice, PLATFORMS.MOBILE_DE, 'mobile.de'),
            this.searchPlatformWithSerpAPI(query, maxPrice, PLATFORMS.AUTOSCOUT24, 'autoscout24.de'),
          ]);

          const results = [];
          if (mobileResults.status === 'fulfilled') {
            results.push(...mobileResults.value);
          }
          if (autoScoutResults.status === 'fulfilled') {
            results.push(...autoScoutResults.value);
          }

          searchCache.set(cacheKey, results, CACHE_CONFIG.SEARCH_RESULTS_TTL);
          return results;
        } catch (error) {
          console.error('Used Cars SerpAPI error:', redactSensitiveData(error.message || ''));
          return [];
        }
      }
      console.warn('Used Cars: SerpAPI key not configured. Please add it in Settings.');
      return [];
    }

    // Default: use Google Custom Search
    if (!this.googleApiKey || !this.googleCx) {
      console.warn('Used Cars: Google API credentials not configured. Please add API key and CX in settings.');
      return [];
    }

    // Check rate limits before making API call
    const limitCheck = await googleRateLimiter.checkLimit();
    
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
      // Search both mobile.de and AutoScout24
      const [mobileResults, autoScoutResults] = await Promise.allSettled([
        this.searchPlatform(query, maxPrice, PLATFORMS.MOBILE_DE, API_CONFIG.USED_CARS.MOBILE_DE_URL),
        this.searchPlatform(query, maxPrice, PLATFORMS.AUTOSCOUT24, API_CONFIG.USED_CARS.AUTOSCOUT24_URL),
      ]);

      const results = [];
      
      // Add mobile.de results
      if (mobileResults.status === 'fulfilled') {
        results.push(...mobileResults.value);
      } else {
        console.error('mobile.de search error:', redactSensitiveData(mobileResults.reason?.message || String(mobileResults.reason)));
      }
      
      // Add AutoScout24 results
      if (autoScoutResults.status === 'fulfilled') {
        results.push(...autoScoutResults.value);
      } else {
        console.error('AutoScout24 search error:', redactSensitiveData(autoScoutResults.reason?.message || String(autoScoutResults.reason)));
      }

      // Cache the results
      searchCache.set(cacheKey, results, CACHE_CONFIG.SEARCH_RESULTS_TTL);
      
      return results;
    } catch (error) {
      console.error('Used Cars search error:', redactSensitiveData(error.message || ''));
      return [];
    }
  }

  /**
   * Search a specific used car platform using SerpAPI
   * @param {string} query - Search query
   * @param {number|null} maxPrice - Maximum price filter
   * @param {string} platformName - Platform name for result metadata
   * @param {string} siteDomain - Domain for site: operator (e.g. 'mobile.de')
   * @returns {Promise<Array>} Array of search results
   */
  async searchPlatformWithSerpAPI(query, maxPrice, platformName, siteDomain) {
    if (!query || query.trim() === '') {
      console.log(`${platformName}: Empty query, skipping SerpAPI call`);
      return [];
    }

    // Check rate limits before making API call
    const limitCheck = await serpApiRateLimiter.checkLimit();
    if (limitCheck.warning) {
      if (limitCheck.level === 'critical') {
        console.warn(`⚠️ CRITICAL: ${limitCheck.warning}`);
      } else if (limitCheck.level === 'warning') {
        console.warn(`⚠️ ${limitCheck.warning}`);
      }
    }
    if (!limitCheck.canProceed) {
      console.error(`❌ ${limitCheck.warning}`);
      return [];
    }

    const params = {
      engine: 'google',
      q: `site:${siteDomain} ${query}`,
      api_key: this.serpApiKey,
      num: API_CONFIG.SERP_API.RESULTS_PER_PAGE,
    };

    const queryString = new URLSearchParams(params).toString();
    const url = `${API_CONFIG.SERP_API.BASE_URL}?${queryString}`;

    console.log(`${platformName} (SerpAPI): Searching for "${query}"`);

    const response = await axios.get(url, {
      timeout: PERFORMANCE_CONFIG.API_TIMEOUT,
    });

    await serpApiRateLimiter.incrementCount();

    return this.parseGoogleResponse(response.data.organic_results
      ? { items: response.data.organic_results }
      : response.data, query, maxPrice, platformName, 'SerpAPI');
  }

  /**
   * Search a specific used car platform using Google Custom Search
   * @param {string} query - Search query
   * @param {number|null} maxPrice - Maximum price filter
   * @param {string} platformName - Platform name for result metadata
   * @param {string} siteUrl - Site URL for site: operator
   * @returns {Promise<Array>} Array of search results
   */
  async searchPlatform(query, maxPrice, platformName, siteUrl) {
    // Validate query
    if (!query || query.trim() === '') {
      console.log(`${platformName}: Empty query, skipping API call`);
      return [];
    }

    try {
      // Build Google Custom Search API request
      // Search specifically on the target site using site: operator
      const searchQuery = `site:${siteUrl} ${query}`;
      const params = {
        key: this.googleApiKey,
        cx: this.googleCx,
        q: searchQuery,
        num: API_CONFIG.USED_CARS.RESULTS_PER_PAGE,
      };

      // Build query string
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_CONFIG.GOOGLE_CUSTOM_SEARCH.BASE_URL}?${queryString}`;

      console.log(`${platformName}: Searching for "${query}"`);

      // Make API request with timeout
      const response = await axios.get(url, {
        timeout: PERFORMANCE_CONFIG.API_TIMEOUT,
      });
      
      // Increment rate limit counter after successful HTTP request
      await googleRateLimiter.incrementCount();
      
      // Parse response
      return this.parseGoogleResponse(response.data, query, maxPrice, platformName);
    } catch (error) {
      console.error(`${platformName} search error:`, redactSensitiveData(error.message || ''));
      throw error;
    }
  }

  /**
   * Parse Google Custom Search API response
   * @param {Object} data - Google API response data
   * @param {string} query - Original search query
   * @param {number|null} maxPrice - Maximum price filter
   * @param {string} platformName - Platform name for result metadata
   * @param {string} [searchEngineName='Google Custom Search'] - Search engine used
   * @returns {Array} Array of standardized search results
   */
  parseGoogleResponse(data, query, maxPrice, platformName, searchEngineName = 'Google Custom Search') {
    try {
      if (!data.items || data.items.length === 0) {
        console.log(`${platformName}: No items found in response`);
        return [];
      }

      console.log(`${platformName}: Found ${data.items.length} items for query "${query}"`);

      // Generate timestamp once for all items in this batch
      const batchTimestamp = Date.now();

      // Transform Google results to our format
      const results = data.items
        .map(item => {
          const title = item.title || 'No title';
          const snippet = item.snippet || '';
          
          // Try to extract price from snippet or title
          // Look for patterns like "EUR 99,99" or "9.999 €" or "€ 9.999,-"
          // Used car prices can be higher, so we match longer numbers
          // Match currency symbol followed by number, or number followed by currency
          const priceMatch = snippet.match(/(?:EUR|€|\$)\s*([\d.,]+)/i) || 
                           snippet.match(/([\d.,]+)\s*(?:EUR|€)/i);
          let price = 0;
          if (priceMatch) {
            let priceStr = priceMatch[1];
            // Clean up the price string
            priceStr = priceStr
              .replace(/,-?$/, '') // Remove trailing comma-dash or comma
              .replace(/\./g, '') // Remove thousand separators (German format: 9.999)
              .replace(',', '.'); // Replace decimal comma with dot
            price = parseFloat(priceStr);
          }

          // Extract year if present (e.g., "2018" or "Bj. 2018")
          const yearMatch = snippet.match(/(?:Bj\.|Jahr|Year|EZ)\s*(\d{4})|(\d{4})/i);
          const year = yearMatch ? (yearMatch[1] || yearMatch[2]) : '';

          // Extract mileage if present (e.g., "50.000 km" or "50000km")
          const mileageMatch = snippet.match(/([\d.]+)\s*km/i);
          const mileage = mileageMatch ? mileageMatch[1].replace(/\./g, '') : '';

          return {
            id: `${platformName}-${batchTimestamp}-${Math.random().toString(36).slice(2, 11)}`,
            title: title,
            price: price,
            currency: 'EUR',
            platform: platformName,
            searchEngine: searchEngineName,
            url: item.link || '',
            year: year,
            mileage: mileage,
            timestamp: new Date(batchTimestamp).toISOString(),
            snippet: snippet,
          };
        })
        // Filter by max price if specified (only if price was extracted)
        .filter(item => {
          if (!maxPrice) {
            return true;
          }
          if (item.price === 0) {
            return true; // Include items where price couldn't be extracted
          }
          return item.price <= maxPrice;
        });

      return results;
    } catch (error) {
      console.error(`Error parsing ${platformName} API response:`, redactSensitiveData(error.message || String(error)));
      return [];
    }
  }
}
