import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, MapPin, Star, Package, Truck, CheckCircle, XCircle, RotateCcw, Search, Filter, Eye } from 'lucide-react'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import orderService from '../services/orderService'

const OrderHistory = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    skip: 0,
    hasMore: false
  })
  const [error, setError] = useState(null)
  const { addToCart } = useCart() || {}
  const { showSuccess, showError } = useToast() || {}

  // Mock data fallback
  const getMockOrders = () => [
    {
      id: 'ORD-001',
      status: 'delivered',
      orderDate: '2024-01-15T18:30:00Z',
      deliveryDate: '2024-01-15T19:15:00Z',
      total: 34.97,
      subtotal: 32.00,
      deliveryFee: 2.97,
      tax: 0,
      items: [
        {
          id: 1,
          name: 'Butter Chicken with Basmati Rice',
          chef: 'Priya Sharma',
          quantity: 2,
          price: 18.99,
          image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400'
        }
      ],
      chef: {
        name: 'Priya Sharma',
        rating: 4.8
      },
      deliveryAddress: '123 Main St, Apt 4B, New York, NY 10001',
      deliveryType: 'delivery',
      canReorder: true,
      canReview: true,
      canCancel: false,
      canTrack: false
    },
    {
      id: 'ORD-002',
      status: 'preparing',
      orderDate: '2024-01-16T12:00:00Z',
      estimatedDelivery: '2024-01-16T13:00:00Z',
      total: 28.50,
      subtotal: 26.50,
      deliveryFee: 2.00,
      tax: 0,
      items: [
        {
          id: 2,
          name: 'Homemade Margherita Pizza',
          chef: 'Marco Rossi',
          quantity: 1,
          price: 16.50,
          image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400'
        },
        {
          id: 3,
          name: 'Caesar Salad',
          chef: 'Marco Rossi',
          quantity: 1,
          price: 12.00,
          image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400'
        }
      ],
      chef: {
        name: 'Marco Rossi',
        rating: 4.7
      },
      deliveryAddress: '123 Main St, Apt 4B, New York, NY 10001',
      deliveryType: 'delivery',
      canReorder: true,
      canReview: false,
      canCancel: true,
      canTrack: true
    },
    {
      id: 'ORD-003',
      status: 'cancelled',
      orderDate: '2024-01-14T16:45:00Z',
      total: 22.00,
      subtotal: 22.00,
      deliveryFee: 0,
      tax: 0,
      items: [
        {
          id: 4,
          name: 'Korean BBQ Bowl',
          chef: 'Kim Min-jun',
          quantity: 1,
          price: 22.00,
          image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400'
        }
      ],
      chef: {
        name: 'Kim Min-jun',
        rating: 4.9
      },
      deliveryAddress: '123 Main St, Apt 4B, New York, NY 10001',
      deliveryType: 'pickup',
      cancellationReason: 'Chef unavailable',
      canReorder: true,
      canReview: false,
      canCancel: false,
      canTrack: false
    }
  ]

  // Load orders from API with fallback to mock data
  const loadOrders = async (resetOrders = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        limit: pagination.limit,
        skip: resetOrders ? 0 : pagination.skip,
        sortBy: 'createdAt',
        sortOrder: -1
      }

      // Add status filter if not 'all'
      if (filter !== 'all') {
        if (filter === 'active') {
          // For active orders, we'll filter on frontend since API doesn't support multiple statuses
          // We'll fetch all and filter client-side for now
        } else {
          params.status = filter
        }
      }

      try {
        const response = await orderService.getOrders(params)
        const formattedOrders = response.data.orders.map(order => 
          orderService.formatOrderForDisplay(order)
        )

        if (resetOrders) {
          setOrders(formattedOrders)
          setPagination({
            ...pagination,
            skip: 0,
            total: response.data.pagination.total,
            hasMore: response.data.pagination.hasMore
          })
        } else {
          setOrders(prev => [...prev, ...formattedOrders])
          setPagination(prev => ({
            ...prev,
            skip: prev.skip + pagination.limit,
            total: response.data.pagination.total,
            hasMore: response.data.pagination.hasMore
          }))
        }
      } catch (apiError) {
        console.warn('API not available, using mock data:', apiError.message)
        // Fallback to mock data
        const mockOrders = getMockOrders()
        setOrders(mockOrders)
        setPagination({
          total: mockOrders.length,
          limit: 20,
          skip: 0,
          hasMore: false
        })
      }

    } catch (err) {
      console.error('Error loading orders:', err)
      setError(err.message)
      showError && showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders(true)
  }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-success-600" />
      case 'confirmed':
      case 'preparing':
        return <Package className="h-5 w-5 text-warning-600" />
      case 'out_for_delivery':
        return <Truck className="h-5 w-5 text-primary-600" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-danger-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'delivered':
        return 'Delivered'
      case 'confirmed':
        return 'Confirmed'
      case 'preparing':
        return 'Preparing'
      case 'out_for_delivery':
        return 'Out for Delivery'
      case 'cancelled':
        return 'Cancelled'
      default:
        return 'Pending'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'badge-success'
      case 'confirmed':
      case 'preparing':
        return 'badge-warning'
      case 'out_for_delivery':
        return 'badge-primary'
      case 'cancelled':
        return 'badge-danger'
      default:
        return 'badge-primary'
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && ['preparing', 'confirmed', 'ready', 'out_for_delivery'].includes(order.status)) ||
      order.status === filter
    const matchesSearch = searchTerm === '' || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.chef.toLowerCase().includes(searchTerm.toLowerCase())
      )
    return matchesFilter && matchesSearch
  })

  // Calculate counts for filter tabs
  const getFilterCounts = () => {
    return {
      all: orders.length,
      active: orders.filter(o => ['preparing', 'confirmed', 'ready', 'out_for_delivery'].includes(o.status)).length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    }
  }

  const filterCounts = getFilterCounts()

  const handleReorder = (order) => {
    try {
      if (addToCart) {
        order.items.forEach(item => {
          addToCart({
            id: item.id,
            name: item.name,
            price: item.price,
            chef: item.chef,
            image: item.image,
            quantity: item.quantity
          })
        })
        showSuccess && showSuccess(`${order.items.length} item(s) added to cart!`)
      }
    } catch (error) {
      console.error('Error adding items to cart:', error)
      showError && showError('Failed to add items to cart')
    }
  }

  const handleCancelOrder = async (orderId, reason = 'Cancelled by customer') => {
    try {
      try {
        const response = await orderService.cancelOrder(orderId, reason)
        const updatedOrder = orderService.formatOrderForDisplay(response.data.order)
        
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId ? updatedOrder : order
          )
        )
      } catch (apiError) {
        // Fallback for when API is not available
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: 'cancelled', cancellationReason: reason, canCancel: false }
              : order
          )
        )
      }
      showSuccess && showSuccess('Order cancelled successfully')
    } catch (err) {
      console.error('Error cancelling order:', err)
      showError && showError(err.message)
    }
  }

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your orders..." />
      </div>
    )
  }

  if (error && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to load orders</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => loadOrders(true)}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
          <p className="text-gray-600">Track and manage your food orders</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders, meals, or chefs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            
            {/* Filter Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {[
                { key: 'all', label: 'All', count: filterCounts.all },
                { key: 'active', label: 'Active', count: filterCounts.active },
                { key: 'delivered', label: 'Delivered', count: filterCounts.delivered },
                { key: 'cancelled', label: 'Cancelled', count: filterCounts.cancelled }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    filter === tab.key
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                  }`}
                >
                  {tab.label} {tab.count > 0 && `(${tab.count})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't placed any orders yet" 
                : filter === 'active'
                ? "No active orders found"
                : `No ${filter} orders found`
              }
            </p>
            <Link to="/meals" className="btn btn-primary">
              Browse Meals
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onReorder={() => handleReorder(order)}
                onCancel={(reason) => handleCancelOrder(order.id, reason)}
              />
            ))}
            
            {/* Load More Button */}
            {pagination.hasMore && filter === 'all' && (
              <div className="text-center py-6">
                <button
                  onClick={() => loadOrders(false)}
                  disabled={loading}
                  className="btn btn-outline"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Loading...</span>
                    </>
                  ) : (
                    'Load More Orders'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const OrderCard = ({ order, onReorder, onCancel }) => {
  const [showDetails, setShowDetails] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-success-600" />
      case 'confirmed':
      case 'preparing':
        return <Package className="h-5 w-5 text-warning-600" />
      case 'out_for_delivery':
        return <Truck className="h-5 w-5 text-primary-600" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-danger-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'badge-success'
      case 'confirmed':
      case 'preparing':
        return 'badge-warning'
      case 'out_for_delivery':
        return 'badge-primary'
      case 'cancelled':
        return 'badge-danger'
      default:
        return 'badge-primary'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Order Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">Order #{order.id}</h3>
            <span className={`badge ${getStatusColor(order.status)} flex items-center space-x-1`}>
              {getStatusIcon(order.status)}
              <span className="capitalize">{order.status.replace('_', ' ')}</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-lg font-bold text-gray-900">${order.total.toFixed(2)}</span>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <Eye className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Ordered: {formatDate(order.orderDate)}</span>
          </div>
          
          {order.deliveryDate && (
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-success-600" />
              <span>Delivered: {formatDate(order.deliveryDate)}</span>
            </div>
          )}
          
          {order.estimatedDelivery && order.status !== 'delivered' && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-warning-600" />
              <span>ETA: {formatDate(order.estimatedDelivery)}</span>
            </div>
          )}
          
          {order.status === 'confirmed' && (
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-primary-600" />
              <span className="text-primary-600 font-medium">Order confirmed - preparing soon</span>
            </div>
          )}
          
          {order.deliveryAddress && (
            <div className="flex items-center space-x-2 md:col-span-3">
              <MapPin className="h-4 w-4" />
              <span>{order.deliveryAddress}</span>
            </div>
          )}
        </div>

        {order.cancellationReason && (
          <div className="mt-3 p-3 bg-danger-50 border border-danger-200 rounded-lg">
            <p className="text-sm text-danger-800">
              <strong>Cancellation reason:</strong> {order.cancellationReason}
            </p>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className={`p-6 ${!showDetails ? 'pb-4' : ''}`}>
        <div className="space-y-4">
          {(showDetails ? order.items : order.items.slice(0, 2)).map((item) => (
            <div key={item.id} className="flex items-center space-x-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg shadow-sm"
              />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.name}</h4>
                <p className="text-sm text-gray-600">by {item.chef}</p>
                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
              </div>
              <span className="font-semibold text-gray-900">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          
          {!showDetails && order.items.length > 2 && (
            <div className="text-center py-2">
              <button
                onClick={() => setShowDetails(true)}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                +{order.items.length - 2} more items
              </button>
            </div>
          )}
        </div>

        {/* Chef Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold">
                  {order.chef.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{order.chef.name}</p>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">{order.chef.rating}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {order.canReorder && (
                <button 
                  onClick={onReorder}
                  className="btn btn-outline text-sm hover:bg-primary-50 hover:border-primary-500"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reorder
                </button>
              )}
              
              {order.canReview && (
                <button className="btn btn-primary text-sm">
                  <Star className="h-4 w-4 mr-1" />
                  Review
                </button>
              )}
              
              {order.canCancel && (
                <button 
                  onClick={() => setShowCancelDialog(true)}
                  className="btn btn-danger text-sm"
                >
                  Cancel Order
                </button>
              )}
              
              {order.canTrack && (
                <Link 
                  to={`/orders/${order.id}/track`}
                  className="btn btn-outline text-sm text-primary-600 border-primary-600 hover:bg-primary-50"
                >
                  Track Order
                </Link>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Order</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please let us know why you're cancelling..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCancelDialog(false)
                  setCancelReason('')
                }}
                className="flex-1 btn btn-outline"
              >
                Keep Order
              </button>
              <button
                onClick={() => {
                  onCancel(cancelReason || 'Cancelled by customer')
                  setShowCancelDialog(false)
                  setCancelReason('')
                }}
                className="flex-1 btn btn-danger"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderHistory