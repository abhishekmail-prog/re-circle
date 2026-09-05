import React from 'react'
import './TraceabilityTimeline.css'

const TraceabilityTimeline = ({ events }) => {

  if (!events || events.length === 0) {
    return (
      <div className="traceability-empty">
        <p>{t('lotDetail.noEvents')}</p>
      </div>
    )
  }

  return (
    <div className="traceability-timeline">
      {events.map((event, index) => (
        <div key={index} className="timeline-item">
          <div className="timeline-icon" style={{ background: event.color || getStatusColor(event.status) }}>
            <span>{event.icon || getDefaultIcon(event.status)}</span>
          </div>
          <div className="timeline-content">
            <div className="timeline-header">
              <span className="timeline-status">{event.status}</span>
              <span className="timeline-time">{event.timestamp || 'N/A'}</span>
            </div>
            <div className="timeline-details">
              <span className="timeline-actor">👤 {event.actor || 'System'}</span>
              {event.message && (
                <span className="timeline-message">{event.message}</span>
              )}
              {event.location && (
                <span className="timeline-location">📍 {event.location}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const getDefaultIcon = (status) => {
  const icons = {
    'CREATED': '📝',
    'MATCHED': '🤝',
    'PICKUP_SCHEDULED': '🚚',
    'IN_TRANSIT': '🚛',
    'HANDED_OVER': '📦',
    'RECEIVED': '✅',
    'PAYMENT_PENDING': '⏳',
    'PAID': '💰',
    'COMPLETED': '🎉'
  }
  return icons[status] || '🔄'
}

const getStatusColor = (status) => {
  const colors = {
    'CREATED': '#2196f3',
    'MATCHED': '#ff9800',
    'PICKUP_SCHEDULED': '#ff9800',
    'IN_TRANSIT': '#ff9800',
    'HANDED_OVER': '#4caf50',
    'RECEIVED': '#4caf50',
    'PAYMENT_PENDING': '#ff9800',
    'PAID': '#4caf50',
    'COMPLETED': '#4caf50'
  }
  return colors[status] || '#999'
}

export default TraceabilityTimeline
