const mongoose = require('mongoose');
const Joi = require('joi');

// Cart Schema
const cartSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID is required'],
    unique: true
  },
  items: [{
    mealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meal',
      required: [true, 'Meal ID is required']
    },
    chefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chef',
      required: [true, 'Chef ID is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [100, 'Quantity cannot exceed 100']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.01, 'Price must be greater than 0']
    },
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: [500, 'Special instructions cannot exceed 500 characters']
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliveryAddress: {
    street: {
      type: String,
      trim: true,
      maxlength: [100, 'Street address cannot exceed 100 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [50, 'City name cannot exceed 50 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [50, 'State name cannot exceed 50 characters']
    },
    zipCode: {
      type: String,
      match: [/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code']
    },
    coordinates: {
      type: [Number],
      validate: {
        validator: function(coords) {
          if (!coords || coords.length === 0) return true;
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates. Longitude must be between -180 and 180, latitude between -90 and 90'
      }
    }
  },
  deliveryType: {
    type: String,
    enum: {
      values: ['delivery', 'pickup'],
      message: 'Delivery type must be either delivery or pickup'
    },
    default: 'delivery'
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    },
    index: { expireAfterSeconds: 0 }
  },
  sessionId: {
    type: String,
    trim: true
  },
  promoCode: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: [20, 'Promo code cannot exceed 20 characters']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for efficient queries
cartSchema.index({ customerId: 1 }, { unique: true });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
cartSchema.index({ sessionId: 1 });
cartSchema.index({ updatedAt: -1 });

// Virtual to populate customer details
cartSchema.virtual('customer', {
  ref: 'User',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate meal details
cartSchema.virtual('mealDetails', {
  ref: 'Meal',
  localField: 'items.mealId',
  foreignField: '_id'
});

// Virtual to populate chef details
cartSchema.virtual('chefDetails', {
  ref: 'Chef',
  localField: 'items.chefId',
  foreignField: '_id'
});

// Virtual for cart subtotal
cartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
});

// Virtual for total items count
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for unique chefs count
cartSchema.virtual('uniqueChefs').get(function() {
  const chefIds = this.items.map(item => item.chefId.toString());
  return [...new Set(chefIds)].length;
});

// Virtual to check if cart is expired
cartSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Virtual to check if cart is empty
cartSchema.virtual('isEmpty').get(function() {
  return this.items.length === 0;
});

// Virtual for full delivery address
cartSchema.virtual('fullDeliveryAddress').get(function() {
  if (!this.deliveryAddress.street) return null;
  return `${this.deliveryAddress.street}, ${this.deliveryAddress.city}, ${this.deliveryAddress.state} ${this.deliveryAddress.zipCode}`;
});

// Virtual for cart total with discount
cartSchema.virtual('total').get(function() {
  return Math.max(0, this.subtotal - this.discount);
});

// Static method to find or create cart for customer
cartSchema.statics.findOrCreateForCustomer = async function(customerId, sessionId = null) {
  let cart = await this.findOne({ customerId });
  
  if (!cart) {
    cart = new this({
      customerId,
      sessionId,
      items: []
    });
    await cart.save();
  }
  
  return cart;
};

// Static method to find cart by session (for guest users)
cartSchema.statics.findBySession = function(sessionId) {
  return this.findOne({ sessionId });
};

// Static method to cleanup expired carts
cartSchema.statics.cleanupExpired = function() {
  return this.deleteMany({ expiresAt: { $lt: new Date() } });
};

// Instance method to add item to cart
cartSchema.methods.addItem = async function(mealId, chefId, quantity, price, specialInstructions = '') {
  // Check if item already exists in cart
  const existingItemIndex = this.items.findIndex(
    item => item.mealId.toString() === mealId.toString()
  );
  
  if (existingItemIndex > -1) {
    // Update existing item
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].price = price; // Update price in case it changed
    this.items[existingItemIndex].specialInstructions = specialInstructions;
    this.items[existingItemIndex].addedAt = new Date();
  } else {
    // Add new item
    this.items.push({
      mealId,
      chefId,
      quantity,
      price,
      specialInstructions,
      addedAt: new Date()
    });
  }
  
  // Extend expiration time
  this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  return this.save();
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = function(mealId, quantity) {
  const itemIndex = this.items.findIndex(
    item => item.mealId.toString() === mealId.toString()
  );
  
  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }
  
  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    this.items.splice(itemIndex, 1);
  } else {
    this.items[itemIndex].quantity = quantity;
    this.items[itemIndex].addedAt = new Date();
  }
  
  // Extend expiration time
  this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  return this.save();
};

// Instance method to remove item from cart
cartSchema.methods.removeItem = function(mealId) {
  const itemIndex = this.items.findIndex(
    item => item.mealId.toString() === mealId.toString()
  );
  
  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }
  
  this.items.splice(itemIndex, 1);
  
  return this.save();
};

