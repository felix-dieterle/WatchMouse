import { SearchService } from '../SearchService';

// Mock axios for eBay API tests
jest.mock('axios');
const axios = require('axios');

describe('SearchService', () => {
  let searchService;

  beforeEach(() => {
    searchService = new SearchService();
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default platform settings (all enabled)', () => {
      expect(searchService.platformSettings).toEqual({
        ebayEnabled: true,
        kleinanzeigenEnabled: true,
      });
    });

    it('should accept custom platform settings', () => {
      const customService = new SearchService({
        ebayEnabled: false,
        kleinanzeigenEnabled: true,
      });
      expect(customService.platformSettings).toEqual({
        ebayEnabled: false,
        kleinanzeigenEnabled: true,
      });
    });
  });

  describe('searchAllPlatforms', () => {
    it('should return results from all enabled platforms', async () => {
      const results = await searchService.searchAllPlatforms('iPhone');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should only search eBay when Kleinanzeigen is disabled', async () => {
      const ebayOnlyService = new SearchService({
        ebayEnabled: true,
        kleinanzeigenEnabled: false,
      });
      const results = await ebayOnlyService.searchAllPlatforms('test');
      
      const platforms = [...new Set(results.map(r => r.platform))];
      expect(platforms).toContain('eBay');
      expect(platforms).not.toContain('Kleinanzeigen');
    });

    it('should only search Kleinanzeigen when eBay is disabled', async () => {
      const kleinanzeigenOnlyService = new SearchService({
        ebayEnabled: false,
        kleinanzeigenEnabled: true,
      });
      const results = await kleinanzeigenOnlyService.searchAllPlatforms('test');
      
      const platforms = [...new Set(results.map(r => r.platform))];
      expect(platforms).toContain('Kleinanzeigen');
      expect(platforms).not.toContain('eBay');
    });

    it('should return empty array when all platforms are disabled', async () => {
      const noPlatformsService = new SearchService({
        ebayEnabled: false,
        kleinanzeigenEnabled: false,
      });
      const results = await noPlatformsService.searchAllPlatforms('test');
      
      expect(results).toEqual([]);
    });

    it('should filter by max price when provided', async () => {
      const maxPrice = 150;
      const results = await searchService.searchAllPlatforms('iPhone', maxPrice);
      
      expect(results).toBeDefined();
      results.forEach(result => {
        expect(result.price).toBeLessThanOrEqual(maxPrice);
      });
    });

    it('should include platform information in results', async () => {
      const results = await searchService.searchAllPlatforms('laptop');
      
      results.forEach(result => {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('price');
        expect(result).toHaveProperty('platform');
        expect(result).toHaveProperty('url');
        expect(['eBay', 'Kleinanzeigen']).toContain(result.platform);
      });
    });

    it('should handle empty query gracefully', async () => {
      const results = await searchService.searchAllPlatforms('');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should return results from both platforms', async () => {
      const results = await searchService.searchAllPlatforms('test');
      
      const platforms = [...new Set(results.map(r => r.platform))];
      expect(platforms.length).toBe(2);
      expect(platforms).toContain('eBay');
      expect(platforms).toContain('Kleinanzeigen');
    });
  });

  describe('platform integration', () => {
    it('should have both eBay and Kleinanzeigen platforms configured', () => {
      expect(searchService.platforms).toHaveProperty('ebay');
      expect(searchService.platforms).toHaveProperty('kleinanzeigen');
    });
  });

  describe('eBay API integration', () => {
    beforeEach(() => {
      // Reset environment variable
      delete process.env.EBAY_API_KEY;
    });

    it('should use mock data when no API key is configured', async () => {
      const results = await searchService.platforms.ebay.search('iPhone', 200);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('platform', 'eBay');
    });

    it('should call eBay API when API key is configured', async () => {
      // Set API key
      process.env.EBAY_API_KEY = 'test-api-key';
      
      // Mock successful API response
      const mockResponse = {
        data: {
          findItemsByKeywordsResponse: [{
            searchResult: [{
              '@count': '2',
              item: [
                {
                  itemId: ['123456789'],
                  title: ['iPhone 13 Pro'],
                  sellingStatus: [{
                    currentPrice: [{
                      __value__: '699.99',
                      '@currencyId': 'EUR'
                    }]
                  }],
                  viewItemURL: ['https://www.ebay.de/itm/123456789'],
                  condition: [{
                    conditionDisplayName: ['New']
                  }],
                  location: ['Berlin, Germany']
                },
                {
                  itemId: ['987654321'],
                  title: ['iPhone 12 Used'],
                  sellingStatus: [{
                    currentPrice: [{
                      __value__: '499.99',
                      '@currencyId': 'EUR'
                    }]
                  }],
                  viewItemURL: ['https://www.ebay.de/itm/987654321'],
                  condition: [{
                    conditionDisplayName: ['Used']
                  }],
                  location: ['Munich, Germany']
                }
              ]
            }]
          }]
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      // Create new searcher with API key
      const ebaySearcher = searchService.platforms.ebay;
      ebaySearcher.apiKey = 'test-api-key';
      
      const results = await ebaySearcher.search('iPhone', 800);
      
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(results).toBeDefined();
      expect(results.length).toBe(2);
      expect(results[0]).toMatchObject({
        title: 'iPhone 13 Pro',
        price: 699.99,
        currency: 'EUR',
        platform: 'eBay',
        condition: 'New',
        location: 'Berlin, Germany'
      });
    });

    it('should fall back to mock data when API call fails', async () => {
      process.env.EBAY_API_KEY = 'test-api-key';
      
      // Mock API error
      axios.get.mockRejectedValue(new Error('Network error'));
      
      const ebaySearcher = searchService.platforms.ebay;
      ebaySearcher.apiKey = 'test-api-key';
      
      const results = await ebaySearcher.search('iPhone', 200);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('platform', 'eBay');
    });

    it('should handle empty API response gracefully', async () => {
      process.env.EBAY_API_KEY = 'test-api-key';
      
      // Mock empty API response
      const mockResponse = {
        data: {
          findItemsByKeywordsResponse: [{
            searchResult: [{
              '@count': '0'
            }]
          }]
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      const ebaySearcher = searchService.platforms.ebay;
      ebaySearcher.apiKey = 'test-api-key';
      
      const results = await ebaySearcher.search('nonexistent-product-xyz', 100);
      
      expect(results).toEqual([]);
    });

    it('should include price filter in API request when maxPrice is specified', async () => {
      process.env.EBAY_API_KEY = 'test-api-key';
      
      const mockResponse = {
        data: {
          findItemsByKeywordsResponse: [{
            searchResult: [{
              '@count': '0'
            }]
          }]
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      const ebaySearcher = searchService.platforms.ebay;
      ebaySearcher.apiKey = 'test-api-key';
      
      await ebaySearcher.search('iPhone', 500);
      
      expect(axios.get).toHaveBeenCalledTimes(1);
      const callUrl = axios.get.mock.calls[0][0];
      expect(callUrl).toContain('itemFilter');
      expect(callUrl).toContain('MaxPrice');
      expect(callUrl).toContain('500');
    });
  });
});
