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
  }

  async search(query, maxPrice) {
    // Mock implementation - in production, use real eBay API
    // For now, return mock data for demonstration
    return this.getMockResults(query, maxPrice, 'eBay');
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
