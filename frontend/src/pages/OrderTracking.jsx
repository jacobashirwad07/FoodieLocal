import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, MapPin, Phone, CheckCircle, Package, Truck, Star } from 'lucide-react'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useToast } from '../contexts/ToastContext'
import orderService from '../services/orderService'

const OrderTracking = () => {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [tracking, setTracking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { showError } = useToast() || {}

  useEffect(() => {
    loadOrderAndTracking()
  }, [orderId])

  const loadOrderAndTracking = async () => {
    try {
      setLoading(true)
      setError(null)

      try {
        // Load order details and tracking info
        const [orderResponse, trackingResponse] = await Promise.all([
          orderService.getOrder(orderId),
          orderService.getOrderTracking(orderId)
        ])

        const formattedOrder = orderService.formatOrderForDisplay(orderResponse.data.order)
        setOrder(formattedOrder)
        setTracking(trackingResponse.data.tracking)
      } catch (apiError) {
        console.warn('API not available, using mock data for order tracking')
        // Mock order data for when API is not available
        const mockOrder = {
          id: orderId,
          status: 'preparing',
          orderDate: new Date().toISOString(),
          estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          total: 28.50,
          subtotal: 26.50,
          deliveryFee: 2.00,
          tax: 0,
          items: [
            {
              id: 1,
              name: 'Sample Meal',
              chef: 'Sample Chef',
              quantity: 1,
              price: 26.50,
              image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400'
            }
          ],
          chef: {
            name: 'Sample Chef',
            rating: 4.5
          },
          deliveryAddress: '123 Main St, Sample City',
          deliveryType: 'delivery'
        }
        
        const mockTracking = {
          orderId: orderId,
          status: 'preparing',
          timeRemaining: 30,
          chefNotes: 'Your order is being prepared with care!'
        }
        
        setOrder(mockOrder)
        setTracking(mockTracking)
      }
    } catch (err) {
      console.error('Error loading order tracking:', err)
      setError(err.message)
      showError && showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusSteps = () => {
    const steps = [
      { key: 'pending', label: 'Order Placed', icon: CheckCircle },
      { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
      { key: 'preparing', label: 'Preparing', icon: Package },
      { key: 'ready', label: 'Ready', icon: CheckCircle },
      { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
      { key: 'delivered', label: 'Delivered', icon: CheckCircle }
    ]

    const currentStatusIndex = steps.findIndex(step => step.key === order?.status)
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentStatusIndex,
      current: index === currentStatusIndex
    }))
  }

  const formatTimeRemaining = (minutes) => {
    if (minutes <= 0) return 'Any moment now'
    if (minutes < 60) return `${minutes} minutes`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading order tracking..." />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Order not found</h3>
          <p className="text-gray-600 mb-6">{error || 'The order you are looking for does not exist.'}</p>
          <Link to="/orders" className="btn btn-primary">
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  const statusSteps = getStatusSteps()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/orders" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Order</h1>
          <p className="text-gray-600">Order #{order.id}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Status Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Status</h2>
              
              {/* Status Timeline */}
              <div className="space-y-4">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon
                  return (
                    <div key={step.key} className="flex items-center">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed 
                          ? 'bg-success-100 text-success-600' 
                          : step.current
                          ? 'bg-primary-100 text-primary-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="ml-4 flex-1">
                        <p className={`font-medium ${
                          step.completed || step.current ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.label}
                        </p>
                        {step.current && tracking?.chefNotes && (
                          <p className="text-sm text-gray-600 mt-1">{tracking.chefNotes}</p>
                        )}
                      </div>
                      {step.current && (
                        <div className="text-sm text-primary-600 font-medium">
                          Current
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Estimated Time */}
              {tracking?.timeRemaining && order.status !== 'delivered' && (
                <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-primary-600 mr-2" />
                    <div>
                      <p className="font-medium text-primary-900">
                        Estimated delivery: {formatTimeRemaining(tracking.timeRemaining)}
                      </p>
                      {order.estimatedDelivery && (
                        <p className="text-sm text-primary-700">
                          Expected by {new Date(order.estimatedDelivery).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      {item.specialInstructions && (
                        <p className="text-sm text-gray-500 italic">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                    </div>
                    <span className="font-semibold text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            {/* Chef Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Chef Information</h3>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-lg">
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
              <button className="w-full btn btn-outline text-sm">
                <Phone className="h-4 w-4 mr-2" />
                Contact Chef
              </button>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Delivery Address</p>
                    <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Delivery Type</p>
                    <p className="text-sm text-gray-600 capitalize">{order.deliveryType}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${order.subtotal?.toFixed(2) || order.total.toFixed(2)}</span>
                </div>
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="text-gray-900">${order.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {order.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">${order.tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderTracking