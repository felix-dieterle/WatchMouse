/**
 * Application Constants
 * 
 * Centralized location for all constants used throughout the application.
 * This improves maintainability and prevents magic strings/numbers scattered across the codebase.
 */

/**
 * App version information
 * Keep in sync with app.json version and android.versionCode
 */
export const APP_VERSION = '1.0.0';
export const BUILD_NUMBER = 1;

/**
 * Platform identifiers
 * Used for platform-specific logic and filtering
 */
export const PLATFORMS = {
  EBAY: 'eBay',
  KLEINANZEIGEN: 'Kleinanzeigen',
  GOOGLE_EBAY: 'eBay (Google)',
  MOBILE_DE: 'mobile.de',
  AUTOSCOUT24: 'AutoScout24',
};

/**
 * AsyncStorage and SecureStore keys
 * Used for local data persistence
 */
export const STORAGE_KEYS = {
  SEARCHES: 'searches',
  MATCHES: 'matches',
  SETTINGS: 'app_settings',
  SECURE_OPENROUTER_KEY: 'secure_openrouter_api_key',
  SECURE_EBAY_KEY: 'secure_ebay_api_key',
  SECURE_GOOGLE_API_KEY: 'secure_google_api_key',
  SECURE_GOOGLE_CX: 'secure_google_cx',
  EBAY_RATE_LIMIT: 'ebay_rate_limit_tracker',
  OPENROUTER_RATE_LIMIT: 'openrouter_rate_limit_tracker',
  GOOGLE_RATE_LIMIT: 'google_rate_limit_tracker',
};

/**
 * API Configuration
 * Base URLs and endpoints for external services
 */
export const API_CONFIG = {
  OPENROUTER: {
    BASE_URL: 'https://openrouter.ai/api/v1',
    MODEL: 'meta-llama/llama-3.2-3b-instruct:free',
    MAX_TOKENS: 100,
    TEMPERATURE: 0.3,
  },
  EBAY: {
    BASE_URL: 'https://svcs.ebay.com/services/search/FindingService/v1',
    GLOBAL_ID: 'EBAY-DE',
    OPERATION: 'findItemsByKeywords',
    SERVICE_VERSION: '1.0.0',
    RESULTS_PER_PAGE: 20,
    DAILY_RATE_LIMIT: 5000, // Free tier: 5,000 calls per day
    WARNING_THRESHOLD: 0.7, // Warn at 70% usage (3,500 calls)
    CRITICAL_THRESHOLD: 0.99, // Critical warning at 99% usage (4,950 calls)
  },
  KLEINANZEIGEN: {
    BASE_URL: 'https://www.kleinanzeigen.de/s-',
  },
  GOOGLE_CUSTOM_SEARCH: {
    BASE_URL: 'https://www.googleapis.com/customsearch/v1',
    RESULTS_PER_PAGE: 10, // Max 10 per request for free tier
    DAILY_RATE_LIMIT: 100, // Free tier: 100 queries per day
    WARNING_THRESHOLD: 0.7, // Warn at 70% usage (70 queries)
    CRITICAL_THRESHOLD: 0.99, // Critical warning at 99% usage (99 queries)
  },
  SERPAPI: {
    BASE_URL: 'https://serpapi.com/search',
    RESULTS_PER_PAGE: 10,
    MONTHLY_RATE_LIMIT: 250, // Free plan: 250 searches per month
    WARNING_THRESHOLD: 0.7, // Warn at 70% usage (175 searches)
    CRITICAL_THRESHOLD: 0.99, // Critical at 99% usage (247 searches)
  },
  USED_CARS: {
    // Used car platforms use Google Custom Search
    MOBILE_DE_URL: 'https://www.mobile.de',
    AUTOSCOUT24_URL: 'https://www.autoscout24.de',
    RESULTS_PER_PAGE: 10,
  },
};

/**
 * Cache Configuration
 * TTL (Time To Live) values for various caches in milliseconds
 */
export const CACHE_CONFIG = {
  SEARCH_RESULTS_TTL: 5 * 60 * 1000, // 5 minutes
  API_RESPONSE_TTL: 10 * 60 * 1000, // 10 minutes
  MAX_CACHE_SIZE: 50, // Maximum number of cached items
};

/**
 * Performance Configuration
 * Timeouts, debounce delays, and other performance-related settings
 */
export const PERFORMANCE_CONFIG = {
  API_TIMEOUT: 10000, // 10 seconds
  SEARCH_DEBOUNCE_MS: 500, // 500ms debounce for search input
  THROTTLE_API_CALLS_MS: 1000, // 1 second between API calls
};

/**
 * UI Configuration
 * Constants related to user interface
 */
export const UI_CONFIG = {
  INITIAL_ITEMS_TO_RENDER: 10,
  MAX_ITEMS_PER_BATCH: 10,
  WINDOW_SIZE: 5,
  EMPTY_SEARCH_MESSAGE: 'No saved searches yet',
  EMPTY_MATCHES_MESSAGE: 'No matches found yet',
  LOADING_MESSAGE: 'Searching...',
};

/**
 * Sort Options
 * Available sorting options for searches and matches
 */
export const SORT_OPTIONS = {
  SEARCHES: {
    DATE_DESC: 'date-desc',
    DATE_ASC: 'date-asc',
    NAME_ASC: 'name-asc',
    NAME_DESC: 'name-desc',
  },
  MATCHES: {
    DATE_DESC: 'date-desc',
    DATE_ASC: 'date-asc',
    PRICE_ASC: 'price-asc',
    PRICE_DESC: 'price-desc',
    TITLE_ASC: 'title-asc',
  },
};

/**
 * Filter Options
 * Available filtering options
 */
export const FILTER_OPTIONS = {
  PLATFORM: {
    ALL: 'all',
    EBAY: PLATFORMS.EBAY,
    KLEINANZEIGEN: PLATFORMS.KLEINANZEIGEN,
    MOBILE_DE: PLATFORMS.MOBILE_DE,
    AUTOSCOUT24: PLATFORMS.AUTOSCOUT24,
  },
  READ_STATUS: {
    ALL: 'all',
    UNREAD: 'unread',
    READ: 'read',
  },
};

/**
 * Default Settings
 * Default values for user settings
 */
export const DEFAULT_SETTINGS = {
  openrouterApiKey: '',
  ebayApiKey: '',
  googleApiKey: '',
  googleCx: '',
  ebayEnabled: true,
  kleinanzeigenEnabled: true,
  useGoogleForEbay: false, // Use Google Custom Search as eBay fallback
  usedCarsEnabled: false, // Enable used car search (requires Google Custom Search)
};

/**
 * Validation Rules
 * Validation constraints for user input
 */
export const VALIDATION = {
  MIN_SEARCH_QUERY_LENGTH: 1,
  MAX_SEARCH_QUERY_LENGTH: 200,
  MIN_PRICE: 0,
  MAX_PRICE: 999999,
  MIN_API_KEY_LENGTH: 10, // Minimum realistic API key length
};

/**
 * Error Messages
 * Standardized error messages for user feedback
 */
export const ERROR_MESSAGES = {
  EMPTY_QUERY: 'Please enter a search query',
  INVALID_PRICE: 'Please enter a valid price',
  API_KEY_REQUIRED: 'API key is required for AI-powered matching',
  SEARCH_FAILED: 'Failed to run search. Please check your configuration.',
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  STORAGE_ERROR: 'Failed to save data. Please try again.',
};

/**
 * Success Messages
 * Standardized success messages for user feedback
 */
export const SUCCESS_MESSAGES = {
  SEARCH_COMPLETE: (count, aiEnabled) => 
    `Found ${count} new matches! ${aiEnabled ? '(AI-powered)' : '(keyword matching)'}`,
  SETTINGS_SAVED: 'Settings saved successfully',
  ALL_MARKED_READ: 'All matches marked as read',
};

/**
 * Feature Flags
 * Enable/disable features for development or gradual rollout
 */
export const FEATURE_FLAGS = {
  ENABLE_CACHING: true,
  ENABLE_PERFORMANCE_LOGGING: false, // Enable in development for debugging
  ENABLE_KLEINANZEIGEN: true, // Currently returns mock data
  ENABLE_EBAY: true,
  ENABLE_USED_CARS: true, // Enable used car search module
};

/**
 * HTTP Status Codes
 * Common HTTP status codes for API error handling
 */
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR: 500,
};