// Instance method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.promoCode = undefined;
  this.discount = 0;
  this.notes = undefined;
  
  return this.save();
};

// Instance method to apply promo code
cartSchema.methods.applyPromoCode = function(promoCode, discountAmount) {
  this.promoCode = promoCode;
  this.discount = discountAmount;
  
  return this.save();
};

// Instance method to remove promo code
cartSchema.methods.removePromoCode = function() {
  this.promoCode = undefined;
  this.discount = 0;
  
  return this.save();
};

// Instance method to update delivery address
cartSchema.methods.updateDeliveryAddress = function(address) {
  this.deliveryAddress = {
    ...this.deliveryAddress,
    ...address
  };
  
  return this.save();
};

// Instance method to validate cart items availability
cartSchema.methods.validateItemsAvailability = async function() {
  const Meal = mongoose.model('Meal');
  const unavailableItems = [];
  
  for (const item of this.items) {
    const meal = await Meal.findById(item.mealId);
    
    if (!meal || !meal.isAvailableForOrder(item.quantity)) {
      unavailableItems.push({
        mealId: item.mealId,
        name: meal?.name || 'Unknown Meal',
        reason: !meal ? 'Meal not found' : 'Insufficient quantity or not available'
      });
    }
  }
  
  return unavailableItems;
};

// Instance method to group items by chef
cartSchema.methods.groupItemsByChef = function() {
  const groupedItems = {};
  
  this.items.forEach(item => {
    // Handle both populated and non-populated chefId
    const chefId = (item.chefId._id || item.chefId).toString();
    
    if (!groupedItems[chefId]) {
      groupedItems[chefId] = {
        chefId,
        items: [],
        subtotal: 0
      };
    }
    
    groupedItems[chefId].items.push(item);
    groupedItems[chefId].subtotal += item.price * item.quantity;
  });
  
  return Object.values(groupedItems);
};

// Instance method to calculate delivery fees by chef
cartSchema.methods.calculateDeliveryFees = async function() {
  if (this.deliveryType !== 'delivery' || !this.deliveryAddress.coordinates) {
    return {};
  }
  
  const Chef = mongoose.model('Chef');
  const groupedItems = this.groupItemsByChef();
  const deliveryFees = {};
  
  for (const group of groupedItems) {
    const chef = await Chef.findById(group.chefId);
    if (chef) {
      const distance = chef.calculateDistance(
        this.deliveryAddress.coordinates[0],
        this.deliveryAddress.coordinates[1]
      );
      
      // Simple delivery fee calculation: $2 base + $0.5 per km
      deliveryFees[group.chefId] = Math.round((2 + (distance * 0.5)) * 100) / 100;
    }
  }
  
  return deliveryFees;
};

// Pre-save middleware to extend expiration on updates
cartSchema.pre('save', function(next) {
  if (this.isModified('items') && this.items.length > 0) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

// Pre-save middleware to validate delivery address completeness
cartSchema.pre('save', function(next) {
  if (this.deliveryType === 'delivery' && this.deliveryAddress) {
    const { street, city, state, zipCode, coordinates } = this.deliveryAddress;
    
    if (street && (!city || !state || !zipCode || !coordinates)) {
      return next(new Error('Incomplete delivery address for delivery type'));
    }
  }
  next();
});

// Joi validation schemas
const cartValidationSchemas = {
  addItem: Joi.object({
    mealId: Joi.string().hex().length(24).required(),
    chefId: Joi.string().hex().length(24).required(),
    quantity: Joi.number().min(1).max(100).required(),
    price: Joi.number().min(0.01).required(),
    specialInstructions: Joi.string().max(500)
  }),

  updateItem: Joi.object({
    mealId: Joi.string().hex().length(24).required(),
    quantity: Joi.number().min(0).max(100).required(),
    specialInstructions: Joi.string().max(500)
  }),

  removeItem: Joi.object({
    mealId: Joi.string().hex().length(24).required()
  }),

  updateDeliveryAddress: Joi.object({
    street: Joi.string().max(100),
    city: Joi.string().max(50),
    state: Joi.string().max(50),
    zipCode: Joi.string().pattern(/^\d{5}(-\d{4})?$/),
    coordinates: Joi.array().items(Joi.number()).length(2)
  }),

  updateDeliveryType: Joi.object({
    deliveryType: Joi.string().valid('delivery', 'pickup').required()
  }),

  applyPromoCode: Joi.object({
    promoCode: Joi.string().max(20).required()
  }),

  updateNotes: Joi.object({
    notes: Joi.string().max(500)
  })
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = {
  Cart,
  cartValidationSchemas
};