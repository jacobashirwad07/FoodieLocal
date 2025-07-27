const mongoose = require('mongoose');
const Joi = require('joi');

// Meal Schema
const mealSchema = new mongoose.Schema({
  chefId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chef',
    required: [true, 'Chef ID is required']
  },
  name: {
    type: String,
    required: [true, 'Meal name is required'],
    trim: true,
    minlength: [2, 'Meal name must be at least 2 characters long'],
    maxlength: [100, 'Meal name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Meal description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0.01, 'Price must be greater than 0'],
    max: [10000, 'Price cannot exceed $10,000']
  },
  preparationTime: {
    type: Number,
    required: [true, 'Preparation time is required'],
    min: [5, 'Preparation time must be at least 5 minutes'],
    max: [480, 'Preparation time cannot exceed 8 hours']
  },
  servingSize: {
    type: Number,
    required: [true, 'Serving size is required'],
    min: [1, 'Serving size must be at least 1'],
    max: [20, 'Serving size cannot exceed 20']
  },
  cuisine: {
    type: String,
    required: [true, 'Cuisine type is required'],
    enum: {
      values: [
        'indian', 'chinese', 'italian', 'mexican', 'thai', 'japanese', 'american',
        'mediterranean', 'french', 'korean', 'vietnamese', 'middle-eastern',
        'continental', 'south-indian', 'north-indian', 'bengali', 'punjabi',
        'gujarati', 'maharashtrian', 'rajasthani', 'kerala', 'hyderabadi',
        'street-food', 'desserts', 'bakery', 'healthy', 'fusion'
      ],
      message: 'Invalid cuisine type'
    }
  },
  dietaryTags: [{
    type: String,
    enum: {
      values: [
        'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 
        'egg-free', 'soy-free', 'halal', 'kosher', 'keto', 'paleo', 
        'low-carb', 'high-protein', 'organic', 'spicy', 'mild'
      ],
      message: 'Invalid dietary tag'
    },
    lowercase: true
  }],
  ingredients: [{
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Ingredient name cannot exceed 100 characters']
  }],
  images: [{
    type: String,
    required: true,
    match: [/^https?:\/\/.+/, 'Image URL must be a valid HTTP/HTTPS URL']
  }],
  availability: {
    date: {
      type: Date,
      required: [true, 'Availability date is required'],
      validate: {
        validator: function(date) {
          // Date should not be in the past (allow today)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date >= today;
        },
        message: 'Availability date cannot be in the past'
      }
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format'],
      validate: {
        validator: function(endTime) {
          if (!this.availability.startTime) return true;
          
          const [startHour, startMin] = this.availability.startTime.split(':').map(Number);
          const [endHour, endMin] = endTime.split(':').map(Number);
          
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          
          return endMinutes > startMinutes;
        },
        message: 'End time must be after start time'
      }
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [1000, 'Quantity cannot exceed 1000']
    },
    remainingQuantity: {
      type: Number,
      min: [0, 'Remaining quantity cannot be negative'],
      validate: {
        validator: function(remaining) {
          return remaining <= this.availability.quantity;
        },
        message: 'Remaining quantity cannot exceed total quantity'
      }
    }
  },
  nutritionInfo: {
    calories: {
      type: Number,
      min: [0, 'Calories cannot be negative'],
      max: [10000, 'Calories cannot exceed 10,000']
    },
    protein: {
      type: Number,
      min: [0, 'Protein cannot be negative'],
      max: [1000, 'Protein cannot exceed 1000g']
    },
    carbs: {
      type: Number,
      min: [0, 'Carbs cannot be negative'],
      max: [1000, 'Carbs cannot exceed 1000g']
    },
    fat: {
      type: Number,
      min: [0, 'Fat cannot be negative'],
      max: [1000, 'Fat cannot exceed 1000g']
    },
    fiber: {
      type: Number,
      min: [0, 'Fiber cannot be negative'],
      max: [100, 'Fiber cannot exceed 100g']
    },
    sugar: {
      type: Number,
      min: [0, 'Sugar cannot be negative'],
      max: [500, 'Sugar cannot exceed 500g']
    },
    sodium: {
      type: Number,
      min: [0, 'Sodium cannot be negative'],
      max: [10000, 'Sodium cannot exceed 10,000mg']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    },
    count: {
      type: Number,
      default: 0,
      min: [0, 'Rating count cannot be negative']
    }
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: [0, 'Total orders cannot be negative']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  allergens: [{
    type: String,
    enum: {
      values: [
        'milk', 'eggs', 'fish', 'shellfish', 'tree-nuts', 'peanuts', 
        'wheat', 'soybeans', 'sesame', 'mustard', 'celery', 'lupin'
      ],
      message: 'Invalid allergen type'
    },
    lowercase: true
  }],
  spiceLevel: {
    type: String,
    enum: {
      values: ['mild', 'medium', 'hot', 'very-hot'],
      message: 'Spice level must be mild, medium, hot, or very-hot'
    },
    default: 'mild'
  },
  isSpecialOffer: {
    type: Boolean,
    default: false
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative'],
    validate: {
      validator: function(originalPrice) {
        if (!this.isSpecialOffer) return true;
        return originalPrice > this.price;
      },
      message: 'Original price must be greater than current price for special offers'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for efficient queries
mealSchema.index({ chefId: 1, isActive: 1 });
mealSchema.index({ cuisine: 1, isActive: 1 });
mealSchema.index({ dietaryTags: 1, isActive: 1 });
mealSchema.index({ 'availability.date': 1, isActive: 1 });
mealSchema.index({ 'rating.average': -1, isActive: 1 });
mealSchema.index({ price: 1, isActive: 1 });
mealSchema.index({ createdAt: -1 });
mealSchema.index({ totalOrders: -1 });

// Text search index for meal name and description
mealSchema.index({ 
  name: 'text', 
  description: 'text', 
  ingredients: 'text',
  tags: 'text'
});

// Virtual to populate chef details
mealSchema.virtual('chef', {
  ref: 'Chef',
  localField: 'chefId',
  foreignField: '_id',
  justOne: true
});

// Virtual to check if meal is currently available
mealSchema.virtual('isCurrentlyAvailable').get(function() {
  if (!this.isActive || this.availability.remainingQuantity <= 0) {
    return false;
  }

  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const availabilityDate = new Date(this.availability.date);
  availabilityDate.setHours(0, 0, 0, 0);

  // Check if it's the right date
  if (availabilityDate.getTime() !== today.getTime()) {
    return false;
  }

  // Check if current time is within availability window
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  return currentTime >= this.availability.startTime && currentTime <= this.availability.endTime;
});

// Virtual for discount percentage
mealSchema.virtual('discountPercentage').get(function() {
  if (!this.isSpecialOffer || !this.originalPrice) return 0;
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

// Virtual for display rating
mealSchema.virtual('displayRating').get(function() {
  return this.rating.count > 0 ? this.rating.average.toFixed(1) : 'New';
});

// Virtual for availability status
mealSchema.virtual('availabilityStatus').get(function() {
  if (!this.isActive) return 'inactive';
  if (this.availability.remainingQuantity <= 0) return 'sold-out';
  if (this.isCurrentlyAvailable) return 'available';
  
  const now = new Date();
  const availabilityDate = new Date(this.availability.date);
  
  if (availabilityDate > now) return 'upcoming';
  return 'expired';
});

// Static method to find available meals by location (requires chef population)
mealSchema.statics.findAvailableByLocation = function(longitude, latitude, radiusInKm = 10, options = {}) {
  const {
    cuisine,
    dietaryTags,
    maxPrice,
    minRating,
    limit = 20,
    skip = 0,
    sortBy = 'rating.average',
    sortOrder = -1
  } = options;

  const query = {
    isActive: true,
    'availability.remainingQuantity': { $gt: 0 },
    'availability.date': {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      $lt: new Date(new Date().setHours(23, 59, 59, 999))
    }
  };

  if (cuisine) query.cuisine = cuisine;
  if (dietaryTags && dietaryTags.length > 0) {
    query.dietaryTags = { $in: dietaryTags };
  }
  if (maxPrice) query.price = { $lte: maxPrice };
  if (minRating) query['rating.average'] = { $gte: minRating };

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder;

  return this.aggregate([
    {
      $lookup: {
        from: 'chefs',
        localField: 'chefId',
        foreignField: '_id',
        as: 'chef'
      }
    },
    {
      $unwind: '$chef'
    },
    {
      $match: {
        ...query,
        'chef.status': 'approved',
        'chef.availability.isActive': true,
        'chef.serviceArea': {
          $geoWithin: {
            $centerSphere: [[longitude, latitude], radiusInKm / 6378.1]
          }
        }
      }
    },
    {
      $sort: sortOptions
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    }
  ]);
};

// Static method to find meals by chef
mealSchema.statics.findByChef = function(chefId, includeInactive = false) {
  const query = { chefId };
  if (!includeInactive) {
    query.isActive = true;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to search meals by text
mealSchema.statics.searchByText = function(searchText, options = {}) {
  const {
    longitude,
    latitude,
    radiusInKm = 10,
    limit = 20,
    skip = 0
  } = options;

  const pipeline = [
    {
      $match: {
        $text: { $search: searchText },
        isActive: true,
        'availability.remainingQuantity': { $gt: 0 }
      }
    },
    {
      $addFields: {
        score: { $meta: 'textScore' }
      }
    }
  ];

  if (longitude && latitude) {
    pipeline.push(
      {
        $lookup: {
          from: 'chefs',
          localField: 'chefId',
          foreignField: '_id',
          as: 'chef'
        }
      },
      {
        $unwind: '$chef'
      },
      {
        $match: {
          'chef.status': 'approved',
          'chef.serviceArea': {
            $geoWithin: {
              $centerSphere: [[longitude, latitude], radiusInKm / 6378.1]
            }
          }
        }
      }
    );
  }

  pipeline.push(
    { $sort: { score: { $meta: 'textScore' }, 'rating.average': -1 } },
    { $skip: skip },
    { $limit: limit }
  );

  return this.aggregate(pipeline);
};

// Instance method to update rating
mealSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Instance method to reduce quantity
mealSchema.methods.reduceQuantity = function(amount = 1) {
  if (this.availability.remainingQuantity < amount) {
    throw new Error('Insufficient quantity available');
  }
  
  this.availability.remainingQuantity -= amount;
  this.totalOrders += amount;
  return this.save();
};

// Instance method to restore quantity (for cancellations)
mealSchema.methods.restoreQuantity = function(amount = 1) {
  this.availability.remainingQuantity += amount;
  this.totalOrders = Math.max(0, this.totalOrders - amount);
  
  // Ensure remaining quantity doesn't exceed total quantity
  if (this.availability.remainingQuantity > this.availability.quantity) {
    this.availability.remainingQuantity = this.availability.quantity;
  }
  
  return this.save();
};

// Instance method to check if meal is available for ordering
mealSchema.methods.isAvailableForOrder = function(quantity = 1) {
  return this.isActive && 
         this.availability.remainingQuantity >= quantity &&
         this.isCurrentlyAvailable;
};

// Pre-save middleware to set remaining quantity on creation
mealSchema.pre('save', function(next) {
  if (this.isNew && this.availability.quantity && (this.availability.remainingQuantity === undefined || this.availability.remainingQuantity === null)) {
    this.availability.remainingQuantity = this.availability.quantity;
  }
  next();
});

// Pre-save middleware to validate availability time window
mealSchema.pre('save', function(next) {
  if (this.availability.startTime && this.availability.endTime) {
    const [startHour, startMin] = this.availability.startTime.split(':').map(Number);
    const [endHour, endMin] = this.availability.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (endMinutes <= startMinutes) {
      return next(new Error('End time must be after start time'));
    }
  }
  next();
});

// Joi validation schemas
const mealValidationSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().min(10).max(1000).required(),
    price: Joi.number().min(0.01).max(10000).required(),
    preparationTime: Joi.number().min(5).max(480).required(),
    servingSize: Joi.number().min(1).max(20).required(),
    cuisine: Joi.string().valid(
      'indian', 'chinese', 'italian', 'mexican', 'thai', 'japanese', 'american',
      'mediterranean', 'french', 'korean', 'vietnamese', 'middle-eastern',
      'continental', 'south-indian', 'north-indian', 'bengali', 'punjabi',
      'gujarati', 'maharashtrian', 'rajasthani', 'kerala', 'hyderabadi',
      'street-food', 'desserts', 'bakery', 'healthy', 'fusion'
    ).required(),
    dietaryTags: Joi.array().items(
      Joi.string().valid(
        'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 
        'egg-free', 'soy-free', 'halal', 'kosher', 'keto', 'paleo', 
        'low-carb', 'high-protein', 'organic', 'spicy', 'mild'
      )
    ),
    ingredients: Joi.array().items(Joi.string().max(100)).min(1).required(),
    images: Joi.array().items(Joi.string().uri()).min(1).required(),
    availability: Joi.object({
      date: Joi.date().min('now').required(),
      startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      quantity: Joi.number().min(1).max(1000).required()
    }).required(),
    nutritionInfo: Joi.object({
      calories: Joi.number().min(0).max(10000),
      protein: Joi.number().min(0).max(1000),
      carbs: Joi.number().min(0).max(1000),
      fat: Joi.number().min(0).max(1000),
      fiber: Joi.number().min(0).max(100),
      sugar: Joi.number().min(0).max(500),
      sodium: Joi.number().min(0).max(10000)
    }),
    tags: Joi.array().items(Joi.string().max(30)),
    allergens: Joi.array().items(
      Joi.string().valid(
        'milk', 'eggs', 'fish', 'shellfish', 'tree-nuts', 'peanuts', 
        'wheat', 'soybeans', 'sesame', 'mustard', 'celery', 'lupin'
      )
    ),
    spiceLevel: Joi.string().valid('mild', 'medium', 'hot', 'very-hot'),
    isSpecialOffer: Joi.boolean(),
    originalPrice: Joi.number().min(0).when('isSpecialOffer', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string().min(10).max(1000),
    price: Joi.number().min(0.01).max(10000),
    preparationTime: Joi.number().min(5).max(480),
    servingSize: Joi.number().min(1).max(20),
    cuisine: Joi.string().valid(
      'indian', 'chinese', 'italian', 'mexican', 'thai', 'japanese', 'american',
      'mediterranean', 'french', 'korean', 'vietnamese', 'middle-eastern',
      'continental', 'south-indian', 'north-indian', 'bengali', 'punjabi',
      'gujarati', 'maharashtrian', 'rajasthani', 'kerala', 'hyderabadi',
      'street-food', 'desserts', 'bakery', 'healthy', 'fusion'
    ),
    dietaryTags: Joi.array().items(
      Joi.string().valid(
        'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 
        'egg-free', 'soy-free', 'halal', 'kosher', 'keto', 'paleo', 
        'low-carb', 'high-protein', 'organic', 'spicy', 'mild'
      )
    ),
    ingredients: Joi.array().items(Joi.string().max(100)).min(1),
    images: Joi.array().items(Joi.string().uri()).min(1),
    availability: Joi.object({
      date: Joi.date().min('now'),
      startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      quantity: Joi.number().min(1).max(1000)
    }),
    nutritionInfo: Joi.object({
      calories: Joi.number().min(0).max(10000),
      protein: Joi.number().min(0).max(1000),
      carbs: Joi.number().min(0).max(1000),
      fat: Joi.number().min(0).max(1000),
      fiber: Joi.number().min(0).max(100),
      sugar: Joi.number().min(0).max(500),
      sodium: Joi.number().min(0).max(10000)
    }),
    tags: Joi.array().items(Joi.string().max(30)),
    allergens: Joi.array().items(
      Joi.string().valid(
        'milk', 'eggs', 'fish', 'shellfish', 'tree-nuts', 'peanuts', 
        'wheat', 'soybeans', 'sesame', 'mustard', 'celery', 'lupin'
      )
    ),
    spiceLevel: Joi.string().valid('mild', 'medium', 'hot', 'very-hot'),
    isActive: Joi.boolean(),
    isSpecialOffer: Joi.boolean(),
    originalPrice: Joi.number().min(0)
  }),

  search: Joi.object({
    longitude: Joi.number().min(-180).max(180),
    latitude: Joi.number().min(-90).max(90),
    radius: Joi.number().min(1).max(100),
    cuisine: Joi.string(),
    dietaryTags: Joi.array().items(Joi.string()),
    maxPrice: Joi.number().min(0),
    minRating: Joi.number().min(0).max(5),
    searchText: Joi.string().max(100),
    limit: Joi.number().min(1).max(100),
    skip: Joi.number().min(0),
    sortBy: Joi.string().valid('rating.average', 'price', 'createdAt', 'totalOrders'),
    sortOrder: Joi.number().valid(1, -1)
  })
};

const Meal = mongoose.model('Meal', mealSchema);

module.exports = {
  Meal,
  mealValidationSchemas
};