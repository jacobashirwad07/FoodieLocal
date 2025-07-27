import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-6xl font-bold text-primary-600 mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        <div className="space-y-4">
          <Link 
            to="/"
            className="btn btn-primary w-full"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Home
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="btn btn-outline w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
          
          <Link 
            to="/meals"
            className="btn btn-outline w-full"
          >
            <Search className="h-4 w-4 mr-2" />
            Browse Meals
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>If you believe this is an error, please contact our support team.</p>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage