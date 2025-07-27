const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const { User } = require('../../models/User');
const { generateToken, hashToken } = require('../../utils/auth');

// Create test app without starting server
const createTestApp = () => {
  const app = express();
  
  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Mount auth routes
  app.use('/api/v1/auth', require('../../routes/auth'));
  
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

describe('Authentication System', () => {
  let mongoServer;
  let app;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Disconnect existing connection if any
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
    
    // Create test app
    app = createTestApp();
  });

  afterAll(async () => {
    // Clean up
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database before each test
    await User.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    const validUserData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      phone: '+1234567890',
      location: {
        coordinates: [-74.006, 40.7128]
      },
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      }
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.data.user.role).toBe('customer');
      expect(response.body.data.user.isEmailVerified).toBe(false);

      // Verify user was created in database
      const user = await User.findOne({ email: validUserData.email });
      expect(user).toBeTruthy();
      expect(user.name).toBe(validUserData.name);
    });

    it('should not register user with invalid email', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should not register user with weak password', async () => {
      const invalidData = { ...validUserData, password: '123' };
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should not register user with duplicate email', async () => {
      // Create first user
      await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData)
        .expect(201);

      // Try to create second user with same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_EXISTS');
    });

    it('should not register user with missing required fields', async () => {
      const invalidData = { ...validUserData };
      delete invalidData.name;
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      // Create a test user
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        phone: '+1234567890',
        location: { coordinates: [-74.006, 40.7128] },
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        }
      });
      await testUser.save();
    });

    it('should login user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.lastLogin).toBeDefined();
    });

    it('should not login user with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should not login user with invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should not login suspended user', async () => {
      // Suspend the user
      testUser.isActive = false;
      await testUser.save();

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCOUNT_SUSPENDED');
    });

    it('should not login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com'
          // missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    let testUser;
    let validToken;

    beforeEach(async () => {
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        phone: '+1234567890',
        location: { coordinates: [-74.006, 40.7128] },
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        }
      });
      await testUser.save();

      validToken = generateToken({
        id: testUser._id,
        email: testUser.email,
        role: testUser.role
      });
    });

    it('should refresh token for valid user', async () => {
      // Add a small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.token).not.toBe(validToken); // Should be a new token
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should not refresh token without authorization header', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should not refresh token for suspended user', async () => {
      testUser.isActive = false;
      await testUser.save();

      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCOUNT_SUSPENDED');
    });
  });

  describe('GET /api/v1/auth/verify-email/:token', () => {
    let testUser;
    let verificationToken;

    beforeEach(async () => {
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        phone: '+1234567890',
        location: { coordinates: [-74.006, 40.7128] },
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        }
      });

      verificationToken = testUser.generateEmailVerificationToken();
      await testUser.save();
    });

    it('should verify email with valid token', async () => {
      const response = await request(app)
        .get(`/api/v1/auth/verify-email/${verificationToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('verified successfully');

      // Check that user is now verified
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.isEmailVerified).toBe(true);
      expect(updatedUser.emailVerificationToken).toBeUndefined();
    });

    it('should not verify email with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/verify-email/invalidtoken')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should not verify email with expired token', async () => {
      // Manually expire the token
      testUser.emailVerificationExpires = new Date(Date.now() - 1000);
      await testUser.save();

      const response = await request(app)
        .get(`/api/v1/auth/verify-email/${verificationToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    let testUser;

    beforeEach(async () => {
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        phone: '+1234567890',
        location: { coordinates: [-74.006, 40.7128] },
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        }
      });
      await testUser.save();
    });

    it('should send reset email for existing user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset link');

      // Check that reset token was generated
      const updatedUser = await User.findById(testUser._id).select('+passwordResetToken');
      expect(updatedUser.passwordResetToken).toBeDefined();
    });

    it('should return success even for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset link');
    });

    it('should not process request without email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_EMAIL');
    });
  });

  describe('POST /api/v1/auth/reset-password/:token', () => {
    let testUser;
    let resetToken;

    beforeEach(async () => {
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        phone: '+1234567890',
        location: { coordinates: [-74.006, 40.7128] },
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        }
      });

      resetToken = testUser.generatePasswordResetToken();
      await testUser.save();
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'NewPassword123!';
      
      const response = await request(app)
        .post(`/api/v1/auth/reset-password/${resetToken}`)
        .send({ password: newPassword })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset successfully');

      // Verify password was changed
      const updatedUser = await User.findById(testUser._id).select('+password');
      const isNewPassword = await updatedUser.comparePassword(newPassword);
      expect(isNewPassword).toBe(true);

      // Verify reset token was cleared
      expect(updatedUser.passwordResetToken).toBeUndefined();
    });

    it('should not reset password with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password/invalidtoken')
        .send({ password: 'NewPassword123!' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should not reset password with weak password', async () => {
      const response = await request(app)
        .post(`/api/v1/auth/reset-password/${resetToken}`)
        .send({ password: '123' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('WEAK_PASSWORD');
    });

    it('should not reset password with expired token', async () => {
      // Manually expire the token
      testUser.passwordResetExpires = new Date(Date.now() - 1000);
      await testUser.save();

      const response = await request(app)
        .post(`/api/v1/auth/reset-password/${resetToken}`)
        .send({ password: 'NewPassword123!' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let testUser;
    let validToken;

    beforeEach(async () => {
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        phone: '+1234567890',
        location: { coordinates: [-74.006, 40.7128] },
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        }
      });
      await testUser.save();

      validToken = generateToken({
        id: testUser._id,
        email: testUser.email,
        role: testUser.role
      });
    });

    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.name).toBe('Test User');
      expect(response.body.data.user.role).toBe('customer');
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let testUser;
    let validToken;

    beforeEach(async () => {
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        phone: '+1234567890',
        location: { coordinates: [-74.006, 40.7128] },
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        }
      });
      await testUser.save();

      validToken = generateToken({
        id: testUser._id,
        email: testUser.email,
        role: testUser.role
      });
    });

    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logout successful');
    });

    it('should not logout without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });
  });
});