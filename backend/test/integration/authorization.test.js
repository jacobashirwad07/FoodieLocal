const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const { User } = require('../../models/User');
const { Chef } = require('../../models/Chef');
const { generateToken } = require('../../utils/auth');
const {
  protect,
  authorize,
  requireChefApproval,
  requireEmailVerification,
  optionalAuth
} = require('../../middleware/auth');

// Create test app with authorization routes
const createTestApp = () => {
  const app = express();
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Test routes for different authorization scenarios
  
  // Public route (no auth required)
  app.get('/api/test/public', (req, res) => {
    res.json({ success: true, message: 'Public route accessible' });
  });
  
  // Protected route (auth required)
  app.get('/api/test/protected', protect, (req, res) => {
    res.json({ 
      success: true, 
      message: 'Protected route accessible',
      user: req.user 
    });
  });
  
  // Customer only route
  app.get('/api/test/customer-only', protect, authorize('customer'), (req, res) => {
    res.json({ 
      success: true, 
      message: 'Customer only route accessible',
      user: req.user 
    });
  });
  
  // Chef only route
  app.get('/api/test/chef-only', protect, authorize('chef'), (req, res) => {
    res.json({ 
      success: true, 
      message: 'Chef only route accessible',
      user: req.user 
    });
  });
  
  // Admin only route
  app.get('/api/test/admin-only', protect, authorize('admin'), (req, res) => {
    res.json({ 
      success: true, 
      message: 'Admin only route accessible',
      user: req.user 
    });
  });
  
  // Multiple roles allowed
  app.get('/api/test/chef-or-admin', protect, authorize('chef', 'admin'), (req, res) => {
    res.json({ 
      success: true, 
      message: 'Chef or admin route accessible',
      user: req.user 
    });
  });
  
  // Approved chef only route
  app.get('/api/test/approved-chef-only', protect, authorize('chef'), requireChefApproval, (req, res) => {
    res.json({ 
      success: true, 
      message: 'Approved chef only route accessible',
      user: req.user,
      chef: req.chef
    });
  });
  
  // Email verification required route
  app.get('/api/test/verified-only', protect, requireEmailVerification, (req, res) => {
    res.json({ 
      success: true, 
      message: 'Email verified users only route accessible',
      user: req.user 
    });
  });
  
  // Optional auth route
  app.get('/api/test/optional-auth', optionalAuth, (req, res) => {
    res.json({ 
      success: true, 
      message: 'Optional auth route accessible',
      user: req.user || null,
      authenticated: !!req.user
    });
  });
  
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

describe('Authorization Integration Tests', () => {
  let mongoServer;
  let app;
  let customerUser, chefUser, adminUser;
  let customerToken, chefToken, adminToken;
  let approvedChef, pendingChef;

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
    await Chef.deleteMany({});

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

    chefUser = new User({
      name: 'Chef User',
      email: 'chef@example.com',
      password: 'Password123!',
      phone: '+1234567891',
      role: 'chef',
      location: { coordinates: [-74.006, 40.7128] },
      address: {
        street: '123 Chef St',
        city: 'Chef City',
        state: 'CC',
        zipCode: '12346'
      },
      isEmailVerified: true,
      isActive: true
    });
    await chefUser.save();

    adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Password123!',
      phone: '+1234567892',
      role: 'admin',
      location: { coordinates: [-74.006, 40.7128] },
      address: {
        street: '123 Admin St',
        city: 'Admin City',
        state: 'AC',
        zipCode: '12347'
      },
      isEmailVerified: true,
      isActive: true
    });
    await adminUser.save();

    // Create chef profiles
    approvedChef = new Chef({
      userId: chefUser._id,
      businessName: 'Approved Chef Kitchen',
      description: 'Approved chef with great food and service',
      specialties: ['italian', 'american'],
      kitchenLicense: 'APPROVED123',
      serviceRadius: 5,
      serviceArea: { coordinates: [-74.006, 40.7128] },
      status: 'approved',
      bankDetails: {
        accountNumber: '1234567890',
        routingNumber: '123456789',
        accountHolderName: 'Approved Chef'
      }
    });
    await approvedChef.save();

    // Generate tokens
    customerToken = generateToken({
      id: customerUser._id,
      email: customerUser.email,
      role: customerUser.role
    });

    chefToken = generateToken({
      id: chefUser._id,
      email: chefUser.email,
      role: chefUser.role
    });

    adminToken = generateToken({
      id: adminUser._id,
      email: adminUser.email,
      role: adminUser.role
    });
  });

  describe('Public Routes', () => {
    it('should allow access to public routes without authentication', async () => {
      const response = await request(app)
        .get('/api/test/public')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Public route accessible');
    });
  });

  describe('Protected Routes', () => {
    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('customer@example.com');
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .get('/api/test/protected')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MALFORMED_TOKEN');
    });
  });

  describe('Role-Based Authorization', () => {
    it('should allow customer access to customer-only route', async () => {
      const response = await request(app)
        .get('/api/test/customer-only')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.role).toBe('customer');
    });

    it('should deny chef access to customer-only route', async () => {
      const response = await request(app)
        .get('/api/test/customer-only')
        .set('Authorization', `Bearer ${chefToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should allow chef access to chef-only route', async () => {
      const response = await request(app)
        .get('/api/test/chef-only')
        .set('Authorization', `Bearer ${chefToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.role).toBe('chef');
    });

    it('should deny customer access to chef-only route', async () => {
      const response = await request(app)
        .get('/api/test/chef-only')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should allow admin access to admin-only route', async () => {
      const response = await request(app)
        .get('/api/test/admin-only')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.role).toBe('admin');
    });

    it('should deny non-admin access to admin-only route', async () => {
      const response = await request(app)
        .get('/api/test/admin-only')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should allow multiple roles access to multi-role route', async () => {
      // Test chef access
      const chefResponse = await request(app)
        .get('/api/test/chef-or-admin')
        .set('Authorization', `Bearer ${chefToken}`)
        .expect(200);

      expect(chefResponse.body.success).toBe(true);
      expect(chefResponse.body.user.role).toBe('chef');

      // Test admin access
      const adminResponse = await request(app)
        .get('/api/test/chef-or-admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminResponse.body.success).toBe(true);
      expect(adminResponse.body.user.role).toBe('admin');
    });

    it('should deny unauthorized role access to multi-role route', async () => {
      const response = await request(app)
        .get('/api/test/chef-or-admin')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('Chef Approval Authorization', () => {
    it('should allow approved chef access to approved-chef-only route', async () => {
      const response = await request(app)
        .get('/api/test/approved-chef-only')
        .set('Authorization', `Bearer ${chefToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.chef.status).toBe('approved');
    });

    it('should deny non-chef access to approved-chef-only route', async () => {
      const response = await request(app)
        .get('/api/test/approved-chef-only')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should deny unapproved chef access to approved-chef-only route', async () => {
      // Create pending chef
      const pendingChefUser = new User({
        name: 'Pending Chef',
        email: 'pending@example.com',
        password: 'Password123!',
        phone: '+1234567893',
        role: 'chef',
        location: { coordinates: [-74.006, 40.7128] },
        address: {
          street: '123 Pending St',
          city: 'Pending City',
          state: 'PC',
          zipCode: '12348'
        },
        isEmailVerified: true,
        isActive: true
      });
      await pendingChefUser.save();

      const pendingChef = new Chef({
        userId: pendingChefUser._id,
        businessName: 'Pending Chef Kitchen',
        description: 'Pending chef waiting for approval',
        specialties: ['italian', 'american'],
        kitchenLicense: 'PENDING123',
        serviceRadius: 5,
        serviceArea: { coordinates: [-74.006, 40.7128] },
        status: 'pending',
        bankDetails: {
          accountNumber: '1234567891',
          routingNumber: '123456789',
          accountHolderName: 'Pending Chef'
        }
      });
      await pendingChef.save();

      const pendingToken = generateToken({
        id: pendingChefUser._id,
        email: pendingChefUser.email,
        role: pendingChefUser.role
      });

      const response = await request(app)
        .get('/api/test/approved-chef-only')
        .set('Authorization', `Bearer ${pendingToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CHEF_NOT_APPROVED');
    });
  });

  describe('Email Verification Authorization', () => {
    it('should allow verified user access to verified-only route', async () => {
      const response = await request(app)
        .get('/api/test/verified-only')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('customer@example.com');
    });

    it('should deny unverified user access to verified-only route', async () => {
      // Create unverified user
      const unverifiedUser = new User({
        name: 'Unverified User',
        email: 'unverified@example.com',
        password: 'Password123!',
        phone: '+1234567894',
        role: 'customer',
        location: { coordinates: [-74.006, 40.7128] },
        address: {
          street: '123 Unverified St',
          city: 'Unverified City',
          state: 'UC',
          zipCode: '12349'
        },
        isEmailVerified: false,
        isActive: true
      });
      await unverifiedUser.save();

      const unverifiedToken = generateToken({
        id: unverifiedUser._id,
        email: unverifiedUser.email,
        role: unverifiedUser.role
      });

      const response = await request(app)
        .get('/api/test/verified-only')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_NOT_VERIFIED');
    });
  });

  describe('Optional Authentication', () => {
    it('should work with valid token', async () => {
      const response = await request(app)
        .get('/api/test/optional-auth')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.authenticated).toBe(true);
      expect(response.body.user.email).toBe('customer@example.com');
    });

    it('should work without token', async () => {
      const response = await request(app)
        .get('/api/test/optional-auth')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.authenticated).toBe(false);
      expect(response.body.user).toBeNull();
    });

    it('should work with invalid token (graceful failure)', async () => {
      const response = await request(app)
        .get('/api/test/optional-auth')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.authenticated).toBe(false);
      expect(response.body.user).toBeNull();
    });
  });

  describe('Account Status Checks', () => {
    it('should deny access for suspended user', async () => {
      // Suspend the customer user
      customerUser.isActive = false;
      await customerUser.save();

      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCOUNT_SUSPENDED');
    });

    it('should deny access for deleted user', async () => {
      // Delete the customer user
      await User.findByIdAndDelete(customerUser._id);

      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });
});