import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../hooks/useTranslation'
import './Auth.css'

const Login = () => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.success) {
      setTimeout(() => {
        navigate('/', { replace: true })
      }, 100)
    }
  }

  const fillCredentials = (emailVal, passwordVal) => {
    setEmail(emailVal)
    setPassword(passwordVal)
  }

  const demoAccounts = [
    { email: 'collector@recircle.demo', password: 'Collector@123', label: '🟢 ' + t('auth.collector') },
    { email: 'recycler@recircle.demo', password: 'Recycler@123', label: '🔵 ' + t('auth.recycler') },
    { email: 'admin@recircle.demo', password: 'Admin@123', label: '🔴 ' + t('auth.admin') },
  ]

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">♻️</div>
          <h1>{t('app.name')}</h1>
          <p className="auth-subtitle">{t('app.tagline')}</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>{t('auth.email')}</label>
            <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>{t('auth.password')}</label>
            <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? t('common.loading') : t('auth.login')}
          </button>
        </form>
        <p className="auth-footer">
          {t('auth.noAccount')} <Link to="/register">{t('auth.registerHere')}</Link>
        </p>
        <div className="demo-credentials">
          <p style={{ fontWeight: 600, marginBottom: '12px', color: '#2e7d32' }}>{t('auth.demoCredentials')}</p>
          <div className="demo-grid">
            {demoAccounts.map((acc, idx) => (
              <div key={idx} className="demo-item clickable" onClick={() => fillCredentials(acc.email, acc.password)}>
                <strong>{acc.label}</strong>
                <span className="demo-email">{acc.email}</span>
                <span className="demo-hint">{t('auth.clickToFill')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
