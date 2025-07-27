const { Cart, cartValidationSchemas } = require('../models/Cart');
const { Meal } = require('../models/Meal');
const { Chef } = require('../models/Chef');
const { User } = require('../models/User');
const mongoose = require('mongoose');

/**
 * Get user's cart
 * @route GET /api/v1/cart
 * @access Private
 */
const getCart = async (req, res) => {
  try {
    const customerId = req.user.id;
    
    let cart = await Cart.findOne({ customerId })
      .populate('items.mealId', 'name description price images isActive availability')
      .populate('items.chefId', 'businessName rating serviceRadius');
    
    if (!cart) {
      cart = await Cart.findOrCreateForCustomer(customerId);
    }
    
    // Check if cart is expired
    if (cart.isExpired) {
      await cart.clearCart();
      return res.json({
        success: true,
        data: {
          cart: {
            ...cart.toJSON(),
            items: []
          }
        }
      });
    }
    
    // Validate item availability
    const unavailableItems = await cart.validateItemsAvailability();
    
    res.json({
      success: true,
      data: {
        cart: cart.toJSON(),
        unavailableItems
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CART_FETCH_ERROR',
        message: 'Failed to fetch cart'
      }
    });
  }
};

/**
 * Add item to cart
 * @route POST /api/v1/cart/items
 * @access Private
 */
const addItemToCart = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = cartValidationSchemas.addItem.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }
    
    const { mealId, chefId, quantity, price, specialInstructions } = value;
    const customerId = req.user.id;
    
    // Verify meal exists and is available
    const meal = await Meal.findById(mealId).populate('chefId');
    if (!meal) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MEAL_NOT_FOUND',
          message: 'Meal not found'
        }
      });
    }
    
    if (!meal.isActive) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MEAL_NOT_AVAILABLE',
          message: 'Meal is not currently available'
        }
      });
    }
    
    // Check meal availability for the requested quantity
    if (!meal.isAvailableForOrder(quantity)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_QUANTITY',
          message: 'Requested quantity is not available'
        }
      });
    }
    
    // Verify chef ID matches meal's chef
    if (meal.chefId._id.toString() !== chefId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CHEF_ID',
          message: 'Chef ID does not match meal chef'
        }
      });
    }
    
    // Verify price matches current meal price
    if (Math.abs(meal.price - price) > 0.01) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PRICE_MISMATCH',
          message: 'Price does not match current meal price'
        }
      });
    }
    
    // Find or create cart
    let cart = await Cart.findOrCreateForCustomer(customerId);
    
    // Add item to cart
    await cart.addItem(mealId, chefId, quantity, price, specialInstructions);
    
    // Populate cart data for response
    cart = await Cart.findById(cart._id)
      .populate('items.mealId', 'name description price images')
      .populate('items.chefId', 'businessName rating');
    
    res.status(201).json({
      success: true,
      data: {
        cart: cart.toJSON(),
        message: 'Item added to cart successfully'
      }
    });
  } catch (error) {
    console.error('Add item to cart error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CART_ADD_ERROR',
        message: 'Failed to add item to cart'
      }
    });
  }
};

/**
 * Update cart item quantity
 * @route PUT /api/v1/cart/items/:mealId
 * @access Private
 */
const updateCartItem = async (req, res) => {
  try {
    const { mealId } = req.params;
    const customerId = req.user.id;
    
    // Validate request body
    const { error, value } = cartValidationSchemas.updateItem.validate({
      mealId,
      ...req.body
    });
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }
    
    const { quantity, specialInstructions } = value;
    
    // Find cart
    const cart = await Cart.findOne({ customerId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CART_NOT_FOUND',
          message: 'Cart not found'
        }
      });
    }
    
    // Check if item exists in cart
    const itemIndex = cart.items.findIndex(
      item => item.mealId.toString() === mealId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: 'Item not found in cart'
        }
      });
    }
    
    // If quantity > 0, verify meal availability
    if (quantity > 0) {
      const meal = await Meal.findById(mealId);
      if (!meal || !meal.isAvailableForOrder(quantity)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_QUANTITY',
            message: 'Requested quantity is not available'
          }
        });
      }
    }
    
    // Update item
    if (quantity === 0) {
      await cart.removeItem(mealId);
    } else {
      await cart.updateItemQuantity(mealId, quantity);
      
      // Update special instructions if provided
      if (specialInstructions !== undefined) {
        const item = cart.items.find(item => item.mealId.toString() === mealId);
        if (item) {
          item.specialInstructions = specialInstructions;
          await cart.save();
        }
      }
    }
    
    // Populate cart data for response
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.mealId', 'name description price images')
      .populate('items.chefId', 'businessName rating');
    
    res.json({
      success: true,
      data: {
        cart: updatedCart.toJSON(),
        message: quantity === 0 ? 'Item removed from cart' : 'Cart item updated successfully'
      }
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CART_UPDATE_ERROR',
        message: 'Failed to update cart item'
      }
    });
  }
};

