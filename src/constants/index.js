/**
 * Application Constants
 * 
 * Centralized location for all constants used throughout the application.
 * This improves maintainability and prevents magic strings/numbers scattered across the codebase.
 */

/**
 * Platform identifiers
 * Used for platform-specific logic and filtering
 */
export const PLATFORMS = {
  EBAY: 'eBay',
  KLEINANZEIGEN: 'Kleinanzeigen',
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
};

/**
 * API Configuration
 * Base URLs and endpoints for external services
 */
export const API_CONFIG = {
  OPENROUTER: {
    BASE_URL: 'https://openrouter.ai/api/v1',
    MODEL: 'openai/gpt-3.5-turbo',
    MAX_TOKENS: 100,
    TEMPERATURE: 0.3,
  },
  EBAY: {
    BASE_URL: 'https://svcs.ebay.com/services/search/FindingService/v1',
    GLOBAL_ID: 'EBAY-DE',
    OPERATION: 'findItemsByKeywords',
    SERVICE_VERSION: '1.0.0',
    RESULTS_PER_PAGE: 20,
  },
  KLEINANZEIGEN: {
    BASE_URL: 'https://www.kleinanzeigen.de/s-',
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
  ebayEnabled: true,
  kleinanzeigenEnabled: true,
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
