import { ShoppingCart } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'

const CartIcon = ({ className = '' }) => {
  const { getTotalItems } = useCart()
  const itemCount = getTotalItems()

  return (
    <div className={`relative ${className}`}>
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </div>
  )
}

export default CartIcon