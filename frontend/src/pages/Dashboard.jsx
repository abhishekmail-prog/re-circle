import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useOffline } from '../context/OfflineContext'
import { useTranslation } from '../hooks/useTranslation'
import api from '../api/axios'
import {
  FaCamera,
  FaMoneyBillWave,
  FaRecycle,
  FaWallet,
  FaShieldAlt,
  FaUser,
} from 'react-icons/fa'
import './Dashboard.css'

const Dashboard = () => {
  const { user } = useAuth()
  const { syncDone, isOnline } = useOffline()
  const { t } = useTranslation()
  const [lots, setLots] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMyLots = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/lots/my')
      setLots(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error('Failed to fetch my lots:', err)
      setLots([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Refetch when syncDone changes (offline queue just flushed) or on mount
  useEffect(() => {
    fetchMyLots()
  }, [fetchMyLots, syncDone])

  // Refetch when we come back online
  useEffect(() => {
    if (isOnline) {
      fetchMyLots()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline])

  const completed = lots.filter(
    (l) => l.status === 'PAID' || l.status === 'COMPLETED'
  ).length

  const totalEarnings = lots
    .filter((l) => l.status === 'PAID' || l.status === 'COMPLETED')
    .reduce((sum, l) => sum + (Number(l.netEarnings) || 0), 0)

  const quickActions = [
    { path: '/create-lot', icon: FaCamera, label: t('dashboard.createLot'), color: '#4caf50' },
    { path: '/prices', icon: FaMoneyBillWave, label: t('dashboard.todayPrices'), color: '#ff9800' },
    { path: '/recyclers', icon: FaRecycle, label: t('dashboard.findRecycler'), color: '#2196f3' },
    { path: '/earnings', icon: FaWallet, label: t('dashboard.myEarnings'), color: '#9c27b0' },
    { path: '/safety', icon: FaShieldAlt, label: t('dashboard.safety'), color: '#f44336' },
    { path: '/profile', icon: FaUser, label: t('dashboard.profile'), color: '#607d8b' }
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
              <div
                className="action-icon"
                style={{
                  background: `${action.color}20`,
                  color: action.color
                }}
              >
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
          <span className="stat-value">{loading ? '…' : lots.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('dashboard.completed')}</span>
          <span className="stat-value">{loading ? '…' : completed}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t('dashboard.earnings')}</span>
          <span className="stat-value">
            ₹{totalEarnings.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Recent lots list */}
      {lots.length > 0 && (
        <div className="card" style={{ marginTop: '16px' }}>
          <h3 style={{ margin: '0 0 12px 0' }}>
            {t('nav.lots')} ({lots.length})
          </h3>
          <div className="lots-list">
            {lots.slice(0, 5).map((lot) => (
              <Link
                key={lot.lotId}
                to={`/lot/${lot.lotId}`}
                className="lot-item"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="lot-info">
                  <span className="lot-id">{lot.lotId}</span>
                  <span className="lot-material">
                    {lot.materialCategory?.name || '—'}
                  </span>
                  <span className="lot-weight">{lot.weightKg} kg</span>
                </div>
                <span className="badge badge-info">{lot.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
