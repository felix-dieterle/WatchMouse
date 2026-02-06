/**
 * Rate Limiter for OpenRouter API
 * 
 * Tracks API usage for awareness (OpenRouter has pay-per-use model)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

/**
 * OpenRouter API Rate Limiter
 * Tracks daily API calls for user awareness
 * Note: OpenRouter uses pay-per-use, so this is for tracking, not hard limits
 */
export class OpenRouterRateLimiter {
  constructor() {
    // No hard limit for OpenRouter, just tracking
    this.data = null;
  }

  /**
   * Load rate limit data from storage
   * @returns {Promise<Object>} Rate limit tracking data
   */
  async load() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.OPENROUTER_RATE_LIMIT);
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
      console.error('Error loading OpenRouter rate limit data:', error);
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
        STORAGE_KEYS.OPENROUTER_RATE_LIMIT,
        JSON.stringify(this.data)
      );
    } catch (error) {
      console.error('Error saving OpenRouter rate limit data:', error);
    }
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

    return {
      count: this.data.count,
      limit: null, // No hard limit for OpenRouter
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
