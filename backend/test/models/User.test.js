const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { User, userValidationSchemas } = require('../../models/User');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
  let mongoServer;

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
    await User.deleteMany({});
  });

  describe('User Schema Validation', () => {
    const validUserData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      phone: '+1234567890',
      location: {
        coordinates: [-74.006, 40.7128] // NYC coordinates
      },
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      }
    };

    it('should create a user with valid data', async () => {
      const user = new User(validUserData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.name).toBe(validUserData.name);
      expect(savedUser.email).toBe(validUserData.email.toLowerCase());
      expect(savedUser.role).toBe('customer'); // default role
      expect(savedUser.isActive).toBe(true); // default value
      expect(savedUser.isEmailVerified).toBe(false); // default value
    });

    it('should hash password before saving', async () => {
      const user = new User(validUserData);
      await user.save();

      expect(user.password).not.toBe(validUserData.password);
      expect(user.password.length).toBeGreaterThan(50); // bcrypt hash length
    });

    it('should not hash password if not modified', async () => {
      const user = new User(validUserData);
      await user.save();
      const originalPassword = user.password;

      user.name = 'Jane Doe';
      await user.save();

      expect(user.password).toBe(originalPassword);
    });

    it('should require name', async () => {
      const userData = { ...validUserData };
      delete userData.name;

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow('Name is required');
    });

    it('should require email', async () => {
      const userData = { ...validUserData };
      delete userData.email;

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow('Email is required');
    });

    it('should validate email format', async () => {
      const userData = { ...validUserData, email: 'invalid-email' };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow('Please enter a valid email');
    });

    it('should enforce unique email', async () => {
      const user1 = new User(validUserData);
      await user1.save();

      const user2 = new User({ ...validUserData, name: 'Jane Doe' });
      await expect(user2.save()).rejects.toThrow();
    });

    it('should validate phone number format', async () => {
      const userData = { ...validUserData, phone: '123' };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow('Please enter a valid phone number');
    });

    it('should validate location coordinates', async () => {
      const userData = {
        ...validUserData,
        location: { coordinates: [200, 100] } // Invalid coordinates
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow('Invalid coordinates');
    });

    it('should validate ZIP code format', async () => {
      const userData = {
        ...validUserData,
        address: { ...validUserData.address, zipCode: '123' }
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow('Please enter a valid ZIP code');
    });

    it('should validate role enum', async () => {
      const userData = { ...validUserData, role: 'invalid-role' };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow('Role must be either customer, chef, or admin');
    });

    it('should validate dietary preferences enum', async () => {
      const userData = {
        ...validUserData,
        preferences: {
          dietary: ['invalid-diet']
        }
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('User Instance Methods', () => {
    let user;

    beforeEach(async () => {
      user = new User({
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
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
      });
      await user.save();
    });

    describe('comparePassword', () => {
      it('should return true for correct password', async () => {
        const isMatch = await user.comparePassword('password123');
        expect(isMatch).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        const isMatch = await user.comparePassword('wrongpassword');
        expect(isMatch).toBe(false);
      });
    });

    describe('generateEmailVerificationToken', () => {
      it('should generate email verification token', () => {
        const token = user.generateEmailVerificationToken();

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(user.emailVerificationToken).toBeDefined();
        expect(user.emailVerificationExpires).toBeDefined();
        expect(user.emailVerificationExpires.getTime()).toBeGreaterThan(Date.now());
      });
    });

    describe('generatePasswordResetToken', () => {
      it('should generate password reset token', () => {
        const token = user.generatePasswordResetToken();

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(user.passwordResetToken).toBeDefined();
        expect(user.passwordResetExpires).toBeDefined();
        expect(user.passwordResetExpires.getTime()).toBeGreaterThan(Date.now());
      });
    });
  });

  describe('User Static Methods', () => {
    beforeEach(async () => {
      // Create test users at different locations
      const users = [
        {
          name: 'User 1',
          email: 'user1@example.com',
          password: 'password123',
          phone: '+1234567890',
          location: { coordinates: [-74.006, 40.7128] }, // NYC
          address: { street: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001' }
        },
        {
          name: 'User 2',
          email: 'user2@example.com',
          password: 'password123',
          phone: '+1234567891',
          location: { coordinates: [-74.0, 40.7] }, // Close to NYC
          address: { street: '456 Oak St', city: 'New York', state: 'NY', zipCode: '10002' }
        },
        {
          name: 'User 3',
          email: 'user3@example.com',
          password: 'password123',
          phone: '+1234567892',
          location: { coordinates: [-118.2437, 34.0522] }, // LA
          address: { street: '789 Pine St', city: 'Los Angeles', state: 'CA', zipCode: '90001' },
          isActive: false
        }
      ];

      await User.insertMany(users);
    });

    describe('findWithinRadius', () => {
      it('should find users within specified radius', async () => {
        const users = await User.findWithinRadius(-74.006, 40.7128, 10); // 10km radius from NYC

        expect(users.length).toBe(2); // Should find 2 active users near NYC
        expect(users.every(user => user.isActive)).toBe(true);
      });

      it('should not find users outside radius', async () => {
        const users = await User.findWithinRadius(-74.006, 40.7128, 1); // 1km radius

        expect(users.length).toBe(1); // Should find only 1 user very close to NYC
      });

      it('should not find inactive users', async () => {
        const users = await User.findWithinRadius(-118.2437, 34.0522, 10); // LA area

        expect(users.length).toBe(0); // Should not find inactive user
      });
    });
  });

  describe('User Virtuals', () => {
    it('should generate full address virtual', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '+1234567890',
        location: { coordinates: [-74.006, 40.7128] },
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001'
        }
      });

      expect(user.fullAddress).toBe('123 Main St, New York, NY 10001');
    });
  });

  describe('User Indexes', () => {
    it('should have geospatial index on location', async () => {
      const indexes = await User.collection.getIndexes();
      const locationIndex = Object.keys(indexes).find(key => 
        indexes[key].some(index => index[0] === 'location' && index[1] === '2dsphere')
      );
      expect(locationIndex).toBeDefined();
    });

    it('should have compound index on email and role', async () => {
      const indexes = await User.collection.getIndexes();
      const compoundIndex = Object.keys(indexes).find(key => 
        indexes[key].some(index => index[0] === 'email') &&
        indexes[key].some(index => index[0] === 'role')
      );
      expect(compoundIndex).toBeDefined();
    });
  });
});

describe('User Validation Schemas', () => {
  describe('register schema', () => {
    const validData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
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

    it('should validate correct registration data', () => {
      const { error } = userValidationSchemas.register.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const { error } = userValidationSchemas.register.validate({
        ...validData,
        email: 'invalid-email'
      });
      expect(error).toBeDefined();
    });

    it('should reject short password', () => {
      const { error } = userValidationSchemas.register.validate({
        ...validData,
        password: '123'
      });
      expect(error).toBeDefined();
    });

    it('should reject invalid coordinates', () => {
      const { error } = userValidationSchemas.register.validate({
        ...validData,
        location: { coordinates: [200] }
      });
      expect(error).toBeDefined();
    });
  });

  describe('login schema', () => {
    it('should validate correct login data', () => {
      const { error } = userValidationSchemas.login.validate({
        email: 'john.doe@example.com',
        password: 'password123'
      });
      expect(error).toBeUndefined();
    });

    it('should reject missing email', () => {
      const { error } = userValidationSchemas.login.validate({
        password: 'password123'
      });
      expect(error).toBeDefined();
    });
  });
});