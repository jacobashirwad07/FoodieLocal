import { createContext, useContext, useReducer, useEffect } from 'react'

const CartContext = createContext()

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM':
      const existingItem = state.items.find(item => item.id === action.payload.id)
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        }
      }
      return {
        ...state,
        items: [...state.items, action.payload]
      }
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      }
    
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      }
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      }
    
    case 'SET_DELIVERY_ADDRESS':
      return {
        ...state,
        deliveryAddress: action.payload
      }
    
    case 'SET_DELIVERY_TYPE':
      return {
        ...state,
        deliveryType: action.payload
      }
    
    default:
      return state
  }
}

const initialState = {
  items: [],
  deliveryAddress: null,
  deliveryType: 'delivery'
}

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      const cartData = JSON.parse(savedCart)
      cartData.items.forEach(item => {
        dispatch({ type: 'ADD_ITEM', payload: item })
      })
      if (cartData.deliveryAddress) {
        dispatch({ type: 'SET_DELIVERY_ADDRESS', payload: cartData.deliveryAddress })
      }
      if (cartData.deliveryType) {
        dispatch({ type: 'SET_DELIVERY_TYPE', payload: cartData.deliveryType })
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state))
  }, [state])

  const addItem = (item) => {
    dispatch({ type: 'ADD_ITEM', payload: item })
  }

  const removeItem = (id) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id })
  }

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeItem(id)
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } })
    }
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  const setDeliveryAddress = (address) => {
    dispatch({ type: 'SET_DELIVERY_ADDRESS', payload: address })
  }

  const setDeliveryType = (type) => {
    dispatch({ type: 'SET_DELIVERY_TYPE', payload: type })
  }

  const getTotalPrice = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0)
  }

  const value = {
    ...state,
    cartItems: state.items, // Alias for compatibility
    addItem,
    addToCart: addItem, // Alias for compatibility
    removeItem,
    removeFromCart: removeItem, // Alias for compatibility
    updateQuantity,
    clearCart,
    setDeliveryAddress,
    setDeliveryType,
    getTotalPrice,
    getTotalItems
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}