import React from 'react'
import { useWebSocket } from '../../context/WebSocketContext'

const WebSocketStatus = () => {
  const { connected } = useWebSocket()

  return (
    <div className="websocket-status" style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      background: connected ? '#e8f5e9' : '#fce4ec',
      color: connected ? '#2e7d32' : '#c62828'
    }}>
      <span style={{ fontSize: '14px' }}>{connected ? '🟢' : '🔴'}</span>
      <span>{connected ? 'Live' : 'Connecting...'}</span>
    </div>
  )
}

export default WebSocketStatus
