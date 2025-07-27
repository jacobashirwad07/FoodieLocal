const express = require('express');
const {
  registerChef,
  getChefProfile,
  updateChefProfile,
  uploadDocuments,
  getChefOrders,
  confirmOrder,
  updateOrderStatus,
  updateEstimatedCompletionTime,
  updateChefStatus
} = require('../controllers/chefController');
const { 
  protect, 
  authorize, 
  requireEmailVerification 
} = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Chef registration (requires email verification)
router.post('/register', requireEmailVerification, registerChef);

// Chef profile routes (accessible to chefs only)
router.get('/profile', authorize('chef'), getChefProfile);
router.put('/profile', authorize('chef'), updateChefProfile);

// Document upload (accessible to chefs only)
router.post('/documents', authorize('chef'), uploadDocuments);

// Chef orders (accessible to chefs only)
router.get('/orders', authorize('chef'), getChefOrders);

// Chef order management (accessible to chefs only)
router.put('/orders/:id/confirm', authorize('chef'), confirmOrder);
router.put('/orders/:id/status', authorize('chef'), updateOrderStatus);
router.put('/orders/:id/completion-time', authorize('chef'), updateEstimatedCompletionTime);

// Admin only routes
router.put('/:id/status', authorize('admin'), updateChefStatus);

module.exports = router;