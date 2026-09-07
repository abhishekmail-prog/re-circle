import React, { createContext, useState, useContext, useEffect } from 'react'
import { OfflineDB } from '../services/db'
import api from '../api/axios'
import toast from 'react-hot-toast'

const OfflineContext = createContext()

export const useOffline = () => useContext(OfflineContext)

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const checkPending = async () => {
      try {
        const count = await OfflineDB.getPendingCount()
        setPendingSyncCount(count)
      } catch (error) {
        console.warn('Failed to check pending count:', error)
        setPendingSyncCount(0)
      }
    }
    checkPending()

    const handleOnline = async () => {
      setIsOnline(true)
      toast.success('📶 You are back online!')
      await autoSync()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('📶 You are offline. Some features will work offline.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const interval = setInterval(async () => {
      if (navigator.onLine && !isSyncing) {
        try {
          const count = await OfflineDB.getPendingCount()
          if (count > 0) {
            await autoSync()
          }
        } catch (error) {
          console.warn('Interval sync check failed:', error)
        }
      }
    }, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const checkPendingCount = async () => {
    try {
      const count = await OfflineDB.getPendingCount()
      setPendingSyncCount(count)
      return count
    } catch (error) {
      console.warn('Failed to check pending count:', error)
      setPendingSyncCount(0)
      return 0
    }
  }

  const autoSync = async () => {
    if (isSyncing || !navigator.onLine) return

    try {
      const count = await OfflineDB.getPendingCount()
      if (count === 0) return
    } catch (error) {
      console.warn('Failed to get pending count for sync:', error)
      return
    }

    setIsSyncing(true)
    try {
      const pendingActions = await OfflineDB.getPendingActions()
      let syncedCount = 0
      let failedCount = 0

      for (const action of pendingActions) {
        try {
          if (action.type === 'CREATE_LOT') {
            const response = await api.post('/lots', action.data)
            console.log('✅ Synced lot:', response.data)
          }
          await OfflineDB.deleteSyncedAction(action.id)
          syncedCount++
        } catch (error) {
          console.error('Failed to sync action:', action.id, error)
          failedCount++
        }
      }

      const remaining = await OfflineDB.getPendingCount()
      setPendingSyncCount(remaining)

      if (syncedCount > 0 && failedCount === 0) {
        toast.success(`✅ ${syncedCount} item(s) synced successfully!`)
      } else if (syncedCount > 0 && failedCount > 0) {
        toast.warning(`⚠️ ${syncedCount} synced, ${failedCount} failed`)
      } else if (failedCount > 0) {
        toast.error(`❌ Failed to sync ${failedCount} item(s)`)
      }
    } catch (error) {
      console.error('Sync failed:', error)
      toast.error('Sync failed. Please try again.')
    } finally {
      setIsSyncing(false)
    }
  }

  const syncNow = async () => {
    if (isSyncing) {
      toast.info('Sync already in progress...')
      return
    }
    if (!navigator.onLine) {
      toast.error('Cannot sync while offline. Please connect to the internet.')
      return
    }
    await autoSync()
  }

  const addPendingAction = async (action) => {
    try {
      await OfflineDB.addPendingAction(action)
      await checkPendingCount()

      if (navigator.onLine) {
        setTimeout(autoSync, 1000)
      }
    } catch (error) {
      console.warn('Failed to add pending action:', error)
      toast.error('Failed to save offline. Please try again.')
    }
  }

  const value = {
    isOnline,
    pendingSyncCount,
    isSyncing,
    syncNow,
    addPendingAction,
    checkPendingCount,
  }

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  )
}
