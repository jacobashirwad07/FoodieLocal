const { User, userValidationSchemas } = require('../models/User');
const { Order } = require('../models/Order');

/**
 * Get user profile
 * @route GET /api/v1/users/profile
 * @access Private
 */
const getProfile = async (req, res) => {
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
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_PROFILE_FAILED',
        message: 'Failed to get user profile'
      }
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/v1/users/profile
 * @access Private
 */
const updateProfile = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = userValidationSchemas.updateProfile.validate(req.body);
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

    // Update user fields
    Object.keys(value).forEach(key => {
      if (key === 'address' || key === 'preferences') {
        user[key] = { ...user[key], ...value[key] };
      } else {
        user[key] = value[key];
      }
    });

    await user.save();

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
          updatedAt: user.updatedAt
        }
      },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_PROFILE_FAILED',
        message: 'Failed to update user profile'
      }
    });
  }
};

/**
 * Update user location
 * @route PUT /api/v1/users/location
 * @access Private
 */
const updateLocation = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = userValidationSchemas.updateLocation.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

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

    user.location.coordinates = value.coordinates;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        location: user.location
      },
      message: 'Location updated successfully'
    });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_LOCATION_FAILED',
        message: 'Failed to update user location'
      }
    });
  }
};

/**
 * Get all users (Admin only)
 * @route GET /api/v1/users
 * @access Private (Admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status } = req.query;
    
    // Build filter
    const filter = {};
    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const users = await User.find(filter)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_USERS_FAILED',
        message: 'Failed to get users'
      }
    });
  }
};

/**
 * Get user orders
 * @route GET /api/v1/users/orders
 * @access Private
 */
const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build filter
    const filter = { customerId: req.user.id };
    if (status) filter.status = status;

    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const orders = await Order.find(filter)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-__v');

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_ORDERS_FAILED',
        message: 'Failed to get user orders'
      }
    });
  }
};

/**
 * Update user status (Admin only)
 * @route PUT /api/v1/users/:id/status
 * @access Private (Admin only)
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'isActive must be a boolean value'
        }
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user.id.toString() && !isActive) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_DEACTIVATE_SELF',
          message: 'You cannot deactivate your own account'
        }
      });
    }

    user.isActive = isActive;
    await user.save();

    // Log the action (in a real app, you'd save this to an audit log)
    console.log(`Admin ${req.user.email} ${isActive ? 'activated' : 'deactivated'} user ${user.email}. Reason: ${reason || 'No reason provided'}`);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      },
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_STATUS_FAILED',
        message: 'Failed to update user status'
      }
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateLocation,
  getUserOrders,
  getAllUsers,
  updateUserStatus
};