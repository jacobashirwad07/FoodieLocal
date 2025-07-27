const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

// Apply authentication middleware to all cart routes
router.use(protect);

// @route   GET /api/v1/cart
// @desc    Get user's cart
// @access  Private
router.get('/', getCart);

// @route   GET /api/v1/cart/summary
// @desc    Get cart summary with delivery fees
// @access  Private
router.get('/summary', getCartSummary);

// @route   POST /api/v1/cart/items
// @desc    Add item to cart
// @access  Private
router.post('/items', addItemToCart);

// @route   PUT /api/v1/cart/items/:mealId
// @desc    Update cart item quantity
// @access  Private
router.put('/items/:mealId', updateCartItem);

// @route   DELETE /api/v1/cart/items/:mealId
// @desc    Remove item from cart
// @access  Private
router.delete('/items/:mealId', removeCartItem);

// @route   DELETE /api/v1/cart/clear
// @desc    Clear entire cart
// @access  Private
router.delete('/clear', clearCart);

// @route   PUT /api/v1/cart/delivery-address
// @desc    Update delivery address
// @access  Private
router.put('/delivery-address', updateDeliveryAddress);

// @route   PUT /api/v1/cart/delivery-type
// @desc    Update delivery type
// @access  Private
router.put('/delivery-type', updateDeliveryType);

// @route   POST /api/v1/cart/promo-code
// @desc    Apply promo code
// @access  Private
router.post('/promo-code', applyPromoCode);

// @route   DELETE /api/v1/cart/promo-code
// @desc    Remove promo code
// @access  Private
router.delete('/promo-code', removePromoCode);

module.exports = router;