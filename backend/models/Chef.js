const mongoose = require('mongoose');
const Joi = require('joi');

// Chef Schema
const chefSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    minlength: [2, 'Business name must be at least 2 characters long'],
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  specialties: [{
    type: String,
    required: true,
    trim: true,
    enum: {
      values: [
        'indian', 'chinese', 'italian', 'mexican', 'thai', 'japanese', 'american',
        'mediterranean', 'french', 'korean', 'vietnamese', 'middle-eastern',
        'continental', 'south-indian', 'north-indian', 'bengali', 'punjabi',
        'gujarati', 'maharashtrian', 'rajasthani', 'kerala', 'hyderabadi',
        'street-food', 'desserts', 'bakery', 'healthy', 'vegan', 'vegetarian'
      ],
      message: 'Invalid specialty cuisine'
    }
  }],
  kitchenLicense: {
    type: String,
    required: [true, 'Kitchen license number is required'],
    trim: true,
    unique: true
  },
  serviceRadius: {
    type: Number,
    required: [true, 'Service radius is required'],
    min: [1, 'Service radius must be at least 1 km'],
    max: [50, 'Service radius cannot exceed 50 km'],
    default: 5
  },
  serviceArea: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Service area coordinates are required'],
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
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'suspended', 'rejected'],
      message: 'Status must be pending, approved, suspended, or rejected'
    },
    default: 'pending'
  },
  availability: {
    isActive: {
      type: Boolean,
      default: false
    },
    schedule: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        required: true
      },
      startTime: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
      },
      endTime: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
      }
    }]
  },
  bankDetails: {
    accountNumber: {
      type: String,
      required: [true, 'Bank account number is required'],
      minlength: [8, 'Account number must be at least 8 digits'],
      maxlength: [20, 'Account number cannot exceed 20 digits']
    },
    routingNumber: {
      type: String,
      required: [true, 'Routing number is required'],
      match: [/^\d{9}$/, 'Routing number must be 9 digits']
    },
    accountHolderName: {
      type: String,
      required: [true, 'Account holder name is required'],
      trim: true,
      maxlength: [100, 'Account holder name cannot exceed 100 characters']
    }
  },
  documents: [{
    type: {
      type: String,
      enum: ['license', 'certification', 'insurance', 'identity'],
      required: true
    },
    url: {
      type: String,
      required: true,
      match: [/^https?:\/\/.+/, 'Document URL must be a valid HTTP/HTTPS URL']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    verified: {
      type: Boolean,
      default: false
    }
  }],
  totalOrders: {
    type: Number,
    default: 0,
    min: [0, 'Total orders cannot be negative']
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: [0, 'Total revenue cannot be negative']
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  suspendedAt: {
    type: Date
  },
  suspensionReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Suspension reason cannot exceed 200 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create geospatial index for location-based queries
chefSchema.index({ serviceArea: '2dsphere' });

// Create compound indexes for common queries
chefSchema.index({ status: 1, 'availability.isActive': 1 });
chefSchema.index({ specialties: 1, status: 1 });
chefSchema.index({ 'rating.average': -1, status: 1 });
chefSchema.index({ userId: 1 }, { unique: true });
chefSchema.index({ kitchenLicense: 1 }, { unique: true });

// Virtual to populate user details
chefSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for average rating display
chefSchema.virtual('displayRating').get(function() {
  return this.rating.count > 0 ? this.rating.average.toFixed(1) : 'New Chef';
});

// Virtual to check if chef is currently available
chefSchema.virtual('isCurrentlyAvailable').get(function() {
  if (!this.availability.isActive || this.status !== 'approved') {
    return false;
  }

  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  const todaySchedule = this.availability.schedule.find(s => s.day === currentDay);
  if (!todaySchedule) return false;

  return currentTime >= todaySchedule.startTime && currentTime <= todaySchedule.endTime;
});

// Static method to find chefs within radius
chefSchema.statics.findWithinRadius = function(longitude, latitude, radiusInKm) {
  return this.find({
    serviceArea: {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], radiusInKm / 6378.1] // Earth radius in km
      }
    },
    status: 'approved',
    'availability.isActive': true
  }).populate('userId', 'name email phone');
};

