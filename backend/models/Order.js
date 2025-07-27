const mongoose = require('mongoose');
const Joi = require('joi');

// Order Schema
const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID is required']
  },
  items: {
    type: [{
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
      }
    }],
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Order must have at least one item'
    }
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0.01, 'Total amount must be greater than 0']
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: [0, 'Delivery fee cannot be negative']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  finalAmount: {
    type: Number,
    required: [true, 'Final amount is required'],
    min: [0.01, 'Final amount must be greater than 0']
  },
  deliveryAddress: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      maxlength: [100, 'Street address cannot exceed 100 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [50, 'City name cannot exceed 50 characters']
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [50, 'State name cannot exceed 50 characters']
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      match: [/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code']
    },
    coordinates: {
      type: [Number],
      required: [true, 'Delivery coordinates are required'],
      validate: {
        validator: function(coords) {
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
    required: [true, 'Delivery type is required']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
      message: 'Invalid order status'
    },
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
      message: 'Invalid payment status'
    },
    default: 'pending'
  },
  paymentIntentId: {
    type: String,
    trim: true
  },
  estimatedDeliveryTime: {
    type: Date,
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Estimated delivery time must be in the future'
    }
  },
  actualDeliveryTime: {
    type: Date
  },
  chefNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Chef notes cannot exceed 500 characters']
  },
  customerNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Customer notes cannot exceed 500 characters']
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters']
  },
  tracking: {
    currentLocation: {
      type: [Number],
      validate: {
        validator: function(coords) {
          if (!coords || coords.length === 0) return true;
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;     // latitude
        },
        message: 'Invalid tracking coordinates'
      }
    },
    deliveryPartnerId: {
      type: String,
      trim: true
    },
    estimatedArrival: {
      type: Date
    }
  },
  refundAmount: {
    type: Number,
    default: 0,
    min: [0, 'Refund amount cannot be negative']
  },
  refundReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Refund reason cannot exceed 200 characters']
  },
  confirmedAt: {
    type: Date
  },
  preparingAt: {
    type: Date
  },
  readyAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for efficient queries
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ 'items.chefId': 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ estimatedDeliveryTime: 1 });
orderSchema.index({ deliveryType: 1, status: 1 });

// Geospatial index for delivery location
orderSchema.index({ 'deliveryAddress.coordinates': '2dsphere' });

