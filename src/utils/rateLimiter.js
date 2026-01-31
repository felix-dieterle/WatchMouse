/**
 * Rate Limiter for eBay API
 * 
 * Tracks API usage and provides warnings when approaching limits
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, API_CONFIG } from '../constants';

/**
 * eBay API Rate Limiter
 * Tracks daily API calls and warns when approaching limits
 */
export class EbayRateLimiter {
  constructor() {
    this.dailyLimit = API_CONFIG.EBAY.DAILY_RATE_LIMIT;
    this.warningThreshold = API_CONFIG.EBAY.WARNING_THRESHOLD;
    this.criticalThreshold = API_CONFIG.EBAY.CRITICAL_THRESHOLD;
    this.data = null;
  }

  /**
   * Load rate limit data from storage
   * @returns {Promise<Object>} Rate limit tracking data
   */
  async load() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.EBAY_RATE_LIMIT);
      if (stored) {
        this.data = JSON.parse(stored);
        
        // Reset if it's a new day
        const today = new Date().toDateString();
        if (this.data.date !== today) {
          this.data = this._createNewData();
          await this.save();
        }
      } else {
        this.data = this._createNewData();
        await this.save();
      }
      return this.data;
    } catch (error) {
      console.error('Error loading rate limit data:', error);
      this.data = this._createNewData();
      return this.data;
    }
  }

  /**
   * Create new rate limit tracking data for today
   * @private
   */
  _createNewData() {
    return {
      date: new Date().toDateString(),
      count: 0,
      lastReset: new Date().toISOString(),
    };
  }

  /**
   * Save rate limit data to storage
   * @private
   */
  async save() {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.EBAY_RATE_LIMIT,
        JSON.stringify(this.data)
      );
    } catch (error) {
      console.error('Error saving rate limit data:', error);
    }
  }

  /**
   * Check if we can make an API call
   * @returns {Promise<Object>} Object with canProceed flag and warning message
   */
  async checkLimit() {
    if (!this.data) {
      await this.load();
    }

    const remaining = this.dailyLimit - this.data.count;
    const usagePercent = this.data.count / this.dailyLimit;

    // Already at or over limit
    if (this.data.count >= this.dailyLimit) {
      return {
        canProceed: false,
        warning: `eBay API daily limit reached (${this.dailyLimit} calls). Limit resets at midnight.`,
        level: 'error',
        remaining: 0,
        usagePercent: 1.0,
      };
    }

    // Critical warning (95%+)
    if (usagePercent >= this.criticalThreshold) {
      return {
        canProceed: true,
        warning: `eBay API limit almost reached! Only ${remaining} calls remaining today.`,
        level: 'critical',
        remaining,
        usagePercent,
      };
    }

    // Warning (80%+)
    if (usagePercent >= this.warningThreshold) {
      return {
        canProceed: true,
        warning: `eBay API usage at ${Math.round(usagePercent * 100)}%. ${remaining} calls remaining today.`,
        level: 'warning',
        remaining,
        usagePercent,
      };
    }

    // Normal usage
    return {
      canProceed: true,
      warning: null,
      level: 'normal',
      remaining,
      usagePercent,
    };
  }

  /**
   * Increment the API call counter
   * @returns {Promise<void>}
   */
  async incrementCount() {
    if (!this.data) {
      await this.load();
    }

    this.data.count += 1;
    await this.save();
  }

  /**
   * Get current usage statistics
   * @returns {Promise<Object>} Usage statistics
   */
  async getStats() {
    if (!this.data) {
      await this.load();
    }

    const remaining = this.dailyLimit - this.data.count;
    const usagePercent = this.data.count / this.dailyLimit;

    return {
      count: this.data.count,
      limit: this.dailyLimit,
      remaining,
      usagePercent,
      date: this.data.date,
      lastReset: this.data.lastReset,
    };
  }

  /**
   * Reset the counter (for testing or manual reset)
   * @returns {Promise<void>}
   */
  async reset() {
    this.data = this._createNewData();
    await this.save();
  }
}
