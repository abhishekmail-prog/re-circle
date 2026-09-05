import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../hooks/useTranslation'
import './Auth.css'

const Register = () => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    role: 'COLLECTOR'
  })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await register(formData)
    setLoading(false)
    if (result.success) {
      navigate('/')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">♻️</div>
          <h1>{t('app.name')}</h1>
          <p className="auth-subtitle">{t('auth.registerTitle')}</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>{t('auth.fullName')}</label>
            <input type="text" name="fullName" className="form-control" value={formData.fullName} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>{t('auth.email')}</label>
            <input type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>{t('auth.phoneNumber')}</label>
            <input type="tel" name="phoneNumber" className="form-control" value={formData.phoneNumber} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>{t('auth.password')}</label>
            <input type="password" name="password" className="form-control" value={formData.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>{t('auth.role')}</label>
            <select name="role" className="form-control" value={formData.role} onChange={handleChange}>
              <option value="COLLECTOR">{t('auth.collector')}</option>
              <option value="RECYCLER">{t('auth.recycler')}</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? t('common.loading') : t('auth.register')}
          </button>
        </form>
        <p className="auth-footer">
          {t('auth.haveAccount')} <Link to="/login">{t('auth.loginHere')}</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
