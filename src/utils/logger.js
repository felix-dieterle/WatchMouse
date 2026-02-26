/**
 * In-app Logger Utility
 *
 * Captures log entries in memory so they can be viewed in the app's Log View.
 * Wraps the global console methods to intercept all existing log output.
 *
 * Usage:
 *   import { logger } from './logger';
 *   logger.info('Search started');
 *   logger.warn('No API key configured');
 *   logger.error('Request failed');
 */

/** Maximum number of log entries to keep in memory */
const MAX_LOG_ENTRIES = 200;

/**
 * Log levels
 */
export const LOG_LEVELS = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

/**
 * In-memory logger singleton
 * Also intercepts console.log/warn/error so existing service logs appear in the log view.
 */
class Logger {
  constructor() {
    this._entries = [];
    this._listeners = [];
    this._intercepted = false;
    this._adding = false; // re-entrancy guard
  }

  /**
   * Add a log entry at info level
   * @param {string} message - Log message
   */
  info(message) {
    this._add(LOG_LEVELS.INFO, String(message));
  }

  /**
   * Add a log entry at warn level
   * @param {string} message - Log message
   */
  warn(message) {
    this._add(LOG_LEVELS.WARN, String(message));
  }

  /**
   * Add a log entry at error level
   * @param {string} message - Log message
   */
  error(message) {
    this._add(LOG_LEVELS.ERROR, String(message));
  }

  /**
   * Get all stored log entries (newest first)
   * @returns {Array<Object>} Array of log entry objects
   */
  getEntries() {
    return [...this._entries];
  }

  /**
   * Clear all stored log entries
   */
  clear() {
    this._entries = [];
    this._notify();
  }

  /**
   * Subscribe to log updates
   * @param {Function} listener - Called with entries array whenever logs change
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  /**
   * Intercept global console methods so all existing log calls are captured.
   * Safe to call multiple times – interception only happens once.
   */
  interceptConsole() {
    if (this._intercepted) {
      return;
    }
    this._intercepted = true;

    const _origLog = console.log.bind(console);
    const _origWarn = console.warn.bind(console);
    const _origError = console.error.bind(console);

    const self = this;

    const serialize = (a) => {
      if (typeof a !== 'object' || a === null) {
        return String(a);
      }
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    };

    console.log = (...args) => {
      _origLog(...args);
      self._add(LOG_LEVELS.INFO, args.map(serialize).join(' '));
    };

    console.warn = (...args) => {
      _origWarn(...args);
      self._add(LOG_LEVELS.WARN, args.map(serialize).join(' '));
    };

    console.error = (...args) => {
      _origError(...args);
      self._add(LOG_LEVELS.ERROR, args.map(serialize).join(' '));
    };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  _add(level, message) {
    // Guard against re-entrant calls (e.g. React's console.error warning triggered
    // by a setState inside a listener, which would loop back into _add).
    if (this._adding) {
      return;
    }
    this._adding = true;
    try {
      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        level,
        message,
        timestamp: new Date().toISOString(),
      };

      this._entries.unshift(entry); // newest first

      if (this._entries.length > MAX_LOG_ENTRIES) {
        this._entries = this._entries.slice(0, MAX_LOG_ENTRIES);
      }

      this._notify();
    } finally {
      this._adding = false;
    }
  }

  _notify() {
    const entries = this._entries;
    this._listeners.forEach(l => l(entries));
  }
}

/** Singleton logger instance used across the app */
export const logger = new Logger();
