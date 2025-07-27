const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  createPaymentIntent,
  confirmPayment,
  createRefund,
  retryPayment,
  handleWebhook
} = require('../controllers/paymentController');

const { protect } = require('../middleware/auth');

// Validation rules
const createPaymentIntentValidation = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isMongoId()
    .withMessage('Invalid order ID format'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('currency')
    .optional()
    .isIn(['usd', 'eur', 'gbp', 'inr'])
    .withMessage('Invalid currency code')
];

const confirmPaymentValidation = [
  body('paymentIntentId')
    .notEmpty()
    .withMessage('Payment intent ID is required')
    .matches(/^pi_[a-zA-Z0-9_]+$/)
    .withMessage('Invalid payment intent ID format')
];

const createRefundValidation = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isMongoId()
    .withMessage('Invalid order ID format'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Refund amount must be a positive number'),
  body('reason')
    .optional()
    .isIn(['duplicate', 'fraudulent', 'requested_by_customer'])
    .withMessage('Invalid refund reason')
];

const retryPaymentValidation = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isMongoId()
    .withMessage('Invalid order ID format')
];

// Routes

/**
 * @route   POST /api/v1/payments/create-intent
 * @desc    Create payment intent for an order
 * @access  Private (Customer)
 */
router.post('/create-intent', protect, createPaymentIntentValidation, createPaymentIntent);

/**
 * @route   POST /api/v1/payments/confirm
 * @desc    Confirm payment for an order
 * @access  Private (Customer)
 */
router.post('/confirm', protect, confirmPaymentValidation, confirmPayment);

/**
 * @route   POST /api/v1/payments/refund
 * @desc    Create refund for an order
 * @access  Private (Customer)
 */
router.post('/refund', protect, createRefundValidation, createRefund);

/**
 * @route   POST /api/v1/payments/retry
 * @desc    Retry failed payment
 * @access  Private (Customer)
 */
router.post('/retry', protect, retryPaymentValidation, retryPayment);

/**
 * @route   POST /api/v1/payments/webhook
 * @desc    Handle Stripe webhooks
 * @access  Public (Stripe only)
 * @note    This endpoint should be secured by Stripe signature verification
 */
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;