// Virtual to populate customer details
orderSchema.virtual('customer', {
  ref: 'User',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate meal details
orderSchema.virtual('mealDetails', {
  ref: 'Meal',
  localField: 'items.mealId',
  foreignField: '_id'
});

// Virtual to populate chef details
orderSchema.virtual('chefDetails', {
  ref: 'Chef',
  localField: 'items.chefId',
  foreignField: '_id'
});

// Virtual for full delivery address
orderSchema.virtual('fullDeliveryAddress').get(function() {
  return `${this.deliveryAddress.street}, ${this.deliveryAddress.city}, ${this.deliveryAddress.state} ${this.deliveryAddress.zipCode}`;
});

// Virtual to check if order can be cancelled
orderSchema.virtual('canBeCancelled').get(function() {
  return ['pending', 'confirmed'].includes(this.status);
});

// Virtual to check if order is active
orderSchema.virtual('isActive').get(function() {
  return !['delivered', 'cancelled'].includes(this.status);
});

// Virtual for order duration
orderSchema.virtual('orderDuration').get(function() {
  if (!this.deliveredAt) return null;
  return Math.round((this.deliveredAt - this.createdAt) / (1000 * 60)); // in minutes
});

// Static method to find orders by customer
orderSchema.statics.findByCustomer = function(customerId, options = {}) {
  const { status, limit = 20, skip = 0, sortBy = 'createdAt', sortOrder = -1 } = options;
  
  const query = { customerId };
  if (status) query.status = status;
  
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder;
  
  return this.find(query)
    .sort(sortOptions)
    .limit(limit)
    .skip(skip)
    .populate('customer', 'name email phone')
    .populate('items.mealId', 'name images cuisine')
    .populate('items.chefId', 'businessName rating');
};

// Static method to find orders by chef
orderSchema.statics.findByChef = function(chefId, options = {}) {
  const { status, limit = 20, skip = 0, sortBy = 'createdAt', sortOrder = -1 } = options;
  
  const query = { 'items.chefId': chefId };
  if (status) query.status = status;
  
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder;
  
  return this.find(query)
    .sort(sortOptions)
    .limit(limit)
    .skip(skip)
    .populate('customer', 'name phone')
    .populate('items.mealId', 'name images preparationTime')
    .populate('items.chefId', 'businessName');
};

// Static method to find orders within date range
orderSchema.statics.findByDateRange = function(startDate, endDate, options = {}) {
  const { status, chefId, customerId } = options;
  
  const query = {
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (status) query.status = status;
  if (chefId) query['items.chefId'] = chefId;
  if (customerId) query.customerId = customerId;
  
  return this.find(query).sort({ createdAt: -1 });
};

// Instance method to update status with timestamp
orderSchema.methods.updateStatus = function(newStatus, notes = '') {
  // Validate transition
  this.validateStatusTransition(newStatus);
  
  const previousStatus = this.status;
  this.status = newStatus;
  
  // Set appropriate timestamp based on status
  const now = new Date();
  switch (newStatus) {
    case 'confirmed':
      this.confirmedAt = now;
      break;
    case 'preparing':
      this.preparingAt = now;
      break;
    case 'ready':
      this.readyAt = now;
      break;
    case 'delivered':
      this.deliveredAt = now;
      break;
    case 'cancelled':
      this.cancelledAt = now;
      break;
  }
  
  if (notes) {
    if (newStatus === 'cancelled') {
      this.cancellationReason = notes;
    } else {
      this.chefNotes = notes;
    }
  }
  
  return this.save();
};

// Instance method to calculate total amount
orderSchema.methods.calculateTotalAmount = function() {
  const itemsTotal = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  this.totalAmount = itemsTotal;
  this.finalAmount = itemsTotal + this.deliveryFee + this.tax;
  
  return this;
};

// Instance method to add refund
orderSchema.methods.addRefund = function(amount, reason) {
  this.refundAmount += amount;
  this.refundReason = reason;
  
  // Use Math.abs to handle floating point precision issues
  if (Math.abs(this.refundAmount - this.finalAmount) < 0.01) {
    this.paymentStatus = 'refunded';
  } else {
    this.paymentStatus = 'partially_refunded';
  }
  
  return this.save();
};

// Instance method to check if order can be delivered to location
orderSchema.methods.canDeliverTo = function(longitude, latitude, maxDistance = 50) {
  const [orderLng, orderLat] = this.deliveryAddress.coordinates;
  
  const R = 6371; // Earth's radius in km
  const dLat = (latitude - orderLat) * Math.PI / 180;
  const dLng = (longitude - orderLng) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(orderLat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance <= maxDistance;
};

// Pre-save middleware to calculate amounts
orderSchema.pre('save', function(next) {
  if (this.isModified('items') || this.isModified('deliveryFee') || this.isModified('tax')) {
    this.calculateTotalAmount();
  }
  next();
});

// Instance method to validate status transition
orderSchema.methods.validateStatusTransition = function(newStatus) {
  const validTransitions = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['preparing', 'cancelled'],
    'preparing': ['ready', 'cancelled'],
    'ready': ['out_for_delivery', 'delivered', 'cancelled'],
    'out_for_delivery': ['delivered', 'cancelled'],
    'delivered': [],
    'cancelled': []
  };
  
  const currentStatus = this.status;
  
  if (currentStatus !== newStatus && !validTransitions[currentStatus]?.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
  }
  
  return true;
};

// Joi validation schemas
const orderValidationSchemas = {
  create: Joi.object({
    items: Joi.array().items(
      Joi.object({
        mealId: Joi.string().hex().length(24).required(),
        chefId: Joi.string().hex().length(24).required(),
        quantity: Joi.number().min(1).max(100).required(),
        price: Joi.number().min(0.01).required(),
        specialInstructions: Joi.string().max(500)
      })
    ).min(1).required(),
    deliveryAddress: Joi.object({
      street: Joi.string().max(100).required(),
      city: Joi.string().max(50).required(),
      state: Joi.string().max(50).required(),
      zipCode: Joi.string().pattern(/^\d{5}(-\d{4})?$/).required(),
      coordinates: Joi.array().items(Joi.number()).length(2).required()
    }).required(),
    deliveryType: Joi.string().valid('delivery', 'pickup').required(),
    deliveryFee: Joi.number().min(0),
    tax: Joi.number().min(0),
    customerNotes: Joi.string().max(500),
    paymentIntentId: Joi.string()
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled').required(),
    notes: Joi.string().max(500),
    estimatedDeliveryTime: Joi.date().greater('now')
  }),

  cancel: Joi.object({
    reason: Joi.string().max(200).required()
  }),

  refund: Joi.object({
    amount: Joi.number().min(0.01).required(),
    reason: Joi.string().max(200).required()
  }),

  updateTracking: Joi.object({
    currentLocation: Joi.array().items(Joi.number()).length(2),
    deliveryPartnerId: Joi.string(),
    estimatedArrival: Joi.date().greater('now')
  })
};

const Order = mongoose.model('Order', orderSchema);

module.exports = {
  Order,
  orderValidationSchemas
};