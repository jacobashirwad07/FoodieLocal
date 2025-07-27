const { User, userValidationSchemas } = require('../models/User');
const { Chef } = require('../models/Chef');
const { generateToken, verifyToken, hashToken } = require('../utils/auth');
const crypto = require('crypto');

/**
 * Register a new user
 * @route POST /api/v1/auth/register
 * @access Public
 */
const register = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = userValidationSchemas.register.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
          details: error.details
        }
      });
    }

    const { name, email, password, phone, location, address, preferences } = value;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      location,
      address,
      preferences
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    
    await user.save();

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    // TODO: Send verification email (will be implemented in notification system)
    console.log(`Email verification token for ${email}: ${verificationToken}`);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive
        }
      },
      message: 'User registered successfully. Please check your email for verification.'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: 'Registration failed. Please try again.'
      }
    });
  }
};

/**
 * Login user
 * @route POST /api/v1/auth/login
 * @access Public
 */
const login = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = userValidationSchemas.login.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    const { email, password } = value;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended. Please contact support.'
        }
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    // Get chef profile if user is a chef
    let chefProfile = null;
    if (user.role === 'chef') {
      chefProfile = await Chef.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          chefProfile: chefProfile ? {
            id: chefProfile._id,
            status: chefProfile.status,
            businessName: chefProfile.businessName
          } : null
        }
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: 'Login failed. Please try again.'
      }
    });
  }
};

/**
 * Logout user
 * @route POST /api/v1/auth/logout
 * @access Private
 */
const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // However, we can implement token blacklisting if needed
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_FAILED',
        message: 'Logout failed. Please try again.'
      }
    });
  }
};

/**
 * Refresh JWT token
 * @route POST /api/v1/auth/refresh-token
 * @access Private
 */
const refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended'
        }
      });
    }

    // Generate new token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive
        }
      },
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TOKEN_REFRESH_FAILED',
        message: 'Token refresh failed. Please login again.'
      }
    });
  }
};

/**
 * Verify email
 * @route GET /api/v1/auth/verify-email/:token
 * @access Public
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Verification token is required'
        }
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = hashToken(token);

    // Find user with matching token and check expiration
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired verification token'
        }
      });
    }

    // Update user verification status
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EMAIL_VERIFICATION_FAILED',
        message: 'Email verification failed. Please try again.'
      }
    });
  }
};

/**
 * Request password reset
 * @route POST /api/v1/auth/forgot-password
 * @access Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_EMAIL',
          message: 'Email is required'
        }
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // TODO: Send password reset email (will be implemented in notification system)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FORGOT_PASSWORD_FAILED',
        message: 'Password reset request failed. Please try again.'
      }
    });
  }
};

/**
 * Reset password
 * @route POST /api/v1/auth/reset-password/:token
 * @access Public
 */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Token and password are required'
        }
      });
    }

    // Validate password strength
    const { validatePasswordStrength } = require('../utils/auth');
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password does not meet requirements',
          details: passwordValidation.errors
        }
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = hashToken(token);

    // Find user with matching token and check expiration
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired reset token'
        }
      });
    }

    // Update password and clear reset token
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'RESET_PASSWORD_FAILED',
        message: 'Password reset failed. Please try again.'
      }
    });
  }
};

/**
 * Get current user profile
 * @route GET /api/v1/auth/me
 * @access Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Get chef profile if user is a chef
    let chefProfile = null;
    if (user.role === 'chef') {
      chefProfile = await Chef.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          location: user.location,
          address: user.address,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          preferences: user.preferences,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          chefProfile: chefProfile ? {
            id: chefProfile._id,
            status: chefProfile.status,
            businessName: chefProfile.businessName,
            rating: chefProfile.rating
          } : null
        }
      }
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_PROFILE_FAILED',
        message: 'Failed to get user profile'
      }
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe
};