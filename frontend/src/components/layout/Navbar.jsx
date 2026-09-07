import React, { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTranslation } from '../../hooks/useTranslation'
import { useWebSocket } from '../../context/WebSocketContext'
import { useOffline } from '../../context/OfflineContext'
import { 
  FaHome, FaCamera, FaMoneyBillWave, FaRecycle, FaWallet, 
  FaShieldAlt, FaUser, FaSignOutAlt, FaBox, FaChartLine, FaUsers,
  FaCheckCircle, FaGlobe, FaBell, FaWifi, FaSync
} from 'react-icons/fa'
import './Navbar.css'

const Navbar = () => {
  const { user, logout } = useAuth()
  const { language, changeLanguage } = useLanguage()
  const { t } = useTranslation()
  const { notifications, connected } = useWebSocket()
  const { isOnline, pendingSyncCount, isSyncing, syncNow } = useOffline()
  const navigate = useNavigate()
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const menuRef = useRef(null)
  const notificationRef = useRef(null)
  
  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowLanguageMenu(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userRole = user?.role || 'COLLECTOR'

  const collectorNavItems = [
    { path: '/dashboard', icon: FaHome, label: t('nav.dashboard') },
    { path: '/create-lot', icon: FaCamera, label: t('nav.createLot') },
    { path: '/prices', icon: FaMoneyBillWave, label: t('nav.prices') },
    { path: '/recyclers', icon: FaRecycle, label: t('nav.recyclers') },
    { path: '/earnings', icon: FaWallet, label: t('nav.earnings') },
    { path: '/safety', icon: FaShieldAlt, label: t('nav.safety') },
    { path: '/profile', icon: FaUser, label: t('nav.profile') },
  ]

  const recyclerNavItems = [
    { path: '/recycler/dashboard', icon: FaHome, label: t('nav.dashboard') },
    { path: '/recycler/lots', icon: FaBox, label: t('nav.lots') },
    { path: '/recycler/handovers', icon: FaCheckCircle, label: t('nav.handovers') },
    { path: '/recycler/earnings', icon: FaWallet, label: t('nav.earnings') },
    { path: '/profile', icon: FaUser, label: t('nav.profile') },
  ]

  const adminNavItems = [
    { path: '/admin/dashboard', icon: FaHome, label: t('nav.dashboard') },
    { path: '/admin/users', icon: FaUsers, label: t('nav.users') },
    { path: '/admin/recyclers', icon: FaRecycle, label: t('nav.recyclers') },
    { path: '/admin/stats', icon: FaChartLine, label: t('nav.stats') },
    { path: '/profile', icon: FaUser, label: t('nav.profile') },
  ]

  const getNavItems = () => {
    switch(userRole) {
      case 'RECYCLER': return recyclerNavItems
      case 'ADMIN': return adminNavItems
      default: return collectorNavItems
    }
  }

  const navItems = getNavItems()

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
  ]

  const currentLanguage = languages.find(l => l.code === language) || languages[0]

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'LOT_CREATED': return '📝'
      case 'RECYCLER_SELECTED': return '🤝'
      case 'HANDOVER_CONFIRMED': return '✅'
      case 'RECYCLER_VERIFIED': return '🏭'
      case 'PAYMENT_UPDATED': return '💰'
      case 'EARNINGS_UPDATED': return '📊'
      default: return '📌'
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-items">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </div>
        <div className="navbar-footer">
          {/* Offline Status */}
          <div className="offline-status" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: '500',
            background: isOnline ? '#e8f5e9' : '#fce4ec',
            color: isOnline ? '#2e7d32' : '#c62828'
          }}>
            <span style={{ fontSize: '12px' }}>{isOnline ? '🟢' : '🔴'}</span>
            <span>{isOnline ? 'Online' : 'Offline'}</span>
            {isOnline && pendingSyncCount > 0 && (
              <button 
                onClick={syncNow} 
                disabled={isSyncing}
                style={{
                  background: '#ff8f00',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0 8px',
                  fontSize: '9px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                <FaSync size={8} />
                {pendingSyncCount}
              </button>
            )}
          </div>

          {/* Notification Bell */}
          <div className="notification-wrapper" ref={notificationRef}>
            <button 
              className="notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <FaBell className="bell-icon" />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <button className="mark-read-btn">Mark all read</button>
                  )}
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="no-notifications">No notifications</div>
                  ) : (
                    notifications.slice(0, 10).map((notif, index) => (
                      <div key={index} className={`notification-item ${notif.read ? 'read' : 'unread'}`}>
                        <span className="notif-icon">{getNotificationIcon(notif.type)}</span>
                        <div className="notif-content">
                          <div className="notif-message">
                            {notif.type === 'LOT_CREATED' && `New lot created: ${notif.data?.lotId || 'N/A'}`}
                            {notif.type === 'RECYCLER_SELECTED' && `Recycler selected for lot: ${notif.data?.lotId || 'N/A'}`}
                            {notif.type === 'HANDOVER_CONFIRMED' && `Handover confirmed for lot: ${notif.data?.lotId || 'N/A'}`}
                            {notif.type === 'RECYCLER_VERIFIED' && `Recycler verified: ${notif.data?.companyName || 'N/A'}`}
                            {notif.type === 'PAYMENT_UPDATED' && `Payment updated for lot: ${notif.data?.lotId || 'N/A'}`}
                            {notif.type === 'EARNINGS_UPDATED' && `Earnings updated!`}
                            {!notif.type && 'Update received'}
                          </div>
                          <div className="notif-time">
                            {notif.timestamp ? new Date(notif.timestamp).toLocaleTimeString() : 'Just now'}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {connected && notifications.length > 0 && (
                  <div className="notification-footer">
                    <span className="live-indicator">🔴 Live</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="language-switcher-wrapper" ref={menuRef}>
            <button 
              className="language-toggle-btn"
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            >
              <FaGlobe className="lang-icon" />
              <span>{currentLanguage.flag}</span>
              <span className="lang-arrow">{showLanguageMenu ? '▲' : '▼'}</span>
            </button>
            {showLanguageMenu && (
              <div className="language-menu-dropdown">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`language-menu-item ${language === lang.code ? 'active' : ''}`}
                    onClick={() => {
                      changeLanguage(lang.code)
                      setShowLanguageMenu(false)
                    }}
                  >
                    <span className="lang-flag">{lang.flag}</span>
                    <span className="lang-name">{lang.label}</span>
                    {language === lang.code && <span className="lang-check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <FaSignOutAlt className="nav-icon" />
            <span className="nav-label">{t('nav.logout')}</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
