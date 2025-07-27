import { ChefHat, Plus, Package, DollarSign, Star, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const ChefDashboard = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">Manage your kitchen and orders from your dashboard</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-primary-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Orders</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-success-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Earnings</p>
                <p className="text-2xl font-bold text-gray-900">$248</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-warning-100 p-3 rounded-lg">
                <Star className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rating</p>
                <p className="text-2xl font-bold text-gray-900">4.8</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Prep Time</p>
                <p className="text-2xl font-bold text-gray-900">35m</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Menu Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Menu Management</h2>
              <button className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Meal
              </button>
            </div>
            <div className="text-center py-12">
              <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Menu management coming soon</h3>
              <p className="text-gray-600 mb-4">
                You'll be able to add, edit, and manage your daily meal offerings here.
              </p>
              <div className="text-sm text-gray-500">
                <p>Features will include:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Add new meals with photos</li>
                  <li>• Set availability and pricing</li>
                  <li>• Manage dietary tags</li>
                  <li>• Track meal performance</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Order Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
              <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                View All
              </button>
            </div>
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Order management coming soon</h3>
              <p className="text-gray-600 mb-4">
                Track and manage incoming orders in real-time.
              </p>
              <div className="text-sm text-gray-500">
                <p>Features will include:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Real-time order notifications</li>
                  <li>• Order status updates</li>
                  <li>• Customer communication</li>
                  <li>• Delivery coordination</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Features */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Coming Soon</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Earnings Analytics</h3>
              <p className="text-sm text-gray-600">Track your daily, weekly, and monthly earnings with detailed analytics.</p>
            </div>
            
            <div className="text-center p-4">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Star className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Customer Reviews</h3>
              <p className="text-sm text-gray-600">View and respond to customer reviews and feedback.</p>
            </div>
            
            <div className="text-center p-4">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ChefHat className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Profile Management</h3>
              <p className="text-sm text-gray-600">Update your chef profile, specialties, and service area.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChefDashboard