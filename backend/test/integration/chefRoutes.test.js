const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const path = require('path');
const fs = require('fs');
const { User } = require('../../models/User');
const { Chef } = require('../../models/Chef');
const { generateToken } = require('../../utils/auth');

// Create test app
const createTestApp = () => {
  const app = express();
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Mount chef routes
  app.use('/api/v1/chefs', require('../../routes/chefs'));
  
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

describe('Chef Routes Integration Tests', () => {
  let mongoServer;
  let app;
  let customerUser, adminUser, chefUser, unverifiedUser;
  let customerToken, adminToken, chefToken, unverifiedToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(mongoUri);
    app = createTestApp();

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../../uploads/documents');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
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

    chefUser = new User({
      name: 'Chef User',
      email: 'chef@example.com',
      password: 'Password123!',
      phone: '+1234567892',
      role: 'chef',
      location: { coordinates: [-74.006, 40.7128] },
      address: {
        street: '123 Chef St',
        city: 'Chef City',
        state: 'CH',
        zipCode: '12347'
      },
      isEmailVerified: true,
      isActive: true
    });
    await chefUser.save();

    unverifiedUser = new User({
      name: 'Unverified User',
      email: 'unverified@example.com',
      password: 'Password123!',
      phone: '+1234567893',
      role: 'customer',
      location: { coordinates: [-74.006, 40.7128] },
      address: {
        street: '123 Unverified St',
        city: 'Unverified City',
        state: 'UC',
        zipCode: '12348'
      },
      isEmailVerified: false,
      isActive: true
    });
    await unverifiedUser.save();

    // Create chef profile for chefUser
    const chefProfile = new Chef({
      userId: chefUser._id,
      businessName: 'Test Kitchen',
      description: 'A test kitchen for integration tests',
      specialties: ['indian', 'chinese'],
      kitchenLicense: 'TEST-LICENSE-123',
      serviceRadius: 10,
      serviceArea: { coordinates: [-74.006, 40.7128] },
      bankDetails: {
        accountNumber: '9876543210',
        routingNumber: '987654321',
        accountHolderName: 'Test Kitchen'
      },
      status: 'approved'
    });
    await chefProfile.save();

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

    chefToken = generateToken({
      id: chefUser._id,
      email: chefUser.email,
      role: chefUser.role
    });

    unverifiedToken = generateToken({
      id: unverifiedUser._id,
      email: unverifiedUser.email,
      role: unverifiedUser.role
    });
  });

  describe('POST /api/v1/chefs/register', () => {
    const validChefData = {
      businessName: 'New Chef Kitchen',
      description: 'A new chef kitchen specializing in authentic cuisine',
      specialties: ['indian', 'italian'],
      kitchenLicense: 'NEW-LICENSE-456',
      serviceRadius: 15,
      serviceArea: { coordinates: [-73.935242, 40.730610] },
      bankDetails: {
        accountNumber: '1234567890',
        routingNumber: '123456789',
        accountHolderName: 'New Chef Kitchen'
      }
    };

    it('should allow verified customer to register as chef', async () => {
      const response = await request(app)
        .post('/api/v1/chefs/register')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validChefData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.chef.businessName).toBe(validChefData.businessName);
      expect(response.body.data.chef.status).toBe('pending');

      // Verify chef was created in database
      const chef = await Chef.findOne({ userId: customerUser._id });
      expect(chef).toBeTruthy();
      expect(chef.businessName).toBe(validChefData.businessName);

      // Verify user role was updated
      const updatedUser = await User.findById(customerUser._id);
      expect(updatedUser.role).toBe('chef');
    });

    it('should deny unverified user from registering as chef', async () => {
      const response = await request(app)
        .post('/api/v1/chefs/register')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .send(validChefData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('should prevent user from registering as chef twice', async () => {
      // First registration
      await request(app)
        .post('/api/v1/chefs/register')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validChefData)
        .expect(201);

      // Second registration attempt
      const response = await request(app)
        .post('/api/v1/chefs/register')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          ...validChefData,
          businessName: 'Another Kitchen',
          kitchenLicense: 'ANOTHER-LICENSE-789',
          bankDetails: {
            accountNumber: '1111111111',
            routingNumber: '111111111',
            accountHolderName: 'Another Kitchen'
          }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CHEF_ALREADY_EXISTS');
    });

    it('should prevent duplicate kitchen license', async () => {
      // First registration
      await request(app)
        .post('/api/v1/chefs/register')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validChefData)
        .expect(201);

      // Create another user
      const anotherUser = new User({
        name: 'Another User',
        email: 'another@example.com',
        password: 'Password123!',
        phone: '+1234567894',
        role: 'customer',
        location: { coordinates: [-74.006, 40.7128] },
        address: {
          street: '123 Another St',
          city: 'Another City',
          state: 'AN',
          zipCode: '12349'
        },
        isEmailVerified: true,
        isActive: true
      });
      await anotherUser.save();

      const anotherToken = generateToken({
        id: anotherUser._id,
        email: anotherUser.email,
        role: anotherUser.role
      });

      // Try to register with same license
      const response = await request(app)
        .post('/api/v1/chefs/register')
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({
          ...validChefData,
          businessName: 'Different Kitchen',
          bankDetails: {
            accountNumber: '2222222222',
            routingNumber: '222222222',
            accountHolderName: 'Different Kitchen'
          }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('LICENSE_ALREADY_EXISTS');
    });

    it('should validate chef registration data', async () => {
      const invalidData = {
        businessName: 'A', // Too short
        description: 'Short', // Too short
        specialties: ['invalid-cuisine'], // Invalid specialty
        kitchenLicense: '', // Empty
        serviceRadius: 0 // Invalid
      };

      const response = await request(app)
        .post('/api/v1/chefs/register')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should deny unauthenticated access', async () => {
      const response = await request(app)
        .post('/api/v1/chefs/register')
        .send(validChefData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });
  });

  describe('GET /api/v1/chefs/profile', () => {
    it('should allow chef to get their profile', async () => {
      const response = await request(app)
        .get('/api/v1/chefs/profile')
        .set('Authorization', `Bearer ${chefToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.chef.businessName).toBe('Test Kitchen');
      expect(response.body.data.chef.user).toBeDefined();
    });

    it('should deny non-chef access', async () => {
      const response = await request(app)
        .get('/api/v1/chefs/profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should handle chef profile not found', async () => {
      // Create a user with chef role but no chef profile
      const userWithoutProfile = new User({
        name: 'Chef Without Profile',
        email: 'noprofile@example.com',
        password: 'Password123!',
        phone: '+1234567895',
        role: 'chef',
        location: { coordinates: [-74.006, 40.7128] },
        address: {
          street: '123 No Profile St',
          city: 'No Profile City',
          state: 'NP',
          zipCode: '12350'
        },
        isEmailVerified: true,
        isActive: true
      });
      await userWithoutProfile.save();

      const noProfileToken = generateToken({
        id: userWithoutProfile._id,
        email: userWithoutProfile.email,
        role: userWithoutProfile.role
      });

      const response = await request(app)
        .get('/api/v1/chefs/profile')
        .set('Authorization', `Bearer ${noProfileToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CHEF_NOT_FOUND');
    });
  });

  describe('PUT /api/v1/chefs/profile', () => {
    it('should allow chef to update their profile', async () => {
      const updateData = {
        businessName: 'Updated Kitchen Name',
        description: 'Updated description for the kitchen',
        serviceRadius: 20
      };

      const response = await request(app)
        .put('/api/v1/chefs/profile')
        .set('Authorization', `Bearer ${chefToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.chef.businessName).toBe(updateData.businessName);
      expect(response.body.data.chef.serviceRadius).toBe(updateData.serviceRadius);

      // Verify update in database
      const chef = await Chef.findOne({ userId: chefUser._id });
      expect(chef.businessName).toBe(updateData.businessName);
    });

    it('should validate profile update data', async () => {
      const invalidData = {
        businessName: 'A', // Too short
        serviceRadius: -5 // Invalid
      };

      const response = await request(app)
        .put('/api/v1/chefs/profile')
        .set('Authorization', `Bearer ${chefToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should deny non-chef access', async () => {
      const response = await request(app)
        .put('/api/v1/chefs/profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ businessName: 'Unauthorized Update' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('GET /api/v1/chefs/orders', () => {
    it('should allow chef to get their orders', async () => {
      const response = await request(app)
        .get('/api/v1/chefs/orders')
        .set('Authorization', `Bearer ${chefToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should deny non-chef access', async () => {
      const response = await request(app)
        .get('/api/v1/chefs/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('PUT /api/v1/chefs/:id/status (Admin only)', () => {
    let testChef;

    beforeEach(async () => {
      testChef = await Chef.findOne({ userId: chefUser._id });
    });

    it('should allow admin to approve chef', async () => {
      // Set chef status to pending first
      testChef.status = 'pending';
      await testChef.save();

      const response = await request(app)
        .put(`/api/v1/chefs/${testChef._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          status: 'approved', 
          reason: 'All documents verified' 
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.chef.status).toBe('approved');

      // Verify update in database
      const updatedChef = await Chef.findById(testChef._id);
      expect(updatedChef.status).toBe('approved');
    });

    it('should allow admin to suspend chef', async () => {
      const response = await request(app)
        .put(`/api/v1/chefs/${testChef._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          status: 'suspended', 
          reason: 'Policy violation' 
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.chef.status).toBe('suspended');
    });

    it('should validate status values', async () => {
      const response = await request(app)
        .put(`/api/v1/chefs/${testChef._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          status: 'invalid-status', 
          reason: 'Test' 
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_STATUS');
    });

    it('should deny non-admin access', async () => {
      const response = await request(app)
        .put(`/api/v1/chefs/${testChef._id}/status`)
        .set('Authorization', `Bearer ${chefToken}`)
        .send({ 
          status: 'approved', 
          reason: 'Unauthorized attempt' 
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should handle non-existent chef', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .put(`/api/v1/chefs/${fakeId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          status: 'approved', 
          reason: 'Test' 
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CHEF_NOT_FOUND');
    });
  });
});