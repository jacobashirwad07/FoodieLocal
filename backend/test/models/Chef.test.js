const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { Chef, chefValidationSchemas } = require('../../models/Chef');
const { User } = require('../../models/User');

describe('Chef Model', () => {
  let mongoServer;
  let testUser;

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
    await Chef.deleteMany({});
    await User.deleteMany({});

    // Create a test user
    testUser = new User({
      name: 'Chef John',
      email: 'chef.john@example.com',
      password: 'password123',
      phone: '+1234567890',
      role: 'chef',
      location: { coordinates: [-74.006, 40.7128] },
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      }
    });
    await testUser.save();
  });

  describe('Chef Schema Validation', () => {
    const validChefData = {
      businessName: 'John\'s Kitchen',
      description: 'Authentic Italian cuisine made with love and traditional recipes',
      specialties: ['italian', 'mediterranean'],
      kitchenLicense: 'KL123456789',
      serviceRadius: 10,
      serviceArea: {
        coordinates: [-74.006, 40.7128]
      },
      bankDetails: {
        accountNumber: '1234567890',
        routingNumber: '123456789',
        accountHolderName: 'John Doe'
      }
    };

    it('should create a chef with valid data', async () => {
      const chefData = { ...validChefData, userId: testUser._id };
      const chef = new Chef(chefData);
      const savedChef = await chef.save();

      expect(savedChef._id).toBeDefined();
      expect(savedChef.businessName).toBe(chefData.businessName);
      expect(savedChef.status).toBe('pending'); // default status
      expect(savedChef.rating.average).toBe(0); // default rating
      expect(savedChef.rating.count).toBe(0); // default count
      expect(savedChef.availability.isActive).toBe(false); // default availability
    });

    it('should require userId', async () => {
      const chef = new Chef(validChefData);
      await expect(chef.save()).rejects.toThrow('User ID is required');
    });

    it('should require business name', async () => {
      const chefData = { ...validChefData, userId: testUser._id };
      delete chefData.businessName;

      const chef = new Chef(chefData);
      await expect(chef.save()).rejects.toThrow('Business name is required');
    });

    it('should validate business name length', async () => {
      const chefData = { 
        ...validChefData, 
        userId: testUser._id,
        businessName: 'A' // Too short
      };

      const chef = new Chef(chefData);
      await expect(chef.save()).rejects.toThrow('Business name must be at least 2 characters long');
    });

    it('should require description', async () => {
      const chefData = { ...validChefData, userId: testUser._id };
      delete chefData.description;

      const chef = new Chef(chefData);
      await expect(chef.save()).rejects.toThrow('Description is required');
    });

    it('should validate description length', async () => {
      const chefData = { 
        ...validChefData, 
        userId: testUser._id,
        description: 'Short' // Too short
      };

      const chef = new Chef(chefData);
      await expect(chef.save()).rejects.toThrow('Description must be at least 10 characters long');
    });

    it('should validate specialty enum values', async () => {
      const chefData = { 
        ...validChefData, 
        userId: testUser._id,
        specialties: ['invalid-specialty']
      };

      const chef = new Chef(chefData);
      await expect(chef.save()).rejects.toThrow('Invalid specialty cuisine');
    });

    it('should require kitchen license', async () => {
      const chefData = { ...validChefData, userId: testUser._id };
      delete chefData.kitchenLicense;

      const chef = new Chef(chefData);
      await expect(chef.save()).rejects.toThrow('Kitchen license number is required');
    });

    it('should enforce unique kitchen license', async () => {
      const chef1 = new Chef({ ...validChefData, userId: testUser._id });
      await chef1.save();

      // Create another user for second chef
      const testUser2 = new User({
        name: 'Chef Jane',
        email: 'chef.jane@example.com',
        password: 'password123',
        phone: '+1234567891',
        role: 'chef',
        location: { coordinates: [-74.0, 40.7] },
        address: {
          street: '456 Oak St',
          city: 'New York',
          state: 'NY',
          zipCode: '10002'
        }
      });
      await testUser2.save();

      const chef2 = new Chef({ 
        ...validChefData, 
        userId: testUser2._id,
        businessName: 'Jane\'s Kitchen'
      });
      await expect(chef2.save()).rejects.toThrow();
    });

    it('should validate service radius range', async () => {
      const chefData = { 
        ...validChefData, 
        userId: testUser._id,
        serviceRadius: 0 // Too small
      };

      const chef = new Chef(chefData);
      await expect(chef.save()).rejects.toThrow('Service radius must be at least 1 km');
    });

    it('should validate service area coordinates', async () => {
      const chefData = {
        ...validChefData,
        userId: testUser._id,
        serviceArea: { coordinates: [200, 100] } // Invalid coordinates
      };

      const chef = new Chef(chefData);
      await expect(chef.save()).rejects.toThrow('Invalid coordinates');
    });

    it('should validate status enum', async () => {
      const chefData = { 
        ...validChefData, 
        userId: testUser._id,
        status: 'invalid-status'
      };

      const chef = new Chef(chefData);
      await expect(chef.save()).rejects.toThrow('Status must be pending, approved, suspended, or rejected');
    });

    it('should validate bank account number length', async () => {
      const chefData = {
        ...validChefData,
        userId: testUser._id,
        bankDetails: {
          ...validChefData.bankDetails,
          accountNumber: '123' // Too short
        }
      };

      const chef = new Chef(chefData);
      await expect(chef.save()).rejects.toThrow('Account number must be at least 8 digits');
    });

    it('should validate routing number format', async () => {
      const chefData = {
        ...validChefData,
        userId: testUser._id,
        bankDetails: {
          ...validChefData.bankDetails,
          routingNumber: '12345' // Invalid format
        }
      };

      const chef = new Chef(chefData);
      await expect(chef.save()).rejects.toThrow('Routing number must be 9 digits');
    });

    it('should validate schedule time format', async () => {
      const chefData = {
        ...validChefData,
        userId: testUser._id,
        availability: {
          schedule: [{
            day: 'monday',
            startTime: '25:00', // Invalid time
            endTime: '18:00'
          }]
        }
      };

      const chef = new Chef(chefData);
      await expect(chef.save()).rejects.toThrow('Start time must be in HH:MM format');
    });
  });

  describe('Chef Instance Methods', () => {
    let chef;

    beforeEach(async () => {
      chef = new Chef({
        userId: testUser._id,
        businessName: 'John\'s Kitchen',
        description: 'Authentic Italian cuisine made with love and traditional recipes',
        specialties: ['italian', 'mediterranean'],
        kitchenLicense: 'KL123456789',
        serviceRadius: 10,
        serviceArea: {
          coordinates: [-74.006, 40.7128] // NYC
        },
        bankDetails: {
          accountNumber: '1234567890',
          routingNumber: '123456789',
          accountHolderName: 'John Doe'
        },
        status: 'approved',
        availability: {
          isActive: true
        }
      });
      await chef.save();
    });

    describe('updateRating', () => {
      it('should update rating correctly', async () => {
        await chef.updateRating(4);
        expect(chef.rating.average).toBe(4);
        expect(chef.rating.count).toBe(1);

        await chef.updateRating(5);
        expect(chef.rating.average).toBe(4.5);
        expect(chef.rating.count).toBe(2);
      });
    });

    describe('servesLocation', () => {
      it('should return true for location within service radius', () => {
        // Location close to NYC (within 10km)
        const result = chef.servesLocation(-74.0, 40.71);
        expect(result).toBe(true);
      });

      it('should return false for location outside service radius', () => {
        // Location far from NYC (LA coordinates)
        const result = chef.servesLocation(-118.2437, 34.0522);
        expect(result).toBe(false);
      });
    });

    describe('calculateDistance', () => {
      it('should calculate distance correctly', () => {
        // Distance from NYC to a nearby point
        const distance = chef.calculateDistance(-74.0, 40.71);
        expect(distance).toBeGreaterThan(0);
        expect(distance).toBeLessThan(1); // Should be less than 1km
      });

      it('should calculate distance to far location', () => {
        // Distance from NYC to LA
        const distance = chef.calculateDistance(-118.2437, 34.0522);
        expect(distance).toBeGreaterThan(3000); // Should be > 3000km
      });
    });
  });

  describe('Chef Static Methods', () => {
    beforeEach(async () => {
      // Create test users
      const users = await User.insertMany([
        {
          name: 'Chef 1',
          email: 'chef1@example.com',
          password: 'password123',
          phone: '+1234567890',
          role: 'chef',
          location: { coordinates: [-74.006, 40.7128] },
          address: { street: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001' }
        },
        {
          name: 'Chef 2',
          email: 'chef2@example.com',
          password: 'password123',
          phone: '+1234567891',
          role: 'chef',
          location: { coordinates: [-74.0, 40.7] },
          address: { street: '456 Oak St', city: 'New York', state: 'NY', zipCode: '10002' }
        },
        {
          name: 'Chef 3',
          email: 'chef3@example.com',
          password: 'password123',
          phone: '+1234567892',
          role: 'chef',
          location: { coordinates: [-118.2437, 34.0522] },
          address: { street: '789 Pine St', city: 'Los Angeles', state: 'CA', zipCode: '90001' }
        }
      ]);

      // Create test chefs
      const chefs = [
        {
          userId: users[0]._id,
          businessName: 'Italian Kitchen',
          description: 'Authentic Italian cuisine',
          specialties: ['italian'],
          kitchenLicense: 'KL123456789',
          serviceArea: { coordinates: [-74.006, 40.7128] },
          bankDetails: { accountNumber: '1234567890', routingNumber: '123456789', accountHolderName: 'Chef 1' },
          status: 'approved',
          availability: { isActive: true }
        },
        {
          userId: users[1]._id,
          businessName: 'Chinese Delights',
          description: 'Traditional Chinese dishes',
          specialties: ['chinese'],
          kitchenLicense: 'KL123456790',
          serviceArea: { coordinates: [-74.0, 40.7] },
          bankDetails: { accountNumber: '1234567891', routingNumber: '123456789', accountHolderName: 'Chef 2' },
          status: 'approved',
          availability: { isActive: true }
        },
        {
          userId: users[2]._id,
          businessName: 'Mexican Fiesta',
          description: 'Spicy Mexican food',
          specialties: ['mexican'],
          kitchenLicense: 'KL123456791',
          serviceArea: { coordinates: [-118.2437, 34.0522] },
          bankDetails: { accountNumber: '1234567892', routingNumber: '123456789', accountHolderName: 'Chef 3' },
          status: 'pending', // Not approved
          availability: { isActive: true }
        }
      ];

      await Chef.insertMany(chefs);
    });

    describe('findWithinRadius', () => {
      it('should find approved chefs within radius', async () => {
        const chefs = await Chef.findWithinRadius(-74.006, 40.7128, 10);

        expect(chefs.length).toBe(2); // Should find 2 approved chefs near NYC
        expect(chefs.every(chef => chef.status === 'approved')).toBe(true);
        expect(chefs.every(chef => chef.availability.isActive)).toBe(true);
      });

      it('should not find chefs outside radius', async () => {
        const chefs = await Chef.findWithinRadius(-74.006, 40.7128, 1);

        expect(chefs.length).toBe(1); // Should find only 1 chef very close
      });

      it('should not find non-approved chefs', async () => {
        const chefs = await Chef.findWithinRadius(-118.2437, 34.0522, 10);

        expect(chefs.length).toBe(0); // Should not find pending chef
      });
    });

    describe('findBySpecialty', () => {
      it('should find chefs by specialty within radius', async () => {
        const chefs = await Chef.findBySpecialty('italian', -74.006, 40.7128, 10);

        expect(chefs.length).toBe(1);
        expect(chefs[0].specialties).toContain('italian');
      });

      it('should not find chefs with different specialty', async () => {
        const chefs = await Chef.findBySpecialty('thai', -74.006, 40.7128, 10);

        expect(chefs.length).toBe(0);
      });
    });
  });

  describe('Chef Virtuals', () => {
    let chef;

    beforeEach(async () => {
      chef = new Chef({
        userId: testUser._id,
        businessName: 'John\'s Kitchen',
        description: 'Authentic Italian cuisine',
        specialties: ['italian'],
        kitchenLicense: 'KL123456789',
        serviceArea: { coordinates: [-74.006, 40.7128] },
        bankDetails: { accountNumber: '1234567890', routingNumber: '123456789', accountHolderName: 'John Doe' }
      });
    });

    describe('displayRating', () => {
      it('should show "New Chef" for chef with no ratings', () => {
        expect(chef.displayRating).toBe('New Chef');
      });

      it('should show formatted rating for chef with ratings', () => {
        chef.rating.average = 4.5;
        chef.rating.count = 10;
        expect(chef.displayRating).toBe('4.5');
      });
    });

    describe('isCurrentlyAvailable', () => {
      it('should return false for non-approved chef', () => {
        chef.status = 'pending';
        chef.availability.isActive = true;
        expect(chef.isCurrentlyAvailable).toBe(false);
      });

      it('should return false for inactive chef', () => {
        chef.status = 'approved';
        chef.availability.isActive = false;
        expect(chef.isCurrentlyAvailable).toBe(false);
      });

      it('should return false when no schedule for current day', () => {
        chef.status = 'approved';
        chef.availability.isActive = true;
        chef.availability.schedule = [];
        expect(chef.isCurrentlyAvailable).toBe(false);
      });
    });
  });

  describe('Chef Middleware', () => {
    it('should set approvedAt when status changes to approved', async () => {
      const chef = new Chef({
        userId: testUser._id,
        businessName: 'John\'s Kitchen',
        description: 'Authentic Italian cuisine',
        specialties: ['italian'],
        kitchenLicense: 'KL123456789',
        serviceArea: { coordinates: [-74.006, 40.7128] },
        bankDetails: { accountNumber: '1234567890', routingNumber: '123456789', accountHolderName: 'John Doe' }
      });
      await chef.save();

      expect(chef.approvedAt).toBeUndefined();

      chef.status = 'approved';
      await chef.save();

      expect(chef.approvedAt).toBeDefined();
      expect(chef.approvedAt).toBeInstanceOf(Date);
    });
  });

  describe('Chef Indexes', () => {
    it('should have geospatial index on serviceArea', async () => {
      const indexes = await Chef.collection.getIndexes();
      const locationIndex = Object.keys(indexes).find(key => 
        indexes[key].some(index => index[0] === 'serviceArea' && index[1] === '2dsphere')
      );
      expect(locationIndex).toBeDefined();
    });

    it('should have unique index on userId', async () => {
      const indexes = await Chef.collection.getIndexes();
      const userIdIndex = Object.keys(indexes).find(key => 
        indexes[key].some(index => index[0] === 'userId')
      );
      expect(userIdIndex).toBeDefined();
    });
  });
});

describe('Chef Validation Schemas', () => {
  describe('register schema', () => {
    const validData = {
      businessName: 'John\'s Kitchen',
      description: 'Authentic Italian cuisine made with love',
      specialties: ['italian', 'mediterranean'],
      kitchenLicense: 'KL123456789',
      serviceArea: {
        coordinates: [-74.006, 40.7128]
      },
      bankDetails: {
        accountNumber: '1234567890',
        routingNumber: '123456789',
        accountHolderName: 'John Doe'
      }
    };

    it('should validate correct registration data', () => {
      const { error } = chefValidationSchemas.register.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid specialty', () => {
      const { error } = chefValidationSchemas.register.validate({
        ...validData,
        specialties: ['invalid-specialty']
      });
      expect(error).toBeDefined();
    });

    it('should reject invalid routing number', () => {
      const { error } = chefValidationSchemas.register.validate({
        ...validData,
        bankDetails: {
          ...validData.bankDetails,
          routingNumber: '12345'
        }
      });
      expect(error).toBeDefined();
    });

    it('should reject short description', () => {
      const { error } = chefValidationSchemas.register.validate({
        ...validData,
        description: 'Short'
      });
      expect(error).toBeDefined();
    });
  });

  describe('updateStatus schema', () => {
    it('should validate status update', () => {
      const { error } = chefValidationSchemas.updateStatus.validate({
        status: 'approved'
      });
      expect(error).toBeUndefined();
    });

    it('should require suspension reason for suspended status', () => {
      const { error } = chefValidationSchemas.updateStatus.validate({
        status: 'suspended'
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('required');
    });

    it('should validate suspension with reason', () => {
      const { error } = chefValidationSchemas.updateStatus.validate({
        status: 'suspended',
        suspensionReason: 'Violation of terms'
      });
      expect(error).toBeUndefined();
    });
  });
});