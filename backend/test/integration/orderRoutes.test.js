const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { User } = require('../../models/User');
const { Chef } = require('../../models/Chef');
const { Meal } = require('../../models/Meal');
const { Cart } = require('../../models/Cart');
const { Order } = require('../../models/Order');
const { generateToken } = require('../../utils/auth');

// Create app without starting server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount order routes
app.use('/api/v1/orders', require('../../routes/orders'));

// Global error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong'
    }
  });
});

describe('Order Routes', () => {
  let mongoServer;
  let testUser;
  let testChef;
  let testMeal;
  let authToken;
  let chefToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await Chef.deleteMany({});
    await Meal.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});

    // Create test user
    testUser = await User.create({
      name: 'Test Customer',
      email: 'customer@test.com',
      password: 'password123',
      phone: '+1234567890',
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

    // Create test chef user
    const chefUser = await User.create({
      name: 'Test Chef',
      email: 'chef@test.com',
      password: 'password123',
      phone: '+1234567891',
      role: 'chef',
      location: {
        type: 'Point',
        coordinates: [-74.005, 40.7127]
      },
      address: {
        street: '456 Chef St',
        city: 'New York',
        state: 'NY',
        zipCode: '10002'
      },
      isEmailVerified: true,
      isActive: true
    });

    // Create test chef
    testChef = await Chef.create({
      userId: chefUser._id,
      businessName: 'Test Kitchen',
      description: 'Delicious home-cooked meals',
      specialties: ['indian', 'italian'],
      kitchenLicense: 'LICENSE123',
      serviceRadius: 10,
      serviceArea: {
        type: 'Point',
        coordinates: [-74.005, 40.7127]
      },
      status: 'approved',
      availability: {
        isActive: true,
        schedule: [{
          day: 'monday',
          startTime: '09:00',
          endTime: '21:00'
        }]
      },
      bankDetails: {
        accountNumber: '1234567890',
        routingNumber: '123456789',
        accountHolderName: 'Test Chef'
      }
    });

    // Create test meal
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    testMeal = await Meal.create({
      chefId: testChef._id,
      name: 'Test Meal',
      description: 'A delicious test meal for testing purposes',
      price: 15.99,
      preparationTime: 30,
      servingSize: 2,
      cuisine: 'indian',
      dietaryTags: ['vegetarian'],
      ingredients: ['rice', 'vegetables', 'spices'],
      images: ['https://example.com/meal1.jpg'],
      availability: {
        date: today,
        startTime: '00:00',
        endTime: '23:59',
        quantity: 10,
        remainingQuantity: 10
      },
      isActive: true
    });

    // Generate auth tokens
    authToken = generateToken({
      id: testUser._id,
      email: testUser.email,
      role: testUser.role
    });

    chefToken = generateToken({
      id: chefUser._id,
      email: chefUser.email,
      role: chefUser.role
    });
  });

  describe('POST /api/v1/orders', () => {
    beforeEach(async () => {
      // Create cart with items
      await Cart.create({
        customerId: testUser._id,
        items: [{
          mealId: testMeal._id,
          chefId: testChef._id,
          quantity: 2,
          price: testMeal.price,
          specialInstructions: 'Extra spicy'
        }],
        deliveryType: 'delivery',
        deliveryAddress: {
          street: '123 Test St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: [-74.006, 40.7128]
        }
      });
    });

    it('should create order from cart successfully', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentIntentId: 'pi_test123',
          customerNotes: 'Please ring doorbell'
        });

      if (response.status !== 201) {
        console.log('Response status:', response.status);
        console.log('Response body:', JSON.stringify(response.body, null, 2));
        throw new Error(`Expected 201, got ${response.status}: ${JSON.stringify(response.body)}`);
      }
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].items).toHaveLength(1);
      expect(response.body.data.orders[0].items[0].quantity).toBe(2);
      expect(response.body.data.orders[0].status).toBe('pending');
      expect(response.body.data.orders[0].paymentStatus).toBe('paid');
      expect(response.body.data.summary.totalOrders).toBe(1);

      // Verify cart is cleared
      const cart = await Cart.findOne({ customerId: testUser._id });
      expect(cart.items).toHaveLength(0);

      // Verify meal quantity is reduced
      const meal = await Meal.findById(testMeal._id);
      expect(meal.availability.remainingQuantity).toBe(8); // 10 - 2
    });

    it('should handle empty cart', async () => {
      // Clear cart first
      await Cart.deleteOne({ customerId: testUser._id });

      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMPTY_CART');
    });

    it('should handle unavailable items', async () => {
      // Make meal unavailable
      testMeal.availability.remainingQuantity = 0;
      await testMeal.save();

      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ITEMS_UNAVAILABLE');
    });

    it('should handle incomplete delivery address', async () => {
      // Update cart with incomplete address
      await Cart.updateOne(
        { customerId: testUser._id },
        { 
          $unset: { 'deliveryAddress.coordinates': 1 }
        }
      );

      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INCOMPLETE_DELIVERY_ADDRESS');
    });

    it('should create multiple orders for multiple chefs', async () => {
      // Create second chef and meal
      const chef2User = await User.create({
        name: 'Test Chef 2',
        email: 'chef2@test.com',
        password: 'password123',
        phone: '+1234567892',
        role: 'chef',
        location: {
          type: 'Point',
          coordinates: [-74.004, 40.7126]
        },
        address: {
          street: '789 Chef Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10003'
        },
        isEmailVerified: true,
        isActive: true
      });

      const chef2 = await Chef.create({
        userId: chef2User._id,
        businessName: 'Test Kitchen 2',
        description: 'More delicious meals',
        specialties: ['chinese'],
        kitchenLicense: 'LICENSE456',
        serviceRadius: 10,
        serviceArea: {
          type: 'Point',
          coordinates: [-74.004, 40.7126]
        },
        status: 'approved',
        availability: {
          isActive: true,
          schedule: [{
            day: 'monday',
            startTime: '09:00',
            endTime: '21:00'
          }]
        },
        bankDetails: {
          accountNumber: '0987654321',
          routingNumber: '987654321',
          accountHolderName: 'Test Chef 2'
        }
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const meal2 = await Meal.create({
        chefId: chef2._id,
        name: 'Test Meal 2',
        description: 'Another delicious test meal',
        price: 12.99,
        preparationTime: 25,
        servingSize: 1,
        cuisine: 'chinese',
        dietaryTags: ['vegetarian'],
        ingredients: ['noodles', 'vegetables'],
        images: ['https://example.com/meal2.jpg'],
        availability: {
          date: tomorrow,
          startTime: '10:00',
          endTime: '20:00',
          quantity: 5,
          remainingQuantity: 5
        },
        isActive: true
      });

      // Add second chef's meal to cart
      await Cart.updateOne(
        { customerId: testUser._id },
        {
          $push: {
            items: {
              mealId: meal2._id,
              chefId: chef2._id,
              quantity: 1,
              price: meal2.price
            }
          }
        }
      );

      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(2);
      expect(response.body.data.summary.totalOrders).toBe(2);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/v1/orders')
        .send({})
        .expect(401);
    });
  });

  describe('GET /api/v1/orders', () => {
    beforeEach(async () => {
      // Create test orders
      await Order.create({
        customerId: testUser._id,
        items: [{
          mealId: testMeal._id,
          chefId: testChef._id,
          quantity: 1,
          price: testMeal.price
        }],
        totalAmount: testMeal.price,
        deliveryFee: 2.50,
        tax: 1.28,
        finalAmount: testMeal.price + 2.50 + 1.28,
        deliveryAddress: {
          street: '123 Test St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: [-74.006, 40.7128]
        },
        deliveryType: 'delivery',
        status: 'pending'
      });
    });

    it('should get customer orders', async () => {
      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].customerId).toBe(testUser._id.toString());
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/v1/orders?status=pending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].status).toBe('pending');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/orders?limit=1&skip=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.pagination.skip).toBe(0);
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        customerId: testUser._id,
        items: [{
          mealId: testMeal._id,
          chefId: testChef._id,
          quantity: 1,
          price: testMeal.price
        }],
        totalAmount: testMeal.price,
        deliveryFee: 2.50,
        tax: 1.28,
        finalAmount: testMeal.price + 2.50 + 1.28,
        deliveryAddress: {
          street: '123 Test St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: [-74.006, 40.7128]
        },
        deliveryType: 'delivery',
        status: 'pending'
      });
    });

    it('should get order by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order._id).toBe(testOrder._id.toString());
      expect(response.body.data.order.customerId._id).toBe(testUser._id.toString());
    });

    it('should handle non-existent order', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/v1/orders/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ORDER_NOT_FOUND');
    });

    it('should validate order ID format', async () => {
      const response = await request(app)
        .get('/api/v1/orders/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ORDER_ID');
    });
  });

  describe('POST /api/v1/orders/:id/cancel', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        customerId: testUser._id,
        items: [{
          mealId: testMeal._id,
          chefId: testChef._id,
          quantity: 2,
          price: testMeal.price
        }],
        totalAmount: testMeal.price * 2,
        deliveryFee: 2.50,
        tax: 2.56,
        finalAmount: (testMeal.price * 2) + 2.50 + 2.56,
        deliveryAddress: {
          street: '123 Test St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: [-74.006, 40.7128]
        },
        deliveryType: 'delivery',
        status: 'pending'
      });

      // Reduce meal quantity to simulate order creation
      testMeal.availability.remainingQuantity = 8;
      await testMeal.save();
    });

    it('should cancel order successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/orders/${testOrder._id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Changed my mind' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe('cancelled');
      expect(response.body.data.order.cancellationReason).toBe('Changed my mind');
      expect(response.body.data.order.paymentStatus).toBe('refunded');

      // Verify meal quantity is restored
      const meal = await Meal.findById(testMeal._id);
      expect(meal.availability.remainingQuantity).toBe(10); // 8 + 2
    });

    it('should not cancel order with non-cancellable status', async () => {
      // Update order status to preparing
      testOrder.status = 'preparing';
      await testOrder.save();

      const response = await request(app)
        .post(`/api/v1/orders/${testOrder._id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Changed my mind' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ORDER_NOT_CANCELLABLE');
    });
  });

  describe('GET /api/v1/orders/:id/tracking', () => {
    let testOrder;

    beforeEach(async () => {
      const estimatedTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      testOrder = await Order.create({
        customerId: testUser._id,
        items: [{
          mealId: testMeal._id,
          chefId: testChef._id,
          quantity: 1,
          price: testMeal.price
        }],
        totalAmount: testMeal.price,
        deliveryFee: 2.50,
        tax: 1.28,
        finalAmount: testMeal.price + 2.50 + 1.28,
        deliveryAddress: {
          street: '123 Test St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: [-74.006, 40.7128]
        },
        deliveryType: 'delivery',
        status: 'preparing',
        estimatedDeliveryTime: estimatedTime
      });
    });

    it('should get order tracking information', async () => {
      const response = await request(app)
        .get(`/api/v1/orders/${testOrder._id}/tracking`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tracking.orderId).toBe(testOrder._id.toString());
      expect(response.body.data.tracking.status).toBe('preparing');
      expect(response.body.data.tracking.deliveryType).toBe('delivery');
      expect(response.body.data.tracking.timeRemaining).toBeGreaterThan(0);
    });
  });
});