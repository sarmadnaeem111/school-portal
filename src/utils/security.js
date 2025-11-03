/**
 * Security utilities for session management, rate limiting, etc.
 */

/**
 * Session timeout configuration (30 minutes)
 */
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
let sessionTimer = null;

/**
 * Starts session timeout timer
 * @param {function} onTimeout - Callback to execute on timeout
 */
export const startSessionTimer = (onTimeout) => {
  clearSessionTimer();
  sessionTimer = setTimeout(() => {
    if (onTimeout) {
      onTimeout();
    }
  }, SESSION_TIMEOUT);
};

/**
 * Clears session timeout timer
 */
export const clearSessionTimer = () => {
  if (sessionTimer) {
    clearTimeout(sessionTimer);
    sessionTimer = null;
  }
};

/**
 * Resets session timer on user activity
 * @param {function} onTimeout - Callback to execute on timeout
 */
export const resetSessionTimer = (onTimeout) => {
  startSessionTimer(onTimeout);
};

/**
 * Rate limiting implementation
 * Limits actions to prevent abuse
 */
class RateLimiter {
  constructor() {
    this.attempts = new Map();
    this.locks = new Map();
  }

  /**
   * Check if an action is allowed
   * @param {string} key - Unique key for the action (e.g., 'login-127.0.0.1')
   * @param {number} maxAttempts - Maximum attempts allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} - True if action is allowed
   */
  isAllowed(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];

    // Remove old attempts outside the window
    const validAttempts = userAttempts.filter(timestamp => now - timestamp < windowMs);

    if (validAttempts.length >= maxAttempts) {
      return false;
    }

    // Add new attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);

    // Clean up old entries
    setTimeout(() => {
      this.attempts.delete(key);
    }, windowMs);

    return true;
  }

  /**
   * Reset attempts for a key
   * @param {string} key - Key to reset
   */
  reset(key) {
    this.attempts.delete(key);
    this.locks.delete(key);
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Generates a unique key for rate limiting based on user IP and action
 * @param {string} action - Action type (e.g., 'login')
 * @param {string} identifier - User identifier (email or UID)
 * @returns {string} - Unique key
 */
export const generateRateLimitKey = (action, identifier) => {
  return `${action}-${identifier}`;
};

/**
 * Secure error messages - avoids information disclosure
 * @param {Error} error - Error object
 * @returns {string} - Sanitized error message
 */
export const getSecureErrorMessage = (error) => {
  const errorMessage = error?.message || 'An error occurred';
  const errorCode = error?.code || '';
  
  // Check authentication errors first (login/signup related)
  // Firebase Auth error codes - these take priority
  if (
    errorCode.includes('auth/user-not-found') ||
    errorCode.includes('auth/wrong-password') ||
    errorCode.includes('auth/invalid-credential') ||
    errorMessage.includes('user-not-found') ||
    errorMessage.includes('wrong-password') ||
    errorMessage.includes('invalid-credential') ||
    errorMessage.includes('invalid email') ||
    errorMessage.includes('invalid password')
  ) {
    return 'Entered Wrong Email or Password. Please try again';
  }
  
  // Don't expose internal error details - but only for non-auth permission errors
  if (
    (errorCode.includes('permission-denied') || errorMessage.includes('permission-denied')) &&
    !errorCode.includes('auth/') && !errorMessage.includes('auth/')
  ) {
    return 'Access denied. Please contact your administrator.';
  }
  
  if (errorMessage.includes('unauthorized') && !errorCode.includes('auth/')) {
    return 'Access denied. Please contact your administrator.';
  }
  
  if (errorMessage.includes('email-already-in-use')) {
    return 'This email is already registered';
  }
  
  if (errorMessage.includes('network-request-failed')) {
    return 'Network error. Please check your internet connection.';
  }
  
  // Generic message for other errors
  // If this is a client-side validation error we generated, surface it
  if (
    errorMessage.includes('Please enter a valid') ||
    errorMessage.includes('Please fix password') ||
    errorMessage.includes('Please select a class') ||
    errorMessage.includes('Please enter a roll number')
  ) {
    return errorMessage;
  }

  return 'An error occurred. Please try again or contact support.';
};

/**
 * Validates and sanitizes file name
 * @param {string} fileName - File name to sanitize
 * @returns {string} - Sanitized file name
 */
export const sanitizeFileName = (fileName) => {
  if (typeof fileName !== 'string') return 'file';
  
  // Remove directory traversal attempts
  let sanitized = fileName.replace(/\.\./g, '');
  
  // Remove special characters except dots, hyphens, and underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    sanitized = sanitized.substring(0, 255 - ext.length) + ext;
  }
  
  return sanitized;
};

/**
 * Checks if user agent looks suspicious
 * @returns {boolean} - True if suspicious
 */
export const isSuspiciousUserAgent = () => {
  if (typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check for common bot/scraper user agents
  const suspiciousPatterns = [
    'bot', 'crawler', 'spider', 'scraper',
    'headless', 'phantom', 'selenium', 'webdriver'
  ];
  
  return suspiciousPatterns.some(pattern => userAgent.includes(pattern));
};

/**
 * Generates a secure random token
 * @param {number} length - Token length
 * @returns {string} - Random token
 */
export const generateSecureToken = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const randomArray = new Uint8Array(length);
  crypto.getRandomValues(randomArray);
  
  for (let i = 0; i < length; i++) {
    token += chars[randomArray[i] % chars.length];
  }
  
  return token;
};

/**
 * Validates timestamp to prevent replay attacks
 * @param {number} timestamp - Timestamp to validate
 * @param {number} maxAge - Maximum age in seconds
 * @returns {boolean} - True if timestamp is valid
 */
export const isValidTimestamp = (timestamp, maxAge = 300) => {
  const now = Math.floor(Date.now() / 1000);
  const timeDiff = Math.abs(now - timestamp);
  return timeDiff <= maxAge;
};

