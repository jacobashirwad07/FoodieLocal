import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ToastProvider } from './contexts/ToastContext'
import Header from './components/common/Header'
import Footer from './components/common/Footer'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MealDiscovery from './pages/MealDiscovery'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderHistory from './pages/OrderHistory'
import OrderTracking from './pages/OrderTracking'
import ChefDashboard from './pages/ChefDashboard'
import AdminPanel from './pages/AdminPanel'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './components/common/ProtectedRoute'
import ErrorBoundary from './components/common/ErrorBoundary'
import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <ToastProvider>
              <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/meals" element={<MealDiscovery />} />
                    <Route 
                      path="/cart" 
                      element={
                        <ProtectedRoute>
                          <CartPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/checkout" 
                      element={
                        <ProtectedRoute>
                          <CheckoutPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/orders" 
                      element={
                        <ProtectedRoute>
                          <OrderHistory />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/orders/:orderId/track" 
                      element={
                        <ProtectedRoute>
                          <OrderTracking />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/chef-dashboard" 
                      element={
                        <ProtectedRoute requiredRole="chef">
                          <ChefDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin" 
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <AdminPanel />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </ToastProvider>
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App