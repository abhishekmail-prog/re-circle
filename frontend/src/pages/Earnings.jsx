import React, { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useTranslation } from '../hooks/useTranslation'
import './Earnings.css'

const Earnings = () => {
  const { t } = useTranslation()
  const [filter, setFilter] = useState('thisMonth')
  const [earnings, setEarnings] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchEarningsData = useCallback(async () => {
    setLoading(true)
    try {
      const summaryResponse = await api.get('/earnings/summary')
      setEarnings(summaryResponse.data)

      const txResponse = await api.get(`/earnings/transactions?period=${filter}`)
      setTransactions(txResponse.data.transactions || [])
    } catch (error) {
      console.error('Failed to fetch earnings:', error)
      setEarnings({
        totalEarnings: 0,
        totalPaid: 0,
        totalPending: 0,
        completedTransactions: 0,
        totalTransactions: 0,
        todayEarnings: 0,
        weekEarnings: 0,
        monthEarnings: 0
      })
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchEarningsData()
  }, [fetchEarningsData])

  const filters = [
    { key: 'today', label: t('earnings.today') },
    { key: 'thisWeek', label: t('earnings.thisWeek') },
    { key: 'thisMonth', label: t('earnings.thisMonth') },
    { key: 'allTime', label: t('earnings.allTime') }
  ]

  // Earnings only count money that has actually changed hands.
  // MATCHED / BIDDING lots appear in the list but contribute ₹0.
  const isPaidStatus = (status) =>
    status === 'PAID' || status === 'COMPLETED'

  const getPeriodEarnings = () => {
    return transactions
      .filter((tx) => isPaidStatus(tx.status))
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
  }

  const pendingAmount = transactions
    .filter((tx) => !isPaidStatus(tx.status))
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)

  const getPeriodLabel = () => {
    switch (filter) {
      case 'today': return t('earnings.today')
      case 'thisWeek': return t('earnings.thisWeek')
      case 'thisMonth': return t('earnings.thisMonth')
      default: return t('earnings.allTime')
    }
  }

  if (loading) {
    return <div className="loading-state">{t('earnings.loading')}</div>
  }

  if (!earnings) {
    return <div className="error-state">{t('earnings.error')}</div>
  }

  return (
    <div className="earnings-page">
      <h1 className="page-title">💰 {t('earnings.title')}</h1>
      <p className="page-subtitle text-muted">{t('earnings.subtitle')}</p>

      <div className="filter-buttons">
        {filters.map((f) => (
          <button
            key={f.key}
            className={`filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-label">
            {t('earnings.periodEarnings', { period: getPeriodLabel() })}
          </div>
          <div className="stat-value primary">
            ₹{getPeriodEarnings().toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          {pendingAmount > 0 && (
            <div style={{ fontSize: '0.72rem', color: '#e65100', marginTop: '4px' }}>
              + ₹{pendingAmount.toLocaleString('en-IN')} pending
            </div>
          )}
        </div>
        <div className="card stat-card">
          <div className="stat-label">{t('earnings.totalEarnings')}</div>
          <div className="stat-value primary">
            ₹{(earnings.totalEarnings || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">{t('earnings.pending')}</div>
          <div className="stat-value warning">
            ₹{(earnings.totalPending || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">{t('earnings.completed')}</div>
          <div className="stat-value">{earnings.completedTransactions || 0}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">{t('earnings.totalLots')}</div>
          <div className="stat-value">{earnings.totalTransactions || 0}</div>
        </div>
      </div>

      <div className="card transactions-section">
        <h3>{t('earnings.recentTransactions')} ({transactions.length})</h3>
        <div className="transactions-list">
          {transactions.length === 0 ? (
            <div className="no-transactions">
              {t('earnings.noTransactions', { period: getPeriodLabel() })}
            </div>
          ) : (
            transactions.map((tx, index) => (
              <div key={index} className="transaction-item">
                <div className="tx-info">
                  <span className="tx-lot">{tx.lotId}</span>
                  <span className="tx-date">
                    {tx.date
                      ? new Date(tx.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })
                      : 'N/A'}
                  </span>
                  <span className="tx-material">{tx.material}</span>
                </div>
                <div className="tx-details">
                  <span className="tx-weight">{tx.weight || 0} kg</span>
                  <span
                    className="tx-amount"
                    style={{
                      opacity: isPaidStatus(tx.status) ? 1 : 0.45,
                      textDecoration: isPaidStatus(tx.status) ? 'none' : 'line-through'
                    }}
                    title={isPaidStatus(tx.status) ? '' : 'Not yet paid'}
                  >
                    ₹{(tx.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                  <span
                    className={`badge ${
                      tx.status === 'PAID' || tx.status === 'COMPLETED'
                        ? 'badge-success'
                        : tx.status === 'PAYMENT_PENDING'
                        ? 'badge-warning'
                        : 'badge-info'
                    }`}
                  >
                    {tx.status || 'UNKNOWN'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Earnings
