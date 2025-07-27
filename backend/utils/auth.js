const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Hash password utility
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error('Password hashing failed');
  }
};

/**
 * Compare password utility
 * @param {string} candidatePassword - Plain text password to compare
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} - True if passwords match
 */
const comparePassword = async (candidatePassword, hashedPassword) => {
  try {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} expiresIn - Token expiration time
 * @returns {string} - JWT token
 */
const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Generate random token for email verification or password reset
 * @returns {string} - Random token
 */
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash token for secure storage
 * @param {string} token - Token to hash
 * @returns {string} - Hashed token
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if email is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if phone number is valid
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with isValid and errors
 */
const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password cannot exceed 128 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate secure random password
 * @param {number} length - Password length (default: 12)
 * @returns {string} - Generated password
 */
const generateSecurePassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .trim(); // Remove leading/trailing whitespace
};

/**
 * Generate email verification token with expiration
 * @returns {Object} - Token and expiration date
 */
const generateEmailVerificationToken = () => {
  const token = generateRandomToken();
  const hashedToken = hashToken(token);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return {
    token,
    hashedToken,
    expires
  };
};

/**
 * Generate password reset token with expiration
 * @returns {Object} - Token and expiration date
 */
const generatePasswordResetToken = () => {
  const token = generateRandomToken();
  const hashedToken = hashToken(token);
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  return {
    token,
    hashedToken,
    expires
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  generateRandomToken,
  hashToken,
  isValidEmail,
  isValidPhone,
  validatePasswordStrength,
  generateSecurePassword,
  sanitizeInput,
  generateEmailVerificationToken,
  generatePasswordResetToken
};