/**
 * Remove item from cart
 * @route DELETE /api/v1/cart/items/:mealId
 * @access Private
 */
const removeCartItem = async (req, res) => {
  try {
    const { mealId } = req.params;
    const customerId = req.user.id;
    
    // Validate meal ID
    if (!mongoose.Types.ObjectId.isValid(mealId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MEAL_ID',
          message: 'Invalid meal ID format'
        }
      });
    }
    
    // Find cart
    const cart = await Cart.findOne({ customerId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CART_NOT_FOUND',
          message: 'Cart not found'
        }
      });
    }
    
    // Remove item
    try {
      await cart.removeItem(mealId);
    } catch (itemError) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: 'Item not found in cart'
        }
      });
    }
    
    // Populate cart data for response
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.mealId', 'name description price images')
      .populate('items.chefId', 'businessName rating');
    
    res.json({
      success: true,
      data: {
        cart: updatedCart.toJSON(),
        message: 'Item removed from cart successfully'
      }
    });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CART_REMOVE_ERROR',
        message: 'Failed to remove item from cart'
      }
    });
  }
};

/**
 * Clear entire cart
 * @route DELETE /api/v1/cart/clear
 * @access Private
 */
const clearCart = async (req, res) => {
  try {
    const customerId = req.user.id;
    
    // Find cart
    const cart = await Cart.findOne({ customerId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CART_NOT_FOUND',
          message: 'Cart not found'
        }
      });
    }
    
    // Clear cart
    await cart.clearCart();
    
    res.json({
      success: true,
      data: {
        cart: cart.toJSON(),
        message: 'Cart cleared successfully'
      }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CART_CLEAR_ERROR',
        message: 'Failed to clear cart'
      }
    });
  }
};

/**
 * Update delivery address
 * @route PUT /api/v1/cart/delivery-address
 * @access Private
 */
const updateDeliveryAddress = async (req, res) => {
  try {
    const customerId = req.user.id;
    
    // Validate request body
    const { error, value } = cartValidationSchemas.updateDeliveryAddress.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }
    
    // Find or create cart
    let cart = await Cart.findOrCreateForCustomer(customerId);
    
    // Update delivery address
    await cart.updateDeliveryAddress(value);
    
    // Calculate delivery fees if address is complete and delivery type is delivery
    let deliveryFees = {};
    if (cart.deliveryType === 'delivery' && cart.deliveryAddress.coordinates) {
      deliveryFees = await cart.calculateDeliveryFees();
    }
    
    res.json({
      success: true,
      data: {
        cart: cart.toJSON(),
        deliveryFees,
        message: 'Delivery address updated successfully'
      }
    });
  } catch (error) {
    console.error('Update delivery address error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELIVERY_ADDRESS_UPDATE_ERROR',
        message: 'Failed to update delivery address'
      }
    });
  }
};

/**
 * Update delivery type
 * @route PUT /api/v1/cart/delivery-type
 * @access Private
 */
