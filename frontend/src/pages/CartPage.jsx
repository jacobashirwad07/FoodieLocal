import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, MapPin, Clock } from 'lucide-react'
import { useCart } from '../contexts/CartContext'

const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, getTotalItems, clearCart } = useCart()
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryType, setDeliveryType] = useState('delivery')

  const deliveryFee = deliveryType === 'delivery' ? 3.99 : 0
  const tax = getTotalPrice() * 0.08
  const total = getTotalPrice() + deliveryFee + tax

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">
              Discover delicious meals from local chefs and add them to your cart
            </p>
            <Link to="/meals" className="btn btn-primary">
              Browse Meals
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Cart</h1>
          <p className="text-gray-600">{getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} in your cart</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
                  <button
                    onClick={clearCart}
                    className="text-danger-600 hover:text-danger-700 text-sm font-medium transition-colors duration-200"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                  />
                ))}
              </div>
            </div>

            {/* Delivery Options */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Options</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="delivery"
                    name="deliveryType"
                    value="delivery"
                    checked={deliveryType === 'delivery'}
                    onChange={(e) => setDeliveryType(e.target.value)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="delivery" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">Delivery</span>
                      </div>
                      <span className="text-gray-600">${deliveryFee.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-500 ml-6">Delivered to your door in 30-45 minutes</p>
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="pickup"
                    name="deliveryType"
                    value="pickup"
                    checked={deliveryType === 'pickup'}
                    onChange={(e) => setDeliveryType(e.target.value)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="pickup" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">Pickup</span>
                      </div>
                      <span className="text-gray-600">Free</span>
                    </div>
                    <p className="text-sm text-gray-500 ml-6">Pick up from chef's location</p>
                  </label>
                </div>
              </div>

              {deliveryType === 'delivery' && (
                <div className="mt-4">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address
                  </label>
                  <textarea
                    id="address"
                    rows={3}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your full delivery address..."
                    className="input-field resize-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Link
                to="/checkout"
                className={`btn btn-primary w-full mb-4 ${
                  deliveryType === 'delivery' && !deliveryAddress.trim()
                    ? 'opacity-50 cursor-not-allowed pointer-events-none'
                    : ''
                }`}
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>

              <Link 
                to="/meals" 
                className="block text-center text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <div className="p-6">
      <div className="flex items-start space-x-4">
        <img
          src={item.image}
          alt={item.name}
          className="w-20 h-20 object-cover rounded-lg"
        />
        
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-medium text-gray-900 mb-1">{item.name}</h4>
          <p className="text-sm text-gray-600 mb-2">by {item.chef}</p>
          <p className="text-lg font-semibold text-primary-600">${item.price.toFixed(2)}</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
              className="p-2 hover:bg-gray-100 transition-colors duration-200"
            >
              <Minus className="h-4 w-4 text-gray-600" />
            </button>
            <span className="px-4 py-2 text-gray-900 font-medium min-w-[3rem] text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="p-2 hover:bg-gray-100 transition-colors duration-200"
            >
              <Plus className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          <button
            onClick={() => onRemove(item.id)}
            className="p-2 text-danger-600 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors duration-200"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default CartPage