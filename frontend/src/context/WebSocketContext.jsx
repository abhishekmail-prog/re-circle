import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const WebSocketContext = createContext()

export const useWebSocket = () => useContext(WebSocketContext)

export const WebSocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState([])
  const stompClient = useRef(null)

  useEffect(() => {
    if (!isAuthenticated) return

    const connect = () => {
      try {
        // Create SockJS connection
        const socket = new SockJS('http://localhost:8080/ws')
        
        stompClient.current = new Client({
          webSocketFactory: () => socket,
          reconnectDelay: 5000,
          debug: (str) => {
            if (str.includes('Opening Web Socket')) {
              console.log('🔌 WebSocket: Connecting...')
            } else if (str.includes('Connected')) {
              console.log('✅ WebSocket: Connected!')
            } else if (str.includes('closed')) {
              console.log('❌ WebSocket: Disconnected')
            }
          },
          onConnect: () => {
            setConnected(true)
            console.log('✅ WebSocket connected!')
            toast.success('🔌 Real-time connection established!')
            
            // Subscribe to topics
            stompClient.current.subscribe('/topic/lots', (message) => {
              try {
                const data = JSON.parse(message.body)
                console.log('📦 Lot update:', data)
                handleNotification(data)
              } catch (e) {
                console.error('Failed to parse message:', e)
              }
            })

            stompClient.current.subscribe('/topic/recyclers', (message) => {
              try {
                const data = JSON.parse(message.body)
                console.log('🏭 Recycler update:', data)
                handleNotification(data)
              } catch (e) {
                console.error('Failed to parse message:', e)
              }
            })

            stompClient.current.subscribe('/topic/handovers', (message) => {
              try {
                const data = JSON.parse(message.body)
                console.log('📦 Handover update:', data)
                handleNotification(data)
              } catch (e) {
                console.error('Failed to parse message:', e)
              }
            })

            stompClient.current.subscribe('/topic/payments', (message) => {
              try {
                const data = JSON.parse(message.body)
                console.log('💰 Payment update:', data)
                handleNotification(data)
              } catch (e) {
                console.error('Failed to parse message:', e)
              }
            })

            stompClient.current.subscribe('/topic/pong', (message) => {
              try {
                const data = JSON.parse(message.body)
                console.log('🏓 Pong:', data)
              } catch (e) {
                console.error('Failed to parse message:', e)
              }
            })
          },
          onDisconnect: () => {
            setConnected(false)
            console.log('❌ WebSocket disconnected')
          },
          onStompError: (frame) => {
            console.error('STOMP error:', frame)
            setConnected(false)
          }
        })

        stompClient.current.activate()
      } catch (error) {
        console.warn('WebSocket connection failed:', error)
      }
    }

    connect()

    return () => {
      if (stompClient.current) {
        try {
          stompClient.current.deactivate()
        } catch (e) {
          console.warn('Error deactivating WebSocket:', e)
        }
      }
    }
  }, [isAuthenticated])

  const handleNotification = (data) => {
    const notification = {
      ...data,
      id: Date.now(),
      read: false
    }
    setNotifications(prev => [notification, ...prev].slice(0, 50))
  }

  const value = {
    connected,
    notifications,
    isWebSocketAvailable: true
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}
