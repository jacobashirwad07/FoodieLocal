const { Cart } = require('../models/Cart');
const cron = require('node-cron');

/**
 * Cleanup expired carts
 * This function removes carts that have expired
 */
const cleanupExpiredCarts = async () => {
  try {
    const result = await Cart.cleanupExpired();
    console.log(`Cleaned up ${result.deletedCount} expired carts`);
    return result;
  } catch (error) {
    console.error('Error cleaning up expired carts:', error);
    throw error;
  }
};

/**
 * Start cart cleanup scheduler
 * Runs every hour to clean up expired carts
 */
const startCartCleanupScheduler = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('Running cart cleanup job...');
    try {
      await cleanupExpiredCarts();
    } catch (error) {
      console.error('Cart cleanup job failed:', error);
    }
  });
  
  console.log('Cart cleanup scheduler started - runs every hour');
};

/**
 * Cleanup carts for a specific user (useful for testing)
 */
const cleanupUserCart = async (customerId) => {
  try {
    const result = await Cart.deleteOne({ customerId });
    return result;
  } catch (error) {
    console.error('Error cleaning up user cart:', error);
    throw error;
  }
};

/**
 * Get cart statistics
 */
const getCartStatistics = async () => {
  try {
    const totalCarts = await Cart.countDocuments();
    const expiredCarts = await Cart.countDocuments({ 
      expiresAt: { $lt: new Date() } 
    });
    const activeCarts = totalCarts - expiredCarts;
    
    const cartsWithItems = await Cart.countDocuments({
      'items.0': { $exists: true }
    });
    
    const emptyCarts = totalCarts - cartsWithItems;
    
    return {
      totalCarts,
      activeCarts,
      expiredCarts,
      cartsWithItems,
      emptyCarts
    };
  } catch (error) {
    console.error('Error getting cart statistics:', error);
    throw error;
  }
};

module.exports = {
  cleanupExpiredCarts,
  startCartCleanupScheduler,
  cleanupUserCart,
  getCartStatistics
};