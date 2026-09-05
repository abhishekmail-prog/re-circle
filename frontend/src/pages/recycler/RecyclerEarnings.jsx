import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../hooks/useTranslation'
import { FaMoneyBillWave, FaWallet, FaChartLine } from 'react-icons/fa'
import './RecyclerDashboard.css'

const RecyclerEarnings = () => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [period, setPeriod] = useState('month')

  const earnings = {
    total: 45000,
    thisMonth: 18500,
    thisWeek: 5200,
    today: 1200,
    transactions: [
      { id: 1, lotId: 'RC-2024-000005', amount: 2500, date: '2024-09-02', status: 'Paid' },
      { id: 2, lotId: 'RC-2024-000006', amount: 1800, date: '2024-09-01', status: 'Paid' },
      { id: 3, lotId: 'RC-2024-000007', amount: 3200, date: '2024-08-31', status: 'Pending' },
      { id: 4, lotId: 'RC-2024-000008', amount: 1500, date: '2024-08-30', status: 'Paid' },
      { id: 5, lotId: 'RC-2024-000009', amount: 2800, date: '2024-08-29', status: 'Paid' },
    ]
  }

  const periods = [
    { key: 'today', label: t('recyclerEarnings.today') },
    { key: 'week', label: t('recyclerEarnings.week') },
    { key: 'month', label: t('recyclerEarnings.month') },
    { key: 'all', label: t('recyclerEarnings.all') },
  ]

  const getPeriodEarnings = () => {
    switch(period) {
      case 'today': return earnings.today
      case 'week': return earnings.thisWeek
      case 'month': return earnings.thisMonth
      default: return earnings.total
    }
  }

  return (
    <div className="recycler-dashboard">
      <div className="dashboard-header">
        <h1>{t('recyclerEarnings.title')}</h1>
        <p className="text-muted">{t('recyclerEarnings.subtitle')}</p>
      </div>

      <div className="filter-buttons" style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
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

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card" style={{ borderColor: '#9c27b0' }}>
          <div className="stat-icon" style={{ color: '#9c27b0' }}><FaMoneyBillWave /></div>
          <div className="stat-content">
            <span className="stat-label">{t('recyclerEarnings.title')}</span>
            <span className="stat-value">₹{getPeriodEarnings().toLocaleString()}</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderColor: '#4caf50' }}>
          <div className="stat-icon" style={{ color: '#4caf50' }}><FaWallet /></div>
          <div className="stat-content">
            <span className="stat-label">{t('recyclerEarnings.totalRevenue')}</span>
            <span className="stat-value">₹{earnings.total.toLocaleString()}</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderColor: '#ff9800' }}>
          <div className="stat-icon" style={{ color: '#ff9800' }}><FaChartLine /></div>
          <div className="stat-content">
            <span className="stat-label">{t('recyclerEarnings.transactions')}</span>
            <span className="stat-value">{earnings.transactions.length}</span>
          </div>
        </div>
      </div>

      <div className="card incoming-lots">
        <h3>{t('recyclerEarnings.transactionHistory')}</h3>
        <div className="lots-list">
          {earnings.transactions.map((tx) => (
            <div key={tx.id} className="lot-item">
              <div className="lot-info">
                <span className="lot-id">{tx.lotId}</span>
                <span className="lot-material">{tx.date}</span>
              </div>
              <div className="lot-actions">
                <span className="lot-weight">₹{tx.amount.toLocaleString()}</span>
                <span className={`badge ${tx.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RecyclerEarnings
