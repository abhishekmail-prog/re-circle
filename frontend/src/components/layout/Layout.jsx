import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import { useOffline } from '../../context/OfflineContext'

const Layout = () => {
  const { isOnline, pendingSyncCount, syncNow, isSyncing } = useOffline()

  return (
    <div className="app">
      {!isOnline && (
        <div className="offline-banner" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <span>📡 You are offline</span>
          {pendingSyncCount > 0 && (
            <span>
              • {pendingSyncCount} items pending sync
              <button className="sync-btn" onClick={syncNow} disabled={isSyncing}>
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </span>
          )}
        </div>
      )}
      {isOnline && pendingSyncCount > 0 && (
        <div className="offline-banner" style={{ background: '#ff8f00', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <span>🔄 {pendingSyncCount} items ready to sync</span>
          <button className="sync-btn" onClick={syncNow} disabled={isSyncing}>
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      )}
      <main className="main-content">
        <Outlet />
      </main>
      <Navbar />
    </div>
  )
}

export default Layout
