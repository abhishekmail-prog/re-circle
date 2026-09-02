import React, { useState, useEffect } from 'react'
import api from '../../api/axios'
import './AdminStats.css'

const AdminStats = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRecyclers: 0,
    pendingVerifications: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats')
      setStats(response.data)
    } catch (err) {
      console.error('Failed to fetch stats', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading-state">Loading stats...</div>

  return (
    <div className="admin-stats">
      <h1>📊 Platform Statistics</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <span className="stat-label">Total Users</span>
            <span className="stat-value">{stats.totalUsers}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏭</div>
          <div className="stat-content">
            <span className="stat-label">Total Recyclers</span>
            <span className="stat-value">{stats.totalRecyclers}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <span className="stat-label">Pending Verifications</span>
            <span className="stat-value">{stats.pendingVerifications}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminStats
