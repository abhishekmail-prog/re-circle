import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const WebSocketContext = createContext()

export const useWebSocket = () => useContext(WebSocketContext)

export const WebSocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [isWsSupported, setIsWsSupported] = useState(true)

  useEffect(() => {
    // Check if WebSocket is supported
    if (typeof WebSocket === 'undefined') {
      setIsWsSupported(false)
      console.log('WebSocket not supported, using polling fallback')
      return
    }

    if (!isAuthenticated) return

    let ws = null
    let reconnectTimer = null

    const connect = () => {
      try {
        // Try to connect to WebSocket
        ws = new WebSocket('ws://localhost:8080/ws')

        ws.onopen = () => {
          setConnected(true)
          console.log('✅ WebSocket connected')
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            handleNotification(data)
          } catch (e) {
            console.error('Failed to parse message:', e)
          }
        }

        ws.onclose = () => {
          setConnected(false)
          console.log('❌ WebSocket disconnected')
          // Try to reconnect after 5 seconds
          reconnectTimer = setTimeout(connect, 5000)
        }

        ws.onerror = (error) => {
          console.warn('WebSocket error:', error)
          setConnected(false)
        }
      } catch (error) {
        console.warn('WebSocket connection failed:', error)
        setConnected(false)
        // Try to reconnect after 5 seconds
        reconnectTimer = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      if (ws) {
        try {
          ws.close()
        } catch (e) {
          // Ignore
        }
      }
    }
  }, [isAuthenticated])

  const handleNotification = (data) => {
    setNotifications(prev => [data, ...prev].slice(0, 20))
    
    if (data.type === 'STATUS_UPDATE') {
      toast.info(`📋 Status updated: ${data.data?.status || 'N/A'}`)
    }
  }

  const sendStatusUpdate = (update) => {
    // In this simplified version, we just log
    console.log('Status update (WebSocket not fully implemented):', update)
  }

  const sendHandoverUpdate = (update) => {
    console.log('Handover update (WebSocket not fully implemented):', update)
  }

  const value = {
    connected,
    notifications,
    sendStatusUpdate,
    sendHandoverUpdate,
    isWebSocketAvailable: isWsSupported
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}
