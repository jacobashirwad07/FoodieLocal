// Initialize Stripe with test key if in test environment
const stripeKey = process.env.STRIPE_SECRET_KEY || 
  (process.env.NODE_ENV === 'test' ? 'sk_test_dummy_key_for_testing' : null);

if (!stripeKey) {
  throw new Error(
    'STRIPE_SECRET_KEY environment variable is required. ' +
    'Set STRIPE_SECRET_KEY in your environment (.env file). ' +
    'For tests, use sk_test_dummy_key_for_testing.'
  );
}

const stripe = require('stripe')(stripeKey);

class PaymentService {
  /**
   * Create a payment intent for an order
   * @param {Object} orderData - Order data including amount and metadata
   * @returns {Object} Payment intent object
   */
  async createPaymentIntent(orderData) {
    try {
      const { amount, currency = 'usd', metadata = {} } = orderData;
      
      // Convert amount to cents (Stripe expects amounts in smallest currency unit)
      const amountInCents = Math.round(amount * 100);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        metadata: {
          orderId: metadata.orderId || '',
          customerId: metadata.customerId || '',
          chefId: metadata.chefId || '',
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status
        }
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return {
        success: false,
        error: {
          code: 'PAYMENT_INTENT_CREATION_FAILED',
          message: error.message || 'Failed to create payment intent',
          details: error
        }
      };
    }
  }

  /**
   * Confirm a payment intent
   * @param {string} paymentIntentId - Payment intent ID
   * @param {Object} confirmationData - Additional confirmation data
   * @returns {Object} Confirmation result
   */
  async confirmPaymentIntent(paymentIntentId, confirmationData = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        ...confirmationData
      });

      return {
        success: true,
        data: {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          charges: paymentIntent.charges?.data || []
        }
      };
    } catch (error) {
      console.error('Error confirming payment intent:', error);
      return {
        success: false,
        error: {
          code: 'PAYMENT_CONFIRMATION_FAILED',
          message: error.message || 'Failed to confirm payment',
          details: error
        }
      };
    }
  }

  /**
   * Retrieve payment intent details
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Object} Payment intent details
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        success: true,
        data: {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata,
          charges: paymentIntent.charges?.data || []
        }
      };
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      return {
        success: false,
        error: {
          code: 'PAYMENT_RETRIEVAL_FAILED',
          message: error.message || 'Failed to retrieve payment details',
          details: error
        }
      };
    }
  }

  /**
   * Create a refund for a payment
   * @param {string} paymentIntentId - Payment intent ID
   * @param {Object} refundData - Refund data including amount and reason
   * @returns {Object} Refund result
   */
  async createRefund(paymentIntentId, refundData = {}) {
    try {
      const { amount, reason = 'requested_by_customer', metadata = {} } = refundData;
      
      // Get the payment intent to find the charge
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (!paymentIntent.charges?.data?.length) {
        throw new Error('No charges found for this payment intent');
      }

      const chargeId = paymentIntent.charges.data[0].id;
      
      const refundParams = {
        charge: chargeId,
        reason,
        metadata
      };

      // If amount is specified, add it (in cents)
      if (amount) {
        refundParams.amount = Math.round(amount * 100);
      }

      const refund = await stripe.refunds.create(refundParams);

      return {
        success: true,
        data: {
          refundId: refund.id,
          amount: refund.amount,
          currency: refund.currency,
          status: refund.status,
          reason: refund.reason
        }
      };
    } catch (error) {
      console.error('Error creating refund:', error);
      return {
        success: false,
        error: {
          code: 'REFUND_CREATION_FAILED',
          message: error.message || 'Failed to create refund',
          details: error
        }
      };
    }
  }

  /**
   * Handle webhook events from Stripe
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - Stripe signature header
   * @returns {Object} Webhook processing result
   */
  async handleWebhook(payload, signature) {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      return {
        success: true,
        data: {
          eventId: event.id,
          eventType: event.type,
          eventData: event.data
        }
      };
    } catch (error) {
      console.error('Error handling webhook:', error);
      return {
        success: false,
        error: {
          code: 'WEBHOOK_PROCESSING_FAILED',
          message: error.message || 'Failed to process webhook',
          details: error
        }
      };
    }
  }

  /**
   * Retry a failed payment with exponential backoff
   * @param {string} paymentIntentId - Payment intent ID
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Object} Retry result
   */
  async retryPayment(paymentIntentId, maxRetries = 3) {
    let attempt = 0;
    let lastError = null;

    while (attempt < maxRetries) {
      try {
        // Wait before retry (exponential backoff)
        if (attempt > 0) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const result = await this.getPaymentIntent(paymentIntentId);
        
        if (result.success) {
          const { status } = result.data;
          
          if (status === 'succeeded') {
            return {
              success: true,
              data: {
                paymentIntentId,
                status,
                retriesUsed: attempt
              }
            };
          } else if (status === 'requires_payment_method' || status === 'requires_confirmation') {
            // Payment can be retried
            const confirmResult = await this.confirmPaymentIntent(paymentIntentId);
            
            if (confirmResult.success && confirmResult.data.status === 'succeeded') {
              return {
                success: true,
                data: {
                  paymentIntentId,
                  status: confirmResult.data.status,
                  retriesUsed: attempt + 1
                }
              };
            }
          }
        }

        lastError = result.error || new Error('Payment retry failed');
        attempt++;
      } catch (error) {
        lastError = error;
        attempt++;
      }
    }

    return {
      success: false,
      error: {
        code: 'PAYMENT_RETRY_EXHAUSTED',
        message: `Payment retry failed after ${maxRetries} attempts`,
        details: lastError
      }
    };
  }
}

module.exports = new PaymentService();