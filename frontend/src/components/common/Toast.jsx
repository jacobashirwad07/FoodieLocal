import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for fade out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-danger-600" />
      case 'info':
        return <Info className="h-5 w-5 text-primary-600" />
      default:
        return <CheckCircle className="h-5 w-5 text-success-600" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-success-50 border-success-200'
      case 'error':
        return 'bg-danger-50 border-danger-200'
      case 'info':
        return 'bg-primary-50 border-primary-200'
      default:
        return 'bg-success-50 border-success-200'
    }
  }

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-success-800'
      case 'error':
        return 'text-danger-800'
      case 'info':
        return 'text-primary-800'
      default:
        return 'text-success-800'
    }
  }

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        max-w-sm w-full ${getBackgroundColor()} border rounded-lg shadow-lg p-4
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className={`text-sm font-medium ${getTextColor()}`}>
            {message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(onClose, 300)
            }}
            className={`inline-flex ${getTextColor()} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Toast