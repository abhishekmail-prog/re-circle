import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { FaUsers, FaRecycle, FaMoneyBillWave, FaChartLine, FaCheckCircle, FaClock, FaUserPlus, FaEdit, FaTrash, FaCheck } from 'react-icons/fa'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const { user } = useAuth()
  const [stats] = useState({
    totalCollectors: 5,
    totalRecyclers: 4,
    totalLots: 25,
    totalTransactions: 18,
    totalEarnings: 45000,
    pendingVerifications: 2
  })
  const [recentActivity] = useState([
    { icon: '📝', message: 'New lot created by Ramesh Kumar (Collector)', time: '5 min ago' },
    { icon: '✅', message: 'Recycler GreenCycle Solutions verified', time: '1 hour ago' },
    { icon: '💰', message: 'Payment confirmed for lot RC-2024-0005', time: '3 hours ago' },
    { icon: '👤', message: 'New collector registered: Priya Singh', time: '5 hours ago' },
    { icon: '🏭', message: 'Recycler TechRecycle Solutions applied for verification', time: '8 hours ago' },
  ])
  const [recyclers, setRecyclers] = useState([
    { id: 1, name: 'GreenCycle Solutions', status: 'Verified', location: 'Pune', authorized: true },
    { id: 2, name: 'EcoRecycle Industries', status: 'Verified', location: 'Mumbai', authorized: true },
    { id: 3, name: 'TechRecycle Solutions', status: 'Pending', location: 'Bangalore', authorized: false },
    { id: 4, name: 'E-Waste Hub', status: 'Pending', location: 'Delhi', authorized: false },
  ])
  const [collectors] = useState([
    { name: 'Ramesh Kumar', email: 'collector@recircle.demo', lots: 12, earnings: '₹24,500' },
    { name: 'Priya Singh', email: 'priya@recircle.demo', lots: 8, earnings: '₹16,200' },
    { name: 'Amit Patel', email: 'amit@recircle.demo', lots: 5, earnings: '₹9,800' },
  ])
  const [categories, setCategories] = useState([
    { id: 1, name: 'CRT', price: 120, active: true },
    { id: 2, name: 'LCD Panel', price: 150, active: true },
    { id: 3, name: 'PCB', price: 500, active: true },
    { id: 4, name: 'Cable', price: 350, active: true },
    { id: 5, name: 'Battery', price: 100, active: true },
    { id: 6, name: 'Motor', price: 250, active: true },
    { id: 7, name: 'Mixed plastic', price: 50, active: true },
    { id: 8, name: 'Mobile phone', price: 800, active: true },
    { id: 9, name: 'Laptop', price: 900, active: true },
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

  const handleVerifyRecycler = (id) => {
    const updated = recyclers.map(r => 
      r.id === id ? { ...r, status: 'Verified', authorized: true } : r
    )
    setRecyclers(updated)
  }

  const handleDeleteRecycler = (id) => {
    const updated = recyclers.filter(r => r.id !== id)
    setRecyclers(updated)
  }

  const handleAddRecycler = () => {
    if (!newRecycler.companyName) {
      alert('Please enter company name')
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
  }

  const handleAddCategory = () => {
    if (!categoryForm.name || !categoryForm.price) {
      alert('Please fill in all fields')
      return
    }
    const newCategory = {
      id: Math.max(...categories.map(c => c.id)) + 1,
      name: categoryForm.name,
      price: parseFloat(categoryForm.price),
      active: true
    }
    setCategories([...categories, newCategory])
    setCategoryForm({ name: '', price: '', active: true })
    setShowCategoryModal(false)
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    setCategoryForm({ name: category.name, price: category.price, active: category.active })
    setShowCategoryModal(true)
  }

  const handleUpdateCategory = () => {
    if (!categoryForm.name || !categoryForm.price) {
      alert('Please fill in all fields')
      return
    }
    setCategories(prev => prev.map(c => 
      c.id === editingCategory.id 
        ? { ...c, name: categoryForm.name, price: parseFloat(categoryForm.price), active: categoryForm.active }
        : c
    ))
    setCategoryForm({ name: '', price: '', active: true })
    setEditingCategory(null)
    setShowCategoryModal(false)
  }

  const handleDeleteCategory = (id) => {
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  const statsCards = [
    { icon: FaUsers, label: 'Collectors', value: stats.totalCollectors, color: '#4caf50' },
    { icon: FaRecycle, label: 'Recyclers', value: stats.totalRecyclers, color: '#2196f3' },
    { icon: FaChartLine, label: 'Total Lots', value: stats.totalLots, color: '#ff9800' },
    { icon: FaMoneyBillWave, label: 'Total Earnings', value: `₹${stats.totalEarnings.toLocaleString()}`, color: '#9c27b0' },
    { icon: FaCheckCircle, label: 'Transactions', value: stats.totalTransactions, color: '#00bcd4' },
    { icon: FaClock, label: 'Pending Verifications', value: stats.pendingVerifications, color: '#f44336' },
  ]

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>👑 Admin Dashboard</h1>
        <p className="text-muted">Platform overview and management</p>
      </div>

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
          <h3>🔄 Recent Activity</h3>
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
          <h3>⚙️ Quick Actions</h3>
          <div className="admin-actions">
            <button className="btn btn-primary btn-block" onClick={() => setShowAddModal(true)}>
              <FaUserPlus /> Add Recycler
            </button>
            <button className="btn btn-secondary btn-block">
              <FaCheckCircle /> Verify Recyclers
            </button>
            <button className="btn btn-outline btn-block">
              <FaUsers /> View All Users
            </button>
            <button className="btn btn-outline btn-block" onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', price: '', active: true }); setShowCategoryModal(true) }}>
              <FaEdit /> Manage Categories
            </button>
          </div>
        </div>

        <div className="card admin-section recyclers-list">
          <h3>🏭 Recyclers</h3>
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
                      <FaCheck /> Verify
                    </button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRecycler(recycler.id)}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card admin-section collectors-list">
          <h3>👤 Top Collectors</h3>
          <div className="collector-items">
            {collectors.map((collector, index) => (
              <div key={index} className="collector-item">
                <div className="collector-info">
                  <span className="collector-name">{collector.name}</span>
                  <span className="collector-email">{collector.email}</span>
                </div>
                <div className="collector-stats">
                  <span className="collector-lots">{collector.lots} lots</span>
                  <span className="collector-earnings">{collector.earnings}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card admin-section categories-list">
          <h3>📦 Material Categories</h3>
          <div className="category-items">
            {categories.map((category) => (
              <div key={category.id} className="category-item">
                <div className="category-info">
                  <span className="category-name">{category.name}</span>
                  <span className="category-price">₹{category.price}/kg</span>
                </div>
                <div className="category-actions">
                  <span className={`badge ${category.active ? 'badge-success' : 'badge-danger'}`}>
                    {category.active ? 'Active' : 'Inactive'}
                  </span>
                  <button className="btn btn-primary btn-sm" onClick={() => handleEditCategory(category)}>
                    <FaEdit />
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCategory(category.id)}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
            <button className="btn btn-primary btn-block" onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', price: '', active: true }); setShowCategoryModal(true) }}>
              <FaUserPlus /> Add Category
            </button>
          </div>
        </div>
      </div>

      {/* Add Recycler Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏭 Add Recycler</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={newRecycler.companyName}
                  onChange={(e) => setNewRecycler({...newRecycler, companyName: e.target.value})}
                  placeholder="Enter company name"
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  className="form-control"
                  value={newRecycler.facilityAddress}
                  onChange={(e) => setNewRecycler({...newRecycler, facilityAddress: e.target.value})}
                  placeholder="Enter address"
                />
              </div>
              <div className="form-group">
                <label>Contact Person</label>
                <input
                  type="text"
                  className="form-control"
                  value={newRecycler.contactPerson}
                  onChange={(e) => setNewRecycler({...newRecycler, contactPerson: e.target.value})}
                  placeholder="Enter contact person"
                />
              </div>
              <div className="form-group">
                <label>Contact Phone</label>
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
                  <FaUserPlus /> Add Recycler
                </button>
                <button className="btn btn-outline btn-block" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCategory ? '✏️ Edit Category' : '📦 Add Category'}</h3>
              <button className="modal-close" onClick={() => setShowCategoryModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g., PCB"
                />
              </div>
              <div className="form-group">
                <label>Price (₹/kg)</label>
                <input
                  type="number"
                  className="form-control"
                  value={categoryForm.price}
                  onChange={(e) => setCategoryForm({ ...categoryForm, price: e.target.value })}
                  placeholder="e.g., 500"
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={categoryForm.active}
                    onChange={(e) => setCategoryForm({ ...categoryForm, active: e.target.checked })}
                  /> Active
                </label>
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary btn-block" onClick={editingCategory ? handleUpdateCategory : handleAddCategory}>
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </button>
                <button className="btn btn-outline btn-block" onClick={() => setShowCategoryModal(false)}>
                  Cancel
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
