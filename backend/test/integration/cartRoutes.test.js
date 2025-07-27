const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { User } = require('../../models/User');
const { Chef } = require('../../models/Chef');
const { Meal } = require('../../models/Meal');
const { Cart } = require('../../models/Cart');
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

// Mount cart routes
app.use('/api/v1/cart', require('../../routes/cart'));

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

describe('Cart Routes', () => {
  let mongoServer;
  let testUser;
  let testChef;
  let testMeal;
  let authToken;

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

    // Create test user
    testUser = await User.create({
      name: 'Test Customer',
      email: 'customer@test.com',
      password: 'password123',
      phone: '+1234567890',
      role: 'customer',
      location: {
        type: 'Point',
        coordinates: [-74.006, 40.7128] // New York coordinates
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
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

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
        date: tomorrow,
        startTime: '10:00',
        endTime: '20:00',
        quantity: 10,
        remainingQuantity: 10
      },
      isActive: true
    });

    // Generate auth token
    authToken = generateToken({
      id: testUser._id,
      email: testUser.email,
      role: testUser.role
    });
  });

  describe('GET /api/v1/cart', () => {
    it('should get empty cart for new user', async () => {
      const response = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart).toBeDefined();
      expect(response.body.data.cart.items).toHaveLength(0);
      expect(response.body.data.cart.customerId).toBe(testUser._id.toString());
    });

    it('should get existing cart with items', async () => {
      // Create cart with items
      const cart = await Cart.create({
        customerId: testUser._id,
        items: [{
          mealId: testMeal._id,
          chefId: testChef._id,
          quantity: 2,
          price: testMeal.price,
          specialInstructions: 'Extra spicy'
        }]
      });

      const response = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.items[0].quantity).toBe(2);
      expect(response.body.data.cart.items[0].specialInstructions).toBe('Extra spicy');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/cart')
        .expect(401);
    });
  });

  describe('POST /api/v1/cart/items', () => {
    it('should add item to cart successfully', async () => {
      const itemData = {
        mealId: testMeal._id.toString(),
        chefId: testChef._id.toString(),
        quantity: 2,
        price: testMeal.price,
        specialInstructions: 'Extra spicy'
      };

      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(itemData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.items[0].quantity).toBe(2);
      expect(response.body.data.cart.items[0].specialInstructions).toBe('Extra spicy');
      expect(response.body.data.message).toBe('Item added to cart successfully');
    });

    it('should update quantity if item already exists in cart', async () => {
      // First add item
      const itemData = {
        mealId: testMeal._id.toString(),
        chefId: testChef._id.toString(),
        quantity: 1,
        price: testMeal.price
      };

      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(itemData);

      // Add same item again
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...itemData, quantity: 2 })
        .expect(201);

      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.items[0].quantity).toBe(3); // 1 + 2
    });

    it('should validate meal existence', async () => {
      const itemData = {
        mealId: new mongoose.Types.ObjectId().toString(),
        chefId: testChef._id.toString(),
        quantity: 1,
        price: 10.99
      };

      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(itemData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MEAL_NOT_FOUND');
    });

    it('should validate meal availability', async () => {
      // Make meal inactive
      testMeal.isActive = false;
      await testMeal.save();

      const itemData = {
        mealId: testMeal._id.toString(),
        chefId: testChef._id.toString(),
        quantity: 1,
        price: testMeal.price
      };

      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(itemData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MEAL_NOT_AVAILABLE');
    });

    it('should validate sufficient quantity', async () => {
      const itemData = {
        mealId: testMeal._id.toString(),
        chefId: testChef._id.toString(),
        quantity: 15, // More than available (10)
        price: testMeal.price
      };

      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(itemData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_QUANTITY');
    });

    it('should validate chef ID matches meal chef', async () => {
      const itemData = {
        mealId: testMeal._id.toString(),
        chefId: new mongoose.Types.ObjectId().toString(),
        quantity: 1,
        price: testMeal.price
      };

      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(itemData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CHEF_ID');
    });

    it('should validate price matches meal price', async () => {
      const itemData = {
        mealId: testMeal._id.toString(),
        chefId: testChef._id.toString(),
        quantity: 1,
        price: 99.99 // Wrong price
      };

      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(itemData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRICE_MISMATCH');
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}) // Empty body
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/v1/cart/items/:mealId', () => {
    beforeEach(async () => {
      // Create cart with item
      await Cart.create({
        customerId: testUser._id,
        items: [{
          mealId: testMeal._id,
          chefId: testChef._id,
          quantity: 2,
          price: testMeal.price,
          specialInstructions: 'Original instructions'
        }]
      });
    });

    it('should update item quantity successfully', async () => {
      const response = await request(app)
        .put(`/api/v1/cart/items/${testMeal._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 3 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items[0].quantity).toBe(3);
      expect(response.body.data.message).toBe('Cart item updated successfully');
    });

    it('should update special instructions', async () => {
      const response = await request(app)
        .put(`/api/v1/cart/items/${testMeal._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          quantity: 2,
          specialInstructions: 'Updated instructions'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items[0].specialInstructions).toBe('Updated instructions');
    });

    it('should remove item when quantity is 0', async () => {
      const response = await request(app)
        .put(`/api/v1/cart/items/${testMeal._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 0 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(0);
      expect(response.body.data.message).toBe('Item removed from cart');
    });

    it('should validate item exists in cart', async () => {
      const nonExistentMealId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .put(`/api/v1/cart/items/${nonExistentMealId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 1 })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ITEM_NOT_FOUND');
    });

    it('should validate meal availability for updated quantity', async () => {
      const response = await request(app)
        .put(`/api/v1/cart/items/${testMeal._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 15 }) // More than available
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_QUANTITY');
    });
  });

  describe('DELETE /api/v1/cart/items/:mealId', () => {
    beforeEach(async () => {
      // Create cart with item
      await Cart.create({
        customerId: testUser._id,
        items: [{
          mealId: testMeal._id,
          chefId: testChef._id,
          quantity: 2,
          price: testMeal.price
        }]
      });
    });

    it('should remove item from cart successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/cart/items/${testMeal._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(0);
      expect(response.body.data.message).toBe('Item removed from cart successfully');
    });

    it('should handle non-existent item', async () => {
      const nonExistentMealId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/api/v1/cart/items/${nonExistentMealId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ITEM_NOT_FOUND');
    });

    it('should validate meal ID format', async () => {
      const response = await request(app)
        .delete('/api/v1/cart/items/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_MEAL_ID');
    });
  });

  describe('DELETE /api/v1/cart/clear', () => {
    beforeEach(async () => {
      // Create cart with items
      await Cart.create({
        customerId: testUser._id,
        items: [{
          mealId: testMeal._id,
          chefId: testChef._id,
          quantity: 2,
          price: testMeal.price
        }],
        promoCode: 'SAVE5',
        discount: 5
      });
    });

    it('should clear cart successfully', async () => {
      const response = await request(app)
        .delete('/api/v1/cart/clear')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(0);
      expect(response.body.data.cart.promoCode).toBeUndefined();
      expect(response.body.data.cart.discount).toBe(0);
      expect(response.body.data.message).toBe('Cart cleared successfully');
    });

    it('should handle non-existent cart', async () => {
      // Delete the cart first
      await Cart.deleteOne({ customerId: testUser._id });

      const response = await request(app)
        .delete('/api/v1/cart/clear')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CART_NOT_FOUND');
    });
  });

  describe('PUT /api/v1/cart/delivery-address', () => {
    it('should update delivery address successfully', async () => {
      const addressData = {
        street: '456 New St',
        city: 'Brooklyn',
        state: 'NY',
        zipCode: '11201',
        coordinates: [-73.9857, 40.6892]
      };

      const response = await request(app)
        .put('/api/v1/cart/delivery-address')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addressData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.deliveryAddress.street).toBe('456 New St');
      expect(response.body.data.cart.deliveryAddress.city).toBe('Brooklyn');
      expect(response.body.data.message).toBe('Delivery address updated successfully');
    });

    it('should calculate delivery fees when address is complete', async () => {
      // First add item to cart
      await Cart.create({
        customerId: testUser._id,
        items: [{
          mealId: testMeal._id,
          chefId: testChef._id,
          quantity: 1,
          price: testMeal.price
        }],
        deliveryType: 'delivery'
      });

      const addressData = {
        street: '456 New St',
        city: 'Brooklyn',
        state: 'NY',
        zipCode: '11201',
        coordinates: [-73.9857, 40.6892]
      };

      const response = await request(app)
        .put('/api/v1/cart/delivery-address')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addressData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deliveryFees).toBeDefined();
    });

    it('should validate address data', async () => {
      const response = await request(app)
        .put('/api/v1/cart/delivery-address')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ zipCode: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/v1/cart/delivery-type', () => {
    it('should update delivery type successfully', async () => {
      const response = await request(app)
        .put('/api/v1/cart/delivery-type')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ deliveryType: 'pickup' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.deliveryType).toBe('pickup');
      expect(response.body.data.message).toBe('Delivery type updated successfully');
    });

    it('should validate delivery type', async () => {
      const response = await request(app)
        .put('/api/v1/cart/delivery-type')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ deliveryType: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/cart/promo-code', () => {
    beforeEach(async () => {
      // Create cart with items
      await Cart.create({
        customerId: testUser._id,
        items: [{
          mealId: testMeal._id,
          chefId: testChef._id,
          quantity: 2,
          price: testMeal.price
        }]
      });
    });

    it('should apply valid promo code successfully', async () => {
      const response = await request(app)
        .post('/api/v1/cart/promo-code')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ promoCode: 'WELCOME10' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.promoCode).toBe('WELCOME10');
      expect(response.body.data.cart.discount).toBe(10);
      expect(response.body.data.discountApplied).toBe(10);
      expect(response.body.data.message).toBe('Promo code applied successfully');
    });

    it('should reject invalid promo code', async () => {
      const response = await request(app)
        .post('/api/v1/cart/promo-code')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ promoCode: 'INVALID' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PROMO_CODE');
    });

    it('should not apply promo code to empty cart', async () => {
      // Clear cart first
      await Cart.deleteOne({ customerId: testUser._id });

      const response = await request(app)
        .post('/api/v1/cart/promo-code')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ promoCode: 'WELCOME10' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMPTY_CART');
    });
  });

  describe('DELETE /api/v1/cart/promo-code', () => {
    beforeEach(async () => {
      // Create cart with promo code
      await Cart.create({
        customerId: testUser._id,
        items: [{
          mealId: testMeal._id,
          chefId: testChef._id,
          quantity: 2,
          price: testMeal.price
        }],
        promoCode: 'WELCOME10',
        discount: 10
      });
    });

    it('should remove promo code successfully', async () => {
      const response = await request(app)
        .delete('/api/v1/cart/promo-code')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.promoCode).toBeUndefined();
      expect(response.body.data.cart.discount).toBe(0);
      expect(response.body.data.message).toBe('Promo code removed successfully');
    });
  });

  describe('GET /api/v1/cart/summary', () => {
    it('should get empty cart summary', async () => {
      const response = await request(app)
        .get('/api/v1/cart/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.subtotal).toBe(0);
      expect(response.body.data.summary.total).toBe(0);
      expect(response.body.data.summary.itemCount).toBe(0);
      expect(response.body.data.summary.chefCount).toBe(0);
    });

    it('should get cart summary with items', async () => {
      // Create cart with items
      await Cart.create({
        customerId: testUser._id,
        items: [{
          mealId: testMeal._id,
          chefId: testChef._id,
          quantity: 2,
          price: testMeal.price
        }],
        deliveryType: 'delivery',
        deliveryAddress: {
          street: '456 New St',
          city: 'Brooklyn',
          state: 'NY',
          zipCode: '11201',
          coordinates: [-73.9857, 40.6892]
        }
      });

      const response = await request(app)
        .get('/api/v1/cart/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.subtotal).toBe(testMeal.price * 2);
      expect(response.body.data.summary.itemCount).toBe(2);
      expect(response.body.data.summary.chefCount).toBe(1);
      expect(response.body.data.summary.deliveryFees).toBeDefined();
      expect(response.body.data.summary.groupedByChef).toHaveLength(1);
    });
  });
});