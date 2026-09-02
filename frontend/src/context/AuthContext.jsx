import React, { createContext, useState, useContext, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    console.log('🔑 token from localStorage:', token)
    if (token && userStr) {
      try {
        setUser(JSON.parse(userStr))
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } catch (e) {
        localStorage.clear()
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login with:', email)
      const res = await api.post('/auth/login', { email, password })
      console.log('✅ Full response:', res)
      console.log('✅ Response data:', res.data)
      
      const { token, ...userData } = res.data
      console.log('✅ Extracted token:', token)
      
      if (!token) {
        throw new Error('No token received')
      }
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      setUser(userData)
      toast.success(`Welcome, ${userData.fullName}!`)
      return { success: true }
    } catch (error) {
      console.error('❌ Login error:', error)
      console.error('❌ Error response:', error.response?.data)
      toast.error(error.response?.data || 'Login failed')
      return { success: false }
    }
  }

  const logout = () => {
    localStorage.clear()
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    toast.success('Logged out')
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!localStorage.getItem('token'),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
