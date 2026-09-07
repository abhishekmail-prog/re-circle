import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useTranslation } from '../hooks/useTranslation'
import './Earnings.css'

const Earnings = () => {
  const { t } = useTranslation()
  const [filter, setFilter] = useState('thisMonth')
  const [earnings, setEarnings] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  // Demo earnings data
  const getDemoEarnings = () => {
    return {
      totalEarnings: 18450,
      totalPaid: 15000,
      totalPending: 3450,
      completedTransactions: 12,
      totalTransactions: 18,
      todayEarnings: 1200,
      weekEarnings: 5200,
      monthEarnings: 18450
    }
  }

  const getDemoTransactions = (period) => {
    const allTx = [
      { lotId: 'RC-2024-000001', date: '2024-09-07', amount: 2650, status: 'PAID', material: 'PCB', weight: 5 },
      { lotId: 'RC-2024-000002', date: '2024-09-06', amount: 1850, status: 'PAID', material: 'Battery', weight: 3 },
      { lotId: 'RC-2024-000003', date: '2024-09-05', amount: 3400, status: 'PAYMENT_PENDING', material: 'LCD Panel', weight: 8 },
      { lotId: 'RC-2024-000004', date: '2024-09-04', amount: 2100, status: 'PAID', material: 'Cable', weight: 12 },
      { lotId: 'RC-2024-000005', date: '2024-09-03', amount: 2850, status: 'PENDING', material: 'PCB', weight: 5 },
      { lotId: 'RC-2024-000006', date: '2024-09-02', amount: 1600, status: 'PAID', material: 'Motor', weight: 4 },
      { lotId: 'RC-2024-000007', date: '2024-09-01', amount: 3200, status: 'PAID', material: 'Mobile phone', weight: 2 },
    ]
    return allTx
  }

  useEffect(() => {
    fetchEarningsData()
  }, [filter])

  const fetchEarningsData = async () => {
    setLoading(true)
    try {
      // Try to fetch from API
      const summaryResponse = await api.get('/earnings/summary')
      setEarnings(summaryResponse.data)

      const txResponse = await api.get(`/earnings/transactions?period=${filter}`)
      setTransactions(txResponse.data.transactions || [])
    } catch (error) {
      console.error('Failed to fetch earnings:', error)
      // Use demo data
      setEarnings(getDemoEarnings())
      setTransactions(getDemoTransactions(filter))
      toast.info('📊 Using demo earnings data')
    } finally {
      setLoading(false)
    }
  }

  const filters = [
    { key: 'today', label: 'Today' },
    { key: 'thisWeek', label: 'This Week' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'allTime', label: 'All Time' },
  ]

  const getPeriodEarnings = () => {
    if (!earnings) return 0
    switch(filter) {
      case 'today': return earnings.todayEarnings || 0
      case 'thisWeek': return earnings.weekEarnings || 0
      case 'thisMonth': return earnings.monthEarnings || 0
      default: return earnings.totalEarnings || 0
    }
  }

  const getPeriodLabel = () => {
    switch(filter) {
      case 'today': return 'Today'
      case 'thisWeek': return 'This Week'
      case 'thisMonth': return 'This Month'
      default: return 'All Time'
    }
  }

  if (loading) {
    return <div className="loading-state">Loading earnings...</div>
  }

  if (!earnings) {
    return <div className="error-state">No earnings data available</div>
  }

  return (
    <div className="earnings-page">
      <h1 className="page-title">📒 My Earnings</h1>
      <p className="page-subtitle text-muted">Track your earnings and payments</p>

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
          <div className="stat-label">{getPeriodLabel()} Earnings</div>
          <div className="stat-value primary">
            ₹{getPeriodEarnings().toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Total Earnings</div>
          <div className="stat-value primary">
            ₹{(earnings.totalEarnings || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Paid</div>
          <div className="stat-value success">
            ₹{(earnings.totalPaid || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value warning">
            ₹{(earnings.totalPending || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value">{earnings.completedTransactions || 0}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Total Lots</div>
          <div className="stat-value">{earnings.totalTransactions || 0}</div>
        </div>
      </div>

      <div className="card transactions-section">
        <h3>📋 Recent Transactions ({transactions.length})</h3>
        <div className="transactions-list">
          {transactions.length === 0 ? (
            <div className="no-transactions">No transactions for {getPeriodLabel()}</div>
          ) : (
            transactions.map((tx, index) => (
              <div key={index} className="transaction-item">
                <div className="tx-info">
                  <span className="tx-lot">{tx.lotId}</span>
                  <span className="tx-date">
                    {tx.date ? new Date(tx.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }) : 'N/A'}
                  </span>
                  <span className="tx-material">{tx.material}</span>
                </div>
                <div className="tx-details">
                  <span className="tx-weight">{tx.weight || 0} kg</span>
                  <span className="tx-amount">₹{(tx.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  <span className={`badge ${
                    tx.status === 'PAID' || tx.status === 'COMPLETED' ? 'badge-success' : 
                    tx.status === 'PAYMENT_PENDING' ? 'badge-warning' : 
                    tx.status === 'MATCHED' ? 'badge-info' : 'badge-info'
                  }`}>
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
