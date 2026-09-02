import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import QRCodeComponent from '../components/common/QRCode'
import TraceabilityTimeline from '../components/common/TraceabilityTimeline'
import './LotDetail.css'

const LotDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lot, setLot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)

  // Demo traceability events
  const demoEvents = [
    { status: 'CREATED', timestamp: new Date(Date.now() - 3600000).toISOString(), actor: 'Collector: Ramesh Kumar', message: 'Lot created' },
    { status: 'MATCHED', timestamp: new Date(Date.now() - 1800000).toISOString(), actor: 'System', message: 'Matched with GreenCycle' },
    { status: 'PICKUP_SCHEDULED', timestamp: new Date(Date.now() - 900000).toISOString(), actor: 'Recycler', message: 'Pickup scheduled for tomorrow' },
  ]

  useEffect(() => {
    fetchLotDetails()
  }, [id])

  const fetchLotDetails = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/lots/${id}`)
      setLot(response.data)
    } catch (error) {
      console.error('Failed to fetch lot:', error)
      toast.error('Failed to load lot details')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'CREATED': 'badge-info',
      'MATCHED': 'badge-warning',
      'PICKUP_SCHEDULED': 'badge-warning',
      'IN_TRANSIT': 'badge-warning',
      'HANDED_OVER': 'badge-success',
      'RECEIVED': 'badge-success',
      'PAYMENT_PENDING': 'badge-warning',
      'PAID': 'badge-success',
      'COMPLETED': 'badge-success'
    }
    return statusMap[status] || 'badge-info'
  }

  if (loading) {
    return <div className="loading-state">Loading lot details...</div>
  }

  if (!lot) {
    return <div className="error-state">Lot not found</div>
  }

  return (
    <div className="lot-detail-page">
      <button className="btn btn-outline btn-sm" onClick={() => navigate('/dashboard')}>
        ← Back to Dashboard
      </button>

      <div className="lot-header">
        <h1 className="page-title">📋 Lot Details</h1>
        <span className={`badge ${getStatusBadge(lot.status)}`}>
          {lot.status || 'CREATED'}
        </span>
      </div>

      <div className="lot-info-grid">
        <div className="card lot-info-card">
          <div className="card-header">
            <span className="card-title">📌 Basic Information</span>
          </div>
          <div className="info-row">
            <span className="info-label">Lot ID</span>
            <span className="info-value">{lot.lotId || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Material</span>
            <span className="info-value">{lot.materialCategory?.name || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Weight</span>
            <span className="info-value">{lot.weightKg || 0} kg</span>
          </div>
          <div className="info-row">
            <span className="info-label">Condition</span>
            <span className="info-value">{lot.condition || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Source</span>
            <span className="info-value">{lot.sourceType || 'N/A'}</span>
          </div>
        </div>

        <div className="card lot-info-card">
          <div className="card-header">
            <span className="card-title">💰 Value Information</span>
          </div>
          <div className="info-row">
            <span className="info-label">Estimated Value</span>
            <span className="info-value">₹{lot.estimatedValue?.toFixed(2) || 'N/A'}</span>
          </div>
          {lot.finalValue && (
            <div className="info-row highlight">
              <span className="info-label">Final Value</span>
              <span className="info-value">₹{lot.finalValue?.toFixed(2) || 'N/A'}</span>
            </div>
          )}
          {lot.netEarnings && (
            <div className="info-row highlight">
              <span className="info-label">Net Earnings</span>
              <span className="info-value">₹{lot.netEarnings?.toFixed(2) || 'N/A'}</span>
            </div>
          )}
          {lot.transportCost && (
            <div className="info-row">
              <span className="info-label">Transport Cost</span>
              <span className="info-value">₹{lot.transportCost?.toFixed(2) || 'N/A'}</span>
            </div>
          )}
        </div>

        <div className="card lot-info-card">
          <div className="card-header">
            <span className="card-title">📍 Location</span>
          </div>
          <div className="info-row">
            <span className="info-label">Collection Address</span>
            <span className="info-value">{lot.collectionAddress || 'N/A'}</span>
          </div>
          {lot.collectionLatitude && lot.collectionLongitude && (
            <div className="info-row">
              <span className="info-label">Coordinates</span>
              <span className="info-value">
                {lot.collectionLatitude}, {lot.collectionLongitude}
              </span>
            </div>
          )}
        </div>

        <div className="card lot-info-card">
          <div className="card-header">
            <span className="card-title">📅 Timeline</span>
          </div>
          <div className="info-row">
            <span className="info-label">Created</span>
            <span className="info-value">
              {lot.createdAt ? new Date(lot.createdAt).toLocaleString() : 'N/A'}
            </span>
          </div>
          {lot.handoverAt && (
            <div className="info-row">
              <span className="info-label">Handover</span>
              <span className="info-value">
                {new Date(lot.handoverAt).toLocaleString()}
              </span>
            </div>
          )}
          {lot.completedAt && (
            <div className="info-row">
              <span className="info-label">Completed</span>
              <span className="info-value">
                {new Date(lot.completedAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {lot.recycler && (
        <div className="card recycler-info">
          <h3>🏭 Recycler Information</h3>
          <div className="info-row">
            <span className="info-label">Recycler</span>
            <span className="info-value">{lot.recycler.companyName || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Contact</span>
            <span className="info-value">{lot.recycler.contactPerson || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Phone</span>
            <span className="info-value">{lot.recycler.contactPhone || 'N/A'}</span>
          </div>
        </div>
      )}

      <div className="card qr-section">
        <div className="qr-header">
          <h3>📱 QR Code for Handover</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowQR(!showQR)}>
            {showQR ? 'Hide QR Code' : 'Show QR Code'}
          </button>
        </div>
        
        {showQR && (
          <div className="qr-display">
            <QRCodeComponent 
              value={lot.lotId || 'N/A'} 
              size={250}
              showDownload={true}
            />
            <div className="qr-instructions">
              <p>📌 Show this QR code to the recycler during handover</p>
              <p className="text-muted">The recycler will scan this to confirm receipt</p>
            </div>
          </div>
        )}
      </div>

      <div className="card traceability-section">
        <h3>📋 Traceability Timeline</h3>
        <TraceabilityTimeline events={demoEvents} />
      </div>
    </div>
  )
}

export default LotDetail
