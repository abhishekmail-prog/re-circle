import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useTranslation } from '../hooks/useTranslation'
import { useAuth } from '../context/AuthContext'
import QRCodeComponent from '../components/common/QRCode'
import TraceabilityTimeline from '../components/common/TraceabilityTimeline'
import CopyButton from '../components/common/CopyButton'
import BidPanel from '../components/common/BidPanel'
import AuctionTimer from '../components/common/AuctionTimer'
import { FaCheck } from 'react-icons/fa'
import './LotDetail.css'

const LotDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [lot, setLot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)

  const fetchLotDetails = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const response = await api.get(`/lots/${id}`)
      console.log('Lot details:', response.data)
      setLot(response.data)
    } catch (error) {
      console.error('Failed to fetch lot:', error)
      setLot({
        lotId: id,
        status: 'CREATED',
        materialCategory: { name: 'PCB' },
        weightKg: 5,
        condition: 'GOOD',
        sourceType: 'HOUSEHOLD',
        estimatedValue: 2500
      })
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchLotDetails()
    } else {
      setLoading(false)
      navigate('/dashboard')
    }
  }, [id, fetchLotDetails, navigate])

  const getStatusBadge = (status) => {
    const statusMap = {
      CREATED: 'badge-info',
      BIDDING: 'badge-warning',
      MATCHED: 'badge-warning',
      PICKUP_SCHEDULED: 'badge-warning',
      IN_TRANSIT: 'badge-warning',
      HANDED_OVER: 'badge-success',
      RECEIVED: 'badge-success',
      PAYMENT_PENDING: 'badge-warning',
      PAID: 'badge-success',
      COMPLETED: 'badge-success'
    }
    return statusMap[status] || 'badge-info'
  }

  const timelineEvents = lot?.events || [
    {
      status: lot?.status || 'CREATED',
      timestamp: lot?.createdAt
        ? new Date(lot.createdAt).toLocaleString()
        : new Date().toLocaleString(),
      actor: lot?.collector?.fullName || 'Collector',
      icon: '📝'
    }
  ]

  // Pre-composed share text for WhatsApp / SMS / anywhere.
  const buildShareText = () => {
    if (!lot) return ''
    const material = lot.materialCategory?.name || lot.materialCategoryName || '—'
    const weight = lot.weightKg || 0
    return `${t('app.name')} — Lot ${lot.lotId}\n${t('lotDetail.material')}: ${material}\n${t('lotDetail.weight')}: ${weight} kg`
  }

  if (loading) {
    return <div className="loading-state">{t('common.loading')}</div>
  }

  if (!lot) {
    return <div className="error-state">{t('common.noData')}</div>
  }

  return (
    <div className="lot-detail-page">
      <button
        className="btn btn-outline btn-sm"
        onClick={() => navigate('/dashboard')}
      >
        {t('lotDetail.back')}
      </button>

      <div className="lot-header">
        <h1 className="page-title">{t('lotDetail.title')}</h1>
        <span className={`badge ${getStatusBadge(lot.status)}`}>
          {lot.status || 'CREATED'}
        </span>
      </div>

      {lot.imageUrl && (
        <div className="card" style={{ marginBottom: '16px', padding: '12px' }}>
          <img
            src={
              lot.imageUrl.startsWith('http')
                ? lot.imageUrl
                : `http://localhost:8080${lot.imageUrl}`
            }
            alt={lot.lotId}
            style={{
              width: '100%',
              maxHeight: '360px',
              objectFit: 'contain',
              borderRadius: '8px',
              background: '#f5f5f5'
            }}
          />
        </div>
      )}

      <div className="lot-info-grid">
        <div className="card lot-info-card">
          <div className="card-header">
            <span className="card-title">{t('lotDetail.basicInfo')}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('lotDetail.lotId')}</span>
            <span className="info-value info-value-row">
              <span className="lot-id-text">{lot.lotId || 'N/A'}</span>
              {lot.lotId && (
                <CopyButton
                  value={lot.lotId}
                  shareText={buildShareText()}
                  size="sm"
                  showShare={true}
                />
              )}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('lotDetail.material')}</span>
            <span className="info-value">
              {lot.materialCategory?.name || lot.materialCategoryName || 'N/A'}
            </span>
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
            <span className="info-value">
              ₹{lot.estimatedValue?.toFixed(2) || 'N/A'}
            </span>
          </div>
          {lot.finalValue != null && (
            <div className="info-row">
              <span className="info-label">{t('lotDetail.finalValue')}</span>
              <span className="info-value">₹{lot.finalValue.toFixed(2)}</span>
            </div>
          )}
          {lot.netEarnings != null && (
            <div className="info-row highlight">
              <span className="info-label">{t('lotDetail.netEarnings')}</span>
              <span className="info-value">₹{lot.netEarnings.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="card qr-section" style={{ marginTop: '16px' }}>
        <div className="card-header">
          <span className="card-title">{t('lotDetail.qrCode')}</span>
        </div>
        <p className="text-muted">{t('lotDetail.qrInstruction')}</p>
        <p className="text-muted">{t('lotDetail.qrSubInstruction')}</p>
        <button
          className="btn btn-primary"
          onClick={() => setShowQR(!showQR)}
        >
          {showQR ? t('lotDetail.hideQR') : t('lotDetail.showQR')}
        </button>
        {showQR && lot.lotId && (
          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <QRCodeComponent value={lot.lotId} size={220} showDownload={true} />
            <CopyButton
              value={lot.lotId}
              shareText={buildShareText()}
              size="md"
              showShare={true}
            />
          </div>
        )}
      </div>

      {(lot.status === 'BIDDING' || lot.status === 'CREATED') && lot.auctionEndsAt && (
        <AuctionTimer endsAt={lot.auctionEndsAt} status={lot.status} />
      )}

      {lot.status === 'BIDDING' && (
        user?.userId === lot.collector?.id ||
        user?.id === lot.collector?.id ||
        user?.email === lot.collector?.email ||
        user?.email === lot.collector?.username ||
        user?.username === lot.collector?.email
      ) && (
        <div style={{ marginBottom: '12px', textAlign: 'right' }}>
          <button
            className="btn btn-primary"
            onClick={async () => {
              if (!window.confirm(t('auction.closeConfirm'))) return
              try {
                const res = await api.post(`/lots/${lot.lotId}/close-auction`)
                if (res.data && res.data.deleted) {
                  navigate('/dashboard')
                  return
                }
                fetchLotDetails()
              } catch (err) {
                console.error('Close auction failed:', err)
                alert(err && err.response && err.response.data && err.response.data.error ? err.response.data.error : 'Close failed')
              }
            }}
          >
            <FaCheck /> {t('auction.closeNow')}
          </button>
        </div>
      )}

      {lot.status === 'CREATED' || lot.status === 'BIDDING' || lot.status === 'MATCHED' ? (
        <BidPanel lot={lot} onLotUpdated={fetchLotDetails} />
      ) : null}

      <div className="card timeline-section" style={{ marginTop: '16px' }}>
        <div className="card-header">
          <span className="card-title">{t('lotDetail.traceability')}</span>
        </div>
        <TraceabilityTimeline events={timelineEvents} />
      </div>
    </div>
  )
}

export default LotDetail
