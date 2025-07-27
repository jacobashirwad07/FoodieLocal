const { User } = require('../models/User');
const { Chef, chefValidationSchemas } = require('../models/Chef');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/documents/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only PDF, JPG, JPEG, PNG files
  const allowedTypes = /pdf|jpg|jpeg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

/**
 * Register as a chef
 * @route POST /api/v1/chefs/register
 * @access Private
 */
const registerChef = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = chefValidationSchemas.register.validate(req.body);
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

    // Check if user exists and is not already a chef
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

    // Check if user is already a chef
    const existingChef = await Chef.findOne({ userId: req.user.id });
    if (existingChef) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CHEF_ALREADY_EXISTS',
          message: 'User is already registered as a chef'
        }
      });
    }

    // Check if kitchen license is already in use
    const existingLicense = await Chef.findOne({ kitchenLicense: value.kitchenLicense });
    if (existingLicense) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'LICENSE_ALREADY_EXISTS',
          message: 'Kitchen license number is already in use'
        }
      });
    }

    // Create chef profile
    const chef = new Chef({
      userId: req.user.id,
      ...value,
      status: 'pending' // All chef registrations start as pending
    });

    await chef.save();

    // Update user role to chef
    user.role = 'chef';
    await user.save();

    res.status(201).json({
      success: true,
      data: {
        chef: {
          id: chef._id,
          userId: chef.userId,
          businessName: chef.businessName,
          description: chef.description,
          specialties: chef.specialties,
          serviceRadius: chef.serviceRadius,
          status: chef.status,
          createdAt: chef.createdAt
        }
      },
      message: 'Chef registration submitted successfully. Your application is pending approval.'
    });

  } catch (error) {
    console.error('Chef registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CHEF_REGISTRATION_FAILED',
        message: 'Chef registration failed. Please try again.'
      }
    });
  }
};

/**
 * Get chef profile
 * @route GET /api/v1/chefs/profile
 * @access Private (Chef only)
 */
const getChefProfile = async (req, res) => {
  try {
    const chef = await Chef.findOne({ userId: req.user.id })
      .populate('userId', 'name email phone location address');

    if (!chef) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CHEF_NOT_FOUND',
          message: 'Chef profile not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        chef: {
          id: chef._id,
          user: chef.userId,
          businessName: chef.businessName,
          description: chef.description,
          specialties: chef.specialties,
          kitchenLicense: chef.kitchenLicense,
          serviceRadius: chef.serviceRadius,
          serviceArea: chef.serviceArea,
          rating: chef.rating,
          status: chef.status,
          availability: chef.availability,
          bankDetails: chef.bankDetails,
          documents: chef.documents,
          createdAt: chef.createdAt,
          updatedAt: chef.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Get chef profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_CHEF_PROFILE_FAILED',
        message: 'Failed to get chef profile'
      }
    });
  }
};

/**
 * Update chef profile
 * @route PUT /api/v1/chefs/profile
 * @access Private (Chef only)
 */
const updateChefProfile = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = chefValidationSchemas.updateProfile.validate(req.body);
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

    const chef = await Chef.findOne({ userId: req.user.id });
    if (!chef) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CHEF_NOT_FOUND',
          message: 'Chef profile not found'
        }
      });
    }

    // Update chef fields
    Object.keys(value).forEach(key => {
      if (key === 'availability' || key === 'bankDetails') {
        chef[key] = { ...chef[key], ...value[key] };
      } else {
        chef[key] = value[key];
      }
    });

    await chef.save();

    res.status(200).json({
      success: true,
      data: {
        chef: {
          id: chef._id,
          businessName: chef.businessName,
          description: chef.description,
          specialties: chef.specialties,
          serviceRadius: chef.serviceRadius,
          serviceArea: chef.serviceArea,
          availability: chef.availability,
          bankDetails: chef.bankDetails,
          updatedAt: chef.updatedAt
        }
      },
      message: 'Chef profile updated successfully'
    });

  } catch (error) {
    console.error('Update chef profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_CHEF_PROFILE_FAILED',
        message: 'Failed to update chef profile'
      }
    });
  }
};

/**
 * Upload chef documents
 * @route POST /api/v1/chefs/documents
 * @access Private (Chef only)
 */
