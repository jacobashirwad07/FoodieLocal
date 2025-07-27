const express = require('express');
const {
  getProfile,
  updateProfile,
  updateLocation,
  getUserOrders,
  getAllUsers,
  updateUserStatus
} = require('../controllers/userController');
const { 
  protect, 
  authorize, 
  requireEmailVerification 
} = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// User profile routes (accessible to all authenticated users)
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/orders', getUserOrders);

// Location update (requires email verification)
router.put('/location', requireEmailVerification, updateLocation);

// Admin only routes
router.get('/', authorize('admin'), getAllUsers);
router.put('/:id/status', authorize('admin'), updateUserStatus);

module.exports = router;