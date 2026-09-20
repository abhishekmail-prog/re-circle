import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import api from '../../api/axios'
import {
  FaMoneyBillWave,
  FaWallet,
  FaChartLine,
  FaSync
} from 'react-icons/fa'
import './RecyclerDashboard.css'

const RecyclerEarnings = () => {
  const { t } = useTranslation()
  const [period, setPeriod] = useState('month')
  const [lots, setLots] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPaidLots = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/lots/recycler/pending-handovers')
      const all = Array.isArray(res.data) ? res.data : []
      setLots(all.filter((l) => l.status === 'PAID' || l.status === 'COMPLETED'))
    } catch (err) {
      console.error('Failed to load earnings:', err)
      setLots([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPaidLots()
  }, [fetchPaidLots])

  const inPeriod = (dateStr) => {
    if (period === 'all') return true
    if (!dateStr) return false
    const d = new Date(dateStr)
    const now = new Date()
    if (period === 'today') {
      return d.toDateString() === now.toDateString()
    }
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return d >= weekAgo
    }
    if (period === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }
    return true
  }

  const filtered = lots.filter((l) => inPeriod(l.handoverAt || l.updatedAt || l.createdAt))

  const totalSpent = filtered.reduce(
    (sum, l) => sum + (Number(l.finalValue) || 0),
    0
  )

  const periods = [
    { key: 'today', label: t('recyclerEarnings.today') },
    { key: 'week', label: t('recyclerEarnings.week') },
    { key: 'month', label: t('recyclerEarnings.month') },
    { key: 'all', label: t('recyclerEarnings.all') }
  ]

  return (
    <div className="recycler-dashboard">
      <div className="dashboard-header">
        <h1>{t('recyclerEarnings.title')}</h1>
        <p className="text-muted">{t('recyclerEarnings.subtitle')}</p>
      </div>

      <div style={{ margin: '12px 0' }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={fetchPaidLots}
          disabled={loading}
        >
          <FaSync /> {t('common.retry')}
        </button>
      </div>

      <div
        className="filter-buttons"
        style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}
      >
        {periods.map((p) => (
          <button
            key={p.key}
            className={`filter-btn ${period === p.key ? 'active' : ''}`}
            onClick={() => setPeriod(p.key)}
            style={{
              padding: '8px 16px',
              border: '2px solid var(--border)',
              borderRadius: '20px',
              background: period === p.key ? 'var(--primary)' : 'white',
              color: period === p.key ? 'white' : 'var(--text)',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div
        className="stats-grid"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
      >
        <div className="stat-card" style={{ borderColor: '#9c27b0' }}>
          <div className="stat-icon" style={{ color: '#9c27b0' }}>
            <FaMoneyBillWave />
          </div>
          <div className="stat-content">
            <span className="stat-label">{t('recyclerHandovers.totalSpent')}</span>
            <span className="stat-value">₹{totalSpent.toLocaleString()}</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: '#4caf50' }}>
          <div className="stat-icon" style={{ color: '#4caf50' }}>
            <FaWallet />
          </div>
          <div className="stat-content">
            <span className="stat-label">{t('recyclerEarnings.transactions')}</span>
            <span className="stat-value">{filtered.length}</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: '#ff9800' }}>
          <div className="stat-icon" style={{ color: '#ff9800' }}>
            <FaChartLine />
          </div>
          <div className="stat-content">
            <span className="stat-label">{t('recyclerHandovers.total')}</span>
            <span className="stat-value">{lots.length}</span>
          </div>
        </div>
      </div>

      <div className="card incoming-lots">
        <h3>{t('recyclerEarnings.transactionHistory')}</h3>
        {loading ? (
          <div className="empty-state">
            <p>{t('common.loading')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '48px' }}>📭</span>
            <p>{t('earnings.noTransactions', { period: periods.find(p => p.key === period)?.label || '' })}</p>
          </div>
        ) : (
          <div className="lots-list">
            {filtered.map((lot) => (
              <div key={lot.lotId} className="lot-item">
                <div className="lot-info">
                  <span className="lot-id">{lot.lotId}</span>
                  <span className="lot-material">
                    {lot.materialCategory?.name || '—'}
                  </span>
                  <span className="lot-weight">
                    {lot.verifiedWeightKg || lot.weightKg} kg
                  </span>
                  <span className="lot-time">
                    {lot.handoverAt
                      ? new Date(lot.handoverAt).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
                <div className="lot-actions">
                  <span className="lot-weight" style={{ fontWeight: 600 }}>
                    ₹{Number(lot.finalValue || 0).toLocaleString()}
                  </span>
                  <span className="badge badge-success">{lot.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RecyclerEarnings
