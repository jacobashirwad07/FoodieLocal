const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrder,
  getCustomerOrders,
  updateOrderStatus,
  cancelOrder,
  getOrderTracking
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// Apply authentication middleware to all order routes
router.use(protect);

// @route   POST /api/v1/orders
// @desc    Create order from cart (checkout)
// @access  Private
router.post('/', createOrder);

// @route   GET /api/v1/orders
// @desc    Get customer's orders
// @access  Private
router.get('/', getCustomerOrders);

// @route   GET /api/v1/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', getOrder);

// @route   GET /api/v1/orders/:id/tracking
// @desc    Get order tracking information
// @access  Private
router.get('/:id/tracking', getOrderTracking);

// @route   PUT /api/v1/orders/:id/status
// @desc    Update order status (for chefs)
// @access  Private (Chef only)
router.put('/:id/status', authorize('chef'), updateOrderStatus);

// @route   POST /api/v1/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.post('/:id/cancel', cancelOrder);

module.exports = router;