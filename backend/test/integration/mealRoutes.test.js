const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const app = require('../../server');
const { User } = require('../../models/User');
const { Chef } = require('../../models/Chef');
const { Meal } = require('../../models/Meal');
const { generateToken } = require('../../utils/auth');

describe('Meal Routes', () => {
  let customerToken, chefToken, chef2Token;
  let customerId, chefId, chef2Id;
  let mealId;

  beforeAll(async () => {
    // Create test users
    const customer = await User.create({
      name: 'Test Customer',
      email: 'customer@test.com',
      password: 'password123',
      phone: '+1234567890',
      role: 'customer',
      location: {
        type: 'Point',
        coordinates: [-74.006, 40.7128] // New York
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

    const chefUser = await User.create({
      name: 'Test Chef',
      email: 'chef@test.com',
      password: 'password123',
      phone: '+1234567891',
      role: 'chef',
      location: {
        type: 'Point',
        coordinates: [-74.006, 40.7128]
      },
      address: {
        street: '456 Chef Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10002'
      },
      isEmailVerified: true,
      isActive: true
    });

    const chef2User = await User.create({
      name: 'Test Chef 2',
      email: 'chef2@test.com',
      password: 'password123',
      phone: '+1234567892',
      role: 'chef',
      location: {
        type: 'Point',
        coordinates: [-74.010, 40.7150]
      },
      address: {
        street: '789 Kitchen Blvd',
        city: 'New York',
        state: 'NY',
        zipCode: '10003'
      },
      isEmailVerified: true,
      isActive: true
    });

    // Create chef profiles
    const chef = await Chef.create({
      userId: chefUser._id,
      businessName: 'Test Kitchen',
      description: 'Delicious home-cooked meals',
      specialties: ['indian', 'italian'],
      kitchenLicense: 'LICENSE123',
      serviceRadius: 10,
      serviceArea: {
        type: 'Point',
        coordinates: [-74.006, 40.7128]
      },
      status: 'approved',
      availability: {
        isActive: true,
        schedule: [
          { day: 'monday', startTime: '09:00', endTime: '21:00' },
          { day: 'tuesday', startTime: '09:00', endTime: '21:00' }
        ]
      },
      bankDetails: {
        accountNumber: '123456789',
        routingNumber: '021000021',
        accountHolderName: 'Test Chef'
      }
    });

    const chef2 = await Chef.create({
      userId: chef2User._id,
      businessName: 'Test Kitchen 2',
      description: 'Amazing home-cooked meals',
      specialties: ['chinese', 'thai'],
      kitchenLicense: 'LICENSE456',
      serviceRadius: 15,
      serviceArea: {
        type: 'Point',
        coordinates: [-74.010, 40.7150]
      },
      status: 'approved',
      availability: {
        isActive: true,
        schedule: [
          { day: 'monday', startTime: '10:00', endTime: '22:00' }
        ]
      },
      bankDetails: {
        accountNumber: '987654321',
        routingNumber: '021000022',
        accountHolderName: 'Test Chef 2'
      }
    });

    customerId = customer._id;
    chefId = chef._id;
    chef2Id = chef2._id;

    // Generate tokens
    customerToken = generateToken({ id: customerId });
    chefToken = generateToken({ id: chefUser._id });
    chef2Token = generateToken({ id: chef2User._id });
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Chef.deleteMany({});
    await Meal.deleteMany({});
    
    // Clean up uploaded test files
    try {
      const uploadsPath = path.join(__dirname, '../../uploads/meals');
      const files = await fs.readdir(uploadsPath);
      for (const file of files) {
        if (file.startsWith('meal-')) {
          await fs.unlink(path.join(uploadsPath, file));
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  beforeEach(async () => {
    await Meal.deleteMany({});
  });

  describe('POST /api/v1/meals', () => {
    const validMealData = {
      name: 'Butter Chicken',
      description: 'Creamy and delicious butter chicken with basmati rice',
      price: 15.99,
      preparationTime: 30,
      servingSize: 2,
      cuisine: 'indian',
      dietaryTags: ['gluten-free'],
      ingredients: ['chicken', 'butter', 'cream', 'tomatoes', 'spices'],
      availability: {
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        startTime: '12:00',
        endTime: '20:00',
        quantity: 10
      },
      nutritionInfo: {
        calories: 450,
        protein: 25,
        carbs: 30,
        fat: 20
      },
      spiceLevel: 'medium'
    };

    it('should create a meal successfully with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/meals')
        .set('Authorization', `Bearer ${chefToken}`)
        .field('name', validMealData.name)
        .field('description', validMealData.description)
        .field('price', validMealData.price)
        .field('preparationTime', validMealData.preparationTime)
        .field('servingSize', validMealData.servingSize)
        .field('cuisine', validMealData.cuisine)
        .field('dietaryTags', JSON.stringify(validMealData.dietaryTags))
        .field('ingredients', JSON.stringify(validMealData.ingredients))
        .field('availability', JSON.stringify(validMealData.availability))
        .field('nutritionInfo', JSON.stringify(validMealData.nutritionInfo))
        .field('spiceLevel', validMealData.spiceLevel)
        .attach('images', Buffer.from('fake image data'), 'test-image.jpg');



      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(validMealData.name);
      expect(response.body.data.chefId).toBe(chefId.toString());
      expect(response.body.data.images).toHaveLength(1);
      expect(response.body.data.images[0]).toContain('/uploads/meals/');

      mealId = response.body.data._id;
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/meals')
        .send(validMealData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should fail for non-chef users', async () => {
      const response = await request(app)
        .post('/api/v1/meals')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validMealData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should fail with invalid meal data', async () => {
      const invalidData = { ...validMealData };
      delete invalidData.name;

      const response = await request(app)
        .post('/api/v1/meals')
        .set('Authorization', `Bearer ${chefToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with invalid cuisine type', async () => {
      const invalidData = { ...validMealData, cuisine: 'invalid-cuisine' };

      const response = await request(app)
        .post('/api/v1/meals')
        .set('Authorization', `Bearer ${chefToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with past availability date', async () => {
      const invalidData = {
        ...validMealData,
        availability: {
          ...validMealData.availability,
          date: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
        }
      };

      const response = await request(app)
        .post('/api/v1/meals')
        .set('Authorization', `Bearer ${chefToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/meals/chef/my-meals', () => {
    beforeEach(async () => {
      // Create test meals for chef
      await Meal.create({
        chefId,
        name: 'Test Meal 1',
        description: 'Test description 1',
        price: 10.99,
        preparationTime: 20,
        servingSize: 1,
        cuisine: 'indian',
        ingredients: ['ingredient1'],
        images: ['http://example.com/image1.jpg'],
        availability: {
          date: new Date(Date.now() + 24 * 60 * 60 * 1000),
          startTime: '12:00',
          endTime: '20:00',
          quantity: 5,
          remainingQuantity: 5
        }
      });

      await Meal.create({
        chefId,
        name: 'Test Meal 2',
        description: 'Test description 2',
        price: 12.99,
        preparationTime: 25,
        servingSize: 2,
        cuisine: 'italian',
        ingredients: ['ingredient2'],
        images: ['http://example.com/image2.jpg'],
        availability: {
          date: new Date(Date.now() + 24 * 60 * 60 * 1000),
          startTime: '12:00',
          endTime: '20:00',
          quantity: 3,
          remainingQuantity: 3
        },
        isActive: false
      });
    });

    it('should get all active meals for authenticated chef', async () => {
      const response = await request(app)
        .get('/api/v1/meals/chef/my-meals')
        .set('Authorization', `Bearer ${chefToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].name).toBe('Test Meal 1');
    });

    it('should get all meals including inactive when requested', async () => {
      const response = await request(app)
        .get('/api/v1/meals/chef/my-meals?includeInactive=true')
        .set('Authorization', `Bearer ${chefToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/meals/chef/my-meals');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/meals/:id', () => {
    let testMealId;

    beforeEach(async () => {
      const meal = await Meal.create({
        chefId,
        name: 'Test Meal',
        description: 'Test description',
        price: 10.99,
        preparationTime: 20,
        servingSize: 1,
        cuisine: 'indian',
        ingredients: ['ingredient1'],
        images: ['http://example.com/image1.jpg'],
        availability: {
          date: new Date(Date.now() + 24 * 60 * 60 * 1000),
          startTime: '12:00',
          endTime: '20:00',
          quantity: 5,
          remainingQuantity: 5
        }
      });
      testMealId = meal._id;
    });

    it('should get meal by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/meals/${testMealId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Meal');
      expect(response.body.data.chef).toBeDefined();
    });

    it('should return 404 for non-existent meal', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/meals/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MEAL_NOT_FOUND');
    });

    it('should return 400 for invalid meal ID format', async () => {
      const response = await request(app)
        .get('/api/v1/meals/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_MEAL_ID');
    });
  });

  describe('PUT /api/v1/meals/:id', () => {
    let testMealId;

    beforeEach(async () => {
      const meal = await Meal.create({
        chefId,
        name: 'Test Meal',
        description: 'Test description',
        price: 10.99,
        preparationTime: 20,
        servingSize: 1,
        cuisine: 'indian',
        ingredients: ['ingredient1'],
        images: ['http://example.com/image1.jpg'],
        availability: {
          date: new Date(Date.now() + 24 * 60 * 60 * 1000),
          startTime: '12:00',
          endTime: '20:00',
          quantity: 5,
          remainingQuantity: 5
        }
      });
      testMealId = meal._id;
    });

    it('should update meal successfully', async () => {
      const updateData = {
        name: 'Updated Meal Name',
        price: 12.99,
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/v1/meals/${testMealId}`)
        .set('Authorization', `Bearer ${chefToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.price).toBe(updateData.price);
    });

    it('should fail to update another chef\'s meal', async () => {
      const updateData = { name: 'Unauthorized Update' };

      const response = await request(app)
        .put(`/api/v1/meals/${testMealId}`)
        .set('Authorization', `Bearer ${chef2Token}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED_MEAL_ACCESS');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/meals/${testMealId}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent meal', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/v1/meals/${fakeId}`)
        .set('Authorization', `Bearer ${chefToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MEAL_NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/meals/:id', () => {
    let testMealId;

    beforeEach(async () => {
      const meal = await Meal.create({
        chefId,
        name: 'Test Meal',
        description: 'Test description',
        price: 10.99,
        preparationTime: 20,
        servingSize: 1,
        cuisine: 'indian',
        ingredients: ['ingredient1'],
        images: ['http://example.com/image1.jpg'],
        availability: {
          date: new Date(Date.now() + 24 * 60 * 60 * 1000),
          startTime: '12:00',
          endTime: '20:00',
          quantity: 5,
          remainingQuantity: 5
        }
      });
      testMealId = meal._id;
    });

    it('should delete meal successfully (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/v1/meals/${testMealId}`)
        .set('Authorization', `Bearer ${chefToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify meal is soft deleted
      const meal = await Meal.findById(testMealId);
      expect(meal.isActive).toBe(false);
    });

    it('should fail to delete another chef\'s meal', async () => {
      const response = await request(app)
        .delete(`/api/v1/meals/${testMealId}`)
        .set('Authorization', `Bearer ${chef2Token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED_MEAL_ACCESS');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/meals/${testMealId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent meal', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/meals/${fakeId}`)
        .set('Authorization', `Bearer ${chefToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MEAL_NOT_FOUND');
    });
  });

  describe('GET /api/v1/meals/search', () => {
    beforeEach(async () => {
      // Create test meals for different chefs
      await Meal.create({
        chefId,
        name: 'Butter Chicken',
        description: 'Delicious Indian curry',
        price: 15.99,
        preparationTime: 30,
        servingSize: 2,
        cuisine: 'indian',
        dietaryTags: ['gluten-free'],
        ingredients: ['chicken', 'butter', 'cream'],
        images: ['http://example.com/image1.jpg'],
        availability: {
          date: new Date(),
          startTime: '12:00',
          endTime: '20:00',
          quantity: 10,
          remainingQuantity: 8
        },
        rating: { average: 4.5, count: 10 }
      });

      await Meal.create({
        chefId: chef2Id,
        name: 'Pad Thai',
        description: 'Authentic Thai noodles',
        price: 12.99,
        preparationTime: 25,
        servingSize: 1,
        cuisine: 'thai',
        dietaryTags: ['vegetarian'],
        ingredients: ['noodles', 'vegetables', 'sauce'],
        images: ['http://example.com/image2.jpg'],
        availability: {
          date: new Date(),
          startTime: '11:00',
          endTime: '21:00',
          quantity: 5,
          remainingQuantity: 3
        },
        rating: { average: 4.2, count: 8 }
      });

      await Meal.create({
        chefId,
        name: 'Margherita Pizza',
        description: 'Classic Italian pizza',
        price: 18.99,
        preparationTime: 20,
        servingSize: 2,
        cuisine: 'italian',
        dietaryTags: ['vegetarian'],
        ingredients: ['dough', 'tomato', 'mozzarella'],
        images: ['http://example.com/image3.jpg'],
        availability: {
          date: new Date(),
          startTime: '17:00',
          endTime: '23:00',
          quantity: 15,
          remainingQuantity: 12
        },
        rating: { average: 4.8, count: 15 }
      });
    });

    it('should search meals by location', async () => {
      const response = await request(app)
        .get('/api/v1/meals/search')
        .query({
          longitude: -74.006,
          latitude: 40.7128,
          radius: 20
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('chef');
    });

    it('should filter meals by cuisine', async () => {
      const response = await request(app)
        .get('/api/v1/meals/search')
        .query({
          longitude: -74.006,
          latitude: 40.7128,
          cuisine: 'indian'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every(meal => meal.cuisine === 'indian')).toBe(true);
    });

    it('should filter meals by dietary tags', async () => {
      const response = await request(app)
        .get('/api/v1/meals/search')
        .query({
          longitude: -74.006,
          latitude: 40.7128,
          dietaryTags: ['vegetarian']
        });



      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every(meal => 
        meal.dietaryTags.includes('vegetarian')
      )).toBe(true);
    });

    it('should filter meals by max price', async () => {
      const response = await request(app)
        .get('/api/v1/meals/search')
        .query({
          longitude: -74.006,
          latitude: 40.7128,
          maxPrice: 15
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every(meal => meal.price <= 15)).toBe(true);
    });

    it('should search meals by text', async () => {
      const response = await request(app)
        .get('/api/v1/meals/search')
        .query({
          searchText: 'chicken',
          longitude: -74.006,
          latitude: 40.7128
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.some(meal => 
        meal.name.toLowerCase().includes('chicken') ||
        meal.description.toLowerCase().includes('chicken')
      )).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/meals/search')
        .query({
          longitude: -74.006,
          latitude: 40.7128,
          limit: 2,
          skip: 0
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination).toHaveProperty('limit', 2);
      expect(response.body.pagination).toHaveProperty('skip', 0);
    });

    it('should sort meals by rating', async () => {
      const response = await request(app)
        .get('/api/v1/meals/search')
        .query({
          longitude: -74.006,
          latitude: 40.7128,
          sortBy: 'rating.average',
          sortOrder: -1
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Check if results are sorted by rating (descending)
      for (let i = 1; i < response.body.data.length; i++) {
        expect(response.body.data[i-1].rating.average)
          .toBeGreaterThanOrEqual(response.body.data[i].rating.average);
      }
    });

    it('should return validation error for invalid coordinates', async () => {
      const response = await request(app)
        .get('/api/v1/meals/search')
        .query({
          longitude: 200, // Invalid longitude
          latitude: 40.7128
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});