const { Meal, mealValidationSchemas } = require('../models/Meal');
const { Chef } = require('../models/Chef');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/meals');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `meal-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 images per meal
  }
});

/**
 * @desc    Create a new meal
 * @route   POST /api/v1/meals
 * @access  Private (Chef only)
 */
const createMeal = async (req, res) => {
  try {
    // Parse JSON fields from form data
    const requestBody = { ...req.body };
    
    // Parse JSON strings for array/object fields
    const jsonFields = ['dietaryTags', 'ingredients', 'availability', 'nutritionInfo', 'tags', 'allergens'];
    jsonFields.forEach(field => {
      if (requestBody[field] && typeof requestBody[field] === 'string') {
        try {
          requestBody[field] = JSON.parse(requestBody[field]);
        } catch (parseError) {
          // Keep as string if parsing fails, validation will catch it
        }
      }
    });

    // Handle uploaded images
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => {
        return `${req.protocol}://${req.get('host')}/uploads/meals/${file.filename}`;
      });
      requestBody.images = imageUrls;
    }

    // Validate request body
    const { error, value } = mealValidationSchemas.create.validate(requestBody);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
          details: error.details
        }
      });
    }

    // Add chef ID to meal data
    const mealData = {
      ...value,
      chefId: req.chef.id
    };

    // Create meal
    const meal = new Meal(mealData);
    await meal.save();

    // Populate chef information
    await meal.populate('chef', 'businessName rating serviceRadius');

    res.status(201).json({
      success: true,
      data: meal,
      message: 'Meal created successfully'
    });

  } catch (error) {
    console.error('Create meal error:', error);
    
    // Clean up uploaded files if meal creation failed
    if (req.files && req.files.length > 0) {
      req.files.forEach(async (file) => {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Failed to delete uploaded file:', unlinkError);
        }
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Meal validation failed',
          details: Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message
          }))
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'MEAL_CREATION_FAILED',
        message: 'Failed to create meal'
      }
    });
  }
};

/**
 * @desc    Get all meals for a chef
 * @route   GET /api/v1/meals/chef
 * @access  Private (Chef only)
 */
const getChefMeals = async (req, res) => {
  try {
    const { includeInactive = 'false' } = req.query;
    
    const meals = await Meal.findByChef(
      req.chef.id, 
      includeInactive === 'true'
    ).populate('chef', 'businessName rating');

    res.json({
      success: true,
      count: meals.length,
      data: meals
    });

  } catch (error) {
    console.error('Get chef meals error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_MEALS_FAILED',
        message: 'Failed to fetch meals'
      }
    });
  }
};

/**
 * @desc    Get single meal by ID
 * @route   GET /api/v1/meals/:id
 * @access  Public
 */
const getMeal = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id)
      .populate('chef', 'businessName description rating serviceRadius availability');

    if (!meal) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MEAL_NOT_FOUND',
          message: 'Meal not found'
        }
      });
    }

    res.json({
      success: true,
      data: meal
    });

  } catch (error) {
    console.error('Get meal error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MEAL_ID',
          message: 'Invalid meal ID format'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_MEAL_FAILED',
        message: 'Failed to fetch meal'
      }
    });
  }
};

/**
 * @desc    Update meal
 * @route   PUT /api/v1/meals/:id
 * @access  Private (Chef only - own meals)
 */
const updateMeal = async (req, res) => {
  try {
    // Parse JSON fields from form data
    const requestBody = { ...req.body };
    
    // Parse JSON strings for array/object fields
    const jsonFields = ['dietaryTags', 'ingredients', 'availability', 'nutritionInfo', 'tags', 'allergens'];
    jsonFields.forEach(field => {
      if (requestBody[field] && typeof requestBody[field] === 'string') {
        try {
          requestBody[field] = JSON.parse(requestBody[field]);
        } catch (parseError) {
          // Keep as string if parsing fails, validation will catch it
        }
      }
    });

    // Validate request body
    const { error, value } = mealValidationSchemas.update.validate(requestBody);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
          details: error.details
        }
      });
    }

    // Find meal and check ownership
    const meal = await Meal.findById(req.params.id);
    if (!meal) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MEAL_NOT_FOUND',
          message: 'Meal not found'
        }
      });
    }

    // Check if chef owns this meal
    if (meal.chefId.toString() !== req.chef.id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED_MEAL_ACCESS',
          message: 'You can only update your own meals'
        }
      });
    }

    // Handle new uploaded images
    let updateData = { ...value };
    if (req.files && req.files.length > 0) {
      const newImageUrls = req.files.map(file => {
        return `${req.protocol}://${req.get('host')}/uploads/meals/${file.filename}`;
      });
      
      // If replacing images, add new ones to existing array or replace entirely
      if (req.body.replaceImages === 'true') {
        updateData.images = newImageUrls;
      } else {
        updateData.images = [...(meal.images || []), ...newImageUrls];
      }
    }

    // Update meal
    const updatedMeal = await Meal.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('chef', 'businessName rating');

    res.json({
      success: true,
      data: updatedMeal,
      message: 'Meal updated successfully'
    });

  } catch (error) {
    console.error('Update meal error:', error);
    
    // Clean up uploaded files if update failed
    if (req.files && req.files.length > 0) {
      req.files.forEach(async (file) => {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Failed to delete uploaded file:', unlinkError);
        }
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Meal validation failed',
          details: Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message
          }))
        }
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MEAL_ID',
          message: 'Invalid meal ID format'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'MEAL_UPDATE_FAILED',
        message: 'Failed to update meal'
      }
    });
  }
};

