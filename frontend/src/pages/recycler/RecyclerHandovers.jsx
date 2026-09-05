import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../hooks/useTranslation'
import { FaCheckCircle, FaClock, FaTrash, FaMoneyBillWave, FaEdit, FaWeightHanging } from 'react-icons/fa'
import toast from 'react-hot-toast'
import './RecyclerDashboard.css'

const RecyclerHandovers = () => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [handovers, setHandovers] = useState([
    { id: 1, lotId: 'RC-2024-000005', material: 'PCB', weight: 5, verifiedWeight: null, collector: 'Ramesh Kumar', status: 'HANDED_OVER', date: '2024-09-01 15:30', quotedPrice: 500, finalPrice: null },
    { id: 2, lotId: 'RC-2024-000006', material: 'Battery', weight: 3, verifiedWeight: null, collector: 'Priya Singh', status: 'HANDED_OVER', date: '2024-09-01 14:20', quotedPrice: 350, finalPrice: null },
    { id: 3, lotId: 'RC-2024-000007', material: 'LCD Panel', weight: 8, verifiedWeight: null, collector: 'Amit Patel', status: 'PAYMENT_PENDING', date: '2024-09-01 12:00', quotedPrice: 600, finalPrice: null },
  ])
  const [selectedHandover, setSelectedHandover] = useState(null)
  const [showHandoverModal, setShowHandoverModal] = useState(false)
  const [verifiedWeight, setVerifiedWeight] = useState('')
  const [finalPrice, setFinalPrice] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('PAID')

  const handleConfirmHandover = (handover) => {
    setSelectedHandover(handover)
    setVerifiedWeight(handover.weight.toString())
    setFinalPrice((handover.quotedPrice * handover.weight).toString())
    setShowHandoverModal(true)
  }

  const handleSubmitHandover = () => {
    if (!selectedHandover) return
    
    const vWeight = parseFloat(verifiedWeight)
    const fPrice = parseFloat(finalPrice)
    
    if (!vWeight || vWeight <= 0) {
      toast.error('Please enter a valid verified weight')
      return
    }
    if (!fPrice || fPrice <= 0) {
      toast.error('Please enter a valid final price')
      return
    }
    
    setHandovers(prev => prev.map(h => 
      h.id === selectedHandover.id 
        ? { 
            ...h, 
            status: paymentStatus === 'PAID' ? 'PAID' : 'PAYMENT_PENDING',
            verifiedWeight: vWeight,
            finalPrice: fPrice,
            completedAt: new Date().toLocaleString()
          }
        : h
    ))
    
    toast.success(t('recyclerHandovers.handoverSuccess', { amount: fPrice }))
    setShowHandoverModal(false)
    setSelectedHandover(null)
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'HANDED_OVER': 'badge-warning',
      'PAYMENT_PENDING': 'badge-info',
      'PAID': 'badge-success',
      'COMPLETED': 'badge-success'
    }
    return statusMap[status] || 'badge-info'
  }

  const stats = {
    total: handovers.length,
    pending: handovers.filter(h => h.status === 'HANDED_OVER' || h.status === 'PAYMENT_PENDING').length,
    completed: handovers.filter(h => h.status === 'PAID' || h.status === 'COMPLETED').length,
    totalAmount: handovers.reduce((sum, h) => sum + (h.finalPrice || h.quotedPrice * h.weight || 0), 0)
  }

  return (
    <div className="recycler-dashboard">
      <div className="dashboard-header">
        <h1>{t('recyclerHandovers.title')}</h1>
        <p className="text-muted">{t('recyclerHandovers.subtitle')}</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card" style={{ borderColor: '#2196f3' }}>
          <div className="stat-icon" style={{ color: '#2196f3' }}><FaCheckCircle /></div>
          <div className="stat-content">
            <span className="stat-label">{t('recyclerHandovers.total')}</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderColor: '#ff9800' }}>
          <div className="stat-icon" style={{ color: '#ff9800' }}><FaClock /></div>
          <div className="stat-content">
            <span className="stat-label">{t('recyclerHandovers.pending')}</span>
            <span className="stat-value">{stats.pending}</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderColor: '#4caf50' }}>
          <div className="stat-icon" style={{ color: '#4caf50' }}><FaCheckCircle /></div>
          <div className="stat-content">
            <span className="stat-label">{t('recyclerHandovers.completed')}</span>
            <span className="stat-value">{stats.completed}</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderColor: '#9c27b0' }}>
          <div className="stat-icon" style={{ color: '#9c27b0' }}><FaMoneyBillWave /></div>
          <div className="stat-content">
            <span className="stat-label">{t('recyclerHandovers.totalRevenue')}</span>
            <span className="stat-value">₹{stats.totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="card incoming-lots">
        <h3>{t('recyclerHandovers.title')} ({handovers.length})</h3>
        {handovers.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '48px' }}>📭</span>
            <p>{t('recyclerHandovers.noHandovers')}</p>
          </div>
        ) : (
          <div className="lots-list">
            {handovers.map((handover) => (
              <div key={handover.id} className="lot-item">
                <div className="lot-info">
                  <span className="lot-id">{handover.lotId}</span>
                  <span className="lot-material">{handover.material}</span>
                  <span className="lot-weight">{handover.weight} kg</span>
                  {handover.verifiedWeight && (
                    <span className="lot-verified">✅ {handover.verifiedWeight} kg {t('recyclerHandovers.verifiedWeight')}</span>
                  )}
                  <span className="lot-collector">👤 {handover.collector}</span>
                  <span className="lot-time">{handover.date}</span>
                </div>
                <div className="lot-actions">
                  <span className={`badge ${getStatusBadge(handover.status)}`}>
                    {handover.status}
                  </span>
                  {handover.status === 'HANDED_OVER' && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleConfirmHandover(handover)}>
                      <FaWeightHanging /> {t('recyclerHandovers.completeHandover')}
                    </button>
                  )}
                  {handover.status === 'PAYMENT_PENDING' && (
                    <button className="btn btn-success btn-sm" onClick={() => handleConfirmHandover(handover)}>
                      <FaMoneyBillWave /> {t('recyclerHandovers.confirmPayment')}
                    </button>
                  )}
                  {handover.verifiedWeight && handover.finalPrice && (
                    <span className="badge badge-success">₹{handover.finalPrice}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showHandoverModal && selectedHandover && (
        <div className="modal-overlay" onClick={() => setShowHandoverModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('recyclerHandovers.completeHandover')}</h3>
              <button className="modal-close" onClick={() => setShowHandoverModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-details">
                <div className="modal-row"><span className="modal-label">{t('lotDetail.lotId')}:</span><span className="modal-value">{selectedHandover.lotId}</span></div>
                <div className="modal-row"><span className="modal-label">{t('lotDetail.material')}:</span><span className="modal-value">{selectedHandover.material}</span></div>
                <div className="modal-row"><span className="modal-label">{t('lotDetail.weight')}:</span><span className="modal-value">{selectedHandover.weight} kg</span></div>
                <div className="modal-row"><span className="modal-label">{t('recyclerDashboard.collector')}:</span><span className="modal-value">{selectedHandover.collector}</span></div>
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
                  <option value="PAYMENT_PENDING">{t('recyclerHandovers.pendingPayment')}</option>
                </select>
              </div>
              
              <div className="modal-actions">
                <button className="btn btn-success btn-block" onClick={handleSubmitHandover}>
                  <FaCheckCircle /> {t('recyclerHandovers.submitHandover')}
                </button>
                <button className="btn btn-outline btn-block" onClick={() => setShowHandoverModal(false)}>
                  {t('recyclerHandovers.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecyclerHandovers
