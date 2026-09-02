import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('🔒 Not authenticated, redirecting to login')
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
