import React, { createContext, useState, useContext, useEffect } from 'react'
import toast from 'react-hot-toast'

const OfflineContext = createContext()

export const useOffline = () => useContext(OfflineContext)

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const syncNow = async () => {
    if (isSyncing || !isOnline) return
    
    setIsSyncing(true)
    try {
      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 2000))
      setPendingSyncCount(0)
      toast.success('Synced successfully!')
    } catch (error) {
      toast.error('Sync failed. Please try again.')
    } finally {
      setIsSyncing(false)
    }
  }

  const addPendingAction = async (action) => {
    setPendingSyncCount(prev => prev + 1)
    // In a real app, this would save to IndexedDB
    console.log('Pending action added:', action)
  }

  const value = {
    isOnline,
    pendingSyncCount,
    isSyncing,
    syncNow,
    addPendingAction,
  }

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  )
}
