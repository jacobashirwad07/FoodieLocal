import { io } from 'socket.io-client'

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
  }

  connect(token) {
    if (this.socket) {
      this.disconnect()
    }

    const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
    
    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    })

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id)
      this.isConnected = true
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      this.isConnected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      this.isConnected = false
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  // Order tracking events
  onOrderStatusUpdate(callback) {
    if (this.socket) {
      this.socket.on('order_status_update', callback)
    }
  }

  onDeliveryLocationUpdate(callback) {
    if (this.socket) {
      this.socket.on('delivery_location_update', callback)
    }
  }

  // Chef events
  onNewOrder(callback) {
    if (this.socket) {
      this.socket.on('new_order', callback)
    }
  }

  onOrderCancellation(callback) {
    if (this.socket) {
      this.socket.on('order_cancellation', callback)
    }
  }

  // Notification events
  onNotification(callback) {
    if (this.socket) {
      this.socket.on('notification', callback)
    }
  }

  // Emit events
  joinOrderRoom(orderId) {
    if (this.socket) {
      this.socket.emit('join_order_room', orderId)
    }
  }

  leaveOrderRoom(orderId) {
    if (this.socket) {
      this.socket.emit('leave_order_room', orderId)
    }
  }

  updateDeliveryLocation(orderId, location) {
    if (this.socket) {
      this.socket.emit('update_delivery_location', { orderId, location })
    }
  }

  sendMessage(roomId, message) {
    if (this.socket) {
      this.socket.emit('send_message', { roomId, message })
    }
  }

  // Remove event listeners
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  // Check connection status
  isSocketConnected() {
    return this.isConnected && this.socket?.connected
  }
}

// Create singleton instance
const socketService = new SocketService()

export default socketService