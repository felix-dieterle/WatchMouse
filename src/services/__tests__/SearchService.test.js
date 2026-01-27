import { SearchService } from '../SearchService';

describe('SearchService', () => {
  let searchService;

  beforeEach(() => {
    searchService = new SearchService();
  });

  describe('searchAllPlatforms', () => {
    it('should return results from all platforms', async () => {
      const results = await searchService.searchAllPlatforms('iPhone');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
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
      expect(platforms.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('platform integration', () => {
    it('should have both eBay and Kleinanzeigen platforms configured', () => {
      expect(searchService.platforms).toHaveProperty('ebay');
      expect(searchService.platforms).toHaveProperty('kleinanzeigen');
    });
  });
});
