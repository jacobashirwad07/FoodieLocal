const LoadingSpinner = ({ size = 'md', text = 'Loading...', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className={`${sizeClasses[size]} border-4 border-primary-600 border-t-transparent rounded-full animate-spin`}></div>
      {text && (
        <p className={`${textSizeClasses[size]} text-gray-600 font-medium`}>
          {text}
        </p>
      )}
    </div>
  )
}

// Inline loading spinner for buttons
export const ButtonSpinner = ({ className = '' }) => (
  <div className={`w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ${className}`}></div>
)

// Full page loading overlay
export const PageLoader = ({ text = 'Loading...' }) => (
  <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
    <LoadingSpinner size="xl" text={text} />
  </div>
)

// Card loading skeleton
export const CardSkeleton = () => (
  <div className="card animate-pulse">
    <div className="h-48 bg-gray-200 rounded-t-xl"></div>
    <div className="p-6 space-y-4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-200 rounded w-20"></div>
        <div className="h-8 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  </div>
)

export default LoadingSpinner