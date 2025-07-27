const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { Cart, cartValidationSchemas } = require('../../models/Cart');
const { User } = require('../../models/User');
const { Chef } = require('../../models/Chef');
const { Meal } = require('../../models/Meal');

describe('Cart Model', () => {
  let mongoServer;
  let testCustomer;
  let testChef;
  let testMeal;

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
    await Cart.deleteMany({});
    await User.deleteMany({});
    await Chef.deleteMany({});
    await Meal.deleteMany({});

    // Create test customer
    testCustomer = await User.create({
      name: 'Test Customer',
      email: 'customer@test.com',
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

    // Create test chef user
    const chefUser = await User.create({
      name: 'Test Chef',
      email: 'chef@test.com',
      password: 'password123',
      phone: '+1234567891',
      role: 'chef',
      location: { coordinates: [-74.007, 40.7129] },
      address: {
        street: '456 Chef St',
        city: 'New York',
        state: 'NY',
        zipCode: '10002'
      }
    });

    // Create test chef
    testChef = await Chef.create({
      userId: chefUser._id,
      businessName: 'Test Kitchen',
      description: 'Test kitchen description',
      specialties: ['indian', 'chinese'],
      kitchenLicense: 'LIC123456',
      serviceArea: { coordinates: [-74.007, 40.7129] },
      status: 'approved',
      bankDetails: {
        accountNumber: '1234567890',
        routingNumber: '123456789',
        accountHolderName: 'Test Chef'
      }
    });

    // Create test meal
    testMeal = await Meal.create({
      chefId: testChef._id,
      name: 'Test Meal',
      description: 'A delicious test meal',
      price: 15.99,
      preparationTime: 30,
      servingSize: 2,
      cuisine: 'indian',
      ingredients: ['rice', 'chicken', 'spices'],
      images: ['https://example.com/image1.jpg'],
      availability: {
        date: new Date(),
        startTime: '10:00',
        endTime: '22:00',
        quantity: 10,
        remainingQuantity: 10
      }
    });
  });

  describe('Cart Schema Validation', () => {
    const getValidCartData = () => ({
      customerId: testCustomer._id,
      items: [{
        mealId: testMeal._id,
        chefId: testChef._id,
        quantity: 2,
        price: 15.99,
        specialInstructions: 'Extra spicy'
      }],
      deliveryAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        coordinates: [-74.006, 40.7128]
      },
      deliveryType: 'delivery'
    });

    it('should create a cart with valid data', async () => {
      const cartData = getValidCartData();
      const cart = new Cart(cartData);
      const savedCart = await cart.save();

      expect(savedCart._id).toBeDefined();
      expect(savedCart.customerId.toString()).toBe(testCustomer._id.toString());
      expect(savedCart.items).toHaveLength(1);
      expect(savedCart.items[0].mealId.toString()).toBe(testMeal._id.toString());
      expect(savedCart.deliveryType).toBe('delivery');
      expect(savedCart.expiresAt).toBeDefined();
    });

    it('should require customerId', async () => {
      const cartData = getValidCartData();
      delete cartData.customerId;
      
      const cart = new Cart(cartData);
      await expect(cart.save()).rejects.toThrow('Customer ID is required');
    });

    it('should enforce unique customerId', async () => {
      const cartData = getValidCartData();
      
      // Create first cart
      await Cart.create(cartData);
      
      // Try to create second cart with same customerId
      const duplicateCart = new Cart(cartData);
      await expect(duplicateCart.save()).rejects.toThrow();
    });

    it('should validate delivery address coordinates', async () => {
      const cartData = getValidCartData();
      cartData.deliveryAddress.coordinates = [200, 100]; // Invalid coordinates
      
      const cart = new Cart(cartData);
      await expect(cart.save()).rejects.toThrow('Invalid coordinates');
    });

    it('should validate delivery type enum', async () => {
      const cartData = getValidCartData();
      cartData.deliveryType = 'invalid';
      
      const cart = new Cart(cartData);
      await expect(cart.save()).rejects.toThrow('Delivery type must be either delivery or pickup');
    });

    it('should validate item quantity limits', async () => {
      const cartData = getValidCartData();
      cartData.items[0].quantity = 0;
      
      const cart = new Cart(cartData);
      await expect(cart.save()).rejects.toThrow('Quantity must be at least 1');
    });

    it('should validate item price minimum', async () => {
      const cartData = getValidCartData();
      cartData.items[0].price = 0;
      
      const cart = new Cart(cartData);
      await expect(cart.save()).rejects.toThrow('Price must be greater than 0');
    });

    it('should set default expiration time', async () => {
      const cart = new Cart({
        customerId: testCustomer._id,
        items: []
      });
      
      await cart.save();
      
      expect(cart.expiresAt).toBeDefined();
      expect(cart.expiresAt > new Date()).toBe(true);
    });
  });

  describe('Cart Virtual Properties', () => {
    let testCart;

    beforeEach(async () => {
      testCart = await Cart.create({
        customerId: testCustomer._id,
        items: [
          {
            mealId: testMeal._id,
            chefId: testChef._id,
            quantity: 2,
            price: 15.99
          },
          {
            mealId: testMeal._id,
            chefId: testChef._id,
            quantity: 1,
            price: 12.99
          }
        ],
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: [-74.006, 40.7128]
        },
        discount: 5.00
      });
    });

    it('should calculate subtotal correctly', () => {
      expect(testCart.subtotal).toBe(44.97); // (15.99 * 2) + (12.99 * 1)
    });

    it('should calculate total items count', () => {
      expect(testCart.totalItems).toBe(3); // 2 + 1
    });

    it('should count unique chefs', () => {
      expect(testCart.uniqueChefs).toBe(1); // Same chef for both items
    });

    it('should check if cart is expired', () => {
      expect(testCart.isExpired).toBe(false);
      
      testCart.expiresAt = new Date(Date.now() - 1000); // 1 second ago
      expect(testCart.isExpired).toBe(true);
    });

    it('should check if cart is empty', () => {
      expect(testCart.isEmpty).toBe(false);
      
      testCart.items = [];
      expect(testCart.isEmpty).toBe(true);
    });

    it('should generate full delivery address', () => {
      expect(testCart.fullDeliveryAddress).toBe('123 Main St, New York, NY 10001');
      
      testCart.deliveryAddress.street = '';
      expect(testCart.fullDeliveryAddress).toBeNull();
    });

    it('should calculate total with discount', () => {
      expect(testCart.total).toBe(39.97); // 44.97 - 5.00
    });
  });

  describe('Cart Static Methods', () => {
    it('should find or create cart for customer', async () => {
      // First call should create new cart
      const cart1 = await Cart.findOrCreateForCustomer(testCustomer._id);
      expect(cart1).toBeDefined();
      expect(cart1.customerId.toString()).toBe(testCustomer._id.toString());
      expect(cart1.items).toHaveLength(0);
      
      // Second call should return existing cart
      const cart2 = await Cart.findOrCreateForCustomer(testCustomer._id);
      expect(cart2._id.toString()).toBe(cart1._id.toString());
    });

    it('should find cart by session', async () => {
      const sessionId = 'test-session-123';
      
      // Create cart with session ID
      const cart = await Cart.create({
        customerId: testCustomer._id,
        sessionId,
        items: []
      });
      
      const foundCart = await Cart.findBySession(sessionId);
      expect(foundCart._id.toString()).toBe(cart._id.toString());
    });

    it('should cleanup expired carts', async () => {
      // Create expired cart
      await Cart.create({
        customerId: testCustomer._id,
        items: [],
        expiresAt: new Date(Date.now() - 1000) // 1 second ago
      });
      
      // Create active cart
      await Cart.create({
        customerId: new mongoose.Types.ObjectId(),
        items: [],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      });
      
      const result = await Cart.cleanupExpired();
      expect(result.deletedCount).toBe(1);
      
      const remainingCarts = await Cart.find({});
      expect(remainingCarts).toHaveLength(1);
    });
  });

  describe('Cart Instance Methods', () => {
    let testCart;

    beforeEach(async () => {
      testCart = await Cart.create({
        customerId: testCustomer._id,
        items: []
      });
    });

    it('should add item to empty cart', async () => {
      await testCart.addItem(testMeal._id, testChef._id, 2, 15.99, 'Extra spicy');
      
      expect(testCart.items).toHaveLength(1);
      expect(testCart.items[0].mealId.toString()).toBe(testMeal._id.toString());
      expect(testCart.items[0].quantity).toBe(2);
      expect(testCart.items[0].price).toBe(15.99);
      expect(testCart.items[0].specialInstructions).toBe('Extra spicy');
    });

    it('should update existing item when adding same meal', async () => {
      // Add item first time
      await testCart.addItem(testMeal._id, testChef._id, 2, 15.99);
      
      // Add same item again
      await testCart.addItem(testMeal._id, testChef._id, 1, 15.99);
      
      expect(testCart.items).toHaveLength(1);
      expect(testCart.items[0].quantity).toBe(3); // 2 + 1
    });

    it('should update item quantity', async () => {
      await testCart.addItem(testMeal._id, testChef._id, 2, 15.99);
      
      await testCart.updateItemQuantity(testMeal._id, 5);
      
      expect(testCart.items[0].quantity).toBe(5);
    });

    it('should remove item when quantity is set to 0', async () => {
      await testCart.addItem(testMeal._id, testChef._id, 2, 15.99);
      
      await testCart.updateItemQuantity(testMeal._id, 0);
      
      expect(testCart.items).toHaveLength(0);
    });

    it('should throw error when updating non-existent item', async () => {
      const nonExistentMealId = new mongoose.Types.ObjectId();
      
      try {
        await testCart.updateItemQuantity(nonExistentMealId, 5);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Item not found in cart');
      }
    });

    it('should remove item from cart', async () => {
      await testCart.addItem(testMeal._id, testChef._id, 2, 15.99);
      
      await testCart.removeItem(testMeal._id);
      
      expect(testCart.items).toHaveLength(0);
    });

    it('should throw error when removing non-existent item', async () => {
      const nonExistentMealId = new mongoose.Types.ObjectId();
      
      try {
        await testCart.removeItem(nonExistentMealId);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Item not found in cart');
      }
    });

    it('should clear cart', async () => {
      await testCart.addItem(testMeal._id, testChef._id, 2, 15.99);
      testCart.promoCode = 'SAVE10';
      testCart.discount = 10;
      testCart.notes = 'Test notes';
      
      await testCart.clearCart();
      
      expect(testCart.items).toHaveLength(0);
      expect(testCart.promoCode).toBeUndefined();
      expect(testCart.discount).toBe(0);
      expect(testCart.notes).toBeUndefined();
    });

    it('should apply promo code', async () => {
      await testCart.applyPromoCode('SAVE10', 10.00);
      
      expect(testCart.promoCode).toBe('SAVE10');
      expect(testCart.discount).toBe(10.00);
    });

    it('should remove promo code', async () => {
      testCart.promoCode = 'SAVE10';
      testCart.discount = 10.00;
      
      await testCart.removePromoCode();
      
      expect(testCart.promoCode).toBeUndefined();
      expect(testCart.discount).toBe(0);
    });

    it('should update delivery address', async () => {
      const newAddress = {
        street: '456 Oak St',
        city: 'Brooklyn',
        state: 'NY',
        zipCode: '11201',
        coordinates: [-73.990, 40.693]
      };
      
      await testCart.updateDeliveryAddress(newAddress);
      
      expect(testCart.deliveryAddress.street).toBe('456 Oak St');
      expect(testCart.deliveryAddress.city).toBe('Brooklyn');
      expect(testCart.deliveryAddress.coordinates).toEqual([-73.990, 40.693]);
    });

    it('should group items by chef', async () => {
      // Create second chef and meal
      const chefUser2 = await User.create({
        name: 'Test Chef 2',
        email: 'chef2@test.com',
        password: 'password123',
        phone: '+1234567892',
        role: 'chef',
        location: { coordinates: [-74.008, 40.7130] },
        address: {
          street: '789 Chef Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10003'
        }
      });

      const testChef2 = await Chef.create({
        userId: chefUser2._id,
        businessName: 'Test Kitchen 2',
        description: 'Second test kitchen',
        specialties: ['italian'],
        kitchenLicense: 'LIC789012',
        serviceArea: { coordinates: [-74.008, 40.7130] },
        status: 'approved',
        bankDetails: {
          accountNumber: '9876543210',
          routingNumber: '987654321',
          accountHolderName: 'Test Chef 2'
        }
      });

      const testMeal2 = await Meal.create({
        chefId: testChef2._id,
        name: 'Test Meal 2',
        description: 'Another delicious test meal',
        price: 18.99,
        preparationTime: 25,
        servingSize: 1,
        cuisine: 'italian',
        ingredients: ['pasta', 'tomato', 'cheese'],
        images: ['https://example.com/image2.jpg'],
        availability: {
          date: new Date(),
          startTime: '11:00',
          endTime: '21:00',
          quantity: 5,
          remainingQuantity: 5
        }
      });

      // Add items from both chefs
      await testCart.addItem(testMeal._id, testChef._id, 2, 15.99);
      await testCart.addItem(testMeal2._id, testChef2._id, 1, 18.99);
      
      const groupedItems = testCart.groupItemsByChef();
      
      expect(groupedItems).toHaveLength(2);
      expect(groupedItems[0].items).toHaveLength(1);
      expect(groupedItems[1].items).toHaveLength(1);
      expect(groupedItems[0].subtotal).toBe(31.98); // 15.99 * 2
      expect(groupedItems[1].subtotal).toBe(18.99); // 18.99 * 1
    });

    it('should validate items availability', async () => {
      // Add item to cart
      await testCart.addItem(testMeal._id, testChef._id, 2, 15.99);
      
      // Mock meal availability check
      testMeal.isAvailableForOrder = jest.fn().mockReturnValue(true);
      
      const unavailableItems = await testCart.validateItemsAvailability();
      
      expect(unavailableItems).toHaveLength(0);
    });

    it('should calculate delivery fees by chef', async () => {
      // Set delivery address
      testCart.deliveryAddress = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        coordinates: [-74.006, 40.7128]
      };
      testCart.deliveryType = 'delivery';
      
      await testCart.addItem(testMeal._id, testChef._id, 2, 15.99);
      
      const deliveryFees = await testCart.calculateDeliveryFees();
      
      expect(deliveryFees[testChef._id]).toBeDefined();
      expect(typeof deliveryFees[testChef._id]).toBe('number');
      expect(deliveryFees[testChef._id]).toBeGreaterThan(0);
    });
  });

  describe('Cart Middleware', () => {
    it('should extend expiration on item updates', async () => {
      const cart = await Cart.create({
        customerId: testCustomer._id,
        items: [],
        expiresAt: new Date(Date.now() + 1000) // 1 second from now
      });
      
      const originalExpiration = cart.expiresAt;
      
      // Wait a bit and add item
      await new Promise(resolve => setTimeout(resolve, 100));
      await cart.addItem(testMeal._id, testChef._id, 1, 15.99);
      
      expect(cart.expiresAt.getTime()).toBeGreaterThan(originalExpiration.getTime());
    });

    it('should validate delivery address completeness for delivery type', async () => {
      const cart = new Cart({
        customerId: testCustomer._id,
        deliveryType: 'delivery',
        deliveryAddress: {
          street: '123 Main St'
          // Missing city, state, zipCode, coordinates
        }
      });
      
      await expect(cart.save()).rejects.toThrow('Incomplete delivery address for delivery type');
    });
  });
});