import { AIService } from '../AIService';

describe('AIService', () => {
  let aiService;

  beforeEach(() => {
    aiService = new AIService();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      expect(aiService).toBeDefined();
      expect(aiService.baseUrl).toBe('https://openrouter.ai/api/v1');
      expect(aiService.model).toBe('openai/gpt-3.5-turbo');
    });
  });

  describe('fallbackFilter', () => {
    it('should filter results based on keyword matching', () => {
      const searchQuery = 'iPhone 12';
      const results = [
        { title: 'iPhone 12 Pro Max', price: 500 },
        { title: 'Samsung Galaxy', price: 400 },
        { title: 'iPhone 12 good condition', price: 350 },
        { title: 'Laptop computer', price: 600 },
      ];

      const filtered = aiService.fallbackFilter(searchQuery, results);

      expect(filtered).toBeDefined();
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.length).toBeLessThanOrEqual(results.length);
    });

    it('should match at least 50% of keywords', () => {
      const searchQuery = 'red nike shoes';
      const results = [
        { title: 'Red Nike running shoes', price: 80 },
        { title: 'Blue Adidas shoes', price: 70 },
        { title: 'Nike red sneakers', price: 75 },
      ];

      const filtered = aiService.fallbackFilter(searchQuery, results);

      expect(filtered.length).toBeGreaterThanOrEqual(1);
      filtered.forEach(result => {
        const title = result.title.toLowerCase();
        const keywords = searchQuery.toLowerCase().split(' ');
        const matchCount = keywords.filter(k => title.includes(k)).length;
        expect(matchCount).toBeGreaterThanOrEqual(Math.ceil(keywords.length * 0.5));
      });
    });

    it('should be case insensitive', () => {
      const searchQuery = 'IPHONE';
      const results = [
        { title: 'iphone 13', price: 600 },
        { title: 'Samsung phone', price: 500 },
      ];

      const filtered = aiService.fallbackFilter(searchQuery, results);

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered[0].title).toContain('iphone');
    });

    it('should return empty array when no matches', () => {
      const searchQuery = 'specific product xyz';
      const results = [
        { title: 'completely different item', price: 100 },
      ];

      const filtered = aiService.fallbackFilter(searchQuery, results);

      expect(filtered).toEqual([]);
    });
  });

  describe('buildFilterPrompt', () => {
    it('should build a valid prompt with results', () => {
      const searchQuery = 'laptop';
      const results = [
        { title: 'Dell Laptop', price: 500 },
        { title: 'HP Desktop', price: 600 },
      ];

      const prompt = aiService.buildFilterPrompt(searchQuery, results);

      expect(prompt).toContain(searchQuery);
      expect(prompt).toContain('Dell Laptop');
      expect(prompt).toContain('HP Desktop');
      expect(prompt).toContain('€500');
      expect(prompt).toContain('€600');
    });
  });

  describe('parseAIResponse', () => {
    it('should parse comma-separated indices', () => {
      const results = [
        { title: 'Item 1', price: 100 },
        { title: 'Item 2', price: 200 },
        { title: 'Item 3', price: 300 },
      ];

      const aiResponse = '0,2';
      const filtered = aiService.parseAIResponse(aiResponse, results);

      expect(filtered).toHaveLength(2);
      expect(filtered[0]).toEqual(results[0]);
      expect(filtered[1]).toEqual(results[2]);
    });

    it('should handle single index', () => {
      const results = [
        { title: 'Item 1', price: 100 },
        { title: 'Item 2', price: 200 },
      ];

      const aiResponse = '1';
      const filtered = aiService.parseAIResponse(aiResponse, results);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toEqual(results[1]);
    });

    it('should ignore invalid indices', () => {
      const results = [
        { title: 'Item 1', price: 100 },
        { title: 'Item 2', price: 200 },
      ];

      const aiResponse = '0,5,10';
      const filtered = aiService.parseAIResponse(aiResponse, results);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toEqual(results[0]);
    });

    it('should handle malformed response gracefully', () => {
      const results = [
        { title: 'Item 1', price: 100 },
      ];

      const aiResponse = 'invalid,text,here';
      const filtered = aiService.parseAIResponse(aiResponse, results);

      expect(filtered).toEqual([]);
    });
  });

  describe('filterMatches', () => {
    it('should use fallback filter when no API key', async () => {
      const searchQuery = 'iPhone';
      const results = [
        { title: 'iPhone 12', price: 500 },
        { title: 'Android phone', price: 400 },
      ];

      const filtered = await aiService.filterMatches(searchQuery, results);

      expect(filtered).toBeDefined();
      expect(Array.isArray(filtered)).toBe(true);
    });
  });
});
