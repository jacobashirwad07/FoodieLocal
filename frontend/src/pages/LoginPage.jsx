import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, ChefHat, User, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState('customer')
  
  const { login, loading, error } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const from = location.state?.from?.pathname || '/'

  // Dummy login credentials for different roles
  const dummyCredentials = {
    customer: {
      email: 'customer@demo.com',
      password: 'customer123',
      user: { id: 1, name: 'John Customer', email: 'customer@demo.com', role: 'customer' }
    },
    chef: {
      email: 'chef@demo.com',
      password: 'chef123',
      user: { id: 2, name: 'Maria Chef', email: 'chef@demo.com', role: 'chef' }
    },
    admin: {
      email: 'admin@demo.com',
      password: 'admin123',
      user: { id: 3, name: 'Admin User', email: 'admin@demo.com', role: 'admin' }
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Check dummy credentials
      const roleCredentials = dummyCredentials[selectedRole]
      if (formData.email === roleCredentials.email && formData.password === roleCredentials.password) {
        await login({
          email: formData.email,
          password: formData.password,
          user: roleCredentials.user
        })
        navigate(from, { replace: true })
      } else {
        throw new Error('Invalid credentials')
      }
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  const handleDemoLogin = async (role) => {
    const credentials = dummyCredentials[role]
    setFormData({
      email: credentials.email,
      password: credentials.password
    })
    setSelectedRole(role)
    
    try {
      await login({
        email: credentials.email,
        password: credentials.password,
        user: credentials.user
      })
      navigate(from, { replace: true })
    } catch (error) {
      console.error('Demo login failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <ChefHat className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
            >
              create a new account
            </Link>
          </p>
        </div>

        {/* Demo Login Cards */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 text-center">Quick Demo Login</h3>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleDemoLogin('customer')}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Login as Customer
            </button>
            <button
              onClick={() => handleDemoLogin('chef')}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              <ChefHat className="h-5 w-5 mr-2 text-green-600" />
              Login as Chef
            </button>
            <button
              onClick={() => handleDemoLogin('admin')}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              <Shield className="h-5 w-5 mr-2 text-purple-600" />
              Login as Admin
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <LoadingSpinner size="sm" text="" className="text-white" />
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>


      </div>
    </div>
  )
}

export default LoginPage