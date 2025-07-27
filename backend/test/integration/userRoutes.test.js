const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const { User } = require('../../models/User');
const { Order } = require('../../models/Order');
const { generateToken } = require('../../utils/auth');

// Create test app
const createTestApp = () => {
  const app = express();
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Mount user routes
  app.use('/api/v1/users', require('../../routes/users'));
  
  // Error handler
  app.use((error, req, res, next) => {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  });
  
  return app;
};

describe('User Routes Authorization Tests', () => {
  let mongoServer;
  let app;
  let customerUser, adminUser, unverifiedUser;
  let customerToken, adminToken, unverifiedToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(mongoUri);
    app = createTestApp();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Order.deleteMany({});

    // Create test users
    customerUser = new User({
      name: 'Customer User',
      email: 'customer@example.com',
      password: 'Password123!',
      phone: '+1234567890',
      role: 'customer',
      location: { coordinates: [-74.006, 40.7128] },
      address: {
        street: '123 Customer St',
        city: 'Customer City',
        state: 'CC',
        zipCode: '12345'
      },
      isEmailVerified: true,
      isActive: true
    });
    await customerUser.save();

    adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Password123!',
      phone: '+1234567891',
      role: 'admin',
      location: { coordinates: [-74.006, 40.7128] },
      address: {
        street: '123 Admin St',
        city: 'Admin City',
        state: 'AC',
        zipCode: '12346'
      },
      isEmailVerified: true,
      isActive: true
    });
    await adminUser.save();

    unverifiedUser = new User({
      name: 'Unverified User',
      email: 'unverified@example.com',
      password: 'Password123!',
      phone: '+1234567892',
      role: 'customer',
      location: { coordinates: [-74.006, 40.7128] },
      address: {
        street: '123 Unverified St',
        city: 'Unverified City',
        state: 'UC',
        zipCode: '12347'
      },
      isEmailVerified: false,
      isActive: true
    });
    await unverifiedUser.save();

    // Generate tokens
    customerToken = generateToken({
      id: customerUser._id,
      email: customerUser.email,
      role: customerUser.role
    });

    adminToken = generateToken({
      id: adminUser._id,
      email: adminUser.email,
      role: adminUser.role
    });

    unverifiedToken = generateToken({
      id: unverifiedUser._id,
      email: unverifiedUser.email,
      role: unverifiedUser.role
    });
  });

  describe('GET /api/v1/users/profile', () => {
    it('should allow authenticated user to get their profile', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('customer@example.com');
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should deny unauthenticated access', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });
  });

  describe('PUT /api/v1/users/profile', () => {
    it('should allow authenticated user to update their profile', async () => {
      const updateData = {
        name: 'Updated Customer Name',
        phone: '+1987654321'
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe('Updated Customer Name');
      expect(response.body.data.user.phone).toBe('+1987654321');
    });

    it('should validate profile update data', async () => {
      const invalidData = {
        name: 'A', // Too short
        phone: 'invalid-phone'
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/v1/users/location', () => {
    it('should allow verified user to update location', async () => {
      const locationData = {
        coordinates: [-73.935242, 40.730610] // New York coordinates
      };

      const response = await request(app)
        .put('/api/v1/users/location')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(locationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.location.coordinates).toEqual([-73.935242, 40.730610]);
    });

    it('should deny unverified user from updating location', async () => {
      const locationData = {
        coordinates: [-73.935242, 40.730610]
      };

      const response = await request(app)
        .put('/api/v1/users/location')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .send(locationData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('should validate location coordinates', async () => {
      const invalidData = {
        coordinates: [-200, 100] // Invalid coordinates
      };

      const response = await request(app)
        .put('/api/v1/users/location')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/users (Admin only)', () => {
    it('should allow admin to get all users', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should allow admin to filter users by role', async () => {
      const response = await request(app)
        .get('/api/v1/users?role=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.users[0].role).toBe('admin');
    });

    it('should deny non-admin access', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('PUT /api/v1/users/:id/status (Admin only)', () => {
    it('should allow admin to update user status', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${customerUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          isActive: false, 
          reason: 'Test suspension' 
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.isActive).toBe(false);

      // Verify user was actually updated
      const updatedUser = await User.findById(customerUser._id);
      expect(updatedUser.isActive).toBe(false);
    });

    it('should prevent admin from deactivating themselves', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${adminUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          isActive: false, 
          reason: 'Self deactivation attempt' 
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CANNOT_DEACTIVATE_SELF');
    });

    it('should deny non-admin access', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${customerUser._id}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ 
          isActive: false, 
          reason: 'Unauthorized attempt' 
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should validate status update data', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${customerUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          isActive: 'invalid' // Should be boolean
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .put(`/api/v1/users/${fakeId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          isActive: false, 
          reason: 'Test' 
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('GET /api/v1/users/orders', () => {
    let testOrder1, testOrder2;

    beforeEach(async () => {
      // Create test orders for the customer
      testOrder1 = new Order({
        customerId: customerUser._id,
        items: [{
          mealId: new mongoose.Types.ObjectId(),
          chefId: new mongoose.Types.ObjectId(),
          quantity: 2,
          price: 15.99,
          specialInstructions: 'Extra spicy'
        }],
        totalAmount: 31.98,
        deliveryFee: 3.99,
        tax: 2.56,
        finalAmount: 38.53,
        deliveryAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TC',
          zipCode: '12345',
          coordinates: [-74.006, 40.7128]
        },
        deliveryType: 'delivery',
        status: 'delivered',
        paymentStatus: 'paid'
      });
      await testOrder1.save();

      testOrder2 = new Order({
        customerId: customerUser._id,
        items: [{
          mealId: new mongoose.Types.ObjectId(),
          chefId: new mongoose.Types.ObjectId(),
          quantity: 1,
          price: 12.99
        }],
        totalAmount: 12.99,
        deliveryFee: 2.99,
        tax: 1.28,
        finalAmount: 17.26,
        deliveryAddress: {
          street: '456 Test Ave',
          city: 'Test City',
          state: 'TC',
          zipCode: '12345',
          coordinates: [-74.006, 40.7128]
        },
        deliveryType: 'pickup',
        status: 'pending',
        paymentStatus: 'pending'
      });
      await testOrder2.save();

      // Create an order for another user (should not be returned)
      const otherOrder = new Order({
        customerId: adminUser._id,
        items: [{
          mealId: new mongoose.Types.ObjectId(),
          chefId: new mongoose.Types.ObjectId(),
          quantity: 1,
          price: 20.00
        }],
        totalAmount: 20.00,
        deliveryFee: 0,
        tax: 1.60,
        finalAmount: 21.60,
        deliveryAddress: {
          street: '789 Other St',
          city: 'Other City',
          state: 'OC',
          zipCode: '54321',
          coordinates: [-74.006, 40.7128]
        },
        deliveryType: 'delivery',
        status: 'confirmed',
        paymentStatus: 'paid'
      });
      await otherOrder.save();
    });

    it('should allow authenticated user to get their orders', async () => {
      const response = await request(app)
        .get('/api/v1/users/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.total).toBe(2);
      
      // Verify orders belong to the authenticated user
      response.body.data.orders.forEach(order => {
        expect(order.customerId).toBe(customerUser._id.toString());
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/users/orders?page=1&limit=1')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.pagination.total).toBe(2);
      expect(response.body.data.pagination.pages).toBe(2);
    });

    it('should support filtering by status', async () => {
      const response = await request(app)
        .get('/api/v1/users/orders?status=delivered')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].status).toBe('delivered');
    });

    it('should support custom sorting', async () => {
      const response = await request(app)
        .get('/api/v1/users/orders?sortBy=finalAmount&sortOrder=asc')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(2);
      // First order should have lower finalAmount
      expect(response.body.data.orders[0].finalAmount).toBeLessThan(
        response.body.data.orders[1].finalAmount
      );
    });

    it('should deny unauthenticated access', async () => {
      const response = await request(app)
        .get('/api/v1/users/orders')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should return empty array when user has no orders', async () => {
      // Create a new user with no orders
      const newUser = new User({
        name: 'No Orders User',
        email: 'noorders@example.com',
        password: 'Password123!',
        phone: '+1234567893',
        role: 'customer',
        location: { coordinates: [-74.006, 40.7128] },
        address: {
          street: '123 Empty St',
          city: 'Empty City',
          state: 'EC',
          zipCode: '12348'
        },
        isEmailVerified: true,
        isActive: true
      });
      await newUser.save();

      const newUserToken = generateToken({
        id: newUser._id,
        email: newUser.email,
        role: newUser.role
      });

      const response = await request(app)
        .get('/api/v1/users/orders')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });
  });
});