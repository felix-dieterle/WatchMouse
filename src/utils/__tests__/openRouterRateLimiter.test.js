import { OpenRouterRateLimiter } from '../openRouterRateLimiter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

describe('OpenRouterRateLimiter', () => {
  let rateLimiter;

  beforeEach(() => {
    jest.clearAllMocks();
    rateLimiter = new OpenRouterRateLimiter();
  });

  describe('initialization', () => {
    it('should initialize without hard limits', () => {
      expect(rateLimiter.data).toBeNull();
    });
  });

  describe('load', () => {
    it('should create new data when no stored data exists', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      await rateLimiter.load();

      expect(rateLimiter.data).toBeDefined();
      expect(rateLimiter.data.count).toBe(0);
      expect(rateLimiter.data.date).toBe(new Date().toDateString());
    });

    it('should load existing data from storage', async () => {
      const storedData = {
        date: new Date().toDateString(),
        count: 50,
        lastReset: new Date().toISOString(),
      };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedData));

      await rateLimiter.load();

      expect(rateLimiter.data.count).toBe(50);
      expect(rateLimiter.data.date).toBe(new Date().toDateString());
    });

    it('should reset data if stored data is from a different day', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const storedData = {
        date: yesterday.toDateString(),
        count: 100,
        lastReset: yesterday.toISOString(),
      };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedData));

      await rateLimiter.load();

      // Should be reset to 0 for new day
      expect(rateLimiter.data.count).toBe(0);
      expect(rateLimiter.data.date).toBe(new Date().toDateString());
    });

    it('should handle errors gracefully', async () => {
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      await rateLimiter.load();

      expect(rateLimiter.data).toBeDefined();
      expect(rateLimiter.data.count).toBe(0);
    });
  });

  describe('incrementCount', () => {
    it('should increment count and save to storage', async () => {
      const storedData = {
        date: new Date().toDateString(),
        count: 50,
        lastReset: new Date().toISOString(),
      };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedData));

      await rateLimiter.load();
      await rateLimiter.incrementCount();

      expect(rateLimiter.data.count).toBe(51);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.OPENROUTER_RATE_LIMIT,
        expect.any(String)
      );
    });

    it('should auto-load if data is not loaded', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      await rateLimiter.incrementCount();

      expect(rateLimiter.data.count).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return usage statistics', async () => {
      const storedData = {
        date: new Date().toDateString(),
        count: 100,
        lastReset: new Date().toISOString(),
      };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedData));

      const stats = await rateLimiter.getStats();

      expect(stats.count).toBe(100);
      expect(stats.limit).toBeNull();
      expect(stats.date).toBe(new Date().toDateString());
    });
  });

  describe('reset', () => {
    it('should reset counter to zero', async () => {
      const storedData = {
        date: new Date().toDateString(),
        count: 100,
        lastReset: new Date().toISOString(),
      };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedData));

      await rateLimiter.load();
      await rateLimiter.reset();

      expect(rateLimiter.data.count).toBe(0);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.OPENROUTER_RATE_LIMIT,
        expect.any(String)
      );
    });
  });
});
