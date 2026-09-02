import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { FaCheckCircle, FaClock, FaTrash, FaMoneyBillWave, FaEdit } from 'react-icons/fa'
import toast from 'react-hot-toast'
import './RecyclerDashboard.css'

const RecyclerHandovers = () => {
  const { user } = useAuth()
  const [handovers, setHandovers] = useState([
    { id: 1, lotId: 'RC-2024-000005', material: 'PCB', weight: 5, collector: 'Ramesh Kumar', status: 'HANDED_OVER', date: '2024-09-01 15:30', amount: 2500 },
    { id: 2, lotId: 'RC-2024-000006', material: 'Battery', weight: 3, collector: 'Priya Singh', status: 'HANDED_OVER', date: '2024-09-01 14:20', amount: 1800 },
    { id: 3, lotId: 'RC-2024-000007', material: 'LCD Panel', weight: 8, collector: 'Amit Patel', status: 'PAYMENT_PENDING', date: '2024-09-01 12:00', amount: 3200 },
  ])
  const [selectedHandover, setSelectedHandover] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('PAID')

  const handleCompleteHandover = (id) => {
    setHandovers(prev => prev.map(h => 
      h.id === id ? { ...h, status: 'COMPLETED' } : h
    ))
    toast.success('✅ Handover marked as completed!')
  }

  const handleDeleteHandover = (id) => {
    setHandovers(prev => prev.filter(h => h.id !== id))
    toast.success('🗑️ Handover removed')
  }

  const handlePayment = (handover) => {
    setSelectedHandover(handover)
    setPaymentAmount(handover.amount.toString())
    setShowPaymentModal(true)
  }

  const handleConfirmPayment = () => {
    if (!selectedHandover) return
    
    setHandovers(prev => prev.map(h => 
      h.id === selectedHandover.id 
        ? { ...h, status: 'PAID', amount: parseFloat(paymentAmount) }
        : h
    ))
    toast.success(`💰 Payment of ₹${paymentAmount} confirmed for ${selectedHandover.lotId}`)
    setShowPaymentModal(false)
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
    pending: handovers.filter(h => h.status !== 'COMPLETED' && h.status !== 'PAID').length,
    completed: handovers.filter(h => h.status === 'COMPLETED' || h.status === 'PAID').length,
    totalAmount: handovers.reduce((sum, h) => sum + (h.amount || 0), 0)
  }

  return (
    <div className="recycler-dashboard">
      <div className="dashboard-header">
        <h1>🔄 Handovers & Payments</h1>
        <p className="text-muted">Track all handover activities and confirm payments</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card" style={{ borderColor: '#2196f3' }}>
          <div className="stat-icon" style={{ color: '#2196f3' }}><FaCheckCircle /></div>
          <div className="stat-content">
            <span className="stat-label">Total</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderColor: '#ff9800' }}>
          <div className="stat-icon" style={{ color: '#ff9800' }}><FaClock /></div>
          <div className="stat-content">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{stats.pending}</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderColor: '#4caf50' }}>
          <div className="stat-icon" style={{ color: '#4caf50' }}><FaCheckCircle /></div>
          <div className="stat-content">
            <span className="stat-label">Completed</span>
            <span className="stat-value">{stats.completed}</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderColor: '#9c27b0' }}>
          <div className="stat-icon" style={{ color: '#9c27b0' }}><FaMoneyBillWave /></div>
          <div className="stat-content">
            <span className="stat-label">Total Revenue</span>
            <span className="stat-value">₹{stats.totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="card incoming-lots">
        <h3>📋 Handover History ({handovers.length})</h3>
        {handovers.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '48px' }}>📭</span>
            <p>No handovers yet</p>
          </div>
        ) : (
          <div className="lots-list">
            {handovers.map((handover) => (
              <div key={handover.id} className="lot-item">
                <div className="lot-info">
                  <span className="lot-id">{handover.lotId}</span>
                  <span className="lot-material">{handover.material}</span>
                  <span className="lot-weight">{handover.weight} kg</span>
                  <span className="lot-collector">👤 {handover.collector}</span>
                  <span className="lot-time">{handover.date}</span>
                </div>
                <div className="lot-actions">
                  <span className={`badge ${getStatusBadge(handover.status)}`}>
                    {handover.status}
                  </span>
                  {handover.status === 'HANDED_OVER' && (
                    <button className="btn btn-primary btn-sm" onClick={() => handlePayment(handover)}>
                      <FaMoneyBillWave /> Payment
                    </button>
                  )}
                  {handover.status === 'PAYMENT_PENDING' && (
                    <button className="btn btn-success btn-sm" onClick={() => handlePayment(handover)}>
                      <FaEdit /> Confirm Payment
                    </button>
                  )}
                  {handover.status !== 'COMPLETED' && handover.status !== 'PAID' && (
                    <button className="btn btn-success btn-sm" onClick={() => handleCompleteHandover(handover.id)}>
                      <FaCheckCircle /> Complete
                    </button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteHandover(handover.id)}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedHandover && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💰 Confirm Payment</h3>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-details">
                <div className="modal-row"><span className="modal-label">Lot ID:</span><span className="modal-value">{selectedHandover.lotId}</span></div>
                <div className="modal-row"><span className="modal-label">Collector:</span><span className="modal-value">{selectedHandover.collector}</span></div>
                <div className="modal-row"><span className="modal-label">Material:</span><span className="modal-value">{selectedHandover.material}</span></div>
                <div className="modal-row"><span className="modal-label">Weight:</span><span className="modal-value">{selectedHandover.weight} kg</span></div>
              </div>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div className="form-group">
                <label>Payment Status</label>
                <select
                  className="form-control"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="PAID">Paid</option>
                  <option value="PAYMENT_PENDING">Pending</option>
                </select>
              </div>
              <div className="modal-actions">
                <button className="btn btn-success btn-block" onClick={handleConfirmPayment}>
                  <FaMoneyBillWave /> Confirm Payment
                </button>
                <button className="btn btn-outline btn-block" onClick={() => setShowPaymentModal(false)}>
                  Cancel
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
