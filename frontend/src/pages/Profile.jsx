import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import './Profile.css'

const Profile = () => {
  const { user, login } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phoneNumber: user?.phoneNumber || '',
    email: user?.email || '',
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Update profile via API
      const response = await api.put('/users/profile', {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber
      })
      
      // Update user in context
      const updatedUser = { ...user, ...response.data }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      toast.success('Profile updated successfully!')
      setIsEditing(false)
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile: ' + (error.response?.data || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="profile-page">
      <h1 className="page-title">👤 Profile</h1>
      
      <div className="card profile-card">
        <div className="profile-avatar">
          <div className="avatar-placeholder">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
        </div>
        
        {!isEditing ? (
          <>
            <div className="profile-info">
              <h2>{user?.fullName || 'User'}</h2>
              <p className="profile-role">
                <span className={`badge ${user?.role === 'COLLECTOR' ? 'badge-success' : 
                  user?.role === 'RECYCLER' ? 'badge-info' : 'badge-warning'}`}>
                  {user?.role || 'User'}
                </span>
              </p>
            </div>

            <div className="profile-details">
              <div className="detail-item">
                <span className="detail-label">📧 Email</span>
                <span className="detail-value">{user?.email || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">📱 Phone</span>
                <span className="detail-value">{user?.phoneNumber || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">📅 Member Since</span>
                <span className="detail-value">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }) : 'N/A'}
                </span>
              </div>
            </div>

            <button className="btn btn-primary btn-block" onClick={() => setIsEditing(true)}>
              ✏️ Edit Profile
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="profile-edit-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                className="form-control"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                className="form-control"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <small>Email cannot be changed</small>
            </div>
            <div className="flex gap-2" style={{ gap: '8px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : '💾 Save Changes'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card settings-card">
        <h3>⚙️ Settings</h3>
        <div className="setting-item">
          <span>🌐 Language</span>
          <span className="setting-value">English</span>
        </div>
        <div className="setting-item">
          <span>🔔 Notifications</span>
          <span className="setting-value">Enabled</span>
        </div>
        <div className="setting-item">
          <span>📱 App Version</span>
          <span className="setting-value">1.0.0</span>
        </div>
      </div>
    </div>
  )
}

export default Profile
