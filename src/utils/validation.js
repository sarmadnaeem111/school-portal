/**
 * Input validation and sanitization utilities for security
 */

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if email is valid
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
};

/**
 * Validates password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * @param {string} password - Password to validate
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (password && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (password && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (password && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Escape special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized.trim();
};

/**
 * Validates phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if phone is valid
 */
export const isValidPhone = (phone) => {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone.trim()) && phone.trim().length >= 10;
};

/**
 * Validates name format
 * @param {string} name - Name to validate
 * @returns {boolean} - True if name is valid
 */
export const isValidName = (name) => {
  if (!name || typeof name !== 'string') return false;
  // Allow letters, spaces, hyphens, apostrophes, periods, ampersands, and digits (more permissive but safe)
  const nameRegex = /^[a-zA-Z0-9\s\-'.&]+$/;
  return nameRegex.test(name.trim()) && name.trim().length >= 2 && name.trim().length <= 100;
};

/**
 * Validates roll number format
 * @param {string} rollNumber - Roll number to validate
 * @returns {boolean} - True if roll number is valid
 */
export const isValidRollNumber = (rollNumber) => {
  if (!rollNumber) return true; // Optional
  const rollRegex = /^[A-Za-z0-9\-_]+$/;
  return rollRegex.test(rollNumber.trim()) && rollNumber.trim().length <= 50;
};

/**
 * Validates address
 * @param {string} address - Address to validate
 * @returns {boolean} - True if address is valid
 */
export const isValidAddress = (address) => {
  if (!address) return true; // Optional
  // Allow alphanumeric, spaces, commas, dashes, periods
  const addressRegex = /^[a-zA-Z0-9\s\-,.']+$/;
  return addressRegex.test(address.trim()) && address.trim().length <= 500;
};

/**
 * Validates all user input fields
 * @param {object} data - User data to validate
 * @param {string} role - User role
 * @returns {object} - { valid: boolean, errors: object }
 */
export const validateUserData = (data, role) => {
  const errors = {};
  
  // Validate name
  if (!isValidName(data.name)) {
    errors.name = 'Please enter a valid name (2-100 characters, letters only)';
  }
  
  // Validate email
  if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // Validate phone
  if (data.phone && !isValidPhone(data.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }
  
  // Validate address
  if (data.address && !isValidAddress(data.address)) {
    errors.address = 'Please enter a valid address';
  }
  
  // Validate roll number for students
  if (role === 'student' && data.rollNumber && !isValidRollNumber(data.rollNumber)) {
    errors.rollNumber = 'Please enter a valid roll number (alphanumeric only)';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Escapes special characters in a string to prevent code injection
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
export const escapeHtml = (str) => {
  if (typeof str !== 'string') return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, m => map[m]);
};

/**
 * Validates file type for uploads
 * @param {File} file - File to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} - True if file type is allowed
 */
export const isValidFileType = (file, allowedTypes) => {
  if (!file || !allowedTypes || !Array.isArray(allowedTypes)) return false;
  return allowedTypes.includes(file.type);
};

/**
 * Validates file size
 * @param {File} file - File to validate
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {boolean} - True if file size is valid
 */
export const isValidFileSize = (file, maxSizeMB = 10) => {
  if (!file) return false;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

