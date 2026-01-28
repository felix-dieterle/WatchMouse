/**
 * Performance Utilities
 * 
 * Functions for optimizing performance through caching, debouncing, and throttling
 */

/**
 * Simple in-memory cache with TTL support
 * Thread-safe cache for storing API responses and computed values
 */
export class Cache {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get value from cache if not expired
   * @param {string} key - Cache key
   * @returns {*} Cached value or undefined if expired/not found
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }

  /**
   * Set value in cache with TTL
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl) {
    // Enforce max size by removing oldest entry
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
    });
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache size
   * @returns {number} Number of entries in cache
   */
  size() {
    return this.cache.size;
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists and is valid
   */
  has(key) {
    return this.get(key) !== undefined;
  }
}

/**
 * Debounce function
 * Delays execution until after wait time has elapsed since last call
 * Useful for search inputs and other rapid user interactions
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 * 
 * @example
 * const debouncedSearch = debounce((query) => search(query), 500);
 * debouncedSearch('iPhone'); // Won't execute immediately
 * debouncedSearch('iPhone 13'); // Cancels previous, waits 500ms
 */
export function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * Ensures function is called at most once per interval
 * Useful for rate limiting API calls
 * 
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {Function} Throttled function
 * 
 * @example
 * const throttledUpdate = throttle(() => updateUI(), 1000);
 * throttledUpdate(); // Executes immediately
 * throttledUpdate(); // Ignored if called within 1 second
 */
export function throttle(func, limit) {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Measure function execution time
 * Useful for performance monitoring and optimization
 * 
 * @param {Function} func - Function to measure
 * @param {string} label - Label for the measurement
 * @returns {Function} Wrapped function that logs execution time
 * 
 * @example
 * const measuredSearch = measurePerformance(searchFunction, 'Search');
 * await measuredSearch(); // Logs: "Search took 245ms"
 */
export function measurePerformance(func, label) {
  return async function(...args) {
    const start = performance.now();
    const result = await func(...args);
    const end = performance.now();
    
    console.log(`[Performance] ${label} took ${(end - start).toFixed(2)}ms`);
    
    return result;
  };
}

/**
 * Retry function with exponential backoff
 * Automatically retries failed operations with increasing delays
 * 
 * @param {Function} func - Async function to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} baseDelay - Base delay in milliseconds (doubles each retry)
 * @returns {Promise} Result of successful execution
 * @throws {Error} Last error if all retries fail
 * 
 * @example
 * const result = await retryWithBackoff(
 *   () => fetchAPI(),
 *   3,  // Max 3 retries
 *   1000  // Start with 1 second delay
 * );
 */
export async function retryWithBackoff(func, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await func();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Deduplicate array of objects by key
 * Removes duplicate items based on a specified key
 * 
 * @param {Array} array - Array to deduplicate
 * @param {string} key - Key to use for deduplication
 * @returns {Array} Deduplicated array
 * 
 * @example
 * const items = [
 *   { id: '1', title: 'Item 1' },
 *   { id: '2', title: 'Item 2' },
 *   { id: '1', title: 'Item 1 Duplicate' }
 * ];
 * deduplicateByKey(items, 'id')
 * // Returns: [{ id: '1', title: 'Item 1' }, { id: '2', title: 'Item 2' }]
 */
export function deduplicateByKey(array, key) {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}
