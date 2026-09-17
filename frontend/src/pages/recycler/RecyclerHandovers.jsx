import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import api from '../../api/axios'
import {
  FaCheckCircle,
  FaClock,
  FaMoneyBillWave,
  FaWeightHanging,
  FaQrcode,
  FaSync,
  FaHourglassHalf
} from 'react-icons/fa'
import QRScanner from '../../components/common/QRScanner'
import './RecyclerDashboard.css'

const RecyclerHandovers = () => {
  const { t } = useTranslation()
  const [handovers, setHandovers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedHandover, setSelectedHandover] = useState(null)
  const [showHandoverModal, setShowHandoverModal] = useState(false)
  const [verifiedWeight, setVerifiedWeight] = useState('')
  const [finalPrice, setFinalPrice] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('PAID')
  const [submitting, setSubmitting] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [scanError, setScanError] = useState(null)

  const fetchHandovers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/lots/recycler/pending-handovers')
      setHandovers(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      console.error('Failed to load handovers:', e)
      setError(t('common.error'))
      setHandovers([])
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchHandovers()
  }, [fetchHandovers])

  const handleConfirmHandover = (handover) => {
    setSelectedHandover(handover)
    const wt = handover.weightKg ?? 0
    setVerifiedWeight(String(wt))
    const pricePerKg =
      handover.estimatedValue && wt ? handover.estimatedValue / wt : 0
    const initialTotal = Math.round(pricePerKg * wt) || 0
    setFinalPrice(String(initialTotal))
    setShowHandoverModal(true)
  }

  const handleScanResult = async (decodedText) => {
    setShowScanner(false)
    setScanError(null)

    let lotId = decodedText
    const match = decodedText.match(/(RC-\d{4}-\d+)/)
    if (match) lotId = match[1]

    let found = handovers.find(
      (h) => (h.lotId || '').toUpperCase() === lotId.toUpperCase()
    )

    if (!found) {
      try {
        const res = await api.get(`/lots/lot/${lotId}`)
        const lot = res.data
        if (lot && lot.lotId) {
          setHandovers((prev) =>
            prev.some((h) => h.lotId === lot.lotId) ? prev : [lot, ...prev]
          )
          found = lot
        }
      } catch (e) {
        // fall through
      }
    }

    if (!found) {
      setScanError(t('scanner.lotNotFound') + ` (${lotId})`)
      setTimeout(() => setScanError(null), 4000)
      return
    }

    handleConfirmHandover(found)
  }

  const handleSubmitHandover = async () => {
    if (!selectedHandover) return

    const vWeight = parseFloat(verifiedWeight)
    const fPrice = parseFloat(finalPrice)

    if (!vWeight || vWeight <= 0) {
      console.error('Please enter a valid verified weight')
      return
    }
    if (!fPrice || fPrice <= 0) {
      console.error('Please enter a valid final price')
      return
    }

    setSubmitting(true)
    try {
      await api.post(`/lots/${selectedHandover.lotId}/handover`, {
        verifiedWeight: vWeight,
        finalPrice: fPrice,
        paymentStatus
      })
      console.log(t('recyclerHandovers.handoverSuccess', { amount: fPrice }))
      await fetchHandovers()
      setShowHandoverModal(false)
      setSelectedHandover(null)
    } catch (e) {
      console.error('Handover submit failed:', e)
      setHandovers((prev) =>
        prev.map((h) =>
          h.lotId === selectedHandover.lotId
            ? {
                ...h,
                status: paymentStatus === 'PAID' ? 'PAID' : 'PAYMENT_PENDING',
                verifiedWeightKg: vWeight,
                finalValue: fPrice,
                updatedAt: new Date().toISOString()
              }
            : h
        )
      )
      setShowHandoverModal(false)
      setSelectedHandover(null)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      MATCHED: 'badge-warning',
      HANDED_OVER: 'badge-warning',
      PAYMENT_PENDING: 'badge-info',
      PAID: 'badge-success',
      COMPLETED: 'badge-success'
    }
    return statusMap[status] || 'badge-info'
  }

  const isPending = (s) =>
    s === 'MATCHED' || s === 'HANDED_OVER' || s === 'PAYMENT_PENDING'
  const isPaid = (s) => s === 'PAID' || s === 'COMPLETED'
  const amountOf = (h) =>
    Number(h.finalValue) || Number(h.estimatedValue) || 0

  const stats = {
    total: handovers.length,
    pending: handovers.filter((h) => isPending(h.status)).length,
    completed: handovers.filter((h) => isPaid(h.status)).length,
    pendingAmount: handovers
      .filter((h) => isPending(h.status))
      .reduce((sum, h) => sum + amountOf(h), 0),
    totalSpent: handovers
      .filter((h) => isPaid(h.status))
      .reduce((sum, h) => sum + amountOf(h), 0)
  }

  return (
    <div className="recycler-dashboard">
      <div className="dashboard-header">
        <h1>{t('recyclerHandovers.title')}</h1>
        <p className="text-muted">{t('recyclerHandovers.subtitle')}</p>
      </div>

      <div
        className="stats-grid"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
      >
        <div className="stat-card" style={{ borderColor: '#2196f3' }}>
          <div className="stat-icon" style={{ color: '#2196f3' }}>
            <FaCheckCircle />
          </div>
          <div className="stat-content">
            <span className="stat-label">{t('recyclerHandovers.total')}</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: '#ff9800' }}>
          <div className="stat-icon" style={{ color: '#ff9800' }}>
            <FaClock />
          </div>
          <div className="stat-content">
            <span className="stat-label">{t('recyclerHandovers.pending')}</span>
            <span className="stat-value">{stats.pending}</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: '#4caf50' }}>
          <div className="stat-icon" style={{ color: '#4caf50' }}>
            <FaCheckCircle />
          </div>
          <div className="stat-content">
            <span className="stat-label">{t('recyclerHandovers.completed')}</span>
            <span className="stat-value">{stats.completed}</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: '#ff5722' }}>
          <div className="stat-icon" style={{ color: '#ff5722' }}>
            <FaHourglassHalf />
          </div>
          <div className="stat-content">
            <span className="stat-label">
              {t('recyclerHandovers.pendingCommitment')}
            </span>
            <span className="stat-value">
              ₹{stats.pendingAmount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: '#9c27b0' }}>
          <div className="stat-icon" style={{ color: '#9c27b0' }}>
            <FaMoneyBillWave />
          </div>
          <div className="stat-content">
            <span className="stat-label">
              {t('recyclerHandovers.totalSpent')}
            </span>
            <span className="stat-value">
              ₹{stats.totalSpent.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          margin: '16px 0',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <button
          className="btn btn-primary"
          onClick={() => setShowScanner(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <FaQrcode /> {t('scanner.scanButton')}
        </button>
        <button
          className="btn btn-outline"
          onClick={fetchHandovers}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <FaSync /> {t('common.retry')}
        </button>
      </div>

      {scanError && (
        <div
          style={{
            background: '#fff3e0',
            color: '#b71c1c',
            padding: '10px 16px',
            borderRadius: '8px',
            marginBottom: '12px'
          }}
        >
          {scanError}
        </div>
      )}

      {error && (
        <div
          style={{
            background: '#ffebee',
            color: '#b71c1c',
            padding: '10px 16px',
            borderRadius: '8px',
            marginBottom: '12px'
          }}
        >
          {error}
        </div>
      )}

      <div className="card incoming-lots">
        <h3>
          {t('recyclerHandovers.title')} ({handovers.length})
        </h3>
        {loading ? (
          <div className="empty-state">
            <p>{t('common.loading')}</p>
          </div>
        ) : handovers.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '48px' }}>📭</span>
            <p>{t('recyclerHandovers.noHandovers')}</p>
          </div>
        ) : (
          <div className="lots-list">
            {handovers.map((h) => (
              <div key={h.id || h.lotId} className="lot-item">
                <div className="lot-info">
                  <span className="lot-id">{h.lotId}</span>
                  <span className="lot-material">
                    {h.materialCategory?.name || h.materialCategoryName || '—'}
                  </span>
                  <span className="lot-weight">{h.weightKg} kg</span>
                  {h.verifiedWeightKg && (
                    <span className="lot-verified">
                      ✅ {h.verifiedWeightKg} kg{' '}
                      {t('recyclerHandovers.verifiedWeight')}
                    </span>
                  )}
                  <span className="lot-collector">
                    👤 {h.collector?.fullName || h.collectorName || '—'}
                  </span>
                </div>
                <div className="lot-actions">
                  <span className={`badge ${getStatusBadge(h.status)}`}>
                    {h.status}
                  </span>
                  {(h.status === 'MATCHED' || h.status === 'HANDED_OVER') && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleConfirmHandover(h)}
                    >
                      <FaWeightHanging />{' '}
                      {t('recyclerHandovers.completeHandover')}
                    </button>
                  )}
                  {h.status === 'PAYMENT_PENDING' && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleConfirmHandover(h)}
                    >
                      <FaMoneyBillWave />{' '}
                      {t('recyclerHandovers.confirmPayment')}
                    </button>
                  )}
                  {(h.status === 'PAID' || h.status === 'COMPLETED') &&
                    h.finalValue && (
                      <span className="badge badge-success">
                        ₹{h.finalValue}
                      </span>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showHandoverModal && selectedHandover && (
        <div
          className="modal-overlay"
          onClick={() => setShowHandoverModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('recyclerHandovers.completeHandover')}</h3>
              <button
                className="modal-close"
                onClick={() => setShowHandoverModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-details">
                <div className="modal-row">
                  <span className="modal-label">{t('lotDetail.lotId')}:</span>
                  <span className="modal-value">{selectedHandover.lotId}</span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">{t('lotDetail.material')}:</span>
                  <span className="modal-value">
                    {selectedHandover.materialCategory?.name ||
                      selectedHandover.materialCategoryName ||
                      '—'}
                  </span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">{t('lotDetail.weight')}:</span>
                  <span className="modal-value">
                    {selectedHandover.weightKg} kg
                  </span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">
                    {t('recyclerDashboard.collector')}:
                  </span>
                  <span className="modal-value">
                    {selectedHandover.collector?.fullName ||
                      selectedHandover.collectorName ||
                      '—'}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>{t('recyclerHandovers.verifiedWeight')} *</label>
                <input
                  type="number"
                  className="form-control"
                  value={verifiedWeight}
                  onChange={(e) => setVerifiedWeight(e.target.value)}
                  placeholder="Enter verified weight"
                  step="0.1"
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('recyclerHandovers.finalPrice')} *</label>
                <input
                  type="number"
                  className="form-control"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  placeholder="Enter final price"
                  step="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('recyclerHandovers.paymentStatus')}</label>
                <select
                  className="form-control"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="PAID">{t('recyclerHandovers.paid')}</option>
                  <option value="PAYMENT_PENDING">
                    {t('recyclerHandovers.pendingPayment')}
                  </option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-success btn-block"
                  onClick={handleSubmitHandover}
                  disabled={submitting}
                >
                  <FaCheckCircle />{' '}
                  {submitting
                    ? t('common.loading')
                    : t('recyclerHandovers.submitHandover')}
                </button>
                <button
                  className="btn btn-outline btn-block"
                  onClick={() => setShowHandoverModal(false)}
                  disabled={submitting}
                >
                  {t('recyclerHandovers.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <QRScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScanResult}
      />
    </div>
  )
}

export default RecyclerHandovers
