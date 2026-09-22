import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { OfflineProvider } from './context/OfflineContext'
import { LanguageProvider } from './context/LanguageContext'
import { WebSocketProvider } from './context/WebSocketContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Register from './pages/Register'

// Collector Pages
import Dashboard from './pages/Dashboard'
import CreateLot from './pages/CreateLot'
import Earnings from './pages/Earnings'
import Safety from './pages/Safety'
import Profile from './pages/Profile'
import LotDetail from './pages/LotDetail'

// Recycler Pages
import RecyclerDashboard from './pages/recycler/RecyclerDashboard'
import RecyclerLots from './pages/recycler/RecyclerLots'
import RecyclerHandovers from './pages/recycler/RecyclerHandovers'
import RecyclerEarnings from './pages/recycler/RecyclerEarnings'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'

import './styles/App.css'

const RecyclerOnly = ({ children }) => (
  <ProtectedRoute allowedRoles={['RECYCLER']}>{children}</ProtectedRoute>
)

const AdminOnly = ({ children }) => (
  <ProtectedRoute allowedRoles={['ADMIN']}>{children}</ProtectedRoute>
)

const RootRedirect = () => {
  const { user, loading, isAuthenticated } = useAuth()
  if (loading) return <div className="loading-screen">Loading...</div>
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  switch(user.role) {
    case 'ADMIN': return <Navigate to="/admin/dashboard" replace />
    case 'RECYCLER': return <Navigate to="/recycler/dashboard" replace />
    default: return <Navigate to="/dashboard" replace />
  }
}

function App() {
  return (
    <AuthProvider>
      <OfflineProvider>
        <WebSocketProvider>
          <LanguageProvider>
            <Toaster position="top-right" />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<RootRedirect />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="create-lot" element={<CreateLot />} />
                <Route path="earnings" element={<Earnings />} />
                <Route path="safety" element={<Safety />} />
                <Route path="profile" element={<Profile />} />
                <Route path="lot/:id" element={<LotDetail />} />
                <Route path="recycler/dashboard" element={<RecyclerOnly><RecyclerDashboard /></RecyclerOnly>} />
                <Route path="recycler/lots" element={<RecyclerOnly><RecyclerLots /></RecyclerOnly>} />
                <Route path="recycler/handovers" element={<RecyclerOnly><RecyclerHandovers /></RecyclerOnly>} />
                <Route path="recycler/earnings" element={<RecyclerOnly><RecyclerEarnings /></RecyclerOnly>} />
                <Route path="admin/dashboard" element={<AdminOnly><AdminDashboard /></AdminOnly>} />
                <Route path="admin/users" element={<AdminOnly><AdminDashboard /></AdminOnly>} />
                <Route path="admin/recyclers" element={<AdminOnly><AdminDashboard /></AdminOnly>} />
                <Route path="admin/stats" element={<AdminOnly><AdminDashboard /></AdminOnly>} />
              </Route>
            </Routes>
          </LanguageProvider>
        </WebSocketProvider>
      </OfflineProvider>
    </AuthProvider>
  )
}

export default App
