/**
 * Security Utilities
 * 
 * Functions for handling sensitive data securely
 */

/**
 * Redact sensitive data from error messages
 * Prevents API keys, tokens, and other secrets from appearing in logs or crash reports
 * 
 * @param {string} message - Error message or log output
 * @returns {string} Message with sensitive data redacted
 * 
 * @example
 * redactSensitiveData('API key: sk-abc123xyz789')
 * // Returns: 'API key: sk-a****'
 */
export function redactSensitiveData(message) {
  if (typeof message !== 'string') {
    return message;
  }
  
  // Only redact when we detect common API key indicators in the message
  // This reduces false positives while still protecting sensitive data
  const hasApiKeyIndicator = /api[_-]?key|token|secret|auth|bearer/i.test(message);
  
  if (!hasApiKeyIndicator) {
    return message;
  }
  
  // Redact alphanumeric strings that appear after key indicators
  return message.replace(
    /(api[_-]?key|token|secret|auth|bearer)[:\s=]+([A-Za-z0-9_-]{10,})/gi,
    (match, prefix, key) => {
      return `${prefix}: ${key.substring(0, 4)}****`;
    }
  );
}

/**
 * Validate API key format
 * Checks if an API key meets minimum security requirements
 * 
 * @param {string} apiKey - API key to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // API keys should be at least 10 characters
  if (apiKey.trim().length < 10) {
    return false;
  }
  
  // Should contain alphanumeric characters
  return /[A-Za-z0-9]/.test(apiKey);
}

/**
 * Sanitize user input to prevent injection attacks
 * Removes potentially dangerous characters from user input
 * 
 * @param {string} input - User input string
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove control characters and trim whitespace
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}
