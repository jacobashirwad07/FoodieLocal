const { Order } = require('../models/Order');
const { Cart } = require('../models/Cart');
const { Meal } = require('../models/Meal');
const { Chef } = require('../models/Chef');
const { User } = require('../models/User');
const mongoose = require('mongoose');

/**
 * Create order from cart (checkout)
 * @route POST /api/v1/orders
 * @access Private
 */
const createOrder = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { paymentIntentId, customerNotes } = req.body;

    // Find customer's cart
    const cart = await Cart.findOne({ customerId })
      .populate('items.mealId', 'name price chefId preparationTime')
      .populate('items.chefId', 'businessName serviceRadius serviceArea');

    if (!cart || cart.isEmpty) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_CART',
          message: 'Cannot create order from empty cart'
        }
      });
    }

    // Check if cart is expired
    if (cart.isExpired) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CART_EXPIRED',
          message: 'Cart has expired'
        }
      });
    }

    // Validate cart items availability
    const unavailableItems = await cart.validateItemsAvailability();
    if (unavailableItems.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ITEMS_UNAVAILABLE',
          message: 'Some items in cart are no longer available',
          details: unavailableItems
        }
      });
    }

    // Validate delivery address for delivery orders
    if (cart.deliveryType === 'delivery') {
      const { street, city, state, zipCode, coordinates } = cart.deliveryAddress;
      if (!street || !city || !state || !zipCode || !coordinates) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INCOMPLETE_DELIVERY_ADDRESS',
            message: 'Complete delivery address is required for delivery orders'
          }
        });
      }
    }

    // Calculate delivery fees
    const deliveryFees = await cart.calculateDeliveryFees();
    const totalDeliveryFee = Object.values(deliveryFees).reduce((sum, fee) => sum + fee, 0);

    // Group items by chef for order splitting
    const groupedItems = cart.groupItemsByChef();
    const orders = [];

    // Create separate orders for each chef
    for (const group of groupedItems) {
      const chef = await Chef.findById(group.chefId);
      if (!chef) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CHEF_NOT_FOUND',
            message: `Chef not found for items in cart`
          }
        });
      }

      // Calculate estimated delivery time based on preparation time
      const maxPrepTime = Math.max(...group.items.map(item => 
        item.mealId ? item.mealId.preparationTime : 30
      ));
      const estimatedDeliveryTime = new Date(Date.now() + (maxPrepTime + 30) * 60 * 1000); // prep time + 30 min buffer

      // Calculate amounts for this chef's order
      const subtotal = group.subtotal;
      const chefDeliveryFee = deliveryFees[group.chefId] || 0;
      const tax = Math.round(subtotal * 0.08 * 100) / 100; // 8% tax
      const finalAmount = subtotal + chefDeliveryFee + tax - (cart.discount || 0);

      const orderData = {
        customerId,
        items: group.items.map(item => ({
          mealId: item.mealId._id || item.mealId,
          chefId: item.chefId._id || item.chefId,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.specialInstructions
        })),
        totalAmount: subtotal,
        deliveryFee: chefDeliveryFee,
        tax,
        finalAmount,
        deliveryAddress: cart.deliveryAddress,
        deliveryType: cart.deliveryType,
        paymentIntentId,
        estimatedDeliveryTime,
        customerNotes: customerNotes || cart.notes,
        status: 'pending',
        paymentStatus: paymentIntentId ? 'paid' : 'pending'
      };

      // Create order
      const order = new Order(orderData);
      await order.save();
      orders.push(order);

      // Reduce meal quantities
      for (const item of group.items) {
        const meal = await Meal.findById(item.mealId._id || item.mealId);
        if (meal) {
          await meal.reduceQuantity(item.quantity);
        }
      }
    }

    // Clear the cart after successful order creation
    await cart.clearCart();

    // Populate orders for response
    const populatedOrders = await Order.find({
      _id: { $in: orders.map(o => o._id) }
    })
    .populate('items.mealId', 'name description images')
    .populate('items.chefId', 'businessName rating')
    .populate('customerId', 'name email phone');

    res.status(201).json({
      success: true,
      data: {
        orders: populatedOrders,
        summary: {
          totalOrders: orders.length,
          totalAmount: orders.reduce((sum, order) => sum + order.finalAmount, 0),
          estimatedDeliveryTime: Math.max(...orders.map(o => o.estimatedDeliveryTime))
        },
        message: `${orders.length} order(s) created successfully`
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ORDER_CREATION_ERROR',
        message: 'Failed to create order'
      }
    });
  }
};

/**
 * Get order by ID
 * @route GET /api/v1/orders/:id
 * @access Private
 */
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ORDER_ID',
          message: 'Invalid order ID format'
        }
      });
    }

    const order = await Order.findOne({ _id: id, customerId })
      .populate('items.mealId', 'name description price images')
      .populate('items.chefId', 'businessName rating phone')
      .populate('customerId', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    res.json({
      success: true,
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ORDER_FETCH_ERROR',
        message: 'Failed to fetch order'
      }
    });
  }
};

/**
 * Get customer's orders
 * @route GET /api/v1/orders
 * @access Private
 */
