import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react'
import { OfflineDB } from '../services/db'
import api from '../api/axios'

const OfflineContext = createContext()

export const useOffline = () => useContext(OfflineContext)

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  // syncDone increments after every successful sync — components can
  // useEffect on it to refetch their data.
  const [syncDone, setSyncDone] = useState(0)

  // Refs keep the effect closures reading the current values
  const syncingRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const checkPendingCount = useCallback(async () => {
    try {
      const count = await OfflineDB.getPendingCount()
      if (mountedRef.current) setPendingSyncCount(count)
      return count
    } catch (error) {
      console.warn('Failed to check pending count:', error)
      if (mountedRef.current) setPendingSyncCount(0)
      return 0
    }
  }, [])

  const autoSync = useCallback(async () => {
    if (syncingRef.current) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) return

    let count = 0
    try {
      count = await OfflineDB.getPendingCount()
    } catch (error) {
      console.warn('Failed to get pending count for sync:', error)
      return
    }
    if (count === 0) return

    syncingRef.current = true
    if (mountedRef.current) setIsSyncing(true)

    try {
      const pendingActions = await OfflineDB.getPendingActions()
      let syncedCount = 0
      let failedCount = 0

      for (const action of pendingActions) {
        try {
          const body = action.data || action.payload

          if (!body) {
            console.warn('Skipping action with no payload:', action)
            await OfflineDB.deleteSyncedAction(action.id)
            continue
          }

          if (action.type === 'CREATE_LOT') {
            const response = await api.post('/lots', body)
            console.log('✅ Synced lot:', response.data?.lotId || response.data)
          } else {
            console.warn('Unknown offline action type:', action.type, action)
          }

          await OfflineDB.deleteSyncedAction(action.id)
          syncedCount++
        } catch (error) {
          console.error('❌ Failed to sync action:', action.id, error?.response?.data || error.message)
          failedCount++
        }
      }

      const remaining = await OfflineDB.getPendingCount()
      if (mountedRef.current) {
        setPendingSyncCount(remaining)
        if (syncedCount > 0 && failedCount === 0) {
          setSyncDone((n) => n + 1)
        }
      }

      if (syncedCount > 0 && failedCount === 0) {
        console.log(`✅ Synced ${syncedCount} item(s) successfully`)
      } else if (syncedCount > 0 && failedCount > 0) {
        console.warn(`⚠️ ${syncedCount} synced, ${failedCount} failed`)
      } else if (failedCount > 0) {
        console.error(`❌ Failed to sync ${failedCount} item(s)`)
      }
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      syncingRef.current = false
      if (mountedRef.current) setIsSyncing(false)
    }
  }, [])

  const syncNow = useCallback(async () => {
    if (syncingRef.current) {
      console.log('Sync already in progress...')
      return
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('Cannot sync while offline')
      return
    }
    await autoSync()
  }, [autoSync])

  const addPendingAction = useCallback(
    async (action) => {
      try {
        await OfflineDB.addPendingAction(action)
        await checkPendingCount()
        console.log('📥 Queued offline action:', action.type)

        // If we're already online, try to flush immediately
        if (navigator.onLine) {
          setTimeout(() => autoSync(), 800)
        }
      } catch (error) {
        console.warn('Failed to add pending action:', error)
      }
    },
    [autoSync, checkPendingCount]
  )

  // ─── Bootstrap + listeners ──────────────────────────────────
  useEffect(() => {
    checkPendingCount()

    const handleOnline = async () => {
      console.log('🟢 Browser reports ONLINE')
      if (mountedRef.current) setIsOnline(true)
      // Brief delay lets the network stack settle before we fire requests
      setTimeout(() => autoSync(), 800)
    }

    const handleOffline = () => {
      console.log('🔴 Browser reports OFFLINE')
      if (mountedRef.current) setIsOnline(false)
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        // Catch the case where we came back online while tab was hidden
        setTimeout(() => autoSync(), 500)
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', handleVisibility)

    // Safety net — every 20s, if online and queue has items, flush
    const interval = setInterval(() => {
      if (navigator.onLine) autoSync()
    }, 20000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibility)
      clearInterval(interval)
    }
  }, [autoSync, checkPendingCount])

  const value = {
    isOnline,
    pendingSyncCount,
    isSyncing,
    syncDone,
    syncNow,
    addPendingAction,
    checkPendingCount,
    autoSync
  }

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  )
}