// Static method to find available chefs by specialty
chefSchema.statics.findBySpecialty = function(specialty, longitude, latitude, radiusInKm = 10) {
  return this.find({
    specialties: { $in: [specialty] },
    serviceArea: {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], radiusInKm / 6378.1]
      }
    },
    status: 'approved',
    'availability.isActive': true
  }).populate('userId', 'name email phone');
};

// Instance method to update rating
chefSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Instance method to check if chef serves a location
chefSchema.methods.servesLocation = function(longitude, latitude) {
  const distance = this.calculateDistance(longitude, latitude);
  return distance <= this.serviceRadius;
};

// Instance method to calculate distance to a point
chefSchema.methods.calculateDistance = function(longitude, latitude) {
  const [chefLng, chefLat] = this.serviceArea.coordinates;
  
  const R = 6371; // Earth's radius in km
  const dLat = (latitude - chefLat) * Math.PI / 180;
  const dLng = (longitude - chefLng) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(chefLat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Pre-save middleware to set approval timestamp
chefSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'approved' && !this.approvedAt) {
    this.approvedAt = new Date();
  }
  next();
});

// Joi validation schemas
const chefValidationSchemas = {
  register: Joi.object({
    businessName: Joi.string().min(2).max(100).required(),
    description: Joi.string().min(10).max(500).required(),
    specialties: Joi.array().items(
      Joi.string().valid(
        'indian', 'chinese', 'italian', 'mexican', 'thai', 'japanese', 'american',
        'mediterranean', 'french', 'korean', 'vietnamese', 'middle-eastern',
        'continental', 'south-indian', 'north-indian', 'bengali', 'punjabi',
        'gujarati', 'maharashtrian', 'rajasthani', 'kerala', 'hyderabadi',
        'street-food', 'desserts', 'bakery', 'healthy', 'vegan', 'vegetarian'
      )
    ).min(1).required(),
    kitchenLicense: Joi.string().required(),
    serviceRadius: Joi.number().min(1).max(50),
    serviceArea: Joi.object({
      coordinates: Joi.array().items(Joi.number()).length(2).required()
    }).required(),
    bankDetails: Joi.object({
      accountNumber: Joi.string().min(8).max(20).required(),
      routingNumber: Joi.string().pattern(/^\d{9}$/).required(),
      accountHolderName: Joi.string().max(100).required()
    }).required(),
    availability: Joi.object({
      schedule: Joi.array().items(
        Joi.object({
          day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday').required(),
          startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
        })
      )
    })
  }),

  updateProfile: Joi.object({
    businessName: Joi.string().min(2).max(100),
    description: Joi.string().min(10).max(500),
    specialties: Joi.array().items(
      Joi.string().valid(
        'indian', 'chinese', 'italian', 'mexican', 'thai', 'japanese', 'american',
        'mediterranean', 'french', 'korean', 'vietnamese', 'middle-eastern',
        'continental', 'south-indian', 'north-indian', 'bengali', 'punjabi',
        'gujarati', 'maharashtrian', 'rajasthani', 'kerala', 'hyderabadi',
        'street-food', 'desserts', 'bakery', 'healthy', 'vegan', 'vegetarian'
      )
    ).min(1),
    serviceRadius: Joi.number().min(1).max(50),
    serviceArea: Joi.object({
      coordinates: Joi.array().items(Joi.number()).length(2)
    }),
    bankDetails: Joi.object({
      accountNumber: Joi.string().min(8).max(20),
      routingNumber: Joi.string().pattern(/^\d{9}$/),
      accountHolderName: Joi.string().max(100)
    }),
    availability: Joi.object({
      isActive: Joi.boolean(),
      schedule: Joi.array().items(
        Joi.object({
          day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday').required(),
          startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
        })
      )
    })
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('pending', 'approved', 'suspended', 'rejected').required(),
    suspensionReason: Joi.string().max(200).when('status', {
      is: 'suspended',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }),

  addDocument: Joi.object({
    type: Joi.string().valid('license', 'certification', 'insurance', 'identity').required(),
    url: Joi.string().uri().required()
  })
};

const Chef = mongoose.model('Chef', chefSchema);

module.exports = {
  Chef,
  chefValidationSchemas
};