import { SearchService } from '../SearchService';

describe('SearchService', () => {
  let searchService;

  beforeEach(() => {
    searchService = new SearchService();
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
});
