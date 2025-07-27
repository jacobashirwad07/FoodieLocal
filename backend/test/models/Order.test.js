const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { Order, orderValidationSchemas } = require('../../models/Order');
const { User } = require('../../models/User');
const { Chef } = require('../../models/Chef');
const { Meal } = require('../../models/Meal');

describe('Order Model', () => {
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
    await Order.deleteMany({});
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

  describe('Order Schema Validation', () => {
    const getValidOrderData = () => ({
      customerId: testCustomer._id,
      items: [{
        mealId: testMeal._id,
        chefId: testChef._id,
        quantity: 2,
        price: 15.99,
        specialInstructions: 'Extra spicy'
      }],
      totalAmount: 31.98,
      deliveryFee: 5.00,
      tax: 2.56,
      finalAmount: 39.54,
      deliveryAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        coordinates: [-74.006, 40.7128]
      },
      deliveryType: 'delivery'
    });

    it('should create an order with valid data', async () => {
      const orderData = getValidOrderData();
      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder._id).toBeDefined();
      expect(savedOrder.customerId.toString()).toBe(testCustomer._id.toString());
      expect(savedOrder.items).toHaveLength(1);
      expect(savedOrder.items[0].mealId.toString()).toBe(testMeal._id.toString());
      expect(savedOrder.status).toBe('pending');
      expect(savedOrder.paymentStatus).toBe('pending');
      expect(savedOrder.deliveryType).toBe('delivery');
      expect(savedOrder.finalAmount).toBeCloseTo(39.54, 2);
    });

    it('should require customerId', async () => {
      const orderData = getValidOrderData();
      delete orderData.customerId;
      
      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow('Customer ID is required');
    });

    it('should require at least one item', async () => {
      const orderData = getValidOrderData();
      orderData.items = [];
      
      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow('Order must have at least one item');
    });

    it('should require valid delivery address coordinates', async () => {
      const orderData = getValidOrderData();
      orderData.deliveryAddress.coordinates = [200, 100]; // Invalid coordinates
      
      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow('Invalid coordinates');
    });

    it('should validate delivery type enum', async () => {
      const orderData = getValidOrderData();
      orderData.deliveryType = 'invalid';
      
      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow('Delivery type must be either delivery or pickup');
    });

    it('should validate status enum', async () => {
      const orderData = getValidOrderData();
      orderData.status = 'invalid';
      
      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow('Invalid order status');
    });

    it('should validate payment status enum', async () => {
      const orderData = getValidOrderData();
      orderData.paymentStatus = 'invalid';
      
      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow('Invalid payment status');
    });

    it('should validate item quantity limits', async () => {
      const orderData = getValidOrderData();
      orderData.items[0].quantity = 0;
      
      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow('Quantity must be at least 1');
    });

    it('should validate item price minimum', async () => {
      const orderData = getValidOrderData();
      orderData.items[0].price = 0;
      
      const order = new Order(orderData);
      await expect(order.save()).rejects.toThrow('Price must be greater than 0');
    });
  });

  describe('Order Virtual Properties', () => {
    let testOrder;

    beforeEach(async () => {
      const orderData = {
        customerId: testCustomer._id,
        items: [{
          mealId: testMeal._id,
          chefId: testChef._id,
          quantity: 2,
          price: 15.99
        }],
        totalAmount: 31.98,
        deliveryFee: 5.00,
        tax: 2.56,
        finalAmount: 39.54,
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: [-74.006, 40.7128]
        },
        deliveryType: 'delivery'
      };
      
      testOrder = await Order.create(orderData);
    });

    it('should generate full delivery address', () => {
      expect(testOrder.fullDeliveryAddress).toBe('123 Main St, New York, NY 10001');
    });

    it('should check if order can be cancelled', () => {
      expect(testOrder.canBeCancelled).toBe(true);
      
      testOrder.status = 'preparing';
      expect(testOrder.canBeCancelled).toBe(false);
      
      testOrder.status = 'delivered';
      expect(testOrder.canBeCancelled).toBe(false);
    });

    it('should check if order is active', () => {
      expect(testOrder.isActive).toBe(true);
      
      testOrder.status = 'delivered';
      expect(testOrder.isActive).toBe(false);
      
      testOrder.status = 'cancelled';
      expect(testOrder.isActive).toBe(false);
    });

    it('should calculate order duration when delivered', () => {
      expect(testOrder.orderDuration).toBeNull();
      
      testOrder.deliveredAt = new Date(testOrder.createdAt.getTime() + 60 * 60 * 1000); // 1 hour later
      expect(testOrder.orderDuration).toBe(60); // 60 minutes
    });
  });

  describe('Order Static Methods', () => {
    let testOrders;

    beforeEach(async () => {
      // Create multiple test orders
      testOrders = await Promise.all([
        Order.create({
          customerId: testCustomer._id,
          items: [{ mealId: testMeal._id, chefId: testChef._id, quantity: 1, price: 15.99 }],
          totalAmount: 15.99,
          finalAmount: 15.99,
          deliveryAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            coordinates: [-74.006, 40.7128]
          },
          deliveryType: 'delivery',
          status: 'pending'
        }),
        Order.create({
          customerId: testCustomer._id,
          items: [{ mealId: testMeal._id, chefId: testChef._id, quantity: 2, price: 15.99 }],
          totalAmount: 31.98,
          finalAmount: 31.98,
          deliveryAddress: {
            street: '456 Oak St',
            city: 'New York',
            state: 'NY',
            zipCode: '10002',
            coordinates: [-74.007, 40.7129]
          },
          deliveryType: 'pickup',
          status: 'confirmed'
        })
      ]);
    });

    it('should find orders by customer', async () => {
      const orders = await Order.findByCustomer(testCustomer._id);
      
      expect(orders).toHaveLength(2);
      expect(orders[0].customerId.toString()).toBe(testCustomer._id.toString());
    });

    it('should find orders by customer with status filter', async () => {
      const pendingOrders = await Order.findByCustomer(testCustomer._id, { status: 'pending' });
      
      expect(pendingOrders).toHaveLength(1);
      expect(pendingOrders[0].status).toBe('pending');
    });

    it('should find orders by chef', async () => {
      const orders = await Order.findByChef(testChef._id);
      
      expect(orders).toHaveLength(2);
      expect(orders[0].items[0].chefId._id.toString()).toBe(testChef._id.toString());
    });

    it('should find orders by date range', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const orders = await Order.findByDateRange(yesterday, tomorrow);
      
      expect(orders).toHaveLength(2);
    });
  });

  describe('Order Instance Methods', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        customerId: testCustomer._id,
        items: [{
          mealId: testMeal._id,
          chefId: testChef._id,
          quantity: 2,
          price: 15.99
        }],
        totalAmount: 31.98,
        deliveryFee: 5.00,
        tax: 2.56,
        finalAmount: 39.54,
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: [-74.006, 40.7128]
        },
        deliveryType: 'delivery'
      });
    });

    it('should update status with timestamp', async () => {
      await testOrder.updateStatus('confirmed', 'Order confirmed by chef');
      
      expect(testOrder.status).toBe('confirmed');
      expect(testOrder.confirmedAt).toBeDefined();
      expect(testOrder.chefNotes).toBe('Order confirmed by chef');
    });

    it('should calculate total amount correctly', () => {
      testOrder.calculateTotalAmount();
      
      expect(testOrder.totalAmount).toBe(31.98);
      expect(testOrder.finalAmount).toBeCloseTo(39.54, 2);
    });

    it('should add refund correctly', async () => {
      await testOrder.addRefund(10.00, 'Partial refund for delay');
      
      expect(testOrder.refundAmount).toBe(10.00);
      expect(testOrder.refundReason).toBe('Partial refund for delay');
      expect(testOrder.paymentStatus).toBe('partially_refunded');
    });

    it('should mark as fully refunded when refund equals final amount', async () => {
      await testOrder.addRefund(39.54, 'Full refund');
      
      expect(testOrder.paymentStatus).toBe('refunded');
    });

    it('should check delivery distance', () => {
      const canDeliver = testOrder.canDeliverTo(-74.006, 40.7128, 1); // Same location
      expect(canDeliver).toBe(true);
      
      const cannotDeliver = testOrder.canDeliverTo(-75.006, 41.7128, 1); // Far location
      expect(cannotDeliver).toBe(false);
    });
  });

  describe('Order Status Transitions', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        customerId: testCustomer._id,
        items: [{
          mealId: testMeal._id,
          chefId: testChef._id,
          quantity: 1,
          price: 15.99
        }],
        totalAmount: 15.99,
        finalAmount: 15.99,
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: [-74.006, 40.7128]
        },
        deliveryType: 'delivery'
      });
    });

    it('should allow valid status transitions', async () => {
      // pending -> confirmed
      await expect(testOrder.updateStatus('confirmed')).resolves.toBeDefined();
      
      // confirmed -> preparing
      await expect(testOrder.updateStatus('preparing')).resolves.toBeDefined();
      
      // preparing -> ready
      await expect(testOrder.updateStatus('ready')).resolves.toBeDefined();
      
      // ready -> out_for_delivery
      await expect(testOrder.updateStatus('out_for_delivery')).resolves.toBeDefined();
      
      // out_for_delivery -> delivered
      await expect(testOrder.updateStatus('delivered')).resolves.toBeDefined();
    });

    it('should prevent invalid status transitions', async () => {
      // pending -> delivered (skipping steps)
      try {
        await testOrder.updateStatus('delivered');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toContain('Invalid status transition');
      }
    });

    it('should allow cancellation from valid states', async () => {
      // pending -> cancelled
      await expect(testOrder.updateStatus('cancelled')).resolves.toBeDefined();
      
      // Reset and test from confirmed
      testOrder.status = 'pending';
      await testOrder.save();
      await testOrder.updateStatus('confirmed');
      
      await expect(testOrder.updateStatus('cancelled')).resolves.toBeDefined();
    });
  });

  describe('Order Middleware', () => {
    it('should calculate amounts on save', async () => {
      const order = new Order({
        customerId: testCustomer._id,
        items: [{
          mealId: testMeal._id,
          chefId: testChef._id,
          quantity: 2,
          price: 15.99
        }],
        totalAmount: 31.98,
        deliveryFee: 5.00,
        tax: 2.56,
        finalAmount: 39.54,
        deliveryAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          coordinates: [-74.006, 40.7128]
        },
        deliveryType: 'delivery'
      });
      
      await order.save();
      
      expect(order.totalAmount).toBeCloseTo(31.98, 2);
      expect(order.finalAmount).toBeCloseTo(39.54, 2);
    });
  });
});