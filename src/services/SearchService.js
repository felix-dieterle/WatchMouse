import axios from 'axios';

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
        console.error('eBay search error:', error);
      }
    }

    // Only search Kleinanzeigen if enabled
    if (this.platformSettings.kleinanzeigenEnabled) {
      try {
        const kleinanzeigenResults = await this.platforms.kleinanzeigen.search(query, maxPrice);
        results.push(...kleinanzeigenResults);
      } catch (error) {
        console.error('Kleinanzeigen search error:', error);
      }
    }

    return results;
  }
}

/**
 * eBay platform searcher
 */
class EbaySearcher {
  constructor() {
    // Using eBay Finding API (requires API key for production)
    this.apiKey = process.env.EBAY_API_KEY || '';
    this.baseUrl = 'https://svcs.ebay.com/services/search/FindingService/v1';
    this.globalId = 'EBAY-DE'; // Default to German eBay
  }

  async search(query, maxPrice) {
    // If no API key is configured, fall back to mock data
    if (!this.apiKey) {
      console.log('eBay: No API key configured, using mock data');
      return this.getMockResults(query, maxPrice, 'eBay');
    }

    try {
      return await this.searchWithAPI(query, maxPrice);
    } catch (error) {
      console.error('eBay API error, falling back to mock data:', error.message);
      return this.getMockResults(query, maxPrice, 'eBay');
    }
  }

  async searchWithAPI(query, maxPrice) {
    // Build eBay Finding API request
    const params = {
      'OPERATION-NAME': 'findItemsByKeywords',
      'SERVICE-VERSION': '1.0.0',
      'SECURITY-APPNAME': this.apiKey,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': true,
      'keywords': query,
      'paginationInput.entriesPerPage': '20',
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

    // Make API request
    const response = await axios.get(url);
    
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
          id: `eBay-${itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          title: title,
          price: price,
          currency: currency,
          platform: 'eBay',
          url: url,
          condition: condition,
          location: location,
          timestamp: new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('Error parsing eBay API response:', error);
      return [];
    }
  }

  getMockResults(query, maxPrice, platform) {
    // Generate mock results for demonstration
    const mockItems = [
      { title: `${query} - Good Condition`, price: 150 },
      { title: `${query} Pro Max`, price: 250 },
      { title: `Used ${query}`, price: 100 },
      { title: `${query} with accessories`, price: 180 },
    ];

    const timestamp = Date.now();
    return mockItems
      .filter(item => !maxPrice || item.price <= maxPrice)
      .map((item, idx) => ({
        id: `${platform}-${timestamp}-${idx}-${Math.random().toString(36).slice(2, 11)}`,
        title: item.title,
        price: item.price,
        platform: platform,
        url: `https://${platform.toLowerCase()}.com/item/${idx}`,
      }));
  }
}

/**
 * Kleinanzeigen platform searcher
 */
class KleinanzeigenSearcher {
  constructor() {
    this.baseUrl = 'https://www.kleinanzeigen.de/s-';
  }

  async search(query, maxPrice) {
    // Mock implementation - in production, scrape or use API if available
    // For now, return mock data for demonstration
    return this.getMockResults(query, maxPrice, 'Kleinanzeigen');
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
        url: `https://www.kleinanzeigen.de/item/${idx}`,
      }));
  }
}
