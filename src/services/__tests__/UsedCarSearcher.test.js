import axios from 'axios';
import { API_CONFIG, PLATFORMS, PERFORMANCE_CONFIG } from '../../constants';

// Mock axios
jest.mock('axios');

// Mock rate limiter
jest.mock('../../utils/rateLimiter', () => ({
  GoogleRateLimiter: jest.fn().mockImplementation(() => ({
    checkLimit: jest.fn().mockResolvedValue({ canProceed: true, warning: null }),
    incrementCount: jest.fn().mockResolvedValue(undefined),
  })),
  EbayRateLimiter: jest.fn().mockImplementation(() => ({
    checkLimit: jest.fn().mockResolvedValue({ canProceed: true, warning: null }),
    incrementCount: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock performance cache
jest.mock('../../utils/performance', () => ({
  Cache: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}));

// Mock searchOptimizer
jest.mock('../../utils/searchOptimizer', () => ({
  QueryOptimizer: {
    normalizeQuery: jest.fn(q => q),
  },
  AIModeOptimizer: {
    getOptimalResultsPerPage: jest.fn(() => 10),
    getOptimalSortOrder: jest.fn(() => 'BestMatch'),
  },
  ResultDeduplicator: {
    deduplicateByTitle: jest.fn(results => results),
    filterOutExisting: jest.fn(results => results),
  },
}));

// Import SearchService which contains UsedCarSearcher class
const { SearchService } = require('../SearchService');

describe('UsedCarSearcher', () => {
  let searchService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a SearchService instance with used cars enabled
    searchService = new SearchService({
      usedCarsEnabled: true,
      googleApiKey: 'test-google-key',
      googleCx: 'test-cx',
    });
  });

  describe('initialization', () => {
    it('should initialize with Google API credentials', () => {
      expect(searchService.platforms.usedCars).toBeDefined();
      expect(searchService.platforms.usedCars.googleApiKey).toBe('test-google-key');
      expect(searchService.platforms.usedCars.googleCx).toBe('test-cx');
    });

    it('should handle missing Google API credentials', () => {
      const serviceWithoutCreds = new SearchService({
        usedCarsEnabled: true,
      });
      expect(serviceWithoutCreds.platforms.usedCars.googleApiKey).toBe('');
      expect(serviceWithoutCreds.platforms.usedCars.googleCx).toBe('');
    });
  });

  describe('search', () => {
    it('should return empty array when Google credentials are missing', async () => {
      const serviceWithoutCreds = new SearchService({
        usedCarsEnabled: true,
      });
      
      const results = await serviceWithoutCreds.platforms.usedCars.search('BMW', null);
      expect(results).toEqual([]);
    });

    it('should search both mobile.de and AutoScout24', async () => {
      // Mock Google API responses for both platforms
      const mobileMockResponse = {
        data: {
          items: [
            {
              title: 'BMW 320d 2018',
              link: 'https://www.mobile.de/test1',
              snippet: 'BMW 320d, Bj. 2018, 50.000 km, EUR 18.990',
            },
          ],
        },
      };

      const autoScoutMockResponse = {
        data: {
          items: [
            {
              title: 'BMW 320d Automatik',
              link: 'https://www.autoscout24.de/test1',
              snippet: 'BMW 320d Automatik, 2019, 35000 km, 19.999 €',
            },
          ],
        },
      };

      axios.get
        .mockResolvedValueOnce(mobileMockResponse)
        .mockResolvedValueOnce(autoScoutMockResponse);

      const results = await searchService.platforms.usedCars.search('BMW 320d', null);

      expect(results).toHaveLength(2);
      expect(results[0].platform).toBe(PLATFORMS.MOBILE_DE);
      expect(results[1].platform).toBe(PLATFORMS.AUTOSCOUT24);
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    it('should handle errors from individual platforms gracefully', async () => {
      // mobile.de succeeds, AutoScout24 fails
      const mobileMockResponse = {
        data: {
          items: [
            {
              title: 'BMW 320d',
              link: 'https://www.mobile.de/test1',
              snippet: 'BMW 320d, EUR 18.990',
            },
          ],
        },
      };

      axios.get
        .mockResolvedValueOnce(mobileMockResponse)
        .mockRejectedValueOnce(new Error('Network error'));

      const results = await searchService.platforms.usedCars.search('BMW', null);

      // Should still return mobile.de results
      expect(results).toHaveLength(1);
      expect(results[0].platform).toBe(PLATFORMS.MOBILE_DE);
    });

    it('should apply max price filter when specified', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              title: 'BMW 320d cheap',
              link: 'https://www.mobile.de/test1',
              snippet: 'BMW 320d, EUR 15.000',
            },
            {
              title: 'BMW 320d expensive',
              link: 'https://www.mobile.de/test2',
              snippet: 'BMW 320d, EUR 25.000',
            },
            {
              title: 'BMW 320d no price',
              link: 'https://www.mobile.de/test3',
              snippet: 'BMW 320d, Contact for price',
            },
          ],
        },
      };

      axios.get
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce({ data: { items: [] } });

      const results = await searchService.platforms.usedCars.search('BMW', 20000);

      // Should include items <= 20000 and items with no price
      expect(results.length).toBeGreaterThan(0);
      const itemsWithPrice = results.filter(r => r.price > 0);
      itemsWithPrice.forEach(item => {
        expect(item.price).toBeLessThanOrEqual(20000);
      });
    });
  });

  describe('parseGoogleResponse', () => {
    it('should parse car details from snippet', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              title: 'BMW 320d Touring',
              link: 'https://www.mobile.de/test1',
              snippet: 'BMW 320d Touring, Bj. 2018, 50.000 km, EUR 18.990',
            },
          ],
        },
      };

      axios.get.mockResolvedValueOnce(mockResponse).mockResolvedValueOnce({ data: { items: [] } });

      const results = await searchService.platforms.usedCars.search('BMW', null);

      expect(results[0]).toMatchObject({
        title: 'BMW 320d Touring',
        price: 18990,
        currency: 'EUR',
        platform: PLATFORMS.MOBILE_DE,
        year: '2018',
        mileage: '50000',
      });
    });

    it('should handle German price format (dots as thousand separators)', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              title: 'Mercedes E-Klasse',
              link: 'https://www.mobile.de/test1',
              snippet: 'Mercedes E-Klasse, 25.999 EUR',
            },
          ],
        },
      };

      axios.get.mockResolvedValueOnce(mockResponse).mockResolvedValueOnce({ data: { items: [] } });

      const results = await searchService.platforms.usedCars.search('Mercedes', null);

      expect(results[0].price).toBe(25999);
    });

    it('should handle price with trailing dash', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              title: 'Audi A4',
              link: 'https://www.autoscout24.de/test1',
              snippet: 'Audi A4, € 19.900,-',
            },
          ],
        },
      };

      axios.get.mockResolvedValueOnce({ data: { items: [] } }).mockResolvedValueOnce(mockResponse);

      const results = await searchService.platforms.usedCars.search('Audi', null);

      expect(results[0].price).toBe(19900);
    });

    it('should extract year from various formats', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              title: 'VW Golf',
              link: 'https://www.mobile.de/test1',
              snippet: 'VW Golf, Bj. 2019, EUR 15.000',
            },
            {
              title: 'VW Passat',
              link: 'https://www.mobile.de/test2',
              snippet: 'VW Passat, EZ 2020, EUR 20.000',
            },
          ],
        },
      };

      axios.get.mockResolvedValueOnce(mockResponse).mockResolvedValueOnce({ data: { items: [] } });

      const results = await searchService.platforms.usedCars.search('VW', null);

      expect(results[0].year).toBe('2019');
      expect(results[1].year).toBe('2020');
    });

    it('should return empty array when no items found', async () => {
      axios.get
        .mockResolvedValueOnce({ data: { items: [] } })
        .mockResolvedValueOnce({ data: { items: [] } });

      const results = await searchService.platforms.usedCars.search('NonExistent', null);

      expect(results).toEqual([]);
    });
  });

  describe('integration with SearchService', () => {
    it('should be called when usedCarsEnabled is true', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              title: 'BMW 320d',
              link: 'https://www.mobile.de/test1',
              snippet: 'BMW 320d, EUR 18.990',
            },
          ],
        },
      };

      axios.get
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce({ data: { items: [] } });

      const results = await searchService.searchAllPlatforms('BMW', null);

      // Should include used car results
      expect(results.some(r => r.platform === PLATFORMS.MOBILE_DE || r.platform === PLATFORMS.AUTOSCOUT24)).toBe(true);
    });

    it('should not be called when usedCarsEnabled is false', async () => {
      const serviceWithoutUsedCars = new SearchService({
        usedCarsEnabled: false,
        googleApiKey: 'test-key',
        googleCx: 'test-cx',
      });

      const results = await serviceWithoutUsedCars.searchAllPlatforms('BMW', null);

      // Should not include used car results
      expect(results.some(r => r.platform === PLATFORMS.MOBILE_DE || r.platform === PLATFORMS.AUTOSCOUT24)).toBe(false);
    });
  });
});
