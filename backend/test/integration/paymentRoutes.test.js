const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const Order = require('../../models/Order');
const { generateToken } = require('../../utils/auth');
const { getDummyCredentials, getDummyLoginCredentials } = require('../../utils/dummyPaymentCredentials');

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

describe('Payment Routes', () => {
  let customerToken;
  let customerId;
  let testOrder;

  beforeEach(async () => {
    // Create test customer
    const dummyCredentials = getDummyLoginCredentials();
    const customer = new User({
      name: dummyCredentials.customer.name,
      email: dummyCredentials.customer.email,
      password: dummyCredentials.customer.password,
      role: 'customer',
      location: {
        type: 'Point',
        coordinates: [-74.006, 40.7128]
      },
      address: {
        street: '123 Test St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      },
      isEmailVerified: true,
      isActive: true
    });
    await customer.save();

    customerId = customer._id;
    customerToken = generateToken(customer._id);

    // Create test order
    testOrder = new Order({
      customerId: customerId,
      items: [{
        mealId: '507f1f77bcf86cd799439011',
        chefId: '507f1f77bcf86cd799439012',
        quantity: 2,
        price: 15.00,
        specialInstructions: 'Extra spicy'
      }],
      totalAmount: 30.00,
      deliveryFee: 5.00,
      tax: 2.50,
      finalAmount: 37.50,
      deliveryAddress: {
        street: '123 Test St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        coordinates: [-74.006, 40.7128]
      },
      deliveryType: 'delivery',
      status: 'pending',
      paymentStatus: 'pending'
    });
    await testOrder.save();

    jest.clearAllMocks();
  });

  describe('POST /api/v1/payments/create-intent', () => {
    it('should create payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        amount: 3750,
        currency: 'usd',
        status: 'requires_payment_method'
      };

      stripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: testOrder._id,
          amount: 37.50,
          currency: 'usd'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.clientSecret).toBe('pi_test123_secret');
      expect(response.body.data.paymentIntentId).toBe('pi_test123');

      // Verify order was updated
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.paymentIntentId).toBe('pi_test123');
    });

    it('should fail with invalid order ID', async () => {
      const response = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: '507f1f77bcf86cd799439999',
          amount: 37.50
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ORDER_NOT_FOUND');
    });

    it('should fail with amount mismatch', async () => {
      const response = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: testOrder._id,
          amount: 50.00 // Wrong amount
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AMOUNT_MISMATCH');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/payments/create-intent')
        .send({
          orderId: testOrder._id,
          amount: 37.50
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should handle Stripe errors', async () => {
      stripe.paymentIntents.create.mockRejectedValue(new Error('Stripe API error'));

      const response = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: testOrder._id,
          amount: 37.50
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/payments/confirm', () => {
    beforeEach(async () => {
      // Set payment intent ID on test order
      testOrder.paymentIntentId = 'pi_test123';
      await testOrder.save();
    });

    it('should confirm payment successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        amount: 3750,
        currency: 'usd',
        metadata: { orderId: testOrder._id.toString() }
      };

      stripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/api/v1/payments/confirm')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          paymentIntentId: 'pi_test123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentStatus).toBe('paid');
      expect(response.body.data.orderStatus).toBe('confirmed');

      // Verify order was updated
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.paymentStatus).toBe('paid');
      expect(updatedOrder.status).toBe('confirmed');
    });

    it('should handle failed payment', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'payment_failed',
        amount: 3750,
        currency: 'usd'
      };

      stripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/api/v1/payments/confirm')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          paymentIntentId: 'pi_test123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PAYMENT_FAILED');

      // Verify order was updated
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.paymentStatus).toBe('failed');
    });

    it('should fail with invalid payment intent ID format', async () => {
      const response = await request(app)
        .post('/api/v1/payments/confirm')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          paymentIntentId: 'invalid_format'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/payments/refund', () => {
    beforeEach(async () => {
      // Set order as paid
      testOrder.paymentStatus = 'paid';
      testOrder.paymentIntentId = 'pi_test123';
      await testOrder.save();
    });

    it('should create refund successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        charges: {
          data: [{ id: 'ch_test123' }]
        }
      };

      const mockRefund = {
        id: 'ref_test123',
        amount: 3750,
        currency: 'usd',
        status: 'succeeded',
        reason: 'requested_by_customer'
      };

      stripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      stripe.refunds.create.mockResolvedValue(mockRefund);

      const response = await request(app)
        .post('/api/v1/payments/refund')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: testOrder._id,
          reason: 'requested_by_customer'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.refundId).toBe('ref_test123');
      expect(response.body.data.paymentStatus).toBe('refunded');

      // Verify order was updated
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.paymentStatus).toBe('refunded');
      expect(updatedOrder.status).toBe('cancelled');
    });

    it('should fail for unpaid order', async () => {
      // Set order as pending
      testOrder.paymentStatus = 'pending';
      await testOrder.save();

      const response = await request(app)
        .post('/api/v1/payments/refund')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: testOrder._id
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PAYMENT_STATUS');
    });

    it('should fail with excessive refund amount', async () => {
      const response = await request(app)
        .post('/api/v1/payments/refund')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: testOrder._id,
          amount: 100.00 // More than order total
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_REFUND_AMOUNT');
    });
  });

  describe('POST /api/v1/payments/retry', () => {
    beforeEach(async () => {
      // Set order as failed
      testOrder.paymentStatus = 'failed';
      testOrder.paymentIntentId = 'pi_test123';
      await testOrder.save();
    });

    it('should retry payment successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        amount: 3750,
        currency: 'usd'
      };

      stripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/api/v1/payments/retry')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: testOrder._id
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentStatus).toBe('paid');
      expect(response.body.data.orderStatus).toBe('confirmed');

      // Verify order was updated
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.paymentStatus).toBe('paid');
      expect(updatedOrder.status).toBe('confirmed');
    });

    it('should fail for already successful payment', async () => {
      // Set order as paid
      testOrder.paymentStatus = 'paid';
      await testOrder.save();

      const response = await request(app)
        .post('/api/v1/payments/retry')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: testOrder._id
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PAYMENT_ALREADY_SUCCESSFUL');
    });
  });

  describe('POST /api/v1/payments/webhook', () => {
    it('should handle payment succeeded webhook', async () => {
      const mockEvent = {
        id: 'evt_test123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            status: 'succeeded',
            metadata: { orderId: testOrder._id.toString() }
          }
        }
      };

      stripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      // Set payment intent ID on order
      testOrder.paymentIntentId = 'pi_test123';
      await testOrder.save();

      const response = await request(app)
        .post('/api/v1/payments/webhook')
        .set('stripe-signature', 'test_signature')
        .send('webhook_payload');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify order was updated
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.paymentStatus).toBe('paid');
      expect(updatedOrder.status).toBe('confirmed');
    });

    it('should handle payment failed webhook', async () => {
      const mockEvent = {
        id: 'evt_test123',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test123',
            status: 'payment_failed'
          }
        }
      };

      stripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      // Set payment intent ID on order
      testOrder.paymentIntentId = 'pi_test123';
      await testOrder.save();

      const response = await request(app)
        .post('/api/v1/payments/webhook')
        .set('stripe-signature', 'test_signature')
        .send('webhook_payload');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify order was updated
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.paymentStatus).toBe('failed');
    });

    it('should fail without signature', async () => {
      const response = await request(app)
        .post('/api/v1/payments/webhook')
        .send('webhook_payload');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_SIGNATURE');
    });

    it('should handle invalid signature', async () => {
      stripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const response = await request(app)
        .post('/api/v1/payments/webhook')
        .set('stripe-signature', 'invalid_signature')
        .send('webhook_payload');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Integration with dummy credentials', () => {
    it('should work with dummy successful payment credentials', async () => {
      const dummyCredentials = getDummyCredentials('successfulPayment');
      
      // Mock successful payment intent creation
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        amount: 3750,
        currency: 'usd',
        status: 'requires_payment_method'
      };

      stripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: testOrder._id,
          amount: 37.50,
          currency: 'usd'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify dummy credentials are available
      expect(dummyCredentials.card.number).toBe('4242424242424242');
      expect(dummyCredentials.scenario.expectedOutcome).toBe('success');
    });

    it('should work with dummy declined payment credentials', async () => {
      const dummyCredentials = getDummyCredentials('declinedPayment');
      
      expect(dummyCredentials.card.number).toBe('4000000000000002');
      expect(dummyCredentials.scenario.expectedOutcome).toBe('declined');
    });
  });
});