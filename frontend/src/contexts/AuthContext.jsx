import { createContext, useContext, useReducer, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null }
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        isAuthenticated: true, 
        user: action.payload.user,
        token: action.payload.token,
        error: null 
      }
    case 'LOGIN_FAILURE':
      return { 
        ...state, 
        loading: false, 
        isAuthenticated: false, 
        user: null,
        token: null,
        error: action.payload 
      }
    case 'LOGOUT':
      return { 
        ...state, 
        isAuthenticated: false, 
        user: null,
        token: null,
        loading: false,
        error: null 
      }
    case 'SET_USER':
      return { ...state, user: action.payload }
    default:
      return state
  }
}

const initialState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { user, token } 
        })
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  }, [])

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' })
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Use provided user data or create default
      const user = credentials.user || { 
        id: 1, 
        name: 'Test User', 
        email: credentials.email,
        role: 'customer' 
      }
      const token = `demo-token-${user.id}-${Date.now()}`
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { user, token } 
      })
      
      return { user, token }
    } catch (error) {
      dispatch({ 
        type: 'LOGIN_FAILURE', 
        payload: error.message || 'Login failed' 
      })
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
    dispatch({ type: 'LOGOUT' })
  }

  const register = async (userData) => {
    dispatch({ type: 'LOGIN_START' })
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const user = {
        ...userData,
        id: userData.id || Date.now()
      }
      const token = `demo-token-${user.id}-${Date.now()}`
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { user, token } 
      })
      
      return { user, token }
    } catch (error) {
      dispatch({ 
        type: 'LOGIN_FAILURE', 
        payload: error.message || 'Registration failed' 
      })
      throw error
    }
  }

  const value = {
    ...state,
    login,
    logout,
    register
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}