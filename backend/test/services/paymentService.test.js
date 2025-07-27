const paymentService = require('../../services/paymentService');
const { getDummyCredentials } = require('../../utils/dummyPaymentCredentials');

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn(() => ({
    paymentIntents: {
      create: jest.fn(),
      confirm: jest.fn(),
      retrieve: jest.fn()
    },
    refunds: {
      create: jest.fn()
    },
    webhooks: {
      constructEvent: jest.fn()
    }
  }));
});

const stripe = require('stripe')();

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        amount: 2000,
        currency: 'usd',
        status: 'requires_payment_method'
      };

      stripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const orderData = {
        amount: 20.00,
        currency: 'usd',
        metadata: {
          orderId: 'order123',
          customerId: 'customer123'
        }
      };

      const result = await paymentService.createPaymentIntent(orderData);

      expect(result.success).toBe(true);
      expect(result.data.clientSecret).toBe('pi_test123_secret');
      expect(result.data.paymentIntentId).toBe('pi_test123');
      expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 2000,
        currency: 'usd',
        metadata: {
          orderId: 'order123',
          customerId: 'customer123'
        },
        automatic_payment_methods: {
          enabled: true
        }
      });
    });

    it('should handle payment intent creation failure', async () => {
      const error = new Error('Payment intent creation failed');
      stripe.paymentIntents.create.mockRejectedValue(error);

      const orderData = {
        amount: 20.00,
        currency: 'usd'
      };

      const result = await paymentService.createPaymentIntent(orderData);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('PAYMENT_INTENT_CREATION_FAILED');
      expect(result.error.message).toBe('Payment intent creation failed');
    });
  });

  describe('confirmPaymentIntent', () => {
    it('should confirm payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        amount: 2000,
        currency: 'usd',
        charges: {
          data: [{ id: 'ch_test123' }]
        }
      };

      stripe.paymentIntents.confirm.mockResolvedValue(mockPaymentIntent);

      const result = await paymentService.confirmPaymentIntent('pi_test123');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('succeeded');
      expect(result.data.paymentIntentId).toBe('pi_test123');
    });

    it('should handle payment confirmation failure', async () => {
      const error = new Error('Payment confirmation failed');
      stripe.paymentIntents.confirm.mockRejectedValue(error);

      const result = await paymentService.confirmPaymentIntent('pi_test123');

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('PAYMENT_CONFIRMATION_FAILED');
    });
  });

  describe('getPaymentIntent', () => {
    it('should retrieve payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        amount: 2000,
        currency: 'usd',
        metadata: { orderId: 'order123' },
        charges: {
          data: [{ id: 'ch_test123' }]
        }
      };

      stripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const result = await paymentService.getPaymentIntent('pi_test123');

      expect(result.success).toBe(true);
      expect(result.data.paymentIntentId).toBe('pi_test123');
      expect(result.data.status).toBe('succeeded');
    });

    it('should handle payment intent retrieval failure', async () => {
      const error = new Error('Payment intent not found');
      stripe.paymentIntents.retrieve.mockRejectedValue(error);

      const result = await paymentService.getPaymentIntent('pi_invalid');

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('PAYMENT_RETRIEVAL_FAILED');
    });
  });

  describe('createRefund', () => {
    it('should create refund successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        charges: {
          data: [{ id: 'ch_test123' }]
        }
      };

      const mockRefund = {
        id: 'ref_test123',
        amount: 1000,
        currency: 'usd',
        status: 'succeeded',
        reason: 'requested_by_customer'
      };

      stripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      stripe.refunds.create.mockResolvedValue(mockRefund);

      const result = await paymentService.createRefund('pi_test123', {
        amount: 10.00,
        reason: 'requested_by_customer'
      });

      expect(result.success).toBe(true);
      expect(result.data.refundId).toBe('ref_test123');
      expect(result.data.amount).toBe(1000);
    });

    it('should handle refund creation failure', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        charges: {
          data: []
        }
      };

      stripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const result = await paymentService.createRefund('pi_test123');

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('REFUND_CREATION_FAILED');
    });
  });

  describe('handleWebhook', () => {
    it('should handle webhook successfully', async () => {
      const mockEvent = {
        id: 'evt_test123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            status: 'succeeded'
          }
        }
      };

      stripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = await paymentService.handleWebhook('payload', 'signature');

      expect(result.success).toBe(true);
      expect(result.data.eventType).toBe('payment_intent.succeeded');
    });

    it('should handle webhook processing failure', async () => {
      const error = new Error('Invalid signature');
      stripe.webhooks.constructEvent.mockImplementation(() => {
        throw error;
      });

      const result = await paymentService.handleWebhook('payload', 'invalid_signature');

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('WEBHOOK_PROCESSING_FAILED');
    });
  });

  describe('retryPayment', () => {
    it('should retry payment successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        amount: 2000,
        currency: 'usd'
      };

      stripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const result = await paymentService.retryPayment('pi_test123');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('succeeded');
      expect(result.data.retriesUsed).toBe(0);
    });

    it('should exhaust retries and fail', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'requires_payment_method',
        amount: 2000,
        currency: 'usd'
      };

      stripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      stripe.paymentIntents.confirm.mockRejectedValue(new Error('Payment failed'));

      const result = await paymentService.retryPayment('pi_test123', 2);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('PAYMENT_RETRY_EXHAUSTED');
    });
  });

  describe('Integration with dummy credentials', () => {
    it('should work with dummy successful payment scenario', async () => {
      const dummyCredentials = getDummyCredentials('successfulPayment');
      
      expect(dummyCredentials.scenario.expectedOutcome).toBe('success');
      expect(dummyCredentials.card.number).toBe('4242424242424242');
      expect(dummyCredentials.customer.email).toBe('test@example.com');
    });

    it('should work with dummy declined payment scenario', async () => {
      const dummyCredentials = getDummyCredentials('declinedPayment');
      
      expect(dummyCredentials.scenario.expectedOutcome).toBe('declined');
      expect(dummyCredentials.card.number).toBe('4000000000000002');
    });
  });
});