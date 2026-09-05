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

  useEffect(() => {
    if (id) {
      fetchLotDetails()
    } else {
      setLoading(false)
      toast.error('Invalid lot ID')
      navigate('/dashboard')
    }
  }, [id])

  const fetchLotDetails = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/lots/${id}`)
      setLot(response.data)
    } catch (error) {
      console.error('❌ Failed to fetch lot:', error)
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

  const buildTraceabilityEvents = () => {
    if (!lot) return []
    
    const events = []
    
    events.push({
      status: 'CREATED',
      timestamp: lot.createdAt ? new Date(lot.createdAt).toLocaleString() : 'N/A',
      actor: 'Collector',
      message: t('lotDetail.createdEvent'),
      icon: '📝',
      color: '#2196f3'
    })
    
    if (lot.selectedRecycler || lot.status === 'MATCHED') {
      events.push({
        status: 'MATCHED',
        timestamp: lot.updatedAt ? new Date(lot.updatedAt).toLocaleString() : 'N/A',
        actor: 'System',
        message: t('lotDetail.matchedEvent', { name: lot.selectedRecycler?.companyName || 'Recycler' }),
        icon: '🤝',
        color: '#ff9800'
      })
    }
    
    if (lot.status === 'HANDED_OVER' || lot.status === 'RECEIVED' || lot.status === 'PAYMENT_PENDING' || lot.status === 'PAID' || lot.status === 'COMPLETED') {
      events.push({
        status: 'HANDED_OVER',
        timestamp: lot.handoverAt ? new Date(lot.handoverAt).toLocaleString() : 'N/A',
        actor: 'Recycler',
        message: t('lotDetail.handoverEvent', { location: lot.collectionAddress || 'collection point' }),
        icon: '📦',
        color: '#4caf50'
      })
    }
    
    if (lot.status === 'PAID' || lot.status === 'COMPLETED') {
      events.push({
        status: 'PAID',
        timestamp: lot.completedAt ? new Date(lot.completedAt).toLocaleString() : 'N/A',
        actor: 'System',
        message: t('lotDetail.paymentEvent', { amount: lot.finalValue?.toFixed(2) || 'N/A' }),
        icon: '💰',
        color: '#4caf50'
      })
    }
    
    if (lot.status === 'COMPLETED') {
      events.push({
        status: 'COMPLETED',
        timestamp: lot.completedAt ? new Date(lot.completedAt).toLocaleString() : 'N/A',
        actor: 'System',
        message: t('lotDetail.completedEvent'),
        icon: '🎉',
        color: '#4caf50'
      })
    }
    
    return events
  }

  if (loading) {
    return <div className="loading-state">{t('common.loading')}</div>
  }

  if (!lot) {
    return <div className="error-state">Lot not found</div>
  }

  return (
    <div className="lot-detail-page">
      <button className="btn btn-outline btn-sm" onClick={() => navigate('/dashboard')}>
        {t('lotDetail.back')}
      </button>

      <div className="lot-header">
        <h1 className="page-title">{t('lotDetail.title')}</h1>
        <span className={`badge ${getStatusBadge(lot.status)}`}>
          {lot.status || 'CREATED'}
        </span>
      </div>

      <div className="lot-info-grid">
        <div className="card lot-info-card">
          <div className="card-header">
            <span className="card-title">{t('lotDetail.basicInfo')}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('lotDetail.lotId')}</span>
            <span className="info-value">{lot.lotId || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('lotDetail.material')}</span>
            <span className="info-value">{lot.materialCategory?.name || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('lotDetail.weight')}</span>
            <span className="info-value">{lot.weightKg || 0} kg</span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('lotDetail.condition')}</span>
            <span className="info-value">{lot.condition || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('lotDetail.source')}</span>
            <span className="info-value">{lot.sourceType || 'N/A'}</span>
          </div>
        </div>

        <div className="card lot-info-card">
          <div className="card-header">
            <span className="card-title">{t('lotDetail.valueInfo')}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('lotDetail.estimatedValue')}</span>
            <span className="info-value">₹{lot.estimatedValue?.toFixed(2) || 'N/A'}</span>
          </div>
          {lot.finalValue && (
            <div className="info-row highlight">
              <span className="info-label">{t('lotDetail.finalValue')}</span>
              <span className="info-value">₹{lot.finalValue?.toFixed(2) || 'N/A'}</span>
            </div>
          )}
          {lot.netEarnings && (
            <div className="info-row highlight">
              <span className="info-label">{t('lotDetail.netEarnings')}</span>
              <span className="info-value">₹{lot.netEarnings?.toFixed(2) || 'N/A'}</span>
            </div>
          )}
          {lot.transportCost && (
            <div className="info-row">
              <span className="info-label">{t('lotDetail.transportCost')}</span>
              <span className="info-value">₹{lot.transportCost?.toFixed(2) || 'N/A'}</span>
            </div>
          )}
        </div>

        <div className="card lot-info-card">
          <div className="card-header">
            <span className="card-title">{t('lotDetail.location')}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('lotDetail.collectionAddress')}</span>
            <span className="info-value">{lot.collectionAddress || 'N/A'}</span>
          </div>
          {lot.collectionLatitude && lot.collectionLongitude && (
            <div className="info-row">
              <span className="info-label">{t('lotDetail.coordinates')}</span>
              <span className="info-value">
                {lot.collectionLatitude}, {lot.collectionLongitude}
              </span>
            </div>
          )}
        </div>

        <div className="card lot-info-card">
          <div className="card-header">
            <span className="card-title">{t('lotDetail.timeline')}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('lotDetail.created')}</span>
            <span className="info-value">
              {lot.createdAt ? new Date(lot.createdAt).toLocaleString() : 'N/A'}
            </span>
          </div>
          {lot.handoverAt && (
            <div className="info-row">
              <span className="info-label">{t('lotDetail.handover')}</span>
              <span className="info-value">
                {new Date(lot.handoverAt).toLocaleString()}
              </span>
            </div>
          )}
          {lot.completedAt && (
            <div className="info-row">
              <span className="info-label">{t('lotDetail.completed')}</span>
              <span className="info-value">
                {new Date(lot.completedAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {lot.selectedRecycler && (
        <div className="card recycler-info">
          <h3>{t('lotDetail.recyclerInfo')}</h3>
          <div className="info-row">
            <span className="info-label">{t('lotDetail.recycler')}</span>
            <span className="info-value">{lot.selectedRecycler.companyName || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('lotDetail.contact')}</span>
            <span className="info-value">{lot.selectedRecycler.contactPerson || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('lotDetail.phone')}</span>
            <span className="info-value">{lot.selectedRecycler.contactPhone || 'N/A'}</span>
          </div>
          {lot.offeredPricePerKg && (
            <div className="info-row">
              <span className="info-label">{t('lotDetail.offeredPrice')}</span>
              <span className="info-value">₹{lot.offeredPricePerKg}/kg</span>
            </div>
          )}
        </div>
      )}

      <div className="card qr-section">
        <div className="qr-header">
          <h3>{t('lotDetail.qrCode')}</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowQR(!showQR)}>
            {showQR ? t('lotDetail.hideQR') : t('lotDetail.showQR')}
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
              <p>{t('lotDetail.qrInstruction')}</p>
              <p className="text-muted">{t('lotDetail.qrSubInstruction')}</p>
            </div>
          </div>
        )}
      </div>

      <div className="card traceability-section">
        <h3>{t('lotDetail.traceability')}</h3>
        <TraceabilityTimeline events={buildTraceabilityEvents()} />
      </div>
    </div>
  )
}

export default LotDetail
