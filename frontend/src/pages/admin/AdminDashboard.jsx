import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useWebSocket } from '../../context/WebSocketContext'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'
import api from '../../api/axios'
import {
  FaUsers, FaRecycle, FaMoneyBillWave, FaChartLine,
  FaCheckCircle, FaClock, FaUserPlus, FaEdit, FaTrash, FaCheck,
  FaHome, FaSync
} from 'react-icons/fa'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const { user } = useAuth()
  const { client, connected } = useWebSocket()
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const getActiveTabFromUrl = () => {
    const path = location.pathname
    if (path.includes('/admin/users')) return 'users'
    if (path.includes('/admin/recyclers')) return 'recyclers'
    if (path.includes('/admin/stats')) return 'stats'
    return 'dashboard'
  }

  const [activeTab, setActiveTab] = useState(getActiveTabFromUrl)
  const [stats, setStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [recyclers, setRecyclers] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', price: '', active: true })
  const [newRecycler, setNewRecycler] = useState({
    companyName: '',
    facilityAddress: '',
    contactPerson: '',
    contactPhone: ''
  })

  useEffect(() => {
    setActiveTab(getActiveTabFromUrl())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // ── Fetch everything ────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, usersRes, recyclersRes, activityRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/recyclers'),
        api.get('/admin/activity/recent')
      ])
      setStats(statsRes.data || null)
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : [])
      setRecyclers(Array.isArray(recyclersRes.data) ? recyclersRes.data : [])
      setRecentActivity(Array.isArray(activityRes.data) ? activityRes.data : [])
    } catch (err) {
      console.error('Failed to load admin data:', err)
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Live updates on lot events
  useEffect(() => {
    if (!client || !connected) return
    const sub = client.subscribe('/topic/lots', () => {
      fetchAll()
    })
    return () => sub.unsubscribe()
  }, [client, connected, fetchAll])

  // ── Actions ─────────────────────────────────────────────────
  const handleVerifyRecycler = async (id) => {
    try {
      await api.put(`/admin/recyclers/${id}/verify`)
      await fetchAll()
      console.log(t('admin.recyclerVerified'))
    } catch (err) {
      console.error('Verify failed:', err)
    }
  }

  const handleDeleteRecycler = async (id) => {
    // No delete endpoint yet — just remove from local view for now
    setRecyclers((prev) => prev.filter((r) => r.id !== id))
    console.log(t('admin.recyclerRemoved'))
  }

  const handleAddRecycler = () => {
    if (!newRecycler.companyName) {
      console.error(t('admin.enterCompanyName'))
      return
    }
    // No create endpoint yet — just close modal
    setNewRecycler({ companyName: '', facilityAddress: '', contactPerson: '', contactPhone: '' })
    setShowAddModal(false)
    console.log(t('admin.recyclerAdded'))
  }

  const tabs = [
    { key: 'dashboard', icon: FaHome, label: t('nav.dashboard') },
    { key: 'users', icon: FaUsers, label: t('nav.users') },
    { key: 'recyclers', icon: FaRecycle, label: t('nav.recyclers') },
    { key: 'stats', icon: FaChartLine, label: t('nav.stats') }
  ]

  // Default stat values while loading
  const s = stats || {
    totalCollectors: 0,
    totalRecyclers: 0,
    totalLots: 0,
    totalEarnings: 0,
    totalTransactions: 0,
    pendingVerifications: 0
  }

  const statsCards = [
    { icon: FaUsers, label: t('admin.stats.collectors'), value: s.totalCollectors, color: '#4caf50' },
    { icon: FaRecycle, label: t('admin.stats.recyclers'), value: s.totalRecyclers, color: '#2196f3' },
    { icon: FaChartLine, label: t('admin.stats.totalLots'), value: s.totalLots, color: '#ff9800' },
    { icon: FaMoneyBillWave, label: t('admin.stats.totalEarnings'), value: `₹${Number(s.totalEarnings || 0).toLocaleString()}`, color: '#9c27b0' },
    { icon: FaCheckCircle, label: t('admin.stats.transactions'), value: s.totalTransactions, color: '#00bcd4' },
    { icon: FaClock, label: t('admin.stats.pendingVerifications'), value: s.pendingVerifications, color: '#f44336' }
  ]

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>{t('admin.title')}</h1>
        <p className="text-muted">{t('admin.subtitle')}</p>
        <div className="live-status">
          {connected ? t('admin.live') : t('admin.connecting')}
        </div>
      </div>

      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => {
              const path = tab.key === 'dashboard' ? '/admin/dashboard' : `/admin/${tab.key}`
              navigate(path)
            }}
          >
            <tab.icon />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div style={{ margin: '12px 0' }}>
        <button className="btn btn-outline btn-sm" onClick={fetchAll} disabled={loading}>
          <FaSync /> {t('common.retry')}
        </button>
      </div>

      {error && (
        <div style={{ background: '#ffebee', color: '#b71c1c', padding: '10px 16px', borderRadius: '8px', marginBottom: '12px' }}>
          {error}
        </div>
      )}

      {activeTab === 'dashboard' && (
        <>
          <div className="stats-grid">
            {statsCards.map((stat, index) => (
              <div key={index} className="stat-card" style={{ borderColor: stat.color }}>
                <div className="stat-icon" style={{ color: stat.color }}>
                  <stat.icon />
                </div>
                <div className="stat-content">
                  <span className="stat-label">{stat.label}</span>
                  <span className="stat-value">{loading ? '…' : stat.value}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-grid">
            <div className="card admin-section">
              <h3>{t('admin.recentActivity')}</h3>
              {loading ? (
                <p className="text-muted">{t('common.loading')}</p>
              ) : recentActivity.length === 0 ? (
                <p className="text-muted">{t('common.noData')}</p>
              ) : (
                <div className="activity-list">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <span className="activity-icon">{activity.icon}</span>
                      <span className="activity-text">{activity.message}</span>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card admin-section">
              <h3>{t('admin.quickActions')}</h3>
              <div className="admin-actions">
                <button className="btn btn-primary btn-block" onClick={() => setShowAddModal(true)}>
                  <FaUserPlus /> {t('admin.addRecycler')}
                </button>
                <button className="btn btn-secondary btn-block" onClick={() => navigate('/admin/recyclers')}>
                  <FaCheckCircle /> {t('admin.verifyRecyclers')}
                </button>
                <button className="btn btn-outline btn-block" onClick={() => navigate('/admin/users')}>
                  <FaUsers /> {t('admin.viewUsers')}
                </button>
                <button
                  className="btn btn-outline btn-block"
                  onClick={() => {
                    setEditingCategory(null)
                    setCategoryForm({ name: '', price: '', active: true })
                    setShowCategoryModal(true)
                  }}
                >
                  <FaEdit /> {t('admin.manageCategories')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="card admin-section">
          <h3>{t('admin.usersHeader')} ({users.length})</h3>
          {loading ? (
            <p className="text-muted">{t('common.loading')}</p>
          ) : users.length === 0 ? (
            <p className="text-muted">{t('common.noData')}</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('admin.tableFullName')}</th>
                    <th>{t('admin.tableEmail')}</th>
                    <th>{t('admin.tableRole')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id || u.email}>
                      <td>{u.fullName || '—'}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${
                          u.role === 'COLLECTOR' ? 'badge-success'
                          : u.role === 'RECYCLER' ? 'badge-info'
                          : 'badge-warning'
                        }`}>{u.role}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'recyclers' && (
        <div className="card admin-section recyclers-list">
          <h3>{t('admin.recyclersList')} ({recyclers.length})</h3>
          {loading ? (
            <p className="text-muted">{t('common.loading')}</p>
          ) : recyclers.length === 0 ? (
            <p className="text-muted">{t('common.noData')}</p>
          ) : (
            <div className="recycler-items">
              {recyclers.map((recycler) => (
                <div key={recycler.id} className="recycler-item">
                  <div className="recycler-info">
                    <span className="recycler-name">{recycler.companyName}</span>
                    <span className="recycler-location">{recycler.facilityAddress || '—'}</span>
                  </div>
                  <div className="recycler-actions">
                    <span className={`badge ${recycler.authorized ? 'badge-success' : 'badge-warning'}`}>
                      {recycler.authorized ? t('admin.verified') : t('admin.pending')}
                    </span>
                    {!recycler.authorized && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleVerifyRecycler(recycler.id)}
                      >
                        <FaCheck /> {t('admin.verify')}
                      </button>
                    )}
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteRecycler(recycler.id)}
                    >
                      <FaTrash /> {t('admin.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="card admin-section">
          <h3>{t('admin.statsHeader')}</h3>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {statsCards.map((stat, index) => (
              <div key={index} className="stat-card" style={{ borderColor: stat.color }}>
                <div className="stat-icon" style={{ color: stat.color }}>
                  <stat.icon />
                </div>
                <div className="stat-content">
                  <span className="stat-label">{stat.label}</span>
                  <span className="stat-value">{loading ? '…' : stat.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.addRecyclerModal')}</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>{t('admin.companyName')} *</label>
                <input
                  type="text"
                  className="form-control"
                  value={newRecycler.companyName}
                  onChange={(e) => setNewRecycler({ ...newRecycler, companyName: e.target.value })}
                  placeholder={t('admin.companyName')}
                />
              </div>
              <div className="form-group">
                <label>{t('admin.address')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={newRecycler.facilityAddress}
                  onChange={(e) => setNewRecycler({ ...newRecycler, facilityAddress: e.target.value })}
                  placeholder={t('admin.address')}
                />
              </div>
              <div className="form-group">
                <label>{t('admin.contactPerson')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={newRecycler.contactPerson}
                  onChange={(e) => setNewRecycler({ ...newRecycler, contactPerson: e.target.value })}
                  placeholder={t('admin.contactPerson')}
                />
              </div>
              <div className="form-group">
                <label>{t('admin.contactPhone')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={newRecycler.contactPhone}
                  onChange={(e) => setNewRecycler({ ...newRecycler, contactPhone: e.target.value })}
                  placeholder={t('admin.contactPhone')}
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary btn-block" onClick={handleAddRecycler}>
                  <FaUserPlus /> {t('admin.addRecycler')}
                </button>
                <button className="btn btn-outline btn-block" onClick={() => setShowAddModal(false)}>
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCategory ? t('admin.editCategory') : t('admin.categoryModal')}</h3>
              <button className="modal-close" onClick={() => setShowCategoryModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>{t('admin.categoryName')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>{t('admin.pricePerKg')}</label>
                <input
                  type="number"
                  className="form-control"
                  value={categoryForm.price}
                  onChange={(e) => setCategoryForm({ ...categoryForm, price: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary btn-block" onClick={() => setShowCategoryModal(false)}>
                  {t('common.save')}
                </button>
                <button className="btn btn-outline btn-block" onClick={() => setShowCategoryModal(false)}>
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
