import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const WebSocketContext = createContext()

export const useWebSocket = () => useContext(WebSocketContext)

export const WebSocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState([])

  // Simple polling fallback instead of WebSocket
  useEffect(() => {
    if (!isAuthenticated) return

    // Simulate WebSocket connection
    setConnected(true)
    console.log('✅ WebSocket simulation connected')

    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      // Simulate notifications
      const randomUpdate = Math.random() > 0.7
      if (randomUpdate) {
        const notification = {
          type: 'STATUS_UPDATE',
          data: { status: 'UPDATED', timestamp: new Date().toISOString() },
          timestamp: Date.now()
        }
        setNotifications(prev => [notification, ...prev].slice(0, 20))
        toast.info('🔄 Status update received')
      }
    }, 30000)

    return () => {
      clearInterval(interval)
      setConnected(false)
    }
  }, [isAuthenticated])

  const sendStatusUpdate = (update) => {
    console.log('📤 Status update:', update)
  }

  const sendHandoverUpdate = (update) => {
    console.log('📤 Handover update:', update)
  }

  const value = {
    connected,
    notifications,
    sendStatusUpdate,
    sendHandoverUpdate,
    isWebSocketAvailable: false
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}
