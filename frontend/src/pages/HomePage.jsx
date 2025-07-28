import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const HomePage = () => {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Zomato Style */}
      <section className="relative bg-gradient-to-br from-red-50 to-red-100 overflow-hidden" style={{ background: 'linear-gradient(135deg, #ffebec 0%, #fff5f5 100%)' }}>
        <div className="absolute inset-0 bg-white bg-opacity-60"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
                Discover the best
                <span className="block text-red-600" style={{ color: '#e23744' }}>
                  food & drinks
                </span>
                <span className="block text-4xl lg:text-5xl text-gray-700 font-normal mt-2">
                  in New York
                </span>
              </h1>
            </div>

            {/* Search Bar */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2">
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1 flex items-center px-4 py-3 border-r border-gray-200">
                    <span className="text-red-500 text-xl mr-3" style={{ color: '#e23744' }}>📍</span>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="New York, NY"
                        className="w-full text-lg font-medium text-gray-900 placeholder-gray-500 border-none outline-none bg-transparent"
                      />
                      <p className="text-sm text-gray-500">Location</p>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center px-4 py-3">
                    <span className="text-red-500 text-xl mr-3" style={{ color: '#e23744' }}>🔍</span>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search for restaurant, cuisine or a dish"
                        className="w-full text-lg font-medium text-gray-900 placeholder-gray-500 border-none outline-none bg-transparent"
                      />
                      <p className="text-sm text-gray-500">Restaurant or dish</p>
                    </div>
                  </div>
                  <Link
                    to="/meals"
                    className="btn btn-primary px-8 py-4 text-lg font-medium whitespace-nowrap"
                  >
                    Search
                  </Link>
                </div>
              </div>
            </div>

            {/* Popular Searches */}
            <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
              <span className="text-gray-600 font-medium">Popular:</span>
              {['Pizza', 'Burger', 'Biryani', 'Chinese', 'Desserts'].map((item, index) => (
                <Link
                  key={index}
                  to="/meals"
                  className="text-red-600 hover:text-red-700 font-medium border-b border-red-200 hover:border-red-400 transition-colors"
                  style={{ color: '#e23744' }}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Order Options */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Order Online */}
            <Link to="/meals" className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="aspect-[4/3] bg-gradient-to-br from-red-400 to-red-600" style={{ background: 'linear-gradient(135deg, #e23744 0%, #cb202d 100%)' }}>
                <img
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600&h=400&fit=crop"
                  alt="Order Online"
                  className="w-full h-full object-cover mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-3xl font-bold mb-2">Order Online</h3>
                  <p className="text-lg opacity-90">Stay home and order to your doorstep</p>
                </div>
                <div className="absolute top-6 right-6 text-white text-4xl">
                  🍽️
                </div>
              </div>
            </Link>

            {/* Dining */}
            <Link to="/meals" className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="aspect-[4/3] bg-gradient-to-br from-blue-400 to-blue-600">
                <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop"
                  alt="Dining"
                  className="w-full h-full object-cover mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-3xl font-bold mb-2">Dining</h3>
                  <p className="text-lg opacity-90">View the city's favourite dining venues</p>
                </div>
                <div className="absolute top-6 right-6 text-white text-4xl">
                  🍴
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Collections
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl">
              Explore curated lists of top restaurants, cafes, pubs, and bars in New York, based on trends
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Trending This Week',
                count: '30 Places',
                image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=400&fit=crop',
                gradient: 'from-red-500 to-pink-500'
              },
              {
                title: 'Best of New York',
                count: '52 Places',
                image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=400&fit=crop',
                gradient: 'from-blue-500 to-purple-500'
              },
              {
                title: 'Newly Opened',
                count: '18 Places',
                image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=400&fit=crop',
                gradient: 'from-green-500 to-teal-500'
              },
              {
                title: 'Pure Veg',
                count: '24 Places',
                image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=400&fit=crop',
                gradient: 'from-orange-500 to-red-500'
              }
            ].map((collection, index) => (
              <Link
                key={index}
                to="/meals"
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 aspect-[3/4]"
              >
                <img
                  src={collection.image}
                  alt={collection.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${collection.gradient} opacity-60`}></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-xl font-bold mb-1">{collection.title}</h3>
                  <p className="text-sm opacity-90">{collection.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Restaurants */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Popular restaurants
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Maria's Authentic Italian",
                cuisine: 'Italian, Pizza, Pasta',
                rating: '4.8',
                reviews: '1.2k',
                time: '25-35 min',
                price: '₹₹',
                image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
                offer: '50% OFF up to ₹100',
                promoted: true
              },
              {
                name: "Spice Garden",
                cuisine: 'North Indian, Biryani, Mughlai',
                rating: '4.9',
                reviews: '2.1k',
                time: '30-40 min',
                price: '₹₹₹',
                image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
                offer: 'Free delivery',
                promoted: false
              },
              {
                name: "Fresh Bowl Co.",
                cuisine: 'Healthy Food, Salads, Bowls',
                rating: '4.7',
                reviews: '856',
                time: '15-25 min',
                price: '₹₹',
                image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop',
                offer: '20% OFF',
                promoted: false
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
                  {restaurant.promoted && (
                    <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: '#e23744' }}>
                      PROMOTED
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                    {restaurant.offer}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{restaurant.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{restaurant.cuisine}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <span className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center text-white text-xs">★</span>
                        <span className="font-semibold">{restaurant.rating}</span>
                        <span className="text-gray-500">({restaurant.reviews})</span>
                      </div>
                      <span className="text-gray-500">{restaurant.time}</span>
                    </div>
                    <span className="text-gray-600 font-medium">{restaurant.price}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Get the App */}
      <section className="py-16 bg-red-50" style={{ backgroundColor: '#ffebec' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-gray-900">
                Get the Zomato app
              </h2>
              <p className="text-xl text-gray-600">
                We will send you a link, open it on your phone to download the app
              </p>
              
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input type="radio" name="contact" className="mr-2" defaultChecked />
                    <span className="text-gray-700">Email</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="contact" className="mr-2" />
                    <span className="text-gray-700">Phone</span>
                  </label>
                </div>
                
                <div className="flex gap-3">
                  <input
                    type="email"
                    placeholder="Email"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button className="btn btn-primary px-6 py-3 font-medium">
                    Share App Link
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <p className="text-gray-600 mb-2">Download app from</p>
                <div className="flex gap-4">
                  <button className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                    <span className="text-xl">🍎</span>
                    <div className="text-left text-sm">
                      <div className="text-xs">Download on the</div>
                      <div className="font-semibold">App Store</div>
                    </div>
                  </button>
                  <button className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                    <span className="text-xl">📱</span>
                    <div className="text-left text-sm">
                      <div className="text-xs">Get it on</div>
                      <div className="font-semibold">Google Play</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500&h=600&fit=crop"
                alt="Mobile App"
                className="w-full max-w-md mx-auto rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Partner with us */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Explore options near me
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Add Restaurant */}
            <Link to="/register" className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#ffebec' }}>
                  <span className="text-3xl">🏪</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Add restaurant</h3>
                <p className="text-gray-600">
                  Partner with us and grow your business
                </p>
                <div className="pt-4">
                  <span className="text-red-600 font-semibold group-hover:underline" style={{ color: '#e23744' }}>
                    Learn more →
                  </span>
                </div>
              </div>
            </Link>

            {/* Become a Chef */}
            <Link to="/register" className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#ffebec' }}>
                  <span className="text-3xl">👨‍🍳</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Become a chef</h3>
                <p className="text-gray-600">
                  Cook from home and earn money
                </p>
                <div className="pt-4">
                  <span className="text-red-600 font-semibold group-hover:underline" style={{ color: '#e23744' }}>
                    Get started →
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage