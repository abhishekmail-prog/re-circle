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

import Dashboard from './pages/Dashboard'
import CreateLot from './pages/CreateLot'
import Prices from './pages/Prices'
import Recyclers from './pages/Recyclers'
import Earnings from './pages/Earnings'
import Safety from './pages/Safety'
import Profile from './pages/Profile'
import LotDetail from './pages/LotDetail'

import RecyclerDashboard from './pages/recycler/RecyclerDashboard'
import RecyclerLots from './pages/recycler/RecyclerLots'
import RecyclerHandovers from './pages/recycler/RecyclerHandovers'
import RecyclerEarnings from './pages/recycler/RecyclerEarnings'

import AdminDashboard from './pages/admin/AdminDashboard'

import './styles/App.css'

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
                <Route path="prices" element={<Prices />} />
                <Route path="recyclers" element={<Recyclers />} />
                <Route path="earnings" element={<Earnings />} />
                <Route path="safety" element={<Safety />} />
                <Route path="profile" element={<Profile />} />
                <Route path="lot/:id" element={<LotDetail />} />
                <Route path="recycler/dashboard" element={<RecyclerDashboard />} />
                <Route path="recycler/lots" element={<RecyclerLots />} />
                <Route path="recycler/handovers" element={<RecyclerHandovers />} />
                <Route path="recycler/earnings" element={<RecyclerEarnings />} />
                <Route path="admin/dashboard" element={<AdminDashboard />} />
                <Route path="admin/users" element={<AdminDashboard />} />
                <Route path="admin/recyclers" element={<AdminDashboard />} />
                <Route path="admin/stats" element={<AdminDashboard />} />
              </Route>
            </Routes>
          </LanguageProvider>
        </WebSocketProvider>
      </OfflineProvider>
    </AuthProvider>
  )
}

export default App
