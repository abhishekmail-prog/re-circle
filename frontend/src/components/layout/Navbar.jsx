import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { 
  FaHome, FaCamera, FaMoneyBillWave, FaRecycle, FaWallet, 
  FaShieldAlt, FaUser, FaSignOutAlt, FaBox, FaChartLine, FaUsers,
  FaCheckCircle, FaClock
} from 'react-icons/fa'
import './Navbar.css'

const Navbar = () => {
  const { user, logout } = useAuth()
  const { language, changeLanguage } = useLanguage()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userRole = user?.role || 'COLLECTOR'

  // Collector navigation items
  const collectorNavItems = [
    { path: '/dashboard', icon: FaHome, label: 'Home' },
    { path: '/create-lot', icon: FaCamera, label: 'Create' },
    { path: '/prices', icon: FaMoneyBillWave, label: 'Prices' },
    { path: '/recyclers', icon: FaRecycle, label: 'Recyclers' },
    { path: '/earnings', icon: FaWallet, label: 'Earnings' },
    { path: '/safety', icon: FaShieldAlt, label: 'Safety' },
    { path: '/profile', icon: FaUser, label: 'Profile' },
  ]

  // Recycler navigation items
  const recyclerNavItems = [
    { path: '/recycler/dashboard', icon: FaHome, label: 'Home' },
    { path: '/recycler/lots', icon: FaBox, label: 'Lots' },
    { path: '/recycler/handovers', icon: FaCheckCircle, label: 'Handovers' },
    { path: '/recycler/earnings', icon: FaWallet, label: 'Earnings' },
    { path: '/profile', icon: FaUser, label: 'Profile' },
  ]

  // Admin navigation items
  const adminNavItems = [
    { path: '/admin/dashboard', icon: FaHome, label: 'Home' },
    { path: '/admin/users', icon: FaUsers, label: 'Users' },
    { path: '/admin/recyclers', icon: FaRecycle, label: 'Recyclers' },
    { path: '/admin/stats', icon: FaChartLine, label: 'Stats' },
    { path: '/profile', icon: FaUser, label: 'Profile' },
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
    { code: 'en', label: '🇬🇧' },
    { code: 'hi', label: '🇮🇳' },
    { code: 'mr', label: '🇮🇳' },
  ]

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
          <div className="language-switcher">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`lang-btn ${language === lang.code ? 'active' : ''}`}
                onClick={() => changeLanguage(lang.code)}
              >
                {lang.label}
              </button>
            ))}
          </div>
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <FaSignOutAlt className="nav-icon" />
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
