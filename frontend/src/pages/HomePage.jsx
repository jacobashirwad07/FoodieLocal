import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const HomePage = () => {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Uber Eats Style */}
      <section className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[600px] py-16">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-6xl font-black text-black leading-tight">
                  Order food to your door
                </h1>
                <p className="text-xl text-gray-600 max-w-lg">
                  Discover amazing home-cooked meals from talented local chefs in your neighborhood. Fresh ingredients, authentic flavors.
                </p>
              </div>

              {/* Address Input */}
              <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📍</span>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Enter delivery address"
                          className="w-full text-lg font-medium text-gray-900 placeholder-gray-500 border-none outline-none bg-transparent"
                          defaultValue="New York, NY"
                        />
                        <p className="text-sm text-gray-500 mt-1">Deliver now</p>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/meals"
                    className="btn btn-success px-8 py-3 text-lg font-semibold whitespace-nowrap"
                  >
                    Find food
                  </Link>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/meals"
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full transition-colors"
                >
                  <span className="text-lg">🍕</span>
                  <span className="text-sm font-medium text-gray-700">Pizza</span>
                </Link>
                <Link
                  to="/meals"
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full transition-colors"
                >
                  <span className="text-lg">🍔</span>
                  <span className="text-sm font-medium text-gray-700">Burgers</span>
                </Link>
                <Link
                  to="/meals"
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full transition-colors"
                >
                  <span className="text-lg">🍜</span>
                  <span className="text-sm font-medium text-gray-700">Asian</span>
                </Link>
                <Link
                  to="/meals"
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full transition-colors"
                >
                  <span className="text-lg">🥗</span>
                  <span className="text-sm font-medium text-gray-700">Healthy</span>
                </Link>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-green-400 to-green-600 rounded-3xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600&h=600&fit=crop&crop=center"
                  alt="Delicious food"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating Cards */}
              <div className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-xl p-4 max-w-xs">
                <div className="flex items-center space-x-3">
                  <img
                    src="https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=60&h=60&fit=crop&crop=center"
                    alt="Food"
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Margherita Pizza</p>
                    <p className="text-sm text-gray-500">⭐ 4.8 • 25-35 min</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl p-4 max-w-xs">
                <div className="flex items-center space-x-3">
                  <img
                    src="https://images.unsplash.com/photo-1546793665-c74683f339c1?w=60&h=60&fit=crop&crop=center"
                    alt="Food"
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Caesar Salad</p>
                    <p className="text-sm text-gray-500">⭐ 4.9 • 15-25 min</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-black mb-4">
              What's on your mind?
            </h2>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-8 gap-6">
            {[
              { emoji: '🍕', name: 'Pizza', color: 'bg-red-100' },
              { emoji: '🍔', name: 'Burgers', color: 'bg-yellow-100' },
              { emoji: '🍜', name: 'Noodles', color: 'bg-orange-100' },
              { emoji: '🥗', name: 'Salads', color: 'bg-green-100' },
              { emoji: '🍛', name: 'Biryani', color: 'bg-purple-100' },
              { emoji: '🌮', name: 'Mexican', color: 'bg-pink-100' },
              { emoji: '🍣', name: 'Sushi', color: 'bg-blue-100' },
              { emoji: '🍰', name: 'Desserts', color: 'bg-indigo-100' },
            ].map((category, index) => (
              <Link
                key={index}
                to="/meals"
                className="group flex flex-col items-center space-y-3 p-4 hover:scale-105 transition-transform duration-200"
              >
                <div className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center group-hover:shadow-lg transition-shadow`}>
                  <span className="text-2xl">{category.emoji}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Restaurants */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-black mb-4">
              Popular near you
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Maria's Kitchen",
                cuisine: 'Italian • Pizza',
                rating: '4.8',
                time: '25-35 min',
                image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
                badge: 'Free delivery'
              },
              {
                name: "Spice Garden",
                cuisine: 'Indian • Curry',
                rating: '4.9',
                time: '30-40 min',
                image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
                badge: 'Promoted'
              },
              {
                name: "Fresh Bowl Co.",
                cuisine: 'Healthy • Salads',
                rating: '4.7',
                time: '15-25 min',
                image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop',
                badge: 'New'
              }
            ].map((restaurant, index) => (
              <Link
                key={index}
                to="/meals"
                className="group bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="relative">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-white px-2 py-1 rounded-full text-xs font-semibold text-gray-700">
                    {restaurant.badge}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{restaurant.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{restaurant.cuisine}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-400">⭐</span>
                      <span className="font-medium">{restaurant.rating}</span>
                    </div>
                    <span className="text-gray-500">{restaurant.time}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* App Download Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-black text-black">
                Get the FoodieLocal app
              </h2>
              <p className="text-xl text-gray-600">
                Order faster and easier with our mobile app. Get exclusive deals and track your orders in real-time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex items-center space-x-3 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors">
                  <span className="text-2xl">📱</span>
                  <div className="text-left">
                    <div className="text-xs text-gray-300">Download on the</div>
                    <div className="font-semibold">App Store</div>
                  </div>
                </button>
                <button className="flex items-center space-x-3 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors">
                  <span className="text-2xl">🤖</span>
                  <div className="text-left">
                    <div className="text-xs text-gray-300">Get it on</div>
                    <div className="font-semibold">Google Play</div>
                  </div>
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-3xl p-8 text-center">
                <div className="text-6xl mb-4">📱</div>
                <div className="text-white text-xl font-bold">Download Now</div>
                <div className="text-green-100 text-sm mt-2">Available on iOS & Android</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chef CTA Section */}
      <section className="py-16 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-black">
                Earn money as a chef
              </h2>
              <p className="text-xl text-gray-300">
                Share your culinary passion and earn money by cooking for your neighbors. Join our community of talented home chefs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="btn btn-success px-8 py-3 text-lg font-semibold">
                  Get started
                </Link>
                <button className="btn btn-ghost text-white border border-gray-600 px-8 py-3 text-lg font-semibold">
                  Learn more
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-3xl p-8 text-center">
                <div className="text-6xl mb-4">👨‍🍳</div>
                <div className="text-white text-xl font-bold">Start Cooking</div>
                <div className="text-green-100 text-sm mt-2">Turn your passion into profit</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage