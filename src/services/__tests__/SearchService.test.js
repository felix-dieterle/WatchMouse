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
        useGoogleForEbay: false,
        usedCarsEnabled: false,
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
        useGoogleForEbay: false,
        usedCarsEnabled: false,
      });
    });

    it('should accept eBay API key via settings', () => {
      const apiKey = 'test-ebay-api-key';
      const customService = new SearchService({
        ebayApiKey: apiKey,
      });
      expect(customService.platforms.ebay.apiKey).toBe(apiKey);
    });

    it('should use environment variable when no API key provided in settings', () => {
      process.env.EBAY_API_KEY = 'env-api-key';
      const customService = new SearchService({});
      expect(customService.platforms.ebay.apiKey).toBe('env-api-key');
      delete process.env.EBAY_API_KEY;
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
      // Mock successful API response for eBay
      const mockResponse = {
        data: {
          findItemsByKeywordsResponse: [{
            searchResult: [{
              '@count': '1',
              item: [{
                itemId: ['123456789'],
                title: ['Test Item'],
                sellingStatus: [{
                  currentPrice: [{
                    __value__: '99.99',
                    '@currencyId': 'EUR'
                  }]
                }],
                viewItemURL: ['https://www.ebay.de/itm/123456789']
              }]
            }]
          }]
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      process.env.EBAY_API_KEY = 'test-api-key';
      
      const ebayOnlyService = new SearchService({
        ebayEnabled: true,
        kleinanzeigenEnabled: false,
      });
      const results = await ebayOnlyService.searchAllPlatforms('test');
      
      const platforms = [...new Set(results.map(r => r.platform))];
      expect(platforms).toContain('eBay');
      expect(platforms).not.toContain('Kleinanzeigen');
      
      // Clean up
      delete process.env.EBAY_API_KEY;
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

    it('should return results from both platforms when eBay API key is configured', async () => {
      // Mock successful API response for eBay
      const mockResponse = {
        data: {
          findItemsByKeywordsResponse: [{
            searchResult: [{
              '@count': '1',
              item: [{
                itemId: ['123456789'],
                title: ['Test Item'],
                sellingStatus: [{
                  currentPrice: [{
                    __value__: '99.99',
                    '@currencyId': 'EUR'
                  }]
                }],
                viewItemURL: ['https://www.ebay.de/itm/123456789']
              }]
            }]
          }]
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      process.env.EBAY_API_KEY = 'test-api-key';
      
      const testService = new SearchService();
      const results = await testService.searchAllPlatforms('test');
      
      const platforms = [...new Set(results.map(r => r.platform))];
      expect(platforms.length).toBe(2);
      expect(platforms).toContain('eBay');
      expect(platforms).toContain('Kleinanzeigen');
      
      // Clean up
      delete process.env.EBAY_API_KEY;
    });

    it('should only return Kleinanzeigen results when eBay API key is not configured', async () => {
      // Use a different query to avoid cache collision
      const results = await searchService.searchAllPlatforms('laptop');
      
      const platforms = [...new Set(results.map(r => r.platform))];
      // Without API key, only Kleinanzeigen returns results
      expect(platforms.length).toBe(1);
      expect(platforms).toContain('Kleinanzeigen');
      expect(platforms).not.toContain('eBay');
    });
  });

  describe('platform integration', () => {
    it('should have both eBay and Kleinanzeigen platforms configured', () => {
      expect(searchService.platforms).toHaveProperty('ebay');
      expect(searchService.platforms).toHaveProperty('kleinanzeigen');
    });
  });

  describe('eBay API integration', () => {
    afterEach(() => {
      // Clean up environment variable after each test
      delete process.env.EBAY_API_KEY;
    });

    it('should return empty array when no API key is configured', async () => {
      const results = await searchService.platforms.ebay.search('iPhone', 200);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should call eBay API when API key is configured', async () => {
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
      
      // Create new service with API key to test environment variable flow
      process.env.EBAY_API_KEY = 'test-api-key';
      const testSearcher = new SearchService().platforms.ebay;
      
      const results = await testSearcher.search('iPhone', 800);
      
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

    it('should return empty array when API call fails', async () => {
      // Mock API error
      axios.get.mockRejectedValue(new Error('Network error'));
      
      process.env.EBAY_API_KEY = 'test-api-key';
      const testSearcher = new SearchService().platforms.ebay;
      
      const results = await testSearcher.search('iPhone', 200);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should handle empty API response gracefully', async () => {
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
      
      process.env.EBAY_API_KEY = 'test-api-key';
      const testSearcher = new SearchService().platforms.ebay;
      
      const results = await testSearcher.search('nonexistent-product-xyz', 100);
      
      expect(results).toEqual([]);
    });

    it('should include price filter in API request when maxPrice is specified', async () => {
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
      
      process.env.EBAY_API_KEY = 'test-api-key';
      const testSearcher = new SearchService().platforms.ebay;
      
      await testSearcher.search('iPhone', 500);
      
      expect(axios.get).toHaveBeenCalledTimes(1);
      const callUrl = axios.get.mock.calls[0][0];
      expect(callUrl).toContain('itemFilter');
      expect(callUrl).toContain('MaxPrice');
      expect(callUrl).toContain('500');
    });

    it('should skip API call for empty query', async () => {
      process.env.EBAY_API_KEY = 'test-api-key';
      const testSearcher = new SearchService().platforms.ebay;
      
      const results = await testSearcher.search('', 100);
      
      expect(axios.get).not.toHaveBeenCalled();
      expect(results).toEqual([]);
    });
  });

  describe('API key management', () => {
    it('should allow updating eBay API key via setEbayApiKey method', () => {
      const newApiKey = 'updated-api-key';
      searchService.setEbayApiKey(newApiKey);
      expect(searchService.platforms.ebay.apiKey).toBe(newApiKey);
    });

    it('should allow setting API key to empty string', () => {
      searchService.setEbayApiKey('test-key');
      searchService.setEbayApiKey('');
      expect(searchService.platforms.ebay.apiKey).toBe('');
    });
  });

  describe('Kleinanzeigen integration', () => {
    it('should generate valid Kleinanzeigen URLs in mock data', async () => {
      const results = await searchService.platforms.kleinanzeigen.search('Sofa', 200);
      
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.url).toMatch(/^https:\/\/www\.kleinanzeigen\.de\/s-anzeige\/mock\d+$/);
        expect(result.platform).toBe('Kleinanzeigen');
      });
    });
  });

  describe('Google Custom Search integration', () => {
    afterEach(() => {
      // Clean up environment variables after each test
      delete process.env.GOOGLE_API_KEY;
      delete process.env.GOOGLE_CX;
    });

    it('should use Google Custom Search when enabled and eBay API key is missing', async () => {
      // Mock Google Custom Search API response
      const mockGoogleResponse = {
        data: {
          items: [
            {
              title: 'iPhone 13 Pro - eBay',
              link: 'https://www.ebay.de/itm/123456789',
              snippet: 'Buy iPhone 13 Pro for EUR 699.99. Free shipping.',
            },
            {
              title: 'iPhone 12 Used - eBay',
              link: 'https://www.ebay.de/itm/987654321',
              snippet: 'Great condition iPhone 12 for 449.99 €',
            },
          ],
        },
      };

      axios.get.mockResolvedValue(mockGoogleResponse);

      const googleService = new SearchService({
        ebayEnabled: true,
        googleApiKey: 'test-google-api-key',
        googleCx: 'test-cx-id',
        useGoogleForEbay: true,
      });

      const results = await googleService.platforms.ebay.search('iPhone', null);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
      expect(results[0].platform).toBe('eBay (Google)');
      expect(results[0].price).toBe(699.99);
      expect(results[1].price).toBe(449.99);
    });

    it('should not use Google when eBay API key is available', async () => {
      // Mock eBay API response
      const mockEbayResponse = {
        data: {
          findItemsByKeywordsResponse: [{
            searchResult: [{
              '@count': '1',
              item: [{
                itemId: ['123456789'],
                title: ['Test Item'],
                sellingStatus: [{
                  currentPrice: [{
                    __value__: '99.99',
                    '@currencyId': 'EUR'
                  }]
                }],
                viewItemURL: ['https://www.ebay.de/itm/123456789']
              }]
            }]
          }]
        }
      };

      axios.get.mockResolvedValue(mockEbayResponse);

      const googleService = new SearchService({
        ebayEnabled: true,
        ebayApiKey: 'test-ebay-api-key',
        googleApiKey: 'test-google-api-key',
        googleCx: 'test-cx-id',
        useGoogleForEbay: true,
      });

      // Clear any cached results from previous tests
      const results = await googleService.platforms.ebay.searchWithAPI('iPhone-unique-test', null);

      expect(results).toBeDefined();
      // Should use eBay API, not Google
      expect(results[0].platform).toBe('eBay');
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('svcs.ebay.com'),
        expect.any(Object)
      );
    });

    it('should filter Google results by maxPrice', async () => {
      const mockGoogleResponse = {
        data: {
          items: [
            {
              title: 'Expensive Item',
              link: 'https://www.ebay.de/itm/111',
              snippet: 'Premium item for EUR 999.99',
            },
            {
              title: 'Affordable Item',
              link: 'https://www.ebay.de/itm/222',
              snippet: 'Budget friendly for 99.99 €',
            },
          ],
        },
      };

      axios.get.mockResolvedValue(mockGoogleResponse);

      const googleService = new SearchService({
        ebayEnabled: true,
        googleApiKey: 'test-google-api-key',
        googleCx: 'test-cx-id',
        useGoogleForEbay: true,
      });

      const results = await googleService.platforms.ebay.search('item', 500);

      expect(results).toBeDefined();
      // Should filter out item > 500 EUR
      const highPriceItem = results.find(r => r.price > 500);
      expect(highPriceItem).toBeUndefined();
    });

    it('should return empty array when Google API is not configured', async () => {
      const googleService = new SearchService({
        ebayEnabled: true,
        useGoogleForEbay: true,
        // No Google API key or CX configured
      });

      // Use unique query to avoid cache
      const results = await googleService.platforms.ebay.search('unique-test-query-123', null);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should return empty array when useGoogleForEbay is false', async () => {
      const googleService = new SearchService({
        ebayEnabled: true,
        googleApiKey: 'test-google-api-key',
        googleCx: 'test-cx-id',
        useGoogleForEbay: false, // Disabled
      });

      // Use unique query to avoid cache
      const results = await googleService.platforms.ebay.search('unique-test-query-456', null);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });
});
