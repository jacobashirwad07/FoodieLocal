import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const { getTotalItems } = useCart()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const location = useLocation()

  const cartItemCount = getTotalItems()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const isActive = (path) => location.pathname === path

  return (
    <header className="bg-white sticky top-0 z-50" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">F</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-black">FoodieLocal</span>
              <span className="text-xs text-gray-500 -mt-1 hidden sm:block">Hyperlocal Food Delivery</span>
            </div>
          </Link>

          {/* Location Selector */}
          <div className="hidden lg:flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full cursor-pointer hover:bg-gray-100 transition-colors">
            <span className="text-lg">📍</span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900">New York, NY</span>
              <span className="text-xs text-gray-500">Deliver now</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/meals" 
              className={`text-sm font-semibold transition-colors duration-200 ${
                isActive('/meals') ? 'text-black border-b-2 border-black pb-1' : 'text-gray-600 hover:text-black'
              }`}
            >
              Browse
            </Link>
            
            {isAuthenticated && (
              <Link 
                to="/orders" 
                className={`text-sm font-semibold transition-colors duration-200 ${
                  isActive('/orders') ? 'text-black border-b-2 border-black pb-1' : 'text-gray-600 hover:text-black'
                }`}
              >
                Orders
              </Link>
            )}
            
            {user?.role === 'chef' && (
              <Link 
                to="/chef-dashboard" 
                className={`text-sm font-semibold transition-colors duration-200 ${
                  isActive('/chef-dashboard') ? 'text-black border-b-2 border-black pb-1' : 'text-gray-600 hover:text-black'
                }`}
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            {isAuthenticated && (
              <Link to="/cart" className="relative p-3 hover:bg-gray-50 rounded-full transition-colors duration-200">
                <span className="text-2xl">🛒</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            )}

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-full transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-lg">👤</span>
                  </div>
                  <span className="hidden sm:block text-sm font-semibold text-gray-900">{user?.name}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl py-2 z-50 border border-gray-100">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="font-semibold text-gray-900">{user?.name}</div>
                      <div className="text-sm text-gray-500 capitalize">{user?.role}</div>
                    </div>
                    <Link
                      to="/orders"
                      className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Your orders
                    </Link>
                    {user?.role === 'chef' && (
                      <Link
                        to="/chef-dashboard"
                        className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Manage store
                      </Link>
                    )}
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Admin panel
                      </Link>
                    )}
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={() => {
                          logout()
                          setIsUserMenuOpen(false)
                        }}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-gray-700 hover:text-black transition-colors duration-200 px-4 py-2"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary text-sm font-semibold"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-gray-700 transition-colors duration-200 hover:text-black hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <span className="text-xl">✕</span>
              ) : (
                <span className="text-xl">☰</span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="py-4 border-t border-gray-200 animate-slide-up">
            <div className="flex flex-col space-y-4">
              <Link 
                to="/meals" 
                className="text-gray-700 font-medium transition-colors duration-200 hover\\:text-primary-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Browse Meals
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/cart" 
                    className="flex items-center space-x-2 text-gray-700 font-medium transition-colors duration-200 hover\\:text-primary-600"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="text-xl">🛒</span>
                    <span>Cart ({cartItemCount})</span>
                  </Link>
                  
                  <Link 
                    to="/orders" 
                    className="text-gray-700 font-medium transition-colors duration-200 hover\\:text-primary-600"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  
                  {user?.role === 'chef' && (
                    <Link 
                      to="/chef-dashboard" 
                      className="flex items-center space-x-2 text-gray-700 font-medium transition-colors duration-200 hover\\:text-primary-600"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="text-lg">👨‍🍳</span>
                      <span>Chef Dashboard</span>
                    </Link>
                  )}
                  
                  {user?.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      className="flex items-center space-x-2 text-gray-700 font-medium transition-colors duration-200 hover\\:text-primary-600"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="text-lg">⚙️</span>
                      <span>Admin Panel</span>
                    </Link>
                  )}
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-lg">👤</span>
                      <span className="text-sm text-gray-700">{user?.name}</span>
                    </div>
                    <button 
                      onClick={() => {
                        logout()
                        setIsMobileMenuOpen(false)
                      }}
                      className="btn btn-danger w-full"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col space-y-3 pt-4 border-t border-gray-200">
                  <Link 
                    to="/login" 
                    className="text-gray-700 font-medium transition-colors duration-200 hover\\:text-primary-600"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="btn btn-primary w-full"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header