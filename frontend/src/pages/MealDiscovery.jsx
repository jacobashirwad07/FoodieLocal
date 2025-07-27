import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, MapPin, Clock, Star, Heart, Plus } from 'lucide-react'
import LoadingSpinner, { CardSkeleton } from '../components/common/LoadingSpinner'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'

const MealDiscovery = () => {
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCuisine, setSelectedCuisine] = useState('')
  const [selectedDietary, setSelectedDietary] = useState('')
  const [sortBy, setSortBy] = useState('rating')
  const { addToCart } = useCart()
  const { showSuccess, showError } = useToast()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Mock data for demonstration
  const mockMeals = [
    {
      id: 1,
      name: 'Butter Chicken with Basmati Rice',
      description: 'Creamy and rich butter chicken served with fragrant basmati rice and naan bread',
      price: 18.99,
      chef: {
        name: 'Priya Sharma',
        rating: 4.8,
        specialties: ['Indian', 'Vegetarian']
      },
      cuisine: 'Indian',
      preparationTime: 45,
      rating: 4.9,
      reviewCount: 127,
      image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400',
      dietaryTags: ['Gluten-Free'],
      distance: 0.8,
      isAvailable: true
    },
    {
      id: 2,
      name: 'Homemade Margherita Pizza',
      description: 'Wood-fired pizza with fresh mozzarella, basil, and San Marzano tomatoes',
      price: 16.50,
      chef: {
        name: 'Marco Rossi',
        rating: 4.7,
        specialties: ['Italian', 'Pizza']
      },
      cuisine: 'Italian',
      preparationTime: 30,
      rating: 4.6,
      reviewCount: 89,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
      dietaryTags: ['Vegetarian'],
      distance: 1.2,
      isAvailable: true
    },
    {
      id: 3,
      name: 'Korean BBQ Bowl',
      description: 'Marinated bulgogi beef with steamed rice, kimchi, and fresh vegetables',
      price: 22.00,
      chef: {
        name: 'Kim Min-jun',
        rating: 4.9,
        specialties: ['Korean', 'BBQ']
      },
      cuisine: 'Korean',
      preparationTime: 35,
      rating: 4.8,
      reviewCount: 156,
      image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400',
      dietaryTags: ['Gluten-Free'],
      distance: 2.1,
      isAvailable: true
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMeals(mockMeals)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredMeals = meals.filter(meal => {
    const matchesSearch = meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meal.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCuisine = !selectedCuisine || meal.cuisine === selectedCuisine
    const matchesDietary = !selectedDietary || meal.dietaryTags.includes(selectedDietary)
    
    return matchesSearch && matchesCuisine && matchesDietary
  })

  const sortedMeals = [...filteredMeals].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'distance':
        return a.distance - b.distance
      case 'time':
        return a.preparationTime - b.preparationTime
      default:
        return 0
    }
  })

  const handleAddToCart = (meal) => {
    if (!isAuthenticated) {
      showError('Please login to add items to cart')
      navigate('/login')
      return
    }

    try {
      addToCart({
        id: meal.id,
        name: meal.name,
        price: meal.price,
        chef: meal.chef.name,
        image: meal.image,
        quantity: 1
      })
      showSuccess(`${meal.name} added to cart!`)
    } catch (error) {
      console.error('Error adding to cart:', error)
      showError('Failed to add item to cart')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Local Meals</h1>
          <p className="text-gray-600">Fresh home-cooked meals from talented chefs in your area</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search meals, cuisines, or chefs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {/* Cuisine Filter */}
            <select
              value={selectedCuisine}
              onChange={(e) => setSelectedCuisine(e.target.value)}
              className="input-field"
            >
              <option value="">All Cuisines</option>
              <option value="Indian">Indian</option>
              <option value="Italian">Italian</option>
              <option value="Korean">Korean</option>
              <option value="Mexican">Mexican</option>
              <option value="Chinese">Chinese</option>
            </select>

            {/* Dietary Filter */}
            <select
              value={selectedDietary}
              onChange={(e) => setSelectedDietary(e.target.value)}
              className="input-field"
            >
              <option value="">All Dietary</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Gluten-Free">Gluten-Free</option>
              <option value="Keto">Keto</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field"
            >
              <option value="rating">Highest Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="distance">Nearest First</option>
              <option value="time">Fastest Prep</option>
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : sortedMeals.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No meals found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing {sortedMeals.length} meal{sortedMeals.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedMeals.map((meal) => (
                <MealCard 
                  key={meal.id} 
                  meal={meal} 
                  onAddToCart={() => handleAddToCart(meal)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const MealCard = ({ meal, onAddToCart }) => {
  const [isFavorite, setIsFavorite] = useState(false)
  const { isAuthenticated } = useAuth()

  return (
    <div className="card card-hover">
      <div className="relative">
        <img 
          src={meal.image} 
          alt={meal.name}
          className="w-full h-48 object-cover"
        />
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className={`absolute top-3 right-3 p-2 rounded-full transition-colors duration-200 ${
            isFavorite 
              ? 'bg-danger-600 text-white' 
              : 'bg-white text-gray-600 hover:text-danger-600'
          }`}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
        <div className="absolute top-3 left-3">
          <span className="badge badge-success">{meal.cuisine}</span>
        </div>
        {!meal.isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-white text-gray-900 px-3 py-1 rounded-full text-sm font-medium">
              Currently Unavailable
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {meal.name}
          </h3>
          <span className="text-xl font-bold text-primary-600 ml-2">
            ${meal.price}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {meal.description}
        </p>

        <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="font-medium">{meal.rating}</span>
            <span>({meal.reviewCount})</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{meal.preparationTime} min</span>
          </div>
          <div className="flex items-center space-x-1">
            <MapPin className="h-4 w-4" />
            <span>{meal.distance} mi</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 text-xs font-semibold">
                {meal.chef.name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{meal.chef.name}</p>
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="text-xs text-gray-500">{meal.chef.rating}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {meal.dietaryTags.map((tag) => (
            <span key={tag} className="badge badge-primary text-xs">
              {tag}
            </span>
          ))}
        </div>

        <button
          onClick={onAddToCart}
          disabled={!meal.isAvailable}
          className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-2" />
          {isAuthenticated ? 'Add to Cart' : 'Login to Add to Cart'}
        </button>
      </div>
    </div>
  )
}

export default MealDiscovery