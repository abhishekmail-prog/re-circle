import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../hooks/useTranslation'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { 
  FaUsers, FaRecycle, FaMoneyBillWave, FaChartLine, 
  FaCheckCircle, FaClock, FaUserPlus, FaEdit, FaTrash, FaCheck,
  FaHome, FaUser
} from 'react-icons/fa'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  
  const getActiveTabFromUrl = () => {
    const path = location.pathname
    if (path.includes('/admin/users')) return 'users'
    if (path.includes('/admin/recyclers')) return 'recyclers'
    if (path.includes('/admin/stats')) return 'stats'
    return 'dashboard'
  }

  const [activeTab, setActiveTab] = useState(getActiveTabFromUrl)

  const [stats] = useState({
    totalCollectors: 5,
    totalRecyclers: 4,
    totalLots: 25,
    totalTransactions: 18,
    totalEarnings: 45000,
    pendingVerifications: 2
  })

  const [recentActivity] = useState([
    { icon: '📝', message: t('admin.activity.newLot'), time: '5 min ago' },
    { icon: '✅', message: t('admin.activity.recyclerVerified'), time: '1 hour ago' },
    { icon: '💰', message: t('admin.activity.paymentConfirmed'), time: '3 hours ago' },
    { icon: '👤', message: t('admin.activity.newCollector'), time: '5 hours ago' },
    { icon: '🏭', message: t('admin.activity.recyclerApplied'), time: '8 hours ago' },
  ])

  const [recyclers, setRecyclers] = useState([
    { id: 1, name: 'GreenCycle Solutions', status: 'Verified', location: 'Pune', authorized: true },
    { id: 2, name: 'EcoRecycle Industries', status: 'Verified', location: 'Mumbai', authorized: true },
    { id: 3, name: 'TechRecycle Solutions', status: 'Pending', location: 'Bangalore', authorized: false },
    { id: 4, name: 'E-Waste Hub', status: 'Pending', location: 'Delhi', authorized: false },
  ])

  const [users] = useState([
    { name: 'Ramesh Kumar', email: 'collector@recircle.demo', role: 'COLLECTOR', lots: 12, earnings: '₹24,500' },
    { name: 'Priya Singh', email: 'priya@recircle.demo', role: 'COLLECTOR', lots: 8, earnings: '₹16,200' },
    { name: 'GreenCycle Solutions', email: 'recycler@recircle.demo', role: 'RECYCLER', lots: 0, earnings: '₹0' },
    { name: 'Amit Patel', email: 'amit@recircle.demo', role: 'COLLECTOR', lots: 5, earnings: '₹9,800' },
  ])

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

  const statsCards = [
    { icon: FaUsers, label: t('admin.stats.collectors'), value: stats.totalCollectors, color: '#4caf50' },
    { icon: FaRecycle, label: t('admin.stats.recyclers'), value: stats.totalRecyclers, color: '#2196f3' },
    { icon: FaChartLine, label: t('admin.stats.totalLots'), value: stats.totalLots, color: '#ff9800' },
    { icon: FaMoneyBillWave, label: t('admin.stats.totalEarnings'), value: `₹${stats.totalEarnings.toLocaleString()}`, color: '#9c27b0' },
    { icon: FaCheckCircle, label: t('admin.stats.transactions'), value: stats.totalTransactions, color: '#00bcd4' },
    { icon: FaClock, label: t('admin.stats.pendingVerifications'), value: stats.pendingVerifications, color: '#f44336' },
  ]

  const handleVerifyRecycler = (id) => {
    setRecyclers(prev => prev.map(r => 
      r.id === id ? { ...r, status: 'Verified', authorized: true } : r
    ))
    toast.success('✅ Recycler verified successfully!')
  }

  const handleDeleteRecycler = (id) => {
    setRecyclers(prev => prev.filter(r => r.id !== id))
    toast.success('🗑️ Recycler removed')
  }

  const handleAddRecycler = () => {
    if (!newRecycler.companyName) {
      toast.error('Please enter company name')
      return
    }
    const newId = Math.max(...recyclers.map(r => r.id)) + 1
    setRecyclers([...recyclers, {
      id: newId,
      name: newRecycler.companyName,
      status: 'Pending',
      location: newRecycler.facilityAddress || 'Unknown',
      authorized: false
    }])
    setNewRecycler({ companyName: '', facilityAddress: '', contactPerson: '', contactPhone: '' })
    setShowAddModal(false)
    toast.success('🏭 Recycler added successfully!')
  }

  const tabs = [
    { key: 'dashboard', icon: FaHome, label: t('nav.dashboard') },
    { key: 'users', icon: FaUsers, label: t('nav.users') },
    { key: 'recyclers', icon: FaRecycle, label: t('nav.recyclers') },
    { key: 'stats', icon: FaChartLine, label: t('nav.stats') },
  ]

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>{t('admin.title')}</h1>
        <p className="text-muted">{t('admin.subtitle')}</p>
      </div>

      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => {
              window.location.href = `/admin/${tab.key === 'dashboard' ? 'dashboard' : tab.key}`
            }}
          >
            <tab.icon />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

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
                  <span className="stat-value">{stat.value}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-grid">
            <div className="card admin-section">
              <h3>{t('admin.recentActivity')}</h3>
              <div className="activity-list">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <span className="activity-icon">{activity.icon}</span>
                    <span className="activity-text">{activity.message}</span>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card admin-section">
              <h3>{t('admin.quickActions')}</h3>
              <div className="admin-actions">
                <button className="btn btn-primary btn-block" onClick={() => setShowAddModal(true)}>
                  <FaUserPlus /> {t('admin.addRecycler')}
                </button>
                <button className="btn btn-secondary btn-block">
                  <FaCheckCircle /> {t('admin.verifyRecyclers')}
                </button>
                <button className="btn btn-outline btn-block">
                  <FaUsers /> {t('admin.viewUsers')}
                </button>
                <button className="btn btn-outline btn-block" onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', price: '', active: true }); setShowCategoryModal(true) }}>
                  <FaEdit /> {t('admin.manageCategories')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="card admin-section">
          <h3>{t('nav.users')} ({users.length})</h3>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('auth.fullName')}</th>
                  <th>{t('auth.email')}</th>
                  <th>{t('auth.role')}</th>
                  <th>{t('earnings.totalLots')}</th>
                  <th>{t('earnings.totalEarnings')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => (
                  <tr key={index}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className={`badge ${u.role === 'COLLECTOR' ? 'badge-success' : 'badge-info'}`}>{u.role}</span></td>
                    <td>{u.lots}</td>
                    <td>{u.earnings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'recyclers' && (
        <div className="card admin-section recyclers-list">
          <h3>{t('admin.recyclersList')} ({recyclers.length})</h3>
          <div className="recycler-items">
            {recyclers.map((recycler) => (
              <div key={recycler.id} className="recycler-item">
                <div className="recycler-info">
                  <span className="recycler-name">{recycler.name}</span>
                  <span className="recycler-location">{recycler.location}</span>
                </div>
                <div className="recycler-actions">
                  <span className={`badge ${recycler.authorized ? 'badge-success' : 'badge-warning'}`}>
                    {recycler.status}
                  </span>
                  {!recycler.authorized && (
                    <button className="btn btn-success btn-sm" onClick={() => handleVerifyRecycler(recycler.id)}>
                      <FaCheck /> {t('admin.verify')}
                    </button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRecycler(recycler.id)}>
                    <FaTrash /> {t('admin.delete')}
                  </button>
                </div>
              </div>
            ))}
            <button className="btn btn-primary btn-block" style={{ marginTop: '12px' }} onClick={() => setShowAddModal(true)}>
              <FaUserPlus /> {t('admin.addRecycler')}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="card admin-section">
          <h3>{t('nav.stats')}</h3>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {statsCards.map((stat, index) => (
              <div key={index} className="stat-card" style={{ borderColor: stat.color }}>
                <div className="stat-icon" style={{ color: stat.color }}>
                  <stat.icon />
                </div>
                <div className="stat-content">
                  <span className="stat-label">{stat.label}</span>
                  <span className="stat-value">{stat.value}</span>
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
                  onChange={(e) => setNewRecycler({...newRecycler, companyName: e.target.value})}
                  placeholder="Enter company name"
                />
              </div>
              <div className="form-group">
                <label>{t('admin.address')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={newRecycler.facilityAddress}
                  onChange={(e) => setNewRecycler({...newRecycler, facilityAddress: e.target.value})}
                  placeholder="Enter address"
                />
              </div>
              <div className="form-group">
                <label>{t('admin.contactPerson')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={newRecycler.contactPerson}
                  onChange={(e) => setNewRecycler({...newRecycler, contactPerson: e.target.value})}
                  placeholder="Enter contact person"
                />
              </div>
              <div className="form-group">
                <label>{t('admin.contactPhone')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={newRecycler.contactPhone}
                  onChange={(e) => setNewRecycler({...newRecycler, contactPhone: e.target.value})}
                  placeholder="Enter phone number"
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
    </div>
  )
}

export default AdminDashboard
