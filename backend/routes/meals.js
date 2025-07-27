const express = require('express');
const {
  createMeal,
  getChefMeals,
  getMeal,
  updateMeal,
  deleteMeal,
  searchMeals,
  upload
} = require('../controllers/mealController');
const { protect, authorize, requireChefApproval, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/search', optionalAuth, searchMeals);
router.get('/:id', optionalAuth, getMeal);

// Protected routes - Chef only
router.use(protect);
router.use(authorize('chef'));
router.use(requireChefApproval);

// Chef meal management routes
router.route('/')
  .post(upload.array('images', 5), createMeal);

router.get('/chef/my-meals', getChefMeals);

router.route('/:id')
  .put(upload.array('images', 5), updateMeal)
  .delete(deleteMeal);

module.exports = router;