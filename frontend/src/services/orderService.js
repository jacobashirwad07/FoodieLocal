import api from './api'

class OrderService {
  /**
   * Get customer's orders with optional filtering
   * @param {Object} params - Query parameters
   * @param {string} params.status - Filter by order status
   * @param {number} params.limit - Number of orders to fetch
   * @param {number} params.skip - Number of orders to skip
   * @param {string} params.sortBy - Field to sort by
   * @param {number} params.sortOrder - Sort order (1 for asc, -1 for desc)
   * @returns {Promise<Object>} Orders data with pagination
   */
  async getOrders(params = {}) {
    try {
      const response = await api.get('/orders', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching orders:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Get a specific order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order data
   */
  async getOrder(orderId) {
    try {
      const response = await api.get(`/orders/${orderId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching order:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Get order tracking information
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Tracking data
   */
  async getOrderTracking(orderId) {
    try {
      const response = await api.get(`/orders/${orderId}/tracking`)
      return response.data
    } catch (error) {
      console.error('Error fetching order tracking:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Cancel an order
   * @param {string} orderId - Order ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancelled order data
   */
  async cancelOrder(orderId, reason) {
    try {
      const response = await api.post(`/orders/${orderId}/cancel`, { reason })
      return response.data
    } catch (error) {
      console.error('Error cancelling order:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Create order from cart (checkout)
   * @param {Object} orderData - Order creation data
   * @param {string} orderData.paymentIntentId - Payment intent ID
   * @param {string} orderData.customerNotes - Customer notes
   * @returns {Promise<Object>} Created order data
   */
  async createOrder(orderData) {
    try {
      const response = await api.post('/orders', orderData)
      return response.data
    } catch (error) {
      console.error('Error creating order:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Handle API errors and return user-friendly messages
   * @param {Error} error - API error
   * @returns {Error} Formatted error
   */
  handleError(error) {
    if (error.response?.data?.error) {
      const { code, message } = error.response.data.error
      const errorMessage = this.getErrorMessage(code, message)
      return new Error(errorMessage)
    }
    return new Error('An unexpected error occurred. Please try again.')
  }

  /**
   * Get user-friendly error messages
   * @param {string} code - Error code
   * @param {string} defaultMessage - Default error message
   * @returns {string} User-friendly error message
   */
  getErrorMessage(code, defaultMessage) {
    const errorMessages = {
      'ORDER_NOT_FOUND': 'Order not found. It may have been deleted or you may not have permission to view it.',
      'INVALID_ORDER_ID': 'Invalid order ID. Please check the order number and try again.',
      'ORDER_NOT_CANCELLABLE': 'This order cannot be cancelled at this time.',
      'ORDERS_FETCH_ERROR': 'Unable to load your orders. Please refresh the page and try again.',
      'ORDER_CANCELLATION_ERROR': 'Unable to cancel the order. Please try again or contact support.',
      'TRACKING_FETCH_ERROR': 'Unable to load tracking information. Please try again.',
      'UNAUTHORIZED': 'You need to be logged in to view orders.',
      'FORBIDDEN': 'You do not have permission to perform this action.'
    }

    return errorMessages[code] || defaultMessage || 'An error occurred. Please try again.'
  }

  /**
   * Format order data for display
   * @param {Object} order - Raw order data from API
   * @returns {Object} Formatted order data
   */
  formatOrderForDisplay(order) {
    return {
      id: order._id,
      status: order.status,
      orderDate: order.createdAt,
      deliveryDate: order.actualDeliveryTime,
      estimatedDelivery: order.estimatedDeliveryTime,
      total: order.finalAmount,
      subtotal: order.totalAmount,
      deliveryFee: order.deliveryFee,
      tax: order.tax,
      items: order.items.map(item => ({
        id: item.mealId._id,
        name: item.mealId.name,
        chef: item.chefId.businessName,
        quantity: item.quantity,
        price: item.price,
        image: item.mealId.images?.[0] || 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
        specialInstructions: item.specialInstructions
      })),
      chef: {
        name: order.items[0]?.chefId.businessName || 'Unknown Chef',
        rating: order.items[0]?.chefId.rating || 0
      },
      deliveryAddress: this.formatAddress(order.deliveryAddress),
      deliveryType: order.deliveryType,
      customerNotes: order.customerNotes,
      chefNotes: order.chefNotes,
      cancellationReason: order.cancellationReason,
      paymentStatus: order.paymentStatus,
      canReorder: ['delivered', 'cancelled'].includes(order.status),
      canCancel: ['pending', 'confirmed'].includes(order.status),
      canReview: order.status === 'delivered' && !order.reviewed,
      canTrack: ['confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status)
    }
  }

  /**
   * Format delivery address for display
   * @param {Object} address - Address object
   * @returns {string} Formatted address string
   */
  formatAddress(address) {
    if (!address) return ''
    
    const { street, city, state, zipCode, apartment } = address
    let formatted = street
    if (apartment) formatted += `, ${apartment}`
    formatted += `, ${city}, ${state} ${zipCode}`
    
    return formatted
  }

  /**
   * Get status display information
   * @param {string} status - Order status
   * @returns {Object} Status display info
   */
  getStatusInfo(status) {
    const statusMap = {
      'pending': {
        label: 'Pending',
        color: 'warning',
        description: 'Order is being processed'
      },
      'confirmed': {
        label: 'Confirmed',
        color: 'primary',
        description: 'Order confirmed by chef'
      },
      'preparing': {
        label: 'Preparing',
        color: 'warning',
        description: 'Chef is preparing your order'
      },
      'ready': {
        label: 'Ready',
        color: 'success',
        description: 'Order is ready for pickup/delivery'
      },
      'out_for_delivery': {
        label: 'Out for Delivery',
        color: 'primary',
        description: 'Order is on the way'
      },
      'delivered': {
        label: 'Delivered',
        color: 'success',
        description: 'Order has been delivered'
      },
      'cancelled': {
        label: 'Cancelled',
        color: 'danger',
        description: 'Order was cancelled'
      }
    }

    return statusMap[status] || {
      label: status,
      color: 'secondary',
      description: 'Unknown status'
    }
  }
}

export default new OrderService()