const getCustomerOrders = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { 
      status, 
      limit = 20, 
      skip = 0, 
      sortBy = 'createdAt', 
      sortOrder = -1 
    } = req.query;

    const query = { customerId };
    if (status) {
      query.status = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = parseInt(sortOrder);

    const orders = await Order.find(query)
      .populate('items.mealId', 'name description images')
      .populate('items.chefId', 'businessName rating')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const totalOrders = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total: totalOrders,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: totalOrders > parseInt(skip) + parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ORDERS_FETCH_ERROR',
        message: 'Failed to fetch orders'
      }
    });
  }
};

/**
 * Update order status (for chefs)
 * @route PUT /api/v1/orders/:id/status
 * @access Private (Chef only)
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, chefNotes, estimatedDeliveryTime } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ORDER_ID',
          message: 'Invalid order ID format'
        }
      });
    }

    // Find the chef profile for the current user
    const chef = await Chef.findOne({ userId });
    if (!chef) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CHEF_PROFILE_NOT_FOUND',
          message: 'Chef profile not found'
        }
      });
    }

    // Find order and verify chef ownership
    const order = await Order.findOne({ 
      _id: id,
      'items.chefId': chef._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found or you do not have permission to update it'
        }
      });
    }

    // Validate status transition
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['out_for_delivery', 'delivered'],
      'out_for_delivery': ['delivered'],
      'delivered': [],
      'cancelled': []
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Cannot change status from ${order.status} to ${status}`
        }
      });
    }

    // Update order
    order.status = status;
    if (chefNotes) order.chefNotes = chefNotes;
    if (estimatedDeliveryTime) order.estimatedDeliveryTime = new Date(estimatedDeliveryTime);
    if (status === 'delivered') order.actualDeliveryTime = new Date();

    await order.save();

    // Populate order for response
    const updatedOrder = await Order.findById(order._id)
      .populate('items.mealId', 'name description images')
      .populate('items.chefId', 'businessName rating')
      .populate('customerId', 'name email phone');

    res.json({
      success: true,
      data: {
        order: updatedOrder,
        message: `Order status updated to ${status}`
      }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ORDER_UPDATE_ERROR',
        message: 'Failed to update order status'
      }
    });
  }
};

/**
 * Cancel order
 * @route POST /api/v1/orders/:id/cancel
 * @access Private
 */
const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { reason } = req.body;
    const customerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ORDER_ID',
          message: 'Invalid order ID format'
        }
      });
    }

    const order = await Order.findOne({ _id: id, customerId }).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'confirmed'];
    if (!cancellableStatuses.includes(order.status)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: {
          code: 'ORDER_NOT_CANCELLABLE',
          message: `Order cannot be cancelled when status is ${order.status}`
        }
      });
    }

    // Update order status
    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.paymentStatus = 'refunded'; // Assume automatic refund processing
    await order.save({ session });

    // Restore meal quantities
    for (const item of order.items) {
      const meal = await Meal.findById(item.mealId).session(session);
      if (meal) {
        await meal.restoreQuantity(item.quantity);
      }
    }

    await session.commitTransaction();

    // Populate order for response
    const cancelledOrder = await Order.findById(order._id)
      .populate('items.mealId', 'name description images')
      .populate('items.chefId', 'businessName rating');

    res.json({
      success: true,
      data: {
        order: cancelledOrder,
        message: 'Order cancelled successfully'
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ORDER_CANCELLATION_ERROR',
        message: 'Failed to cancel order'
      }
    });
  } finally {
    session.endSession();
  }
};

/**
 * Get order tracking information
 * @route GET /api/v1/orders/:id/tracking
 * @access Private
 */
const getOrderTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ORDER_ID',
          message: 'Invalid order ID format'
        }
      });
    }

    const order = await Order.findOne({ _id: id, customerId })
      .populate('items.chefId', 'businessName phone serviceArea')
      .select('status estimatedDeliveryTime actualDeliveryTime tracking deliveryType chefNotes');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    // Calculate estimated time remaining
    let timeRemaining = null;
    if (order.estimatedDeliveryTime && order.status !== 'delivered') {
      const now = new Date();
      const estimatedTime = new Date(order.estimatedDeliveryTime);
      timeRemaining = Math.max(0, Math.ceil((estimatedTime - now) / (1000 * 60))); // minutes
    }

    const trackingInfo = {
      orderId: order._id,
      status: order.status,
      deliveryType: order.deliveryType,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      actualDeliveryTime: order.actualDeliveryTime,
      timeRemaining,
      chefNotes: order.chefNotes,
      tracking: order.tracking,
      statusHistory: [
        { status: 'pending', timestamp: order.createdAt, description: 'Order placed' },
        // Add more status history based on order updates
      ]
    };

    res.json({
      success: true,
      data: {
        tracking: trackingInfo
      }
    });
  } catch (error) {
    console.error('Get order tracking error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRACKING_FETCH_ERROR',
        message: 'Failed to fetch order tracking information'
      }
    });
  }
};

module.exports = {
  createOrder,
  getOrder,
  getCustomerOrders,
  updateOrderStatus,
  cancelOrder,
  getOrderTracking
};