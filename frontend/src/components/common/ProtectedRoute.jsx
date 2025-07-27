import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'
import { Lock, AlertTriangle } from 'lucide-react'

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <AlertTriangle className="h-16 w-16 text-warning-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-2">
              You don't have permission to access this page.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Required role:</span> {requiredRole}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Your role:</span> {user?.role || 'Unknown'}
              </p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => window.history.back()}
                className="btn btn-primary w-full"
              >
                Go Back
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="btn btn-outline w-full"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute