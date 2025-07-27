const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
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

describe('Auth Middleware', () => {
  let mongoServer;
  let testUser;
  let testChef;
  let validToken;
  let req, res, next;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Disconnect existing connection if any
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Chef.deleteMany({});

    // Create test user
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      phone: '+1234567890',
      role: 'customer',
      location: { coordinates: [-74.006, 40.7128] },
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345'
      },
      isEmailVerified: true,
      isActive: true
    });
    await testUser.save();

    validToken = generateToken({
      id: testUser._id,
      email: testUser.email,
      role: testUser.role
    });

    // Mock request, response, and next
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('protect middleware', () => {
    it('should authenticate user with valid token', async () => {
      req.headers.authorization = `Bearer ${validToken}`;

      await protect(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toEqual(testUser._id);
      expect(req.user.email).toBe(testUser.email);
      expect(req.user.role).toBe(testUser.role);
    });

    it('should reject request without token', async () => {
      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Access token is required. Please login to continue.'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      req.headers.authorization = 'Bearer invalidtoken';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MALFORMED_TOKEN',
          message: 'Malformed token. Please login again.'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request for non-existent user', async () => {
      // Delete the user
      await User.findByIdAndDelete(testUser._id);

      req.headers.authorization = `Bearer ${validToken}`;

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User associated with this token no longer exists'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request for suspended user', async () => {
      // Suspend the user
      testUser.isActive = false;
      await testUser.save();

      req.headers.authorization = `Bearer ${validToken}`;

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended. Please contact support.'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle expired token', async () => {
      // Create an expired token
      const expiredToken = generateToken({
        id: testUser._id,
        email: testUser.email,
        role: testUser.role
      }, '0s'); // Expires immediately

      // Wait a moment to ensure token is expired
      await new Promise(resolve => setTimeout(resolve, 100));

      req.headers.authorization = `Bearer ${expiredToken}`;

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired. Please login again.'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    beforeEach(() => {
      req.user = {
        id: testUser._id,
        email: testUser.email,
        role: 'customer'
      };
    });

    it('should allow access for authorized role', () => {
      const middleware = authorize('customer', 'admin');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for unauthorized role', () => {
      const middleware = authorize('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Access denied. Required role: admin. Your role: customer'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access without user object', () => {
      req.user = null;
      const middleware = authorize('customer');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required to access this route'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireChefApproval middleware', () => {
    beforeEach(async () => {
      // Create chef user
      testUser.role = 'chef';
      await testUser.save();

      req.user = {
        id: testUser._id,
        email: testUser.email,
        role: 'chef'
      };

      // Create chef profile
      testChef = new Chef({
        userId: testUser._id,
        businessName: 'Test Kitchen',
        description: 'Test chef description with more than 10 characters',
        specialties: ['italian', 'american'],
        kitchenLicense: 'LICENSE123',
        serviceRadius: 5,
        serviceArea: { coordinates: [-74.006, 40.7128] },
        status: 'approved',
        bankDetails: {
          accountNumber: '1234567890',
          routingNumber: '123456789',
          accountHolderName: 'Test Chef'
        }
      });
      await testChef.save();
    });

    it('should allow access for approved chef', async () => {
      await requireChefApproval(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.chef).toBeDefined();
      expect(req.chef.id).toEqual(testChef._id);
      expect(req.chef.status).toBe('approved');
    });

    it('should deny access for non-chef user', async () => {
      req.user.role = 'customer';

      await requireChefApproval(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CHEF_ACCESS_REQUIRED',
          message: 'This route is only accessible to chefs'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access for chef without profile', async () => {
      await Chef.findByIdAndDelete(testChef._id);

      await requireChefApproval(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CHEF_PROFILE_NOT_FOUND',
          message: 'Chef profile not found. Please complete chef registration.'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access for unapproved chef', async () => {
      testChef.status = 'pending';
      await testChef.save();

      await requireChefApproval(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CHEF_NOT_APPROVED',
          message: 'Chef account status: pending. Approval required to access this feature.'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireEmailVerification middleware', () => {
    beforeEach(() => {
      req.user = {
        id: testUser._id,
        email: testUser.email,
        role: 'customer',
        isEmailVerified: true
      };
    });

    it('should allow access for verified user', () => {
      requireEmailVerification(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for unverified user', () => {
      req.user.isEmailVerified = false;

      requireEmailVerification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Email verification required to access this feature'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth middleware', () => {
    it('should set user data with valid token', async () => {
      req.headers.authorization = `Bearer ${validToken}`;

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toEqual(testUser._id);
    });

    it('should continue without user data when no token provided', async () => {
      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeNull();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should continue without user data for invalid token', async () => {
      req.headers.authorization = 'Bearer invalidtoken';

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeNull();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should continue without user data for suspended user', async () => {
      testUser.isActive = false;
      await testUser.save();

      req.headers.authorization = `Bearer ${validToken}`;

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeNull();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});