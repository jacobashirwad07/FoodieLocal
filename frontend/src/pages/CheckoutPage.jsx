import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, MapPin, Clock, User, Phone, Mail, Lock, CheckCircle, ArrowLeft } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'

const CheckoutPage = () => {
  const { cartItems, getTotalPrice, getTotalItems, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [step, setStep] = useState(1) // 1: Details, 2: Payment, 3: Confirmation
  const [loading, setLoading] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  
  const [orderDetails, setOrderDetails] = useState({
    deliveryType: 'delivery',
    deliveryAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      instructions: ''
    },
    contactInfo: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    },
    paymentMethod: 'card',
    cardDetails: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: user?.name || ''
    }
  })

  const deliveryFee = orderDetails.deliveryType === 'delivery' ? 3.99 : 0
  const tax = getTotalPrice() * 0.08
  const total = getTotalPrice() + deliveryFee + tax

  // Redirect if cart is empty
  if (cartItems.length === 0) {
    navigate('/cart')
    return null
  }

  const handleInputChange = (section, field, value) => {
    setOrderDetails(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleDirectChange = (field, value) => {
    setOrderDetails(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateStep1 = () => {
    if (orderDetails.deliveryType === 'delivery') {
      return orderDetails.deliveryAddress.street && 
             orderDetails.deliveryAddress.city && 
             orderDetails.deliveryAddress.state && 
             orderDetails.deliveryAddress.zipCode
    }
    return true
  }

  const validateStep2 = () => {
    return orderDetails.contactInfo.name && 
           orderDetails.contactInfo.email && 
           orderDetails.contactInfo.phone &&
           orderDetails.cardDetails.cardNumber &&
           orderDetails.cardDetails.expiryDate &&
           orderDetails.cardDetails.cvv &&
           orderDetails.cardDetails.cardholderName
  }

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handlePlaceOrder = async () => {
    setLoading(true)
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create dummy order
      const order = {
        id: `ORD-${Date.now()}`,
        items: cartItems,
        total: total,
        deliveryType: orderDetails.deliveryType,
        deliveryAddress: orderDetails.deliveryAddress,
        contactInfo: orderDetails.contactInfo,
        status: 'confirmed',
        orderDate: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
        createdAt: new Date().toISOString(),
        chef: {
          name: cartItems[0]?.chef || 'Multiple Chefs',
          rating: 4.8
        },
        canCancel: true,
        canReorder: true
      }
      
      // Store order in localStorage (in real app, this would be sent to backend)
      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]')
      existingOrders.unshift(order)
      localStorage.setItem('orders', JSON.stringify(existingOrders))
      
      clearCart()
      setOrderPlaced(true)
      
    } catch (error) {
      console.error('Order placement failed:', error)
    } finally {
      setLoading(false)
    }
  }

  if (orderPlaced) {
    return <OrderConfirmation />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[
              { number: 1, title: 'Delivery Details', icon: MapPin },
              { number: 2, title: 'Payment', icon: CreditCard },
              { number: 3, title: 'Review', icon: CheckCircle }
            ].map(({ number, title, icon: Icon }) => (
              <div key={number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step >= number 
                    ? 'bg-primary-600 border-primary-600 text-white' 
                    : 'border-gray-300 text-gray-500'
                }`}>
                  {step > number ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step >= number ? 'text-primary-600' : 'text-gray-500'
                }`}>
                  {title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 1 && <DeliveryDetailsStep orderDetails={orderDetails} onInputChange={handleInputChange} onDirectChange={handleDirectChange} />}
            {step === 2 && <PaymentStep orderDetails={orderDetails} onInputChange={handleInputChange} />}
            {step === 3 && <ReviewStep orderDetails={orderDetails} cartItems={cartItems} />}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items ({getTotalItems()})</span>
                  <span className="text-gray-900">${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="text-gray-900">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {step < 3 ? (
                <button
                  onClick={handleNextStep}
                  disabled={step === 1 ? !validateStep1() : !validateStep2()}
                  className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {step === 1 ? 'Continue to Payment' : 'Review Order'}
                </button>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" text="" className="text-white" />
                  ) : (
                    'Place Order'
                  )}
                </button>
              )}

              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="btn btn-outline w-full mt-3"
                >
                  Back
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const DeliveryDetailsStep = ({ orderDetails, onInputChange, onDirectChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Delivery Details</h2>
      
      {/* Delivery Type */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Method</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onDirectChange('deliveryType', 'delivery')}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              orderDetails.deliveryType === 'delivery'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <MapPin className="h-5 w-5 text-primary-600 mb-2" />
            <div className="font-medium">Delivery</div>
            <div className="text-sm text-gray-600">30-45 minutes</div>
            <div className="text-sm font-medium text-primary-600">$3.99</div>
          </button>
          
          <button
            onClick={() => onDirectChange('deliveryType', 'pickup')}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              orderDetails.deliveryType === 'pickup'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Clock className="h-5 w-5 text-primary-600 mb-2" />
            <div className="font-medium">Pickup</div>
            <div className="text-sm text-gray-600">15-20 minutes</div>
            <div className="text-sm font-medium text-green-600">Free</div>
          </button>
        </div>
      </div>

      {/* Delivery Address */}
      {orderDetails.deliveryType === 'delivery' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Delivery Address</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input
              type="text"
              value={orderDetails.deliveryAddress.street}
              onChange={(e) => onInputChange('deliveryAddress', 'street', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="123 Main Street"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={orderDetails.deliveryAddress.city}
                onChange={(e) => onInputChange('deliveryAddress', 'city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="New York"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={orderDetails.deliveryAddress.state}
                onChange={(e) => onInputChange('deliveryAddress', 'state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="NY"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
            <input
              type="text"
              value={orderDetails.deliveryAddress.zipCode}
              onChange={(e) => onInputChange('deliveryAddress', 'zipCode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="10001"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Instructions (Optional)</label>
            <textarea
              rows={3}
              value={orderDetails.deliveryAddress.instructions}
              onChange={(e) => onInputChange('deliveryAddress', 'instructions', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="Apartment number, gate code, etc."
            />
          </div>
        </div>
      )}
    </div>
  )
}

const PaymentStep = ({ orderDetails, onInputChange }) => {
  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={orderDetails.contactInfo.name}
                onChange={(e) => onInputChange('contactInfo', 'name', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="John Doe"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                value={orderDetails.contactInfo.phone}
                onChange={(e) => onInputChange('contactInfo', 'phone', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              value={orderDetails.contactInfo.email}
              onChange={(e) => onInputChange('contactInfo', 'email', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="john@example.com"
            />
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Information</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
            <input
              type="text"
              value={orderDetails.cardDetails.cardholderName}
              onChange={(e) => onInputChange('cardDetails', 'cardholderName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="John Doe"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={orderDetails.cardDetails.cardNumber}
                onChange={(e) => onInputChange('cardDetails', 'cardNumber', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="text"
                value={orderDetails.cardDetails.expiryDate}
                onChange={(e) => onInputChange('cardDetails', 'expiryDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="MM/YY"
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={orderDetails.cardDetails.cvv}
                  onChange={(e) => onInputChange('cardDetails', 'cvv', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>
          </div>
        </div>
        

      </div>
    </div>
  )
}

const ReviewStep = ({ orderDetails, cartItems }) => {
  return (
    <div className="space-y-6">
      {/* Order Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Items</h2>
        <div className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center space-x-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg"
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
        </div>
      </div>

      {/* Delivery Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Delivery Details</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Method:</span>
            <span className="font-medium capitalize">{orderDetails.deliveryType}</span>
          </div>
          
          {orderDetails.deliveryType === 'delivery' && (
            <div className="flex justify-between">
              <span className="text-gray-600">Address:</span>
              <div className="text-right">
                <div className="font-medium">{orderDetails.deliveryAddress.street}</div>
                <div className="text-sm text-gray-600">
                  {orderDetails.deliveryAddress.city}, {orderDetails.deliveryAddress.state} {orderDetails.deliveryAddress.zipCode}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-600">Contact:</span>
            <div className="text-right">
              <div className="font-medium">{orderDetails.contactInfo.name}</div>
              <div className="text-sm text-gray-600">{orderDetails.contactInfo.phone}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>
        <div className="flex items-center space-x-3">
          <CreditCard className="h-6 w-6 text-gray-400" />
          <div>
            <div className="font-medium">
              **** **** **** {orderDetails.cardDetails.cardNumber.slice(-4)}
            </div>
            <div className="text-sm text-gray-600">
              {orderDetails.cardDetails.cardholderName}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const OrderConfirmation = () => {
  const navigate = useNavigate()
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your order. You'll receive a confirmation email shortly with your order details and tracking information.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/orders')}
              className="btn btn-primary w-full"
            >
              View Order Status
            </button>
            <button
              onClick={() => navigate('/meals')}
              className="btn btn-outline w-full"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage