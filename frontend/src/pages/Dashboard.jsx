import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../hooks/useTranslation'
import { FaCamera, FaMoneyBillWave, FaRecycle, FaWallet, FaShieldAlt, FaUser } from 'react-icons/fa'
import './Dashboard.css'

const Dashboard = () => {
  const { user } = useAuth()
  const { t } = useTranslation()

  const quickActions = [
    { path: '/create-lot', icon: FaCamera, label: t('dashboard.createLot'), color: '#4caf50' },
    { path: '/prices', icon: FaMoneyBillWave, label: t('dashboard.todayPrices'), color: '#ff9800' },
    { path: '/recyclers', icon: FaRecycle, label: t('dashboard.findRecycler'), color: '#2196f3' },
    { path: '/earnings', icon: FaWallet, label: t('dashboard.myEarnings'), color: '#9c27b0' },
    { path: '/safety', icon: FaShieldAlt, label: t('dashboard.safety'), color: '#f44336' },
    { path: '/profile', icon: FaUser, label: t('dashboard.profile'), color: '#607d8b' },
  ]

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{t('dashboard.welcome', { name: user?.fullName || 'Kabadiwala' })}</h1>
        <p className="text-muted">{t('dashboard.tagline')}</p>
      </div>

      <div className="quick-actions">
        <h2 className="section-title">{t('dashboard.quickActions')}</h2>
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
          <span className="stat-label">{t('dashboard.totalLots')}</span>
          <span className="stat-value">0</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('dashboard.completed')}</span>
          <span className="stat-value">0</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('dashboard.earnings')}</span>
          <span className="stat-value">₹0</span>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
