import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useOffline } from '../context/OfflineContext'
import { useTranslation } from '../hooks/useTranslation'
import api from '../api/axios'
import {
  FaCamera, FaMoneyBillWave, FaWallet,
  FaShieldAlt, FaUser, FaSync, FaBox
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

  useEffect(() => {
    fetchMyLots()
  }, [fetchMyLots, syncDone])

  useEffect(() => {
    if (isOnline) fetchMyLots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline])

  const completed = lots.filter(
    (l) => l.status === 'PAID' || l.status === 'COMPLETED'
  ).length

  const totalEarnings = lots
    .filter((l) => l.status === 'PAID' || l.status === 'COMPLETED')
    .reduce((sum, l) => sum + (Number(l.netEarnings) || 0), 0)

  const actions = [
    { path: '/create-lot', icon: FaCamera,         label: t('dashboard.createLot'),    color: '#1e8e3e', bg: '#e6f4ea' },
    { path: '/earnings',   icon: FaWallet,         label: t('dashboard.myEarnings'),   color: '#7b1fa2', bg: '#f3e8fd' },
    { path: '/safety',     icon: FaShieldAlt,      label: t('dashboard.safety'),       color: '#c5221f', bg: '#fce8e6' },
    { path: '/profile',    icon: FaUser,           label: t('dashboard.profile'),      color: '#1967d2', bg: '#e8f0fe' }
  ]

  const firstName = (user?.fullName || 'Kabadiwala').split(' ')[0]

  return (
    <div className="dashboard-gpay">
      <div className="gpay-greeting">
        <span className="gpay-hello">
          {t('dashboard.welcome', { name: firstName })}
        </span>
        <p className="gpay-tagline">{t('dashboard.tagline')}</p>
      </div>

      <div className="gpay-hero">
        <div className="gpay-hero-top">
          <span className="gpay-hero-label">{t('dashboard.earnings')}</span>
          <span className="gpay-hero-icon">
            <FaWallet />
          </span>
        </div>
        <div className="gpay-hero-value">
          ₹{totalEarnings.toLocaleString('en-IN')}
        </div>
        <div className="gpay-hero-row">
          <div className="gpay-hero-stat">
            <span className="gpay-hero-stat-num">{loading ? '…' : lots.length}</span>
            <span className="gpay-hero-stat-lbl">{t('dashboard.totalLots')}</span>
          </div>
          <div className="gpay-hero-divider" />
          <div className="gpay-hero-stat">
            <span className="gpay-hero-stat-num">{loading ? '…' : completed}</span>
            <span className="gpay-hero-stat-lbl">{t('dashboard.completed')}</span>
          </div>
        </div>
      </div>

      <h2 className="gpay-section-title">{t('dashboard.quickActions')}</h2>
      <div className="gpay-tiles">
        {actions.map((a) => (
          <Link key={a.path} to={a.path} className="gpay-tile">
            <span
              className="gpay-tile-icon"
              style={{ background: a.bg, color: a.color }}
            >
              <a.icon />
            </span>
            <span className="gpay-tile-label">{a.label}</span>
          </Link>
        ))}
      </div>

      {lots.length > 0 && (
        <div className="gpay-section">
          <div className="gpay-section-head">
            <h2 className="gpay-section-title" style={{ margin: 0 }}>
              {t('nav.lots')} ({lots.length})
            </h2>
            <button
              className="gpay-icon-btn"
              onClick={fetchMyLots}
              disabled={loading}
              aria-label={t('common.retry')}
            >
              <FaSync />
            </button>
          </div>

          <div className="gpay-list">
            {lots.slice(0, 5).map((lot) => (
              <Link
                key={lot.lotId}
                to={`/lot/${lot.lotId}`}
                className="gpay-list-row"
              >
                <span className="gpay-list-icon">
                  <FaBox />
                </span>
                <span className="gpay-list-body">
                  <span className="gpay-list-title">
                    {lot.materialCategory?.name || '—'}
                  </span>
                  <span className="gpay-list-sub">{lot.lotId}</span>
                </span>
                <span className="gpay-list-right">
                  <span className="gpay-list-amount">
                    {lot.weightKg || 0} kg
                  </span>
                  <span
                    className={`gpay-list-status status-${(lot.status || '').toLowerCase()}`}
                  >
                    {lot.status || '—'}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
