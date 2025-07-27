import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

// Mock the contexts to avoid provider errors in tests
vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn()
  })
}))

vi.mock('./contexts/CartContext', () => ({
  CartProvider: ({ children }) => children,
  useCart: () => ({
    items: [],
    getTotalItems: () => 0,
    getTotalPrice: () => 0,
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn()
  })
}))

vi.mock('./contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }) => children,
  useNotification: () => ({
    notifications: [],
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn()
  })
}))

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    
    // Check if the header is rendered
    expect(screen.getByText('FoodDelivery')).toBeInTheDocument()
  })

  it('renders the main navigation', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    
    // Check if navigation links are present (using getAllByText since there are multiple instances)
    expect(screen.getAllByText('Browse Meals')).toHaveLength(3) // Header, hero, footer
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Register')).toBeInTheDocument()
  })
})