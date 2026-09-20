import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../hooks/useTranslation'
import { useWebSocket } from '../../context/WebSocketContext'
import api from '../../api/axios'
import {
  FaBox,
  FaMoneyBillWave,
  FaCheckCircle,
  FaClock,
  FaEye,
  FaSync
} from 'react-icons/fa'
import './RecyclerDashboard.css'

const RecyclerDashboard = () => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { client, connected } = useWebSocket()
  const navigate = useNavigate()

  const [lots, setLots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLots = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/lots/recycler/pending-handovers')
      setLots(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error('Failed to load recycler lots:', err)
      setError(t('common.error'))
      setLots([])
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchLots()
  }, [fetchLots])

  // Live updates when lots change (auction closes, handover confirmed, etc.)
  useEffect(() => {
    if (!client || !connected) return
    const sub = client.subscribe('/topic/lots', () => {
      fetchLots()
    })
    return () => sub.unsubscribe()
  }, [client, connected, fetchLots])

  // ─── Stats ───────────────────────────────────────────────
  const incoming = lots.filter(
    (l) => l.status === 'MATCHED' || l.status === 'HANDED_OVER'
  )
  const pendingPayment = lots.filter((l) => l.status === 'PAYMENT_PENDING')
  const completed = lots.filter(
    (l) => l.status === 'PAID' || l.status === 'COMPLETED'
  )

  const totalSpent = completed.reduce(
    (sum, l) => sum + (Number(l.finalValue) || Number(l.estimatedValue) || 0),
    0
  )

  const stats = [
    {
      icon: FaBox,
      label: t('recyclerDashboard.incomingLots'),
      color: '#2196f3',
      value: incoming.length
    },
    {
      icon: FaClock,
      label: t('recyclerDashboard.pendingHandovers'),
      color: '#ff9800',
      value: pendingPayment.length
    },
    {
      icon: FaCheckCircle,
      label: t('recyclerDashboard.completed'),
      color: '#4caf50',
      value: completed.length
    },
    {
      icon: FaMoneyBillWave,
      label: t('recyclerHandovers.totalSpent'),
      color: '#9c27b0',
      value: `₹${totalSpent.toLocaleString()}`
    }
  ]

  const getStatusBadge = (status) => {
    const map = {
      MATCHED: 'badge-warning',
      HANDED_OVER: 'badge-success',
      PAYMENT_PENDING: 'badge-warning',
      PAID: 'badge-success',
      COMPLETED: 'badge-success'
    }
    return map[status] || 'badge-info'
  }

  return (
    <div className="recycler-dashboard">
      <div className="dashboard-header">
        <h1>{t('recyclerDashboard.title')}</h1>
        <p className="text-muted">
          {t('recyclerDashboard.welcome', { name: user?.fullName || 'Recycler' })}
        </p>
        <p className="text-muted">{t('recyclerDashboard.subtitle')}</p>
      </div>

      <div style={{ margin: '12px 0' }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={fetchLots}
          disabled={loading}
        >
          <FaSync /> {t('common.retry')}
        </button>
      </div>

      <div className="stats-grid">
        {stats.map((s, idx) => (
          <div key={idx} className="stat-card" style={{ borderColor: s.color }}>
            <div className="stat-icon" style={{ color: s.color }}>
              <s.icon />
            </div>
            <div className="stat-content">
              <span className="stat-label">{s.label}</span>
              <span className="stat-value">{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div
          style={{
            background: '#ffebee',
            color: '#b71c1c',
            padding: '10px 16px',
            borderRadius: '8px',
            marginBottom: '12px'
          }}
        >
          {error}
        </div>
      )}

      <div className="card incoming-lots">
        <h3>
          {t('recyclerDashboard.incomingLots')} ({incoming.length + pendingPayment.length})
        </h3>
        {loading ? (
          <div className="empty-state">
            <p>{t('common.loading')}</p>
          </div>
        ) : incoming.length === 0 && pendingPayment.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '48px' }}>📭</span>
            <p>{t('recyclerDashboard.noIncomingLots')}</p>
          </div>
        ) : (
          <div className="lots-list">
            {[...incoming, ...pendingPayment].map((lot) => (
              <div key={lot.lotId} className="lot-item">
                <div className="lot-info">
                  <span className="lot-id">{lot.lotId}</span>
                  <span className="lot-material">
                    {lot.materialCategory?.name || '—'}
                  </span>
                  <span className="lot-weight">{lot.weightKg} kg</span>
                  <span className="lot-collector">
                    👤 {lot.collector?.fullName || '—'}
                  </span>
                </div>
                <div className="lot-actions">
                  <span className={`badge ${getStatusBadge(lot.status)}`}>
                    {lot.status}
                  </span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/recycler/handovers')}
                  >
                    <FaEye /> {t('recyclerDashboard.viewAndConfirm')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RecyclerDashboard