const updateDeliveryType = async (req, res) => {
  try {
    const customerId = req.user.id;
    
    // Validate request body
    const { error, value } = cartValidationSchemas.updateDeliveryType.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }
    
    const { deliveryType } = value;
    
    // Find or create cart
    let cart = await Cart.findOrCreateForCustomer(customerId);
    
    // Update delivery type
    cart.deliveryType = deliveryType;
    await cart.save();
    
    // Calculate delivery fees if delivery type is delivery and address is available
    let deliveryFees = {};
    if (deliveryType === 'delivery' && cart.deliveryAddress.coordinates) {
      deliveryFees = await cart.calculateDeliveryFees();
    }
    
    res.json({
      success: true,
      data: {
        cart: cart.toJSON(),
        deliveryFees,
        message: 'Delivery type updated successfully'
      }
    });
  } catch (error) {
    console.error('Update delivery type error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELIVERY_TYPE_UPDATE_ERROR',
        message: 'Failed to update delivery type'
      }
    });
  }
};

/**
 * Apply promo code
 * @route POST /api/v1/cart/promo-code
 * @access Private
 */
const applyPromoCode = async (req, res) => {
  try {
    const customerId = req.user.id;
    
    // Validate request body
    const { error, value } = cartValidationSchemas.applyPromoCode.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }
    
    const { promoCode } = value;
    
    // Find cart
    const cart = await Cart.findOne({ customerId });
    if (!cart || cart.isEmpty) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_CART',
          message: 'Cannot apply promo code to empty cart'
        }
      });
    }
    
    // Simple promo code validation (in real app, this would check a promo codes table)
    let discountAmount = 0;
    const validPromoCodes = {
      'WELCOME10': 10, // $10 off
      'SAVE5': 5,      // $5 off
      'FIRST20': 20    // $20 off for first order
    };
    
    if (validPromoCodes[promoCode]) {
      discountAmount = Math.min(validPromoCodes[promoCode], cart.subtotal);
      await cart.applyPromoCode(promoCode, discountAmount);
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROMO_CODE',
          message: 'Invalid or expired promo code'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        cart: cart.toJSON(),
        discountApplied: discountAmount,
        message: 'Promo code applied successfully'
      }
    });
  } catch (error) {
    console.error('Apply promo code error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PROMO_CODE_ERROR',
        message: 'Failed to apply promo code'
      }
    });
  }
};

/**
 * Remove promo code
 * @route DELETE /api/v1/cart/promo-code
 * @access Private
 */
const removePromoCode = async (req, res) => {
  try {
    const customerId = req.user.id;
    
    // Find cart
    const cart = await Cart.findOne({ customerId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CART_NOT_FOUND',
          message: 'Cart not found'
        }
      });
    }
    
    // Remove promo code
    await cart.removePromoCode();
    
    res.json({
      success: true,
      data: {
        cart: cart.toJSON(),
        message: 'Promo code removed successfully'
      }
    });
  } catch (error) {
    console.error('Remove promo code error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PROMO_CODE_REMOVE_ERROR',
        message: 'Failed to remove promo code'
      }
    });
  }
};

/**
 * Get cart summary with delivery fees
 * @route GET /api/v1/cart/summary
 * @access Private
 */
const getCartSummary = async (req, res) => {
  try {
    const customerId = req.user.id;
    
    const cart = await Cart.findOne({ customerId })
      .populate('items.mealId', 'name price')
      .populate('items.chefId', 'businessName serviceRadius');
    
    if (!cart || cart.isEmpty) {
      return res.json({
        success: true,
        data: {
          summary: {
            subtotal: 0,
            discount: 0,
            deliveryFees: {},
            totalDeliveryFee: 0,
            total: 0,
            itemCount: 0,
            chefCount: 0
          }
        }
      });
    }
    
    // Calculate delivery fees
    const deliveryFees = await cart.calculateDeliveryFees();
    const totalDeliveryFee = Object.values(deliveryFees).reduce((sum, fee) => sum + fee, 0);
    
    const summary = {
      subtotal: cart.subtotal,
      discount: cart.discount,
      deliveryFees,
      totalDeliveryFee,
      total: cart.total + totalDeliveryFee,
      itemCount: cart.totalItems,
      chefCount: cart.uniqueChefs,
      groupedByChef: cart.groupItemsByChef()
    };
    
    res.json({
      success: true,
      data: {
        summary
      }
    });
  } catch (error) {
    console.error('Get cart summary error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CART_SUMMARY_ERROR',
        message: 'Failed to get cart summary'
      }
    });
  }
};

module.exports = {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  updateDeliveryAddress,
  updateDeliveryType,
  applyPromoCode,
  removePromoCode,
  getCartSummary
};