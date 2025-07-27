const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { Chef } = require('../models/Chef');

/**
 * Protect routes - verify JWT token and load user data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'NO_TOKEN',
        message: 'Access token is required. Please login to continue.'
      }
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database to ensure they still exist and are active
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User associated with this token no longer exists'
        }
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended. Please contact support.'
        }
      });
    }

    // Add user data to request object
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive
    };

    next();
  } catch (error) {
    let errorCode = 'INVALID_TOKEN';
    let errorMessage = 'Invalid or expired token. Please login again.';

    if (error.name === 'TokenExpiredError') {
      errorCode = 'TOKEN_EXPIRED';
      errorMessage = 'Token has expired. Please login again.';
    } else if (error.name === 'JsonWebTokenError') {
      errorCode = 'MALFORMED_TOKEN';
      errorMessage = 'Malformed token. Please login again.';
    }

    return res.status(401).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage
      }
    });
  }
};

/**
 * Grant access to specific roles
 * @param {...string} roles - Allowed roles
 * @returns {Function} - Express middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required to access this route'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
        }
      });
    }

    next();
  };
};

/**
 * Check if chef is approved (for chef-specific routes)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireChefApproval = async (req, res, next) => {
  try {
    if (req.user.role !== 'chef') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CHEF_ACCESS_REQUIRED',
          message: 'This route is only accessible to chefs'
        }
      });
    }

    // Get chef profile to check approval status
    const chef = await Chef.findOne({ userId: req.user.id });
    if (!chef) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CHEF_PROFILE_NOT_FOUND',
          message: 'Chef profile not found. Please complete chef registration.'
        }
      });
    }

    if (chef.status !== 'approved') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CHEF_NOT_APPROVED',
          message: `Chef account status: ${chef.status}. Approval required to access this feature.`
        }
      });
    }

    // Add chef data to request object
    req.chef = {
      id: chef._id,
      userId: chef.userId,
      businessName: chef.businessName,
      status: chef.status,
      rating: chef.rating,
      serviceRadius: chef.serviceRadius
    };

    next();
  } catch (error) {
    console.error('Chef approval check error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CHEF_APPROVAL_CHECK_FAILED',
        message: 'Failed to verify chef approval status'
      }
    });
  }
};

/**
 * Check if user's email is verified
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Email verification required to access this feature'
      }
    });
  }
  next();
};

/**
 * Optional authentication - doesn't fail if no token provided
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (user && user.isActive) {
      req.user = {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive
      };
    }
  } catch (error) {
    // Silently fail for optional auth
    console.log('Optional auth failed:', error.message);
  }

  next();
};

module.exports = {
  protect,
  authorize,
  requireChefApproval,
  requireEmailVerification,
  optionalAuth
};