import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTranslation } from '../../hooks/useTranslation'
import { 
  FaHome, FaCamera, FaMoneyBillWave, FaRecycle, FaWallet, 
  FaShieldAlt, FaUser, FaSignOutAlt, FaBox, FaChartLine, FaUsers,
  FaCheckCircle, FaGlobe
} from 'react-icons/fa'
import './Navbar.css'

const Navbar = () => {
  const { user, logout } = useAuth()
  const { language, changeLanguage } = useLanguage()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showLanguageMenu, setShowLanguageMenu] = React.useState(false)
  const menuRef = React.useRef(null)

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowLanguageMenu(false)
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
          <div className="language-switcher-wrapper" ref={menuRef}>
            <button 
              className="language-toggle-btn"
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            >
              <FaGlobe className="lang-icon" />
              <span>{currentLanguage.flag} {currentLanguage.label}</span>
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
