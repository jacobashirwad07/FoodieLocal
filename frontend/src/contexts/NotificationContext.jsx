import { createContext, useContext, useReducer } from 'react'

const NotificationContext = createContext()

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, { ...action.payload, id: Date.now() }]
      }
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(notification => notification.id !== action.payload)
      }
    
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: []
      }
    
    default:
      return state
  }
}

const initialState = {
  notifications: []
}

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState)

  const addNotification = (notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
    
    // Auto-remove notification after 5 seconds
    if (notification.type !== 'error') {
      setTimeout(() => {
        removeNotification(notification.id || Date.now())
      }, 5000)
    }
  }

  const removeNotification = (id) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
  }

  const clearNotifications = () => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' })
  }

  const showSuccess = (message) => {
    addNotification({ type: 'success', message })
  }

  const showError = (message) => {
    addNotification({ type: 'error', message })
  }

  const showInfo = (message) => {
    addNotification({ type: 'info', message })
  }

  const showWarning = (message) => {
    addNotification({ type: 'warning', message })
  }

  const value = {
    ...state,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showInfo,
    showWarning
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}