const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { Meal, mealValidationSchemas } = require('../../models/Meal');
const { Chef } = require('../../models/Chef');
const { User } = require('../../models/User');

describe('Meal Model', () => {
    let mongoServer;
    let testChef;
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
        await Meal.deleteMany({});
        await Chef.deleteMany({});
        await User.deleteMany({});

        // Create test user and chef
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

        testChef = new Chef({
            userId: testUser._id,
            businessName: 'John\'s Kitchen',
            description: 'Authentic Italian cuisine made with love',
            specialties: ['italian', 'mediterranean'],
            kitchenLicense: 'KL123456789',
            serviceArea: { coordinates: [-74.006, 40.7128] },
            bankDetails: {
                accountNumber: '1234567890',
                routingNumber: '123456789',
                accountHolderName: 'John Doe'
            },
            status: 'approved',
            availability: { isActive: true }
        });
        await testChef.save();
    });

    describe('Meal Schema Validation', () => {
        const validMealData = {
            name: 'Margherita Pizza',
            description: 'Classic Italian pizza with fresh tomatoes, mozzarella, and basil',
            price: 15.99,
            preparationTime: 30,
            servingSize: 2,
            cuisine: 'italian',
            dietaryTags: ['vegetarian'],
            ingredients: ['pizza dough', 'tomato sauce', 'mozzarella cheese', 'fresh basil'],
            images: ['https://example.com/pizza1.jpg'],
            availability: {
                date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                startTime: '11:00',
                endTime: '22:00',
                quantity: 10
            },
            nutritionInfo: {
                calories: 280,
                protein: 12,
                carbs: 35,
                fat: 10
            }
        };

        it('should create a meal with valid data', async () => {
            const mealData = { ...validMealData, chefId: testChef._id };
            const meal = new Meal(mealData);
            const savedMeal = await meal.save();

            expect(savedMeal._id).toBeDefined();
            expect(savedMeal.name).toBe(mealData.name);
            expect(savedMeal.isActive).toBe(true); // default value
            expect(savedMeal.rating.average).toBe(0); // default value
            expect(savedMeal.rating.count).toBe(0); // default value
            expect(savedMeal.availability.remainingQuantity).toBe(mealData.availability.quantity);
        });

        it('should require chef ID', async () => {
            const meal = new Meal(validMealData);
            await expect(meal.save()).rejects.toThrow('Chef ID is required');
        });

        it('should require meal name', async () => {
            const mealData = { ...validMealData, chefId: testChef._id };
            delete mealData.name;

            const meal = new Meal(mealData);
            await expect(meal.save()).rejects.toThrow('Meal name is required');
        });

        it('should validate meal name length', async () => {
            const mealData = {
                ...validMealData,
                chefId: testChef._id,
                name: 'A' // Too short
            };

            const meal = new Meal(mealData);
            await expect(meal.save()).rejects.toThrow('Meal name must be at least 2 characters long');
        });

        it('should validate meal name maximum length', async () => {
            const mealData = {
                ...validMealData,
                chefId: testChef._id,
                name: 'A'.repeat(101) // Too long
            };

            const meal = new Meal(mealData);
            await expect(meal.save()).rejects.toThrow('Meal name cannot exceed 100 characters');
        });

        it('should require description', async () => {
            const mealData = { ...validMealData, chefId: testChef._id };
            delete mealData.description;

            const meal = new Meal(mealData);
            await expect(meal.save()).rejects.toThrow('Meal description is required');
        });

        it('should validate description length', async () => {
            const mealData = {
                ...validMealData,
                chefId: testChef._id,
                description: 'Short' // Too short
            };

            const meal = new Meal(mealData);
            await expect(meal.save()).rejects.toThrow('Description must be at least 10 characters long');
        });

        it('should validate price range', async () => {
            const mealData = {
                ...validMealData,
                chefId: testChef._id,
                price: 0 // Invalid price
            };

            const meal = new Meal(mealData);
            await expect(meal.save()).rejects.toThrow('Price must be greater than 0');
        });

        it('should validate preparation time', async () => {
            const mealData = {
                ...validMealData,
                chefId: testChef._id,
                preparationTime: 3 // Too short
            };

            const meal = new Meal(mealData);
            await expect(meal.save()).rejects.toThrow('Preparation time must be at least 5 minutes');
        });

        it('should validate cuisine type', async () => {
            const mealData = {
                ...validMealData,
                chefId: testChef._id,
                cuisine: 'invalid-cuisine'
            };

            const meal = new Meal(mealData);
            await expect(meal.save()).rejects.toThrow('Invalid cuisine type');
        });

        it('should validate dietary tags', async () => {
            const mealData = {
                ...validMealData,
                chefId: testChef._id,
                dietaryTags: ['invalid-tag']
            };

            const meal = new Meal(mealData);
            await expect(meal.save()).rejects.toThrow('Invalid dietary tag');
        });

        it('should validate image URLs', async () => {
            const mealData = {
                ...validMealData,
                chefId: testChef._id,
                images: ['invalid-url']
            };

            const meal = new Meal(mealData);
            await expect(meal.save()).rejects.toThrow('Image URL must be a valid HTTP/HTTPS URL');
        });

        it('should validate availability date is not in the past', async () => {
            const mealData = {
                ...validMealData,
                chefId: testChef._id,
                availability: {
                    ...validMealData.availability,
                    date: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
                }
            };

            const meal = new Meal(mealData);
            await expect(meal.save()).rejects.toThrow('Availability date cannot be in the past');
        });

        it('should validate time format', async () => {
            const mealData = {
                ...validMealData,
                chefId: testChef._id,
                availability: {
                    ...validMealData.availability,
                    startTime: '25:00' // Invalid time
                }
            };

            const meal = new Meal(mealData);
            await expect(meal.save()).rejects.toThrow('Start time must be in HH:MM format');
        });

        it('should validate end time is after start time', async () => {
            const mealData = {
                ...validMealData,
                chefId: testChef._id,
                availability: {
                    ...validMealData.availability,
                    startTime: '15:00',
                    endTime: '14:00' // End before start
                }
            };

            const meal = new Meal(mealData);
            await expect(meal.save()).rejects.toThrow('End time must be after start time');
        });

        it('should validate quantity limits', async () => {
            const mealData = {
                ...validMealData,
                chefId: testChef._id,
                availability: {
                    ...validMealData.availability,
                    quantity: 0 // Invalid quantity
                }
            };

            const meal = new Meal(mealData);
            await expect(meal.save()).rejects.toThrow('Quantity must be at least 1');
        });

        it('should validate nutrition info ranges', async () => {
            const mealData = {
                ...validMealData,
                chefId: testChef._id,
                nutritionInfo: {
                    calories: -10 // Invalid negative value
                }
            };

            const meal = new Meal(mealData);
            await expect(meal.save()).rejects.toThrow('Calories cannot be negative');
        });

        it('should validate special offer pricing', async () => {
            const mealData = {
                ...validMealData,
                chefId: testChef._id,
                isSpecialOffer: true,
                originalPrice: 10.00 // Less than current price
            };

            const meal = new Meal(mealData);
            await expect(meal.save()).rejects.toThrow('Original price must be greater than current price for special offers');
        });
    });

    describe('Meal Virtuals', () => {
        let testMeal;

        beforeEach(async () => {
            const mealData = {
                chefId: testChef._id,
                name: 'Test Meal',
                description: 'A delicious test meal for testing purposes',
                price: 12.99,
                preparationTime: 25,
                servingSize: 1,
                cuisine: 'italian',
                ingredients: ['ingredient1', 'ingredient2'],
                images: ['https://example.com/meal.jpg'],
                availability: {
                    date: new Date(),
                    startTime: '10:00',
                    endTime: '20:00',
                    quantity: 5
                }
            };

            testMeal = new Meal(mealData);
            await testMeal.save();
        });

        it('should calculate discount percentage correctly', () => {
            testMeal.isSpecialOffer = true;
            testMeal.originalPrice = 20.00;

            expect(testMeal.discountPercentage).toBe(35); // (20-12.99)/20 * 100 = 35%
        });

        it('should return 0 discount for non-special offers', () => {
            expect(testMeal.discountPercentage).toBe(0);
        });

        it('should display rating correctly', () => {
            expect(testMeal.displayRating).toBe('New');

            testMeal.rating.average = 4.5;
            testMeal.rating.count = 10;
            expect(testMeal.displayRating).toBe('4.5');
        });

        it('should determine availability status correctly', () => {
            expect(testMeal.availabilityStatus).toBe('available');

            testMeal.isActive = false;
            expect(testMeal.availabilityStatus).toBe('inactive');

            testMeal.isActive = true;
            testMeal.availability.remainingQuantity = 0;
            expect(testMeal.availabilityStatus).toBe('sold-out');
        });
    });

    describe('Meal Instance Methods', () => {
        let testMeal;

        beforeEach(async () => {
            const mealData = {
                chefId: testChef._id,
                name: 'Test Meal',
                description: 'A delicious test meal for testing purposes',
                price: 12.99,
                preparationTime: 25,
                servingSize: 1,
                cuisine: 'italian',
                ingredients: ['ingredient1', 'ingredient2'],
                images: ['https://example.com/meal.jpg'],
                availability: {
                    date: new Date(),
                    startTime: '10:00',
                    endTime: '20:00',
                    quantity: 5
                }
            };

            testMeal = new Meal(mealData);
            await testMeal.save();
        });

        it('should update rating correctly', async () => {
            await testMeal.updateRating(4);
            expect(testMeal.rating.average).toBe(4);
            expect(testMeal.rating.count).toBe(1);

            await testMeal.updateRating(5);
            expect(testMeal.rating.average).toBe(4.5);
            expect(testMeal.rating.count).toBe(2);
        });

        it('should reduce quantity correctly', async () => {
            const initialQuantity = testMeal.availability.remainingQuantity;
            const initialOrders = testMeal.totalOrders;

            await testMeal.reduceQuantity(2);

            expect(testMeal.availability.remainingQuantity).toBe(initialQuantity - 2);
            expect(testMeal.totalOrders).toBe(initialOrders + 2);
        });

        it('should throw error when reducing quantity below available', async () => {
            expect(() => testMeal.reduceQuantity(10)).toThrow('Insufficient quantity available');
        });

        it('should restore quantity correctly', async () => {
            await testMeal.reduceQuantity(2);
            const quantityAfterReduction = testMeal.availability.remainingQuantity;
            const ordersAfterReduction = testMeal.totalOrders;

            await testMeal.restoreQuantity(1);

            expect(testMeal.availability.remainingQuantity).toBe(quantityAfterReduction + 1);
            expect(testMeal.totalOrders).toBe(ordersAfterReduction - 1);
        });

        it('should not restore quantity beyond total quantity', async () => {
            await testMeal.restoreQuantity(10);
            expect(testMeal.availability.remainingQuantity).toBe(testMeal.availability.quantity);
        });

        it('should check availability for order correctly', () => {
            expect(testMeal.isAvailableForOrder(3)).toBe(true);
            expect(testMeal.isAvailableForOrder(10)).toBe(false);

            testMeal.isActive = false;
            expect(testMeal.isAvailableForOrder(1)).toBe(false);
        });
    });

    describe('Meal Static Methods', () => {
        let testMeals;

        beforeEach(async () => {
            // Create multiple test meals
            const mealData1 = {
                chefId: testChef._id,
                name: 'Italian Pasta',
                description: 'Delicious Italian pasta with fresh ingredients',
                price: 14.99,
                preparationTime: 20,
                servingSize: 1,
                cuisine: 'italian',
                dietaryTags: ['vegetarian'],
                ingredients: ['pasta', 'tomato sauce', 'cheese'],
                images: ['https://example.com/pasta.jpg'],
                availability: {
                    date: new Date(),
                    startTime: '11:00',
                    endTime: '21:00',
                    quantity: 8
                },
                rating: { average: 4.5, count: 20 }
            };

            const mealData2 = {
                chefId: testChef._id,
                name: 'Vegan Salad',
                description: 'Fresh and healthy vegan salad with organic vegetables',
                price: 9.99,
                preparationTime: 10,
                servingSize: 1,
                cuisine: 'healthy',
                dietaryTags: ['vegan', 'gluten-free'],
                ingredients: ['lettuce', 'tomatoes', 'cucumber', 'olive oil'],
                images: ['https://example.com/salad.jpg'],
                availability: {
                    date: new Date(),
                    startTime: '09:00',
                    endTime: '18:00',
                    quantity: 12
                },
                rating: { average: 4.2, count: 15 }
            };

            testMeals = await Meal.create([mealData1, mealData2]);
        });

        it('should find meals by chef', async () => {
            const meals = await Meal.findByChef(testChef._id);
            expect(meals).toHaveLength(2);
            expect(meals[0].chefId.toString()).toBe(testChef._id.toString());
        });

        it('should find only active meals by default', async () => {
            testMeals[0].isActive = false;
            await testMeals[0].save();

            const activeMeals = await Meal.findByChef(testChef._id);
            expect(activeMeals).toHaveLength(1);
            expect(activeMeals[0].isActive).toBe(true);
        });

        it('should include inactive meals when requested', async () => {
            testMeals[0].isActive = false;
            await testMeals[0].save();

            const allMeals = await Meal.findByChef(testChef._id, true);
            expect(allMeals).toHaveLength(2);
        });

        it('should search meals by text', async () => {
            const results = await Meal.searchByText('pasta');
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Italian Pasta');
        });

        it('should search meals by ingredients', async () => {
            const results = await Meal.searchByText('tomato');
            expect(results.length).toBeGreaterThan(0);
        });
    });

    describe('Meal Indexing', () => {
        it('should have proper indexes for efficient queries', async () => {
            const indexes = await Meal.collection.getIndexes();
            const indexNames = Object.keys(indexes);

            // Check for essential indexes
            expect(indexNames).toContain('chefId_1_isActive_1');
            expect(indexNames).toContain('cuisine_1_isActive_1');
            expect(indexNames).toContain('dietaryTags_1_isActive_1');
            expect(indexNames).toContain('availability.date_1_isActive_1');
            expect(indexNames).toContain('rating.average_-1_isActive_1');
        });
    });

    describe('Meal Pre-save Middleware', () => {
        it('should set remaining quantity on creation', async () => {
            const mealData = {
                chefId: testChef._id,
                name: 'New Meal',
                description: 'A brand new meal for testing middleware',
                price: 10.99,
                preparationTime: 15,
                servingSize: 1,
                cuisine: 'american',
                ingredients: ['ingredient1'],
                images: ['https://example.com/new-meal.jpg'],
                availability: {
                    date: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    startTime: '12:00',
                    endTime: '20:00',
                    quantity: 7
                }
            };

            const meal = new Meal(mealData);
            await meal.save();

            expect(meal.availability.remainingQuantity).toBe(7);
        });

        it('should validate time window in pre-save middleware', async () => {
            const mealData = {
                chefId: testChef._id,
                name: 'Invalid Time Meal',
                description: 'A meal with invalid time window for testing',
                price: 10.99,
                preparationTime: 15,
                servingSize: 1,
                cuisine: 'american',
                ingredients: ['ingredient1'],
                images: ['https://example.com/invalid-meal.jpg'],
                availability: {
                    date: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    startTime: '20:00',
                    endTime: '19:00', // End before start
                    quantity: 5
                }
            };

            const meal = new Meal(mealData);
            await expect(meal.save()).rejects.toThrow('End time must be after start time');
        });
    });

    describe('Joi Validation Schemas', () => {
        it('should validate meal creation data', () => {
            const validData = {
                name: 'Test Meal',
                description: 'A test meal for validation',
                price: 15.99,
                preparationTime: 30,
                servingSize: 2,
                cuisine: 'italian',
                dietaryTags: ['vegetarian'],
                ingredients: ['ingredient1', 'ingredient2'],
                images: ['https://example.com/meal.jpg'],
                availability: {
                    date: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    startTime: '11:00',
                    endTime: '22:00',
                    quantity: 10
                }
            };

            const { error } = mealValidationSchemas.create.validate(validData);
            expect(error).toBeUndefined();
        });

        it('should reject invalid meal creation data', () => {
            const invalidData = {
                name: 'A', // Too short
                description: 'Short', // Too short
                price: -5, // Negative
                preparationTime: 2, // Too short
                servingSize: 0, // Too small
                cuisine: 'invalid-cuisine',
                ingredients: [], // Empty array
                images: ['invalid-url'], // Invalid URL
                availability: {
                    date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Past date
                    startTime: '25:00', // Invalid time
                    endTime: '26:00', // Invalid time
                    quantity: 0 // Too small
                }
            };

            const { error } = mealValidationSchemas.create.validate(invalidData);
            expect(error).toBeDefined();
        });

        it('should validate meal update data', () => {
            const validUpdateData = {
                name: 'Updated Meal Name',
                price: 18.99,
                isActive: false
            };

            const { error } = mealValidationSchemas.update.validate(validUpdateData);
            expect(error).toBeUndefined();
        });

        it('should validate search parameters', () => {
            const validSearchData = {
                longitude: -74.006,
                latitude: 40.7128,
                radius: 10,
                cuisine: 'italian',
                dietaryTags: ['vegetarian', 'gluten-free'],
                maxPrice: 25,
                minRating: 4,
                limit: 20,
                skip: 0,
                sortBy: 'rating.average',
                sortOrder: -1
            };

            const { error } = mealValidationSchemas.search.validate(validSearchData);
            expect(error).toBeUndefined();
        });
    });
});
