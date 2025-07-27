import api from './api'

export const authService = {
  async login(credentials) {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
    }
  },

  async refreshToken() {
    const response = await api.post('/auth/refresh-token')
    return response.data
  },

  async verifyEmail(token) {
    const response = await api.get(`/auth/verify-email/${token}`)
    return response.data
  },

  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  async resetPassword(token, password) {
    const response = await api.post('/auth/reset-password', { token, password })
    return response.data
  }
}

export default authService