import { EbayRateLimiter } from '../rateLimiter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, API_CONFIG } from '../../constants';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('EbayRateLimiter', () => {
  let rateLimiter;

  beforeEach(() => {
    rateLimiter = new EbayRateLimiter();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct limits', () => {
      expect(rateLimiter.dailyLimit).toBe(API_CONFIG.EBAY.DAILY_RATE_LIMIT);
      expect(rateLimiter.warningThreshold).toBe(API_CONFIG.EBAY.WARNING_THRESHOLD);
      expect(rateLimiter.criticalThreshold).toBe(API_CONFIG.EBAY.CRITICAL_THRESHOLD);
    });
  });

  describe('load', () => {
    it('should create new data if no stored data exists', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      await rateLimiter.load();

      expect(rateLimiter.data).toBeDefined();
      expect(rateLimiter.data.count).toBe(0);
      expect(rateLimiter.data.date).toBe(new Date().toDateString());
    });

    it('should load existing data from storage', async () => {
      const mockData = {
        date: new Date().toDateString(),
        count: 100,
        lastReset: new Date().toISOString(),
      };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockData));

      await rateLimiter.load();

      expect(rateLimiter.data.count).toBe(100);
      expect(rateLimiter.data.date).toBe(new Date().toDateString());
    });

    it('should reset data if date has changed', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const mockData = {
        date: yesterday.toDateString(),
        count: 4500,
        lastReset: yesterday.toISOString(),
      };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockData));

      await rateLimiter.load();

      // Should be reset to 0 for today
      expect(rateLimiter.data.count).toBe(0);
      expect(rateLimiter.data.date).toBe(new Date().toDateString());
    });

    it('should handle load errors gracefully', async () => {
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      await rateLimiter.load();

      expect(rateLimiter.data).toBeDefined();
      expect(rateLimiter.data.count).toBe(0);
    });
  });

  describe('checkLimit', () => {
    it('should return canProceed=true when under warning threshold', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        date: new Date().toDateString(),
        count: 1000, // 20% of 5000
        lastReset: new Date().toISOString(),
      }));

      const result = await rateLimiter.checkLimit();

      expect(result.canProceed).toBe(true);
      expect(result.warning).toBeNull();
      expect(result.level).toBe('normal');
      expect(result.remaining).toBe(4000);
    });

    it('should return warning at 80% usage', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        date: new Date().toDateString(),
        count: 4000, // 80% of 5000
        lastReset: new Date().toISOString(),
      }));

      const result = await rateLimiter.checkLimit();

      expect(result.canProceed).toBe(true);
      expect(result.warning).toContain('80%');
      expect(result.level).toBe('warning');
      expect(result.remaining).toBe(1000);
    });

    it('should return critical warning at 95% usage', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        date: new Date().toDateString(),
        count: 4750, // 95% of 5000
        lastReset: new Date().toISOString(),
      }));

      const result = await rateLimiter.checkLimit();

      expect(result.canProceed).toBe(true);
      expect(result.warning).toContain('almost reached');
      expect(result.level).toBe('critical');
      expect(result.remaining).toBe(250);
    });

    it('should return canProceed=false when limit is reached', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        date: new Date().toDateString(),
        count: 5000, // 100% of 5000
        lastReset: new Date().toISOString(),
      }));

      const result = await rateLimiter.checkLimit();

      expect(result.canProceed).toBe(false);
      expect(result.warning).toContain('limit reached');
      expect(result.level).toBe('error');
      expect(result.remaining).toBe(0);
    });

    it('should return canProceed=false when over limit', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        date: new Date().toDateString(),
        count: 5500, // Over limit
        lastReset: new Date().toISOString(),
      }));

      const result = await rateLimiter.checkLimit();

      expect(result.canProceed).toBe(false);
      expect(result.level).toBe('error');
    });
  });

  describe('incrementCount', () => {
    it('should increment the counter', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        date: new Date().toDateString(),
        count: 100,
        lastReset: new Date().toISOString(),
      }));

      await rateLimiter.load();
      await rateLimiter.incrementCount();

      expect(rateLimiter.data.count).toBe(101);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.EBAY_RATE_LIMIT,
        expect.stringContaining('"count":101')
      );
    });

    it('should load data before incrementing if not loaded', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      await rateLimiter.incrementCount();

      expect(rateLimiter.data.count).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return current usage statistics', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        date: new Date().toDateString(),
        count: 2500,
        lastReset: new Date().toISOString(),
      }));

      const stats = await rateLimiter.getStats();

      expect(stats.count).toBe(2500);
      expect(stats.limit).toBe(5000);
      expect(stats.remaining).toBe(2500);
      expect(stats.usagePercent).toBe(0.5);
      expect(stats.date).toBeDefined();
    });
  });

  describe('reset', () => {
    it('should reset the counter', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        date: new Date().toDateString(),
        count: 4500,
        lastReset: new Date().toISOString(),
      }));

      await rateLimiter.load();
      await rateLimiter.reset();

      expect(rateLimiter.data.count).toBe(0);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.EBAY_RATE_LIMIT,
        expect.stringContaining('"count":0')
      );
    });
  });
});