const uploadDocuments = async (req, res) => {
  try {
    const chef = await Chef.findOne({ userId: req.user.id });
    if (!chef) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CHEF_NOT_FOUND',
          message: 'Chef profile not found'
        }
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILES_UPLOADED',
          message: 'No files were uploaded'
        }
      });
    }

    // Process uploaded files
    const documents = req.files.map(file => ({
      type: req.body.documentType || 'license',
      url: `/uploads/documents/${file.filename}`,
      uploadedAt: new Date()
    }));

    // Add documents to chef profile
    chef.documents.push(...documents);
    await chef.save();

    res.status(200).json({
      success: true,
      data: {
        documents: documents
      },
      message: 'Documents uploaded successfully'
    });

  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_DOCUMENTS_FAILED',
        message: 'Failed to upload documents'
      }
    });
  }
};

/**
 * Get chef orders with enhanced filtering
 * @route GET /api/v1/chefs/orders
 * @access Private (Chef only)
 */
const getChefOrders = async (req, res) => {
  try {
    const chef = await Chef.findOne({ userId: req.user.id });
    if (!chef) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CHEF_NOT_FOUND',
          message: 'Chef profile not found'
        }
      });
    }

    const { 
      page = 1, 
      limit = 10, 
      status, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      dateFrom,
      dateTo,
      deliveryType
    } = req.query;
    
    // Build filter
    const filter = { 'items.chefId': chef._id };
    
    // Status filtering - support multiple statuses
    if (status) {
      if (status.includes(',')) {
        filter.status = { $in: status.split(',') };
      } else {
        filter.status = status;
      }
    }
    
    // Date range filtering
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    
    // Delivery type filtering
    if (deliveryType) {
      filter.deliveryType = deliveryType;
    }

    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const { Order } = require('../models/Order');
    const orders = await Order.find(filter)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('customerId', 'name phone email')
      .populate('items.mealId', 'name images preparationTime')
      .select('-__v');

    const total = await Order.countDocuments(filter);

    // Get order statistics for dashboard
    const stats = await Order.aggregate([
      { $match: { 'items.chefId': chef._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$finalAmount' }
        }
      }
    ]);

    const orderStats = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0
    };

    stats.forEach(stat => {
      orderStats[stat._id] = stat.count;
      if (stat._id === 'delivered') {
        orderStats.totalRevenue = stat.totalAmount;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        orders,
        stats: orderStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get chef orders error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_CHEF_ORDERS_FAILED',
        message: 'Failed to get chef orders'
      }
    });
  }
};

/**
 * Update chef status (Admin only)
 * @route PUT /api/v1/chefs/:id/status
 * @access Private (Admin only)
 */
const updateChefStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['pending', 'approved', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be pending, approved, or suspended'
        }
      });
    }

    const chef = await Chef.findById(id).populate('userId', 'name email');
    if (!chef) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CHEF_NOT_FOUND',
          message: 'Chef not found'
        }
      });
    }

    const previousStatus = chef.status;
    chef.status = status;
    await chef.save();

    // Log the action (in a real app, you'd save this to an audit log)
    console.log(`Admin ${req.user.email} changed chef ${chef.userId.email} status from ${previousStatus} to ${status}. Reason: ${reason || 'No reason provided'}`);

    // TODO: Send notification to chef about status change (will be implemented in notification system)

    res.status(200).json({
      success: true,
      data: {
        chef: {
          id: chef._id,
          businessName: chef.businessName,
          status: chef.status,
          user: chef.userId
        }
      },
      message: `Chef status updated to ${status} successfully`
    });

  } catch (error) {
    console.error('Update chef status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_CHEF_STATUS_FAILED',
        message: 'Failed to update chef status'
      }
    });
  }
};

/**
 * Confirm order
 * @route PUT /api/v1/chefs/orders/:id/confirm
 * @access Private (Chef only)
 */
const confirmOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { estimatedCompletionTime, notes } = req.body;

    const chef = await Chef.findOne({ userId: req.user.id });
    if (!chef) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CHEF_NOT_FOUND',
          message: 'Chef profile not found'
        }
      });
    }

    const { Order } = require('../models/Order');
    const order = await Order.findOne({ 
      _id: id, 
      'items.chefId': chef._id 
    }).populate('customerId', 'name phone email');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found or you do not have permission to access it'
        }
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ORDER_STATUS',
          message: `Cannot confirm order with status: ${order.status}`
        }
      });
    }

    // Update order status to confirmed
    await order.updateStatus('confirmed', notes);

    // Set estimated delivery time if provided
    if (estimatedCompletionTime) {
      const estimatedTime = new Date(estimatedCompletionTime);
      if (estimatedTime <= new Date()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_COMPLETION_TIME',
            message: 'Estimated completion time must be in the future'
          }
        });
      }
      order.estimatedDeliveryTime = estimatedTime;
      await order.save();
    }

    // TODO: Send notification to customer about order confirmation
    console.log(`Order ${order._id} confirmed by chef ${chef.businessName} for customer ${order.customerId.name}`);

    res.status(200).json({
      success: true,
      data: {
        order: {
          id: order._id,
          status: order.status,
          confirmedAt: order.confirmedAt,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
          chefNotes: order.chefNotes
        }
      },
      message: 'Order confirmed successfully'
    });

  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONFIRM_ORDER_FAILED',
        message: 'Failed to confirm order'
      }
    });
  }
};

/**
 * Update order status
 * @route PUT /api/v1/chefs/orders/:id/status
 * @access Private (Chef only)
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, estimatedCompletionTime } = req.body;

    // Validate status
    const validStatuses = ['confirmed', 'preparing', 'ready', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Status must be one of: ${validStatuses.join(', ')}`
        }
      });
    }

    const chef = await Chef.findOne({ userId: req.user.id });
    if (!chef) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CHEF_NOT_FOUND',
          message: 'Chef profile not found'
        }
      });
    }

    const { Order } = require('../models/Order');
    const order = await Order.findOne({ 
      _id: id, 
      'items.chefId': chef._id 
    }).populate('customerId', 'name phone email');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found or you do not have permission to access it'
        }
      });
    }

    // Validate status transition
    try {
      order.validateStatusTransition(status);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: error.message
        }
      });
    }

    // Update order status
    await order.updateStatus(status, notes);

    // Update estimated completion time if provided
    if (estimatedCompletionTime) {
      const estimatedTime = new Date(estimatedCompletionTime);
      if (estimatedTime <= new Date()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_COMPLETION_TIME',
            message: 'Estimated completion time must be in the future'
          }
        });
      }
      order.estimatedDeliveryTime = estimatedTime;
      await order.save();
    }

    // TODO: Send notification to customer about status update
    console.log(`Order ${order._id} status updated to ${status} by chef ${chef.businessName}`);

    res.status(200).json({
      success: true,
      data: {
        order: {
          id: order._id,
          status: order.status,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
          chefNotes: order.chefNotes,
          confirmedAt: order.confirmedAt,
          preparingAt: order.preparingAt,
          readyAt: order.readyAt,
          cancelledAt: order.cancelledAt
        }
      },
      message: `Order status updated to ${status} successfully`
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ORDER_STATUS_FAILED',
        message: 'Failed to update order status'
      }
    });
  }
};

/**
 * Update estimated completion time
 * @route PUT /api/v1/chefs/orders/:id/completion-time
 * @access Private (Chef only)
 */
const updateEstimatedCompletionTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { estimatedCompletionTime } = req.body;

    if (!estimatedCompletionTime) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_COMPLETION_TIME',
          message: 'Estimated completion time is required'
        }
      });
    }

    const estimatedTime = new Date(estimatedCompletionTime);
    if (estimatedTime <= new Date()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COMPLETION_TIME',
          message: 'Estimated completion time must be in the future'
        }
      });
    }

    const chef = await Chef.findOne({ userId: req.user.id });
    if (!chef) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CHEF_NOT_FOUND',
          message: 'Chef profile not found'
        }
      });
    }

    const { Order } = require('../models/Order');
    const order = await Order.findOne({ 
      _id: id, 
      'items.chefId': chef._id 
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found or you do not have permission to access it'
        }
      });
    }

    // Only allow updating completion time for active orders
    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ORDER_NOT_ACTIVE',
          message: 'Cannot update completion time for completed or cancelled orders'
        }
      });
    }

    order.estimatedDeliveryTime = estimatedTime;
    await order.save();

    // TODO: Send notification to customer about updated completion time
    console.log(`Order ${order._id} completion time updated by chef ${chef.businessName}`);

    res.status(200).json({
      success: true,
      data: {
        order: {
          id: order._id,
          estimatedDeliveryTime: order.estimatedDeliveryTime
        }
      },
      message: 'Estimated completion time updated successfully'
    });

  } catch (error) {
    console.error('Update completion time error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_COMPLETION_TIME_FAILED',
        message: 'Failed to update estimated completion time'
      }
    });
  }
};

module.exports = {
  registerChef,
  getChefProfile,
  updateChefProfile,
  uploadDocuments: [upload.array('documents', 5), uploadDocuments],
  getChefOrders,
  confirmOrder,
  updateOrderStatus,
  updateEstimatedCompletionTime,
  updateChefStatus
};