/**
 * @desc    Delete meal
 * @route   DELETE /api/v1/meals/:id
 * @access  Private (Chef only - own meals)
 */
const deleteMeal = async (req, res) => {
  try {
    // Find meal and check ownership
    const meal = await Meal.findById(req.params.id);
    if (!meal) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MEAL_NOT_FOUND',
          message: 'Meal not found'
        }
      });
    }

    // Check if chef owns this meal
    if (meal.chefId.toString() !== req.chef.id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED_MEAL_ACCESS',
          message: 'You can only delete your own meals'
        }
      });
    }

    // Soft delete by setting isActive to false
    meal.isActive = false;
    await meal.save();

    res.json({
      success: true,
      message: 'Meal deleted successfully'
    });

  } catch (error) {
    console.error('Delete meal error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MEAL_ID',
          message: 'Invalid meal ID format'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'MEAL_DELETION_FAILED',
        message: 'Failed to delete meal'
      }
    });
  }
};

/**
 * @desc    Search meals with location-based filtering
 * @route   GET /api/v1/meals/search
 * @access  Public
 */
const searchMeals = async (req, res) => {
  try {
    // Parse query parameters - handle arrays that come as strings
    const queryParams = { ...req.query };
    
    // Convert dietaryTags to array if it's a string
    if (queryParams.dietaryTags && typeof queryParams.dietaryTags === 'string') {
      queryParams.dietaryTags = [queryParams.dietaryTags];
    }

    // Validate query parameters
    const { error, value } = mealValidationSchemas.search.validate(queryParams);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
          details: error.details
        }
      });
    }

    const {
      longitude,
      latitude,
      radius = 10,
      cuisine,
      dietaryTags,
      maxPrice,
      minRating,
      searchText,
      limit = 20,
      skip = 0,
      sortBy = 'rating.average',
      sortOrder = -1
    } = value;

    let meals = [];

    if (searchText) {
      // Text-based search
      meals = await Meal.searchByText(searchText, {
        longitude,
        latitude,
        radiusInKm: radius,
        limit,
        skip
      });
    } else if (longitude && latitude) {
      // Location-based search
      const options = {
        cuisine,
        dietaryTags: dietaryTags ? (Array.isArray(dietaryTags) ? dietaryTags : [dietaryTags]) : undefined,
        maxPrice,
        minRating,
        limit,
        skip,
        sortBy,
        sortOrder
      };

      meals = await Meal.findAvailableByLocation(longitude, latitude, radius, options);
    } else {
      // General search without location
      const query = {
        isActive: true,
        'availability.remainingQuantity': { $gt: 0 },
        'availability.date': {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      };

      if (cuisine) query.cuisine = cuisine;
      if (dietaryTags) {
        const tagsArray = Array.isArray(dietaryTags) ? dietaryTags : [dietaryTags];
        query.dietaryTags = { $in: tagsArray };
      }
      if (maxPrice) query.price = { $lte: maxPrice };
      if (minRating) query['rating.average'] = { $gte: minRating };

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder;

      meals = await Meal.find(query)
        .populate('chef', 'businessName rating serviceRadius')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);
    }

    res.json({
      success: true,
      count: meals.length,
      data: meals,
      pagination: {
        limit,
        skip,
        hasMore: meals.length === limit
      }
    });

  } catch (error) {
    console.error('Search meals error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'MEAL_SEARCH_FAILED',
        message: 'Failed to search meals'
      }
    });
  }
};

module.exports = {
  createMeal,
  getChefMeals,
  getMeal,
  updateMeal,
  deleteMeal,
  searchMeals,
  upload
};