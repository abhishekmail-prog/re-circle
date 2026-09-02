import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.success) {
      // Force reload to root
      window.location.href = '/'
    }
  }

  const fill = (e, p) => { setEmail(e); setPassword(p) }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">♻️</div>
          <h1>RE-CIRCLE</h1>
          <p className="auth-subtitle">Kabadiwala Connect</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="demo-credentials">
          <p style={{ fontWeight: 600, marginBottom: '12px', color: '#2e7d32' }}>Click to auto-fill:</p>
          <div className="demo-grid">
            <div className="demo-item clickable" onClick={() => fill('collector@recircle.demo', 'Collector@123')}>
              <strong>🟢 Collector</strong>
              <span className="demo-email">collector@recircle.demo</span>
            </div>
            <div className="demo-item clickable" onClick={() => fill('recycler@recircle.demo', 'Recycler@123')}>
              <strong>🔵 Recycler</strong>
              <span className="demo-email">recycler@recircle.demo</span>
            </div>
            <div className="demo-item clickable" onClick={() => fill('admin@recircle.demo', 'Admin@123')}>
              <strong>🔴 Admin</strong>
              <span className="demo-email">admin@recircle.demo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
