import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import './Earnings.css'

const Earnings = () => {
  const [filter, setFilter] = useState('thisMonth')
  const [earnings, setEarnings] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchEarningsData()
  }, [filter])

  const fetchEarningsData = async () => {
    setLoading(true)
    try {
      // Fetch earnings summary
      const summaryResponse = await api.get('/earnings/summary')
      setEarnings(summaryResponse.data)

      // Fetch transactions for the selected period
      const txResponse = await api.get(`/earnings/transactions?period=${filter}`)
      setTransactions(txResponse.data.transactions || [])
    } catch (error) {
      console.error('Failed to fetch earnings:', error)
      toast.error('Failed to load earnings data')
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

  if (loading) {
    return <div className="loading-state">Loading earnings...</div>
  }

  if (!earnings) {
    return <div className="error-state">No earnings data available</div>
  }

  // Calculate period-specific earnings
  const getPeriodEarnings = () => {
    switch(filter) {
      case 'today':
        return earnings.todayEarnings || 0
      case 'thisWeek':
        return earnings.weekEarnings || 0
      case 'thisMonth':
        return earnings.monthEarnings || 0
      default:
        return earnings.totalEarnings || 0
    }
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
          <div className="stat-label">Total Earnings</div>
          <div className="stat-value primary">
            ₹{(getPeriodEarnings() || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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
      </div>

      <div className="card transactions-section">
        <h3>Recent Transactions ({transactions.length})</h3>
        <div className="transactions-list">
          {transactions.length === 0 ? (
            <div className="no-transactions">No transactions for this period</div>
          ) : (
            transactions.map((tx, index) => (
              <div key={index} className="transaction-item">
                <div className="tx-info">
                  <span className="tx-lot">{tx.lotId}</span>
                  <span className="tx-date">
                    {tx.date ? new Date(tx.date).toLocaleDateString('en-IN') : 'N/A'}
                  </span>
                  <span className="tx-material">{tx.material}</span>
                </div>
                <div className="tx-details">
                  <span className="tx-weight">{tx.weight || 0} kg</span>
                  <span className="tx-amount">₹{(tx.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  <span className={`badge ${tx.status === 'PAID' || tx.status === 'COMPLETED' ? 'badge-success' : 
                    tx.status === 'PAYMENT_PENDING' ? 'badge-warning' : 'badge-info'}`}>
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
