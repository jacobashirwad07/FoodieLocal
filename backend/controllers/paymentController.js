const paymentService = require('../services/paymentService');
const Order = require('../models/Order');
const { validationResult } = require('express-validator');

/**
 * Create payment intent for an order
 */
const createPaymentIntent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array()
        }
      });
    }

    const { orderId, amount, currency = 'usd' } = req.body;
    const customerId = req.user.id;

    // Verify order exists and belongs to the user
    const order = await Order.findOne({ _id: orderId, customerId });
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found or access denied'
        }
      });
    }

    // Check if order is in correct status for payment
    if (order.status !== 'pending' && order.paymentStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ORDER_STATUS',
          message: 'Order is not eligible for payment'
        }
      });
    }

    // Verify amount matches order total
    if (Math.abs(amount - order.finalAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'AMOUNT_MISMATCH',
          message: 'Payment amount does not match order total'
        }
      });
    }

    // Create payment intent
    const result = await paymentService.createPaymentIntent({
      amount,
      currency,
      metadata: {
        orderId: order._id.toString(),
        customerId: customerId,
        chefId: order.items[0]?.chefId?.toString() || ''
      }
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    // Update order with payment intent ID
    order.paymentIntentId = result.data.paymentIntentId;
    await order.save();

    res.status(200).json({
      success: true,
      data: {
        clientSecret: result.data.clientSecret,
        paymentIntentId: result.data.paymentIntentId,
        amount: result.data.amount,
        currency: result.data.currency
      }
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create payment intent'
      }
    });
  }
};

/**
 * Confirm payment for an order
 */
const confirmPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array()
        }
      });
    }

    const { paymentIntentId } = req.body;
    const customerId = req.user.id;

    // Find order by payment intent ID
    const order = await Order.findOne({ paymentIntentId, customerId });
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found for this payment'
        }
      });
    }

    // Get payment status from Stripe
    const result = await paymentService.getPaymentIntent(paymentIntentId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    const { status } = result.data;

    // Update order based on payment status
    if (status === 'succeeded') {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      await order.save();

      res.status(200).json({
        success: true,
        data: {
          orderId: order._id,
          paymentStatus: order.paymentStatus,
          orderStatus: order.status,
          paymentIntentId
        }
      });
    } else if (status === 'requires_payment_method' || status === 'requires_confirmation') {
      res.status(400).json({
        success: false,
        error: {
          code: 'PAYMENT_INCOMPLETE',
          message: 'Payment requires additional action',
          details: { status }
        }
      });
    } else if (status === 'canceled' || status === 'payment_failed') {
      order.paymentStatus = 'failed';
      await order.save();

      res.status(400).json({
        success: false,
        error: {
          code: 'PAYMENT_FAILED',
          message: 'Payment was unsuccessful',
          details: { status }
        }
      });
    } else {
      res.status(200).json({
        success: true,
        data: {
          orderId: order._id,
          paymentStatus: order.paymentStatus,
          paymentIntentStatus: status,
          paymentIntentId
        }
      });
    }

  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to confirm payment'
      }
    });
  }
};

/**
 * Create refund for an order
 */
const createRefund = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array()
        }
      });
    }

    const { orderId, amount, reason = 'requested_by_customer' } = req.body;
    const customerId = req.user.id;

    // Find and verify order
    const order = await Order.findOne({ _id: orderId, customerId });
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found or access denied'
        }
      });
    }

    // Check if order is eligible for refund
    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYMENT_STATUS',
          message: 'Order payment is not eligible for refund'
        }
      });
    }

    if (!order.paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PAYMENT_INTENT',
          message: 'No payment intent found for this order'
        }
      });
    }

    // Validate refund amount
    const refundAmount = amount || order.finalAmount;
    if (refundAmount > order.finalAmount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REFUND_AMOUNT',
          message: 'Refund amount cannot exceed order total'
        }
      });
    }

    // Create refund
    const result = await paymentService.createRefund(order.paymentIntentId, {
      amount: refundAmount,
      reason,
      metadata: {
        orderId: order._id.toString(),
        customerId: customerId
      }
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    // Update order status
    order.paymentStatus = 'refunded';
    order.status = 'cancelled';
    order.cancellationReason = reason;
    await order.save();

    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        refundId: result.data.refundId,
        refundAmount: result.data.amount / 100, // Convert back from cents
        refundStatus: result.data.status,
        orderStatus: order.status,
        paymentStatus: order.paymentStatus
      }
    });

  } catch (error) {
    console.error('Error creating refund:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create refund'
      }
    });
  }
};

/**
 * Retry failed payment
 */
const retryPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array()
        }
      });
    }

    const { orderId } = req.body;
    const customerId = req.user.id;

    // Find and verify order
    const order = await Order.findOne({ _id: orderId, customerId });
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found or access denied'
        }
      });
    }

    if (!order.paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PAYMENT_INTENT',
          message: 'No payment intent found for this order'
        }
      });
    }

    // Check if order is eligible for retry
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAYMENT_ALREADY_SUCCESSFUL',
          message: 'Payment has already been completed'
        }
      });
    }

    // Retry payment
    const result = await paymentService.retryPayment(order.paymentIntentId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    // Update order if payment succeeded
    if (result.data.status === 'succeeded') {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      await order.save();
    }

    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        paymentIntentId: order.paymentIntentId,
        paymentStatus: result.data.status === 'succeeded' ? 'paid' : order.paymentStatus,
        orderStatus: result.data.status === 'succeeded' ? 'confirmed' : order.status,
        retriesUsed: result.data.retriesUsed
      }
    });

  } catch (error) {
    console.error('Error retrying payment:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retry payment'
      }
    });
  }
};

/**
 * Handle Stripe webhooks
 */
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_SIGNATURE',
          message: 'Stripe signature header is missing'
        }
      });
    }

    // Process webhook
    const result = await paymentService.handleWebhook(payload, signature);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    const { eventType, eventData } = result.data;

    // Handle different event types
    switch (eventType) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(eventData.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(eventData.object);
        break;
      case 'payment_intent.canceled':
        await handlePaymentCanceled(eventData.object);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'WEBHOOK_PROCESSING_ERROR',
        message: 'Failed to process webhook'
      }
    });
  }
};

/**
 * Handle successful payment webhook
 */
const handlePaymentSucceeded = async (paymentIntent) => {
  try {
    const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
    if (order && order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      await order.save();
      console.log(`Payment succeeded for order: ${order._id}`);
    }
  } catch (error) {
    console.error('Error handling payment succeeded webhook:', error);
  }
};

/**
 * Handle failed payment webhook
 */
const handlePaymentFailed = async (paymentIntent) => {
  try {
    const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
    if (order && order.paymentStatus !== 'failed') {
      order.paymentStatus = 'failed';
      await order.save();
      console.log(`Payment failed for order: ${order._id}`);
    }
  } catch (error) {
    console.error('Error handling payment failed webhook:', error);
  }
};

/**
 * Handle canceled payment webhook
 */
const handlePaymentCanceled = async (paymentIntent) => {
  try {
    const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
    if (order && order.status !== 'cancelled') {
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      order.cancellationReason = 'payment_canceled';
      await order.save();
      console.log(`Payment canceled for order: ${order._id}`);
    }
  } catch (error) {
    console.error('Error handling payment canceled webhook:', error);
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  createRefund,
  retryPayment,
  handleWebhook
};