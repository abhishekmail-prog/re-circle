import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * ProtectedRoute — auth gate + optional role gate.
 *
 *   <ProtectedRoute>              → any logged-in user
 *   <ProtectedRoute allowedRoles={['RECYCLER']}>  → only recyclers
 *   <ProtectedRoute allowedRoles={['ADMIN']}>     → only admins
 *
 * If the user is logged in but lacks the role, we send them to their
 * own role's landing page instead of a 403.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const role = user?.role
    if (!allowedRoles.includes(role)) {
      // Send to the user's own home
      const fallback =
        role === 'ADMIN'
          ? '/admin/dashboard'
          : role === 'RECYCLER'
          ? '/recycler/dashboard'
          : '/dashboard'
      return <Navigate to={fallback} replace />
    }
  }

  return children
}

export default ProtectedRoute
