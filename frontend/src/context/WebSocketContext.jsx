import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuth } from './AuthContext'
import { WS_URL } from '../config'

const WebSocketContext = createContext()

export const useWebSocket = () => useContext(WebSocketContext)

export const WebSocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState([])
  const stompClientRef = useRef(null)
  // Force a state change so consumers get the new client after connect
  const [clientVersion, setClientVersion] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) return

    const socket = new SockJS(`${WS_URL}/ws`)

    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: () => {
        // Quiet — noisy in dev
      },
      onConnect: () => {
        setConnected(true)
        console.log('✅ WebSocket connected')
        setClientVersion((v) => v + 1)

        // Global topics that feed notifications (not the main feed)
        const notifyTopic = (topic, label) => {
          client.subscribe(topic, (message) => {
            try {
              const data = JSON.parse(message.body)
              console.log(`${label}:`, data)
              setNotifications((prev) => {
                const item = { ...data, id: Date.now() + Math.random(), read: false }
                return [item, ...prev].slice(0, 50)
              })
            } catch (e) {
              console.warn(`Failed to parse ${topic} message`, e)
            }
          })
        }

        notifyTopic('/topic/recyclers', '🏭 Recycler')
        notifyTopic('/topic/handovers', '📦 Handover')
        notifyTopic('/topic/earnings', '💰 Earnings')
        notifyTopic('/topic/payments', '💵 Payment')
        notifyTopic('/topic/admin', '👑 Admin')
        notifyTopic('/topic/collector', '👤 Collector')
        notifyTopic('/topic/recycler', '🏭 Recycler')
      },
      onDisconnect: () => {
        setConnected(false)
        console.log('❌ WebSocket disconnected')
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame)
        setConnected(false)
      }
    })

    client.activate()
    stompClientRef.current = client

    return () => {
      setConnected(false)
      try {
        client.deactivate()
      } catch (e) {
        // ignore
      }
      stompClientRef.current = null
    }
  }, [isAuthenticated])

  // Memoize the value so consumers don't re-render on every notification
  // Minimal stub — some pages read realtimeData.stats. Not wired to anything
  // live anymore; each page fetches its own data.
  const realtimeDataStub = useMemo(() => ({ stats: null }), [])

  const value = useMemo(
    () => ({
      client: stompClientRef.current,
      connected,
      notifications,
      realtimeData: realtimeDataStub,
      isWebSocketAvailable: true,
      clientVersion
    }),
    [connected, notifications, clientVersion, realtimeDataStub]
  )

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}
