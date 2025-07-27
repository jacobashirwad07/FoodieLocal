import { Shield, Users, ChefHat, Package, BarChart3, Settings, AlertTriangle, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const AdminPanel = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Monitor and manage the FoodieLocal platform</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">2,847</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <ChefHat className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Chefs</p>
                <p className="text-2xl font-bold text-gray-900">156</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Orders Today</p>
                <p className="text-2xl font-bold text-gray-900">342</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chef Approvals */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Chef Approvals</h2>
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                3 Pending
              </span>
            </div>
            <div className="text-center py-12">
              <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chef approval system coming soon</h3>
              <p className="text-gray-600 mb-4">
                Review and approve new chef applications with document verification.
              </p>
              <div className="text-sm text-gray-500">
                <p>Features will include:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Document verification</li>
                  <li>• Background checks</li>
                  <li>• Kitchen license validation</li>
                  <li>• Approval workflow</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Order Monitoring */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Order Monitoring</h2>
              <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                View All
              </button>
            </div>
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Order monitoring coming soon</h3>
              <p className="text-gray-600 mb-4">
                Monitor all orders across the platform in real-time.
              </p>
              <div className="text-sm text-gray-500">
                <p>Features will include:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Real-time order tracking</li>
                  <li>• Issue resolution</li>
                  <li>• Performance metrics</li>
                  <li>• Customer support tools</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Admin Features */}
        <div className="mt-8 space-y-8">
          {/* User Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">User Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">User Accounts</h3>
                <p className="text-sm text-gray-600">Manage customer and chef accounts, handle suspensions and verifications.</p>
              </div>
              
              <div className="text-center p-4">
                <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Dispute Resolution</h3>
                <p className="text-sm text-gray-600">Handle customer complaints, refund requests, and order disputes.</p>
              </div>
              
              <div className="text-center p-4">
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Quality Control</h3>
                <p className="text-sm text-gray-600">Monitor food quality, safety standards, and customer satisfaction.</p>
              </div>
            </div>
          </div>

          {/* Analytics & Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <BarChart3 className="h-6 w-6 text-primary-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
              </div>
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  Comprehensive analytics and reporting tools for platform insights.
                </p>
                <div className="text-sm text-gray-500">
                  <ul className="space-y-1">
                    <li>• Revenue analytics</li>
                    <li>• User engagement metrics</li>
                    <li>• Chef performance reports</li>
                    <li>• Geographic insights</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <Settings className="h-6 w-6 text-primary-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
              </div>
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  Configure platform settings, fees, and operational parameters.
                </p>
                <div className="text-sm text-gray-500">
                  <ul className="space-y-1">
                    <li>• Commission rates</li>
                    <li>• Delivery zones</li>
                    <li>• Payment settings</li>
                    <li>• Notification preferences</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel