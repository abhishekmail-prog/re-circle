import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useTranslation } from '../hooks/useTranslation'
import toast from 'react-hot-toast'
import './Profile.css'

const Profile = () => {
  const { user } = useAuth()
  const { language, changeLanguage } = useLanguage()
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)
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
    toast.success(t('profile.save'))
    setIsEditing(false)
  }

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
  ]

  return (
    <div className="profile-page">
      <h1 className="page-title">{t('profile.title')}</h1>
      
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
                <span className={`badge ${user?.role === 'COLLECTOR' ? 'badge-success' : user?.role === 'RECYCLER' ? 'badge-info' : 'badge-warning'}`}>
                  {user?.role || 'User'}
                </span>
              </p>
            </div>

            <div className="profile-details">
              <div className="detail-item">
                <span className="detail-label">{t('profile.email')}</span>
                <span className="detail-value">{user?.email || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{t('profile.phone')}</span>
                <span className="detail-value">{user?.phoneNumber || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{t('profile.memberSince')}</span>
                <span className="detail-value">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{t('profile.language')}</span>
                <span className="detail-value">
                  <select 
                    className="language-select"
                    value={language}
                    onChange={(e) => changeLanguage(e.target.value)}
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.label}
                      </option>
                    ))}
                  </select>
                </span>
              </div>
            </div>

            <button className="btn btn-primary btn-block" onClick={() => setIsEditing(true)}>
              {t('profile.edit')}
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="profile-edit-form">
            <div className="form-group">
              <label>{t('auth.fullName')}</label>
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
              <label>{t('auth.phoneNumber')}</label>
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
              <label>{t('auth.email')}</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                disabled
                style={{ opacity: 0.6 }}
              />
              <small>Email cannot be changed</small>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">{t('profile.save')}</button>
              <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>
                {t('profile.cancel')}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card settings-card">
        <h3>{t('profile.settings')}</h3>
        <div className="setting-item">
          <span>{t('profile.language')}</span>
          <span className="setting-value">
            <select 
              className="language-select"
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </span>
        </div>
        <div className="setting-item">
          <span>{t('profile.notifications')}</span>
          <span className="setting-value">{t('profile.enabled')}</span>
        </div>
        <div className="setting-item">
          <span>{t('profile.appVersion')}</span>
          <span className="setting-value">1.0.0</span>
        </div>
      </div>
    </div>
  )
}

export default Profile
