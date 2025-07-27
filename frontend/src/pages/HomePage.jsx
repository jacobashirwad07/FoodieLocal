import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const HomePage = () => {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-400 rounded-full opacity-10 -translate-y-48 translate-x-48"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-400 rounded-full opacity-10 translate-y-40 -translate-x-40"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white rounded-full opacity-5 -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-32 text-center">
          {/* Main heading with enhanced typography */}
          <div className="mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              <span className="block bg-gradient-to-r from-white to-primary-100 bg-clip-text text-transparent">
                Fresh Home-Cooked
              </span>
              <span className="block text-4xl md:text-6xl font-light text-primary-100 mt-4 tracking-wide">
                Meals from Local Chefs
              </span>
            </h1>
            
            {/* Decorative line */}
            <div className="w-24 h-1 bg-gradient-to-r from-primary-200 to-white mx-auto mb-8 rounded-full"></div>
          </div>
          
          {/* Enhanced subtitle */}
          <p className="text-xl md:text-2xl text-primary-100 max-w-4xl mx-auto leading-relaxed mb-12 animate-slide-up font-light">
            Discover amazing home-cooked meals from talented chefs in your neighborhood. 
            <span className="block mt-2 text-lg md:text-xl text-primary-200">
              Authentic flavors, fresh ingredients, delivered to your door.
            </span>
          </p>
          
          {/* Enhanced CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up">
            {!isAuthenticated ? (
              <>
                <Link 
                  to="/meals" 
                  className="group btn bg-white text-primary-600 hover:bg-primary-50 px-10 py-5 text-lg font-semibold shadow-2xl transform hover:scale-105 transition-all duration-300 rounded-full"
                >
                  <span className="flex items-center">
                    <span className="text-2xl mr-3">🍽️</span>
                    Browse Meals
                    <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </span>
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn-outline border-2 border-white text-white hover:bg-white hover:text-primary-600 px-10 py-5 text-lg font-semibold rounded-full transition-all duration-300"
                >
                  <span className="flex items-center">
                    <span className="text-2xl mr-3">✨</span>
                    Join Now
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/meals" 
                  className="group btn bg-white text-primary-600 hover:bg-primary-50 px-10 py-5 text-lg font-semibold shadow-2xl transform hover:scale-105 transition-all duration-300 rounded-full"
                >
                  <span className="flex items-center">
                    <span className="text-2xl mr-3">🍽️</span>
                    Browse Meals
                    <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </span>
                </Link>
                {user?.role === 'chef' ? (
                  <Link 
                    to="/chef-dashboard" 
                    className="btn btn-outline border-2 border-white text-white hover:bg-white hover:text-primary-600 px-10 py-5 text-lg font-semibold rounded-full transition-all duration-300"
                  >
                    <span className="flex items-center">
                      <span className="text-2xl mr-3">👨‍🍳</span>
                      Chef Dashboard
                    </span>
                  </Link>
                ) : (
                  <Link 
                    to="/orders" 
                    className="btn btn-outline border-2 border-white text-white hover:bg-white hover:text-primary-600 px-10 py-5 text-lg font-semibold rounded-full transition-all duration-300"
                  >
                    <span className="flex items-center">
                      <span className="text-2xl mr-3">📋</span>
                      My Orders
                    </span>
                  </Link>
                )}
              </>
            )}
          </div>
          
          {/* Trust indicators */}
          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-primary-200 animate-slide-up">
            <div className="flex items-center space-x-2">
              <span className="text-xl">⭐</span>
              <span className="text-sm font-medium">4.9/5 Rating</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xl">🛡️</span>
              <span className="text-sm font-medium">Verified Chefs</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xl">🚚</span>
              <span className="text-sm font-medium">30min Delivery</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple steps to enjoy delicious home-cooked meals from your neighborhood
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div className="text-center">
              <div className="bg-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Discover</h3>
              <p className="text-gray-600">
                Browse meals from verified home chefs in your area. Filter by cuisine, 
                dietary preferences, and delivery time.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl">❤️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Order</h3>
              <p className="text-gray-600">
                Add your favorite meals to cart, customize your order, and checkout 
                securely with multiple payment options.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl">🚚</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Enjoy</h3>
              <p className="text-gray-600">
                Track your order in real-time and enjoy fresh, home-cooked meals 
                delivered hot to your doorstep.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose FoodieLocal?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the difference of authentic home-cooked meals
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="bg-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">🛡️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Verified Chefs</h3>
              <p className="text-gray-600 text-sm">All chefs are verified and follow strict food safety standards</p>
            </div>

            <div className="text-center">
              <div className="bg-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">⏰</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fresh Daily</h3>
              <p className="text-gray-600 text-sm">Meals prepared fresh daily with the finest ingredients</p>
            </div>

            <div className="text-center">
              <div className="bg-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">⭐</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Top Rated</h3>
              <p className="text-gray-600 text-sm">Highly rated chefs and meals by our community</p>
            </div>

            <div className="text-center">
              <div className="bg-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">💝</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Made with Love</h3>
              <p className="text-gray-600 text-sm">Every meal is prepared with passion and care</p>
            </div>
          </div>
        </div>
      </section>

      {/* Chef CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="text-6xl mb-6">👨‍🍳</div>
            <h2 className="text-3xl font-bold mb-6">
              Are You a Home Chef?
            </h2>
            <p className="text-xl mb-8">
              Share your culinary passion and earn money by cooking for your neighbors. 
              Join our community of talented home chefs and turn your kitchen into a business.
            </p>
            <div className="flex flex-col space-y-4 items-center">
              <Link to="/chef-register" className="btn bg-white text-primary-600 px-8 py-4 text-lg font-semibold">
                Become a Chef
              </Link>
              <Link to="/chef-info" className="btn btn-outline border-white text-white px-8 py-4 text-lg font-semibold">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">500+</div>
              <div className="text-gray-600">Home Chefs</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">10K+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">50K+</div>
              <div className="text-gray-600">Meals Delivered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">25+</div>
              <div className="text-gray-600">Cities</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage