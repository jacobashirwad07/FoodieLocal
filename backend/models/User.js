const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Joi = require('joi');

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[\d\s\-\(\)]{10,15}$/, 'Please enter a valid phone number']
  },
  role: {
    type: String,
    enum: {
      values: ['customer', 'chef', 'admin'],
      message: 'Role must be either customer, chef, or admin'
    },
    default: 'customer'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Location coordinates are required'],
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
  address: {
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
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    dietary: [{
      type: String,
      enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher'],
      lowercase: true
    }]
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create geospatial index for location-based queries
userSchema.index({ location: '2dsphere' });

// Create compound index for email and role
userSchema.index({ email: 1, role: 1 });

// Create index for active users
userSchema.index({ isActive: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return token;
};

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return token;
};

// Static method to find users within radius
userSchema.statics.findWithinRadius = function(longitude, latitude, radiusInKm) {
  return this.find({
    location: {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], radiusInKm / 6378.1] // Earth radius in km
      }
    },
    isActive: true
  });
};

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
});

// Joi validation schemas
const userValidationSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]{10,15}$/).required(),
    location: Joi.object({
      coordinates: Joi.array().items(Joi.number()).length(2).required()
    }).required(),
    address: Joi.object({
      street: Joi.string().max(100).required(),
      city: Joi.string().max(50).required(),
      state: Joi.string().max(50).required(),
      zipCode: Joi.string().pattern(/^\d{5}(-\d{4})?$/).required()
    }).required(),
    preferences: Joi.object({
      notifications: Joi.object({
        email: Joi.boolean(),
        sms: Joi.boolean(),
        push: Joi.boolean()
      }),
      dietary: Joi.array().items(Joi.string().valid('vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher'))
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]{10,15}$/),
    address: Joi.object({
      street: Joi.string().max(100),
      city: Joi.string().max(50),
      state: Joi.string().max(50),
      zipCode: Joi.string().pattern(/^\d{5}(-\d{4})?$/)
    }),
    preferences: Joi.object({
      notifications: Joi.object({
        email: Joi.boolean(),
        sms: Joi.boolean(),
        push: Joi.boolean()
      }),
      dietary: Joi.array().items(Joi.string().valid('vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher'))
    })
  }),

  updateLocation: Joi.object({
    coordinates: Joi.array().items(
      Joi.number().min(-180).max(180)
    ).length(2).required().custom((value, helpers) => {
      const [longitude, latitude] = value;
      if (longitude < -180 || longitude > 180) {
        return helpers.error('coordinates.longitude');
      }
      if (latitude < -90 || latitude > 90) {
        return helpers.error('coordinates.latitude');
      }
      return value;
    }).messages({
      'coordinates.longitude': 'Longitude must be between -180 and 180',
      'coordinates.latitude': 'Latitude must be between -90 and 90'
    })
  })
};

const User = mongoose.model('User', userSchema);

module.exports = {
  User,
  userValidationSchemas
};