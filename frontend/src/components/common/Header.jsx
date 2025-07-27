import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const { getTotalItems } = useCart()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const cartItemCount = getTotalItems()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">👨‍🍳</span>
            <span className="text-xl font-bold text-gray-900">FoodieLocal</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="flex items-center space-x-8">
            <Link 
              to="/meals" 
              className="text-gray-700 font-medium transition-colors duration-200 hover\\:text-primary-600"
            >
              Browse Meals
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to="/cart" 
                  className="relative flex items-center space-x-1 text-gray-700 font-medium transition-colors duration-200 hover\\:text-primary-600"
                >
                  <span className="text-xl">🛒</span>
                  <span>Cart</span>
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-sm rounded-full w-5 h-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
                
                <Link 
                  to="/orders" 
                  className="text-gray-700 font-medium transition-colors duration-200 hover\\:text-primary-600"
                >
                  My Orders
                </Link>
                
                {user?.role === 'chef' && (
                  <Link 
                    to="/chef-dashboard" 
                    className="flex items-center space-x-1 text-gray-700 font-medium transition-colors duration-200 hover\\:text-primary-600"
                  >
                    <span className="text-lg">👨‍🍳</span>
                    <span>Dashboard</span>
                  </Link>
                )}
                
                {user?.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="flex items-center space-x-1 text-gray-700 font-medium transition-colors duration-200 hover\\:text-primary-600"
                  >
                    <span className="text-lg">⚙️</span>
                    <span>Admin</span>
                  </Link>
                )}
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">👤</span>
                    <span className="text-sm text-gray-700">{user?.name}</span>
                  </div>
                  <button 
                    onClick={logout}
                    className="btn btn-danger text-sm"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-gray-700 font-medium transition-colors duration-200 hover\\:text-primary-600"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn-primary"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-gray-700 transition-colors duration-200 hover\\:text-primary-600 hover\\:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <span className="text-xl">✕</span>
              ) : (
                <span className="text-xl">☰</span>
              )}
            </button>
          </nav>
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