import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaCamera, FaMoneyBillWave, FaRecycle, FaWallet, FaShieldAlt, FaUser } from 'react-icons/fa'
import './Dashboard.css'

const Dashboard = () => {
  const { user } = useAuth()

  const quickActions = [
    { path: '/create-lot', icon: FaCamera, label: 'Create Lot', color: '#4caf50' },
    { path: '/prices', icon: FaMoneyBillWave, label: 'Today\'s Prices', color: '#ff9800' },
    { path: '/recyclers', icon: FaRecycle, label: 'Find Recycler', color: '#2196f3' },
    { path: '/earnings', icon: FaWallet, label: 'My Earnings', color: '#9c27b0' },
    { path: '/safety', icon: FaShieldAlt, label: 'Safety', color: '#f44336' },
    { path: '/profile', icon: FaUser, label: 'Profile', color: '#607d8b' },
  ]

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.fullName || 'Kabadiwala'}! 👋</h1>
        <p className="text-muted">Making e-waste recycling profitable and transparent</p>
      </div>

      <div className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          {quickActions.map((action) => (
            <Link to={action.path} key={action.path} className="action-card">
              <div className="action-icon" style={{ background: `${action.color}20`, color: action.color }}>
                <action.icon />
              </div>
              <span className="action-label">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-label">Total Lots</span>
          <span className="stat-value">0</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Completed</span>
          <span className="stat-value">0</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Earnings</span>
          <span className="stat-value">₹0</